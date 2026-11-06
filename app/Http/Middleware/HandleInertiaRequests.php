<?php

namespace App\Http\Middleware;

use App\Enums\LibraryStatus;
use App\Models\Song;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     *
     * Toasts and celebrations travel as Inertia flash data (Inertia::flash), not props.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'is_admin' => $user->isAdmin(),
                    'daily_goal_minutes' => $user->daily_goal_minutes ?: 30,
                ] : null,
            ],
            'locale' => app()->getLocale(),
            'translations' => fn () => [
                ...__('app'),
                'auth_ui' => __('auth_ui'),
                ...($user?->isAdmin() ? ['admin' => __('admin')] : []),
            ],
            'pendingReviews' => fn () => $user?->isAdmin()
                ? Song::where('library_status', LibraryStatus::Pending)->count()
                : 0,
        ];
    }
}
