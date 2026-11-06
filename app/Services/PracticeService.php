<?php

namespace App\Services;

use App\Enums\SongStatus;
use App\Events\PracticeSessionLogged;
use App\Models\PracticeSession;
use App\Models\User;
use App\Models\UserSong;
use App\Repositories\Contracts\PracticeGoalRepositoryInterface;
use App\Repositories\Contracts\PracticeSessionRepositoryInterface;
use App\Support\UserClock;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PracticeService
{
    /** Days shown on the Today staff: four bars of 7/4. */
    public const STAFF_DAYS = 28;

    public function __construct(
        protected PracticeSessionRepositoryInterface $sessions,
        protected PracticeGoalRepositoryInterface $goals,
        protected StreakCalculator $streaks,
    ) {}

    /**
     * Store a session (RD §3.1): write inside a transaction, then fire the event
     * so listeners update repertoire progress, goals, the streak and caches.
     */
    public function logPracticeSession(User $user, array $data): PracticeSession
    {
        $session = DB::transaction(fn () => $this->sessions->logSession([
            ...$this->normalise($user, $data),
            'user_id' => $user->id,
        ]));

        PracticeSessionLogged::dispatch($user->id, $session->song_id, $session);

        return $session;
    }

    public function updateSession(PracticeSession $session, array $data): PracticeSession
    {
        $previousSongId = $session->song_id;

        DB::transaction(fn () => $session->update($this->normalise($session->user, $data)));

        PracticeSessionLogged::dispatch($session->user_id, $session->song_id, $session);

        if ($previousSongId !== $session->song_id) {
            PracticeSessionLogged::dispatch($session->user_id, $previousSongId);
        }

        return $session;
    }

    public function deleteSession(PracticeSession $session): void
    {
        $session->delete();

        PracticeSessionLogged::dispatch($session->user_id, $session->song_id);
    }

    public function restoreSession(PracticeSession $session): void
    {
        $session->restore();

        PracticeSessionLogged::dispatch($session->user_id, $session->song_id, $session);
    }

    /**
     * Everything the Today screen needs for one user.
     *
     * @return array<string, mixed>
     */
    public function today(User $user): array
    {
        $clock = UserClock::for($user);
        $today = $clock->today();
        $from = $today->subDays(self::STAFF_DAYS - 1);
        $minutesByDay = $this->sessions->dailyMinutes($user, $from);

        $days = collect(range(0, self::STAFF_DAYS - 1))->map(function (int $offset) use ($from, $minutesByDay) {
            $date = $from->addDays($offset)->toDateString();

            return ['date' => $date, 'minutes' => $minutesByDay[$date] ?? 0];
        });

        $goals = $this->goals->getActiveGoals($user->id, 3);
        $entries = UserSong::query()
            ->where('user_id', $user->id)
            ->whereIn('song_id', $goals->pluck('song_id'))
            ->get()
            ->keyBy('song_id');

        return [
            'dailyGoal' => $user->daily_goal_minutes ?: 30,
            'days' => $days,
            'todayMinutes' => $minutesByDay[$today->toDateString()] ?? 0,
            'totals' => $this->sessions->totals($user),
            'streak' => $this->streaks->forUser($user),
            'nextUp' => $this->suggestions($user, $goals),
            'goals' => $goals->map(fn ($goal) => GoalPresenter::present($goal, $user, $entries->get($goal->song_id)))->values(),
            'recentSessions' => $this->sessions->recentForUser($user, 4),
        ];
    }

    /**
     * What to practise next: pieces with a goal due soonest first, then the
     * learning/polishing pieces that have waited longest since their last session.
     */
    public function suggestions(User $user, ?Collection $goals = null, int $limit = 3): Collection
    {
        $goalSongIds = ($goals ?? $this->goals->getActiveGoals($user->id))->pluck('song_id')->all();

        $entries = UserSong::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [SongStatus::Learning, SongStatus::Polishing])
            ->with(['song:id,title,artist', 'instrument:id,name'])
            ->get();

        return $entries
            ->sortBy(fn (UserSong $entry) => [
                in_array($entry->song_id, $goalSongIds, true) ? array_search($entry->song_id, $goalSongIds, true) : 100,
                $entry->last_practised_at?->getTimestamp() ?? 0,
            ])
            ->take($limit)
            ->map(fn (UserSong $entry) => RepertoirePresenter::present($entry, $user, in_array($entry->song_id, $goalSongIds, true)))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function normalise(User $user, array $data): array
    {
        $start = UserClock::for($user)->parseLocal($data['start_time']);
        $minutes = (int) $data['duration_minutes'];

        return [
            'song_id' => $data['song_id'],
            'instrument_id' => $data['instrument_id'],
            'start_time' => $start,
            'end_time' => $start->addMinutes($minutes),
            'duration_minutes' => $minutes,
            'achieved_bpm' => $data['achieved_bpm'] ?? null,
            'rating' => $data['rating'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];
    }
}
