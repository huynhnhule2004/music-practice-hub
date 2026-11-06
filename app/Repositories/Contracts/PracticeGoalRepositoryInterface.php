<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface PracticeGoalRepositoryInterface
{
    /** Active goals, soonest deadline first, with their song. */
    public function getActiveGoals(int $userId, ?int $limit = null): Collection;
}
