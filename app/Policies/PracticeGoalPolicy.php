<?php

namespace App\Policies;

use App\Models\PracticeGoal;
use App\Models\User;

class PracticeGoalPolicy
{
    public function update(User $user, PracticeGoal $goal): bool
    {
        return $goal->user_id === $user->id;
    }

    public function delete(User $user, PracticeGoal $goal): bool
    {
        return $goal->user_id === $user->id;
    }
}
