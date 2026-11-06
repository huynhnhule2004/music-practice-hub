<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'state' => ['nullable', Rule::in(['active', 'suspended'])],
        ]);

        $users = User::query()
            ->withCount('practiceSessions')
            ->withSum('practiceSessions as minutes', 'duration_minutes')
            ->withMax('practiceSessions as last_session_at', 'start_time')
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")))
            ->when($filters['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->when(($filters['state'] ?? null) === 'suspended', fn ($q) => $q->whereNotNull('suspended_at'))
            ->when(($filters['state'] ?? null) === 'active', fn ($q) => $q->whereNull('suspended_at'))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $u) => [
                ...$u->only(['id', 'name', 'email', 'current_streak', 'practice_sessions_count']),
                'role' => $u->role->value,
                'minutes' => (int) $u->minutes,
                'last_session_at' => $u->last_session_at,
                'created_at' => $u->created_at?->toIso8601String(),
                'suspended_at' => $u->suspended_at?->toIso8601String(),
                'onboarded' => $u->onboarded_at !== null,
            ]);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => (object) array_filter($filters),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['sometimes', Rule::enum(UserRole::class)],
            'suspended' => ['sometimes', 'boolean'],
        ]);

        // Admins cannot demote or suspend themselves, so the site always keeps an admin.
        abort_if($user->is($request->user()), 422, __('admin.cannot_change_self'));

        if (array_key_exists('role', $data)) {
            $user->role = UserRole::from($data['role']);
        }

        if (array_key_exists('suspended', $data)) {
            $user->suspended_at = $data['suspended'] ? now() : null;
        }

        $user->save();

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }
}
