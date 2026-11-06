<?php

namespace App\Enums;

/**
 * Where a piece sits in the user's repertoire.
 */
enum SongStatus: string
{
    case Learning = 'learning';
    case Polishing = 'polishing';
    case Mastered = 'mastered';
}
