<?php

namespace App\Policies;

use App\Enums\LibraryStatus;
use App\Models\Song;
use App\Models\User;

class SongPolicy
{
    /** Members may use approved library songs and their own pieces. */
    public function use(User $user, Song $song): bool
    {
        return $song->library_status === LibraryStatus::Approved || $song->user_id === $user->id;
    }

    /** Owners edit their own pieces while not yet in the shared library; admins edit anything. */
    public function update(User $user, Song $song): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $song->user_id === $user->id && $song->library_status !== LibraryStatus::Approved;
    }

    public function submitToLibrary(User $user, Song $song): bool
    {
        return $song->user_id === $user->id
            && in_array($song->library_status, [LibraryStatus::Private, LibraryStatus::Rejected], true);
    }

    public function delete(User $user, Song $song): bool
    {
        return $user->isAdmin();
    }
}
