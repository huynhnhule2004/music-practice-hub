<?php

namespace App\Enums;

/**
 * Moderation state of a song in the shared library.
 *
 * Private songs (owned by a user) stay Private; a user can submit one to the
 * shared library, which puts it in Pending until an admin approves or rejects it.
 */
enum LibraryStatus: string
{
    case Private = 'private';
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
