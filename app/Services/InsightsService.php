<?php

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\User;
use App\Support\UserClock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Heavier per-user statistics for the Insights page. Cached per user and
 * busted by ForgetDashboardCache whenever a session changes (RD §3.2).
 */
class InsightsService
{
    public const WEEKS = 12;

    public static function cacheKey(int $userId): string
    {
        return "insights:user:{$userId}";
    }

    /**
     * @return array<string, mixed>
     */
    public function forUser(User $user): array
    {
        return Cache::remember(self::cacheKey($user->id), now()->addHour(), fn () => $this->compute($user));
    }

    /**
     * @return array<string, mixed>
     */
    private function compute(User $user): array
    {
        $clock = UserClock::for($user);
        $weekStart = $clock->today()->startOfWeek()->subWeeks(self::WEEKS - 1);
        $day = $clock->localDateSql('practice_sessions.start_time');

        $base = PracticeSession::query()
            ->where('practice_sessions.user_id', $user->id)
            ->where('practice_sessions.start_time', '>=', $weekStart->utc());

        // Minutes per week per instrument.
        $rows = (clone $base)
            ->join('instruments', 'instruments.id', '=', 'practice_sessions.instrument_id')
            ->selectRaw("{$day} as day, instruments.id as instrument_id, instruments.name as instrument, SUM(duration_minutes) as minutes")
            ->groupBy('day', 'instruments.id', 'instruments.name')
            ->get();

        $instruments = $rows->unique('instrument_id')
            ->map(fn ($row) => ['id' => (int) $row->instrument_id, 'name' => $row->instrument])
            ->sortBy('name')
            ->values();

        $weeks = collect(range(0, self::WEEKS - 1))->map(function (int $i) use ($weekStart, $rows, $clock) {
            $start = $weekStart->addWeeks($i);
            $end = $start->addDays(6);
            $inWeek = $rows->filter(fn ($row) => $row->day >= $start->toDateString() && $row->day <= $end->toDateString());

            return [
                'week_start' => $start->toDateString(),
                'is_current' => $clock->today()->between($start, $end),
                'by_instrument' => $inWeek->groupBy('instrument_id')
                    ->map(fn ($group) => (int) $group->sum('minutes'))
                    ->all(),
                'total' => (int) $inWeek->sum('minutes'),
            ];
        });

        $topPieces = (clone $base)
            ->join('songs', 'songs.id', '=', 'practice_sessions.song_id')
            ->selectRaw('songs.id, songs.title, songs.artist, SUM(duration_minutes) as minutes, COUNT(*) as sessions')
            ->groupBy('songs.id', 'songs.title', 'songs.artist')
            ->orderByDesc('minutes')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => $row->title,
                'artist' => $row->artist,
                'minutes' => (int) $row->minutes,
                'sessions' => (int) $row->sessions,
            ]);

        $hours = (clone $base)
            ->selectRaw($clock->localHourSql('start_time').' as hour, SUM(duration_minutes) as minutes')
            ->groupBy('hour')
            ->pluck('minutes', 'hour');

        $byHour = collect(range(0, 23))->map(fn (int $h) => (int) ($hours[$h] ?? 0));

        $weekday = (clone $base)
            ->selectRaw("WEEKDAY({$day}) as weekday, SUM(duration_minutes) as minutes")
            ->groupBy('weekday')
            ->pluck('minutes', 'weekday');

        $byWeekday = collect(range(0, 6))->map(fn (int $d) => (int) ($weekday[$d] ?? 0));

        $totalMinutes = (int) $weeks->sum('total');
        $activeDays = (int) (clone $base)->selectRaw("COUNT(DISTINCT {$day}) as days")->value('days');

        $avgRating = (clone $base)->whereNotNull('rating')->avg('rating');

        return [
            'weeks' => $weeks,
            'instruments' => $instruments,
            'topPieces' => $topPieces,
            'byHour' => $byHour,
            'byWeekday' => $byWeekday,
            'summary' => [
                'minutes' => $totalMinutes,
                'active_days' => $activeDays,
                'avg_session' => (int) round((clone $base)->avg('duration_minutes') ?? 0),
                'avg_rating' => $avgRating ? round((float) $avgRating, 1) : null,
            ],
            'year' => $this->yearHeatmap($user),
        ];
    }

    /**
     * Minutes per local day for the last 53 weeks, for the History heatmap.
     *
     * @return array<string, int>
     */
    public function yearHeatmap(User $user): array
    {
        $clock = UserClock::for($user);
        $from = $clock->today()->startOfWeek()->subWeeks(52);
        $day = $clock->localDateSql('start_time');

        return PracticeSession::query()
            ->where('user_id', $user->id)
            ->where('start_time', '>=', $from->utc())
            ->select(DB::raw("{$day} as day"), DB::raw('SUM(duration_minutes) as minutes'))
            ->groupBy('day')
            ->pluck('minutes', 'day')
            ->map(fn ($m) => (int) $m)
            ->all();
    }
}
