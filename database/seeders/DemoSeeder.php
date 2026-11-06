<?php

namespace Database\Seeders;

use App\Enums\SongStatus;
use App\Events\PracticeSessionLogged;
use App\Models\Instrument;
use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * A believable member with ~10 weeks of practice, so every screen has something to show.
 * Idempotent: re-running replaces the demo member's sessions.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstWhere('email', 'test@example.com');

        if (! $user) {
            return;
        }

        $user->forceFill([
            'timezone' => 'Asia/Ho_Chi_Minh',
            'daily_goal_minutes' => 30,
            'onboarded_at' => now(),
        ])->save();

        $piano = Instrument::firstWhere('name', 'Piano');
        $guitar = Instrument::firstWhere('name', 'Guitar');
        $user->instruments()->sync([$piano->id => ['level' => 'intermediate'], $guitar->id => ['level' => 'beginner']]);

        $pieces = [
            'Für Elise' => ['status' => SongStatus::Learning, 'start' => 52, 'step' => 2],
            'Prelude in C major, BWV 846' => ['status' => SongStatus::Polishing, 'start' => 54, 'step' => 1],
            'Gymnopédie No. 1' => ['status' => SongStatus::Mastered, 'start' => 56, 'step' => 1],
            'Romance (Spanish Romance)' => ['status' => SongStatus::Learning, 'start' => 58, 'step' => 2],
            'Major scale, CAGED shapes' => ['status' => SongStatus::Learning, 'start' => 70, 'step' => 2],
        ];

        $songs = Song::whereIn('title', array_keys($pieces))->get()->keyBy('title');

        PracticeSession::withTrashed()->where('user_id', $user->id)->forceDelete();
        UserSong::where('user_id', $user->id)->delete();
        PracticeGoal::where('user_id', $user->id)->delete();

        foreach ($songs as $title => $song) {
            UserSong::create([
                'user_id' => $user->id,
                'song_id' => $song->id,
                'instrument_id' => $song->instrument_id,
                'status' => $pieces[$title]['status'],
                'target_bpm' => $song->default_target_bpm,
            ]);
        }

        // ~70 days of evenings: mostly practised, some rest days, longer at weekends.
        mt_srand(7);
        $today = CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
        $bpm = collect($pieces)->map(fn ($p) => $p['start']);
        $active = $songs->filter(fn ($s, $title) => $pieces[$title]['status'] !== SongStatus::Mastered)->values();

        for ($d = 69; $d >= 0; $d--) {
            $day = $today->subDays($d);

            if ($d > 0 && mt_rand(1, 100) <= ($day->isWeekend() ? 15 : 25)) {
                continue; // rest day
            }

            $sessions = $day->isWeekend() ? 2 : 1;

            for ($s = 0; $s < $sessions; $s++) {
                $song = $active[mt_rand(0, $active->count() - 1)];
                $title = $song->title;
                $minutes = [15, 20, 25, 30, 30, 35, 40, 45, 60][mt_rand(0, 8)];
                $bpm[$title] = min($song->default_target_bpm ?? 120, $bpm[$title] + (mt_rand(0, 2) ? $pieces[$title]['step'] : 0));
                $start = $day->setTime($s ? 10 : 19, mt_rand(0, 50));

                PracticeSession::create([
                    'user_id' => $user->id,
                    'song_id' => $song->id,
                    'instrument_id' => $song->instrument_id,
                    'start_time' => $start->utc(),
                    'end_time' => $start->addMinutes($minutes)->utc(),
                    'duration_minutes' => $minutes,
                    'achieved_bpm' => mt_rand(0, 3) ? $bpm[$title] : null,
                    'rating' => mt_rand(0, 2) ? mt_rand(3, 5) : null,
                    'notes' => mt_rand(0, 4) === 0 ? collect([
                        'Left hand still heavy in bars 9–12.',
                        'Slow practice with the metronome helped.',
                        'Ran it twice cleanly at the end.',
                        'Focus on even sixteenths next time.',
                    ])->random() : null,
                ]);
            }
        }

        $furElise = $songs['Für Elise'];
        PracticeGoal::create([
            'user_id' => $user->id,
            'song_id' => $furElise->id,
            'title' => 'Recital ready',
            'start_bpm' => $pieces['Für Elise']['start'],
            'target_bpm' => ($furElise->default_target_bpm ?? 72) + 12, // a stretch beyond the library tempo
            'deadline_date' => $today->addWeeks(3)->toDateString(),
        ]);

        UserSong::where('user_id', $user->id)->where('song_id', $furElise->id)
            ->update(['target_bpm' => ($furElise->default_target_bpm ?? 72) + 12]);

        // Recompute repertoire progress and the streak exactly as the app would.
        foreach ($songs as $song) {
            PracticeSessionLogged::dispatch($user->id, $song->id);
        }
    }
}
