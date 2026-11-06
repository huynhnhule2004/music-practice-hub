<?php

namespace App\Policies;

use App\Models\PracticeSession;
use App\Models\User;

class PracticeSessionPolicy
{
    public function update(User $user, PracticeSession $session): bool
    {
        return $session->user_id === $user->id;
    }

    public function delete(User $user, PracticeSession $session): bool
    {
        return $session->user_id === $user->id;
    }
}
