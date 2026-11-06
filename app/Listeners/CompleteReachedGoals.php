<?php

namespace App\Listeners;

use App\Events\PracticeSessionLogged;
use App\Models\PracticeGoal;
use Inertia\Inertia;

/**
 * Marks a tempo goal complete as soon as a session reaches its target,
 * and flashes it so the UI can celebrate.
 */
class CompleteReachedGoals
{
    public function handle(PracticeSessionLogged $event): void
    {
        $bpm = $event->session?->achieved_bpm;

        if (! $bpm) {
            return;
        }

        $reached = PracticeGoal::query()
            ->active()
            ->where('user_id', $event->userId)
            ->where('song_id', $event->songId)
            ->where('target_bpm', '<=', $bpm)
            ->get();

        foreach ($reached as $goal) {
            $goal->update(['is_completed' => true, 'completed_at' => now()]);
        }

        if ($reached->isNotEmpty() && app()->bound('request') && request()->hasSession()) {
            Inertia::flash('goalReached', [
                'title' => $reached->first()->title,
                'target_bpm' => $reached->first()->target_bpm,
            ]);
        }
    }
}
