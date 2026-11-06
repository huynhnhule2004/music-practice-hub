<?php

namespace App\Repositories\Eloquent;

use App\Models\PracticeSession;
use App\Models\User;
use App\Repositories\Contracts\PracticeSessionRepositoryInterface;
use App\Support\UserClock;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class PracticeSessionRepository implements PracticeSessionRepositoryInterface
{
    public function logSession(array $data): PracticeSession
    {
        return PracticeSession::create($data);
    }

    public function dailyMinutes(User $user, CarbonInterface $from, ?CarbonInterface $to = null): Collection
    {
        $clock = UserClock::for($user);
        $day = $clock->localDateSql('start_time');

        return PracticeSession::query()
            ->where('user_id', $user->id)
            ->where('start_time', '>=', CarbonImmutable::instance($from)->startOfDay()->utc())
            ->when($to, fn ($query) => $query->where('start_time', '<', CarbonImmutable::instance($to)->addDay()->startOfDay()->utc()))
            ->selectRaw("{$day} as day, SUM(duration_minutes) as minutes")
            ->groupBy('day')
            ->pluck('minutes', 'day')
            ->map(fn ($minutes) => (int) $minutes);
    }

    public function totals(User $user): array
    {
        $row = PracticeSession::query()
            ->where('user_id', $user->id)
            ->selectRaw('COUNT(*) as sessions, COALESCE(SUM(duration_minutes), 0) as minutes, COUNT(DISTINCT song_id) as pieces')
            ->first();

        return [
            'sessions' => (int) $row->sessions,
            'minutes' => (int) $row->minutes,
            'pieces' => (int) $row->pieces,
        ];
    }

    public function recentForUser(User $user, int $limit): Collection
    {
        return PracticeSession::query()
            ->where('user_id', $user->id)
            ->with(['song:id,title,artist', 'instrument:id,name'])
            ->latest('start_time')
            ->limit($limit)
            ->get(['id', 'song_id', 'instrument_id', 'start_time', 'duration_minutes', 'achieved_bpm', 'rating', 'notes']);
    }
}
