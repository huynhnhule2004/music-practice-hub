<?php

namespace App\Repositories\Eloquent;

use App\Models\PracticeGoal;
use App\Repositories\Contracts\PracticeGoalRepositoryInterface;
use Illuminate\Support\Collection;

class PracticeGoalRepository implements PracticeGoalRepositoryInterface
{
    public function getActiveGoals(int $userId, ?int $limit = null): Collection
    {
        return PracticeGoal::query()
            ->active()
            ->where('user_id', $userId)
            ->with('song:id,title,artist,instrument_id')
            ->orderBy('deadline_date')
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get();
    }
}
