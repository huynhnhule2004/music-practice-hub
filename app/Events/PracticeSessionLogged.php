<?php

namespace App\Events;

use App\Models\PracticeSession;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a practice session is created, edited or deleted (RD §3.1).
 * Listeners recompute everything derived from sessions, so they are idempotent.
 */
class PracticeSessionLogged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $songId,
        public readonly ?PracticeSession $session = null,
    ) {}
}
