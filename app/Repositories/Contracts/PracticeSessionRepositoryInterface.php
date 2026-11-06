<?php

namespace App\Repositories\Contracts;

use App\Models\PracticeSession;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface PracticeSessionRepositoryInterface
{
    public function logSession(array $data): PracticeSession;

    /**
     * Minutes practised per local calendar day in [from, to], keyed by 'Y-m-d'.
     *
     * @return Collection<string, int>
     */
    public function dailyMinutes(User $user, CarbonInterface $from, ?CarbonInterface $to = null): Collection;

    /**
     * @return array{sessions: int, minutes: int, pieces: int}
     */
    public function totals(User $user): array;

    public function recentForUser(User $user, int $limit): Collection;
}
