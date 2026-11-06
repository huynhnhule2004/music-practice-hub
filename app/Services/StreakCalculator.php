<?php

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\User;
use App\Support\UserClock;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class StreakCalculator
{
    /**
     * @return array{current: int, best: int, last: ?string}
     */
    public function forUser(User $user): array
    {
        $clock = UserClock::for($user);

        $dates = PracticeSession::query()
            ->where('user_id', $user->id)
            ->selectRaw($clock->localDateSql('start_time').' as day')
            ->distinct()
            ->orderByDesc('day')
            ->pluck('day');

        return $this->fromDates($dates, $clock->today());
    }

    /**
     * The current streak counts consecutive days ending today, or yesterday when
     * today has no session yet (the streak stays alive until the day is over).
     *
     * @param  Collection<int, string>  $dates  distinct 'Y-m-d' dates, newest first
     * @return array{current: int, best: int, last: ?string}
     */
    public function fromDates(Collection $dates, CarbonImmutable $today): array
    {
        $days = $dates->map(fn (string $date) => CarbonImmutable::parse($date)->startOfDay())->values();
        $today = CarbonImmutable::parse($today->toDateString());

        $current = 0;
        $cursor = $today;

        if ($days->isNotEmpty() && ! $days->first()->equalTo($cursor)) {
            $cursor = $cursor->subDay();
        }

        foreach ($days as $day) {
            if (! $day->equalTo($cursor)) {
                break;
            }

            $current++;
            $cursor = $cursor->subDay();
        }

        $best = 0;
        $run = 0;
        $previous = null;

        foreach ($days as $day) {
            $run = $previous && $previous->subDay()->equalTo($day) ? $run + 1 : 1;
            $best = max($best, $run);
            $previous = $day;
        }

        return ['current' => $current, 'best' => $best, 'last' => $dates->first()];
    }
}
