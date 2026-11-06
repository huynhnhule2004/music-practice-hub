<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSong;
use App\Support\UserClock;

class RepertoirePresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function present(UserSong $entry, User $user, bool $hasGoal = false): array
    {
        $daysSince = $entry->last_practised_at
            ? (int) UserClock::for($user)->local($entry->last_practised_at)->startOfDay()->diffInDays(UserClock::for($user)->today())
            : null;

        return [
            'id' => $entry->id,
            'song_id' => $entry->song_id,
            'title' => $entry->song?->title,
            'artist' => $entry->song?->artist,
            'instrument' => $entry->instrument?->only(['id', 'name']),
            'status' => $entry->status->value,
            'progress' => $entry->computedProgress(),
            'target_bpm' => $entry->target_bpm,
            'best_bpm' => $entry->best_bpm,
            'total_minutes' => $entry->total_minutes,
            'last_practised_at' => $entry->last_practised_at?->toIso8601String(),
            'days_since' => $daysSince,
            'has_goal' => $hasGoal,
        ];
    }
}
