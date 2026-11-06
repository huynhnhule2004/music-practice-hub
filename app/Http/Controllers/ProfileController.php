<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Jobs\ExportPracticeHistory;
use App\Models\Instrument;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $exportPath = ExportPracticeHistory::pathFor($user->id);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'preferences' => [
                'daily_goal_minutes' => $user->daily_goal_minutes ?: 30,
                'timezone' => $user->timezone,
                'locale' => $user->locale ?? app()->getLocale(),
            ],
            'myInstruments' => $user->instruments()->orderBy('name')->get(['instruments.id', 'name'])
                ->map(fn ($i) => ['id' => $i->id, 'name' => $i->name, 'level' => $i->pivot->level->value]),
            'instruments' => Instrument::orderBy('name')->get(['id', 'name']),
            'export' => Storage::disk('local')->exists($exportPath)
                ? ['ready_at' => date(DATE_ATOM, Storage::disk('local')->lastModified($exportPath))]
                : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
