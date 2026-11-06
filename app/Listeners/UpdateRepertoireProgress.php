<?php

namespace App\Listeners;

use App\Events\PracticeSessionLogged;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\UserSong;

/**
 * Keeps a piece's best tempo, total minutes and last-practised time in sync with its sessions.
 * Practising a piece that is not in the repertoire yet adds it.
 */
class UpdateRepertoireProgress
{
    public function handle(PracticeSessionLogged $event): void
    {
        $stats = PracticeSession::query()
            ->where('user_id', $event->userId)
            ->where('song_id', $event->songId)
            ->selectRaw('COUNT(*) as sessions, MAX(achieved_bpm) as best_bpm, COALESCE(SUM(duration_minutes), 0) as minutes, MAX(start_time) as last_at')
            ->first();

        $entry = UserSong::firstWhere(['user_id' => $event->userId, 'song_id' => $event->songId]);

        if (! $entry) {
            if ((int) $stats->sessions === 0) {
                return;
            }

            $song = Song::find($event->songId);

            if (! $song) {
                return;
            }

            $entry = new UserSong([
                'user_id' => $event->userId,
                'song_id' => $song->id,
                'instrument_id' => $event->session?->instrument_id ?? $song->instrument_id,
                'target_bpm' => $song->default_target_bpm,
            ]);
        }

        $entry->fill([
            'best_bpm' => $stats->best_bpm ? (int) $stats->best_bpm : null,
            'total_minutes' => (int) $stats->minutes,
            'last_practised_at' => $stats->last_at,
        ]);

        if ($entry->target_bpm && $entry->best_bpm) {
            $entry->progress_percentage = $entry->computedProgress();
        }

        $entry->save();
    }
}
