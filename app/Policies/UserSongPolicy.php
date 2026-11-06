<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserSong;

class UserSongPolicy
{
    public function view(User $user, UserSong $entry): bool
    {
        return $entry->user_id === $user->id;
    }

    public function update(User $user, UserSong $entry): bool
    {
        return $entry->user_id === $user->id;
    }

    public function delete(User $user, UserSong $entry): bool
    {
        return $entry->user_id === $user->id;
    }
}
