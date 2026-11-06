<?php

namespace App\Listeners;

use App\Events\PracticeSessionLogged;
use App\Models\User;
use App\Services\StreakCalculator;

/**
 * Persists the streak on the user row (RD §3.1) so the admin area and lists can read it cheaply.
 */
class RefreshStreak
{
    public function __construct(private readonly StreakCalculator $streaks) {}

    public function handle(PracticeSessionLogged $event): void
    {
        $user = User::find($event->userId);

        if (! $user) {
            return;
        }

        $streak = $this->streaks->forUser($user);

        $user->forceFill([
            'current_streak' => $streak['current'],
            'highest_streak' => $streak['best'],
            'last_practice_date' => $streak['last'],
        ])->saveQuietly();
    }
}
