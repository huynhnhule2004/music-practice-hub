<?php

namespace App\Models;

use App\Enums\SongStatus;
use Database\Factories\UserSongFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A piece in a user's repertoire, with their personal progress on it.
 */
#[Fillable(['user_id', 'song_id', 'instrument_id', 'status', 'progress_percentage', 'target_bpm', 'best_bpm', 'total_minutes', 'last_practised_at'])]
class UserSong extends Model
{
    /** @use HasFactory<UserSongFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'learning',
        'progress_percentage' => 0,
        'total_minutes' => 0,
    ];

    protected function casts(): array
    {
        return [
            'status' => SongStatus::class,
            'progress_percentage' => 'int',
            'target_bpm' => 'int',
            'best_bpm' => 'int',
            'total_minutes' => 'int',
            'last_practised_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }

    public function instrument(): BelongsTo
    {
        return $this->belongsTo(Instrument::class);
    }

    /**
     * Progress toward the target tempo when there is one; otherwise the manual percentage.
     */
    public function computedProgress(): int
    {
        if ($this->status === SongStatus::Mastered) {
            return 100;
        }

        if ($this->target_bpm && $this->best_bpm) {
            return (int) min(100, round($this->best_bpm / $this->target_bpm * 100));
        }

        return $this->progress_percentage;
    }
}
