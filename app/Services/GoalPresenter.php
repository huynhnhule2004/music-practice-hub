<?php

namespace App\Services;

use App\Models\PracticeGoal;
use App\Models\User;
use App\Models\UserSong;
use App\Support\UserClock;

/**
 * Shapes a goal for the UI: where you are, where you're going, and the pace needed.
 */
class GoalPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function present(PracticeGoal $goal, User $user, ?UserSong $entry = null): array
    {
        $today = UserClock::for($user)->today();
        $current = $entry?->best_bpm ?? $goal->start_bpm;
        $daysLeft = (int) $today->diffInDays($goal->deadline_date->copy()->startOfDay(), false);

        $span = max(1, $goal->target_bpm - ($goal->start_bpm ?? 0));
        $progress = $goal->is_completed
            ? 100
            : (int) max(0, min(100, round((($current ?? $goal->start_bpm ?? 0) - ($goal->start_bpm ?? 0)) / $span * 100)));

        $remainingBpm = max(0, $goal->target_bpm - ($current ?? 0));
        $weeksLeft = max(1, $daysLeft / 7);

        return [
            'id' => $goal->id,
            'title' => $goal->title,
            'song' => $goal->relationLoaded('song') ? $goal->song?->only(['id', 'title', 'artist', 'instrument_id']) : null,
            'song_id' => $goal->song_id,
            'target_bpm' => $goal->target_bpm,
            'start_bpm' => $goal->start_bpm,
            'current_bpm' => $current,
            'deadline_date' => $goal->deadline_date->toDateString(),
            'days_left' => $daysLeft,
            'is_overdue' => ! $goal->is_completed && $daysLeft < 0,
            'is_completed' => $goal->is_completed,
            'completed_at' => $goal->completed_at?->toIso8601String(),
            'progress' => $progress,
            'bpm_per_week' => $goal->is_completed || $daysLeft < 0 || $current === null
                ? null
                : (int) ceil($remainingBpm / $weeksLeft),
        ];
    }
}
