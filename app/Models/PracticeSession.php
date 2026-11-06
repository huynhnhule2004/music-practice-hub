<?php

namespace App\Models;

use Database\Factories\PracticeSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'song_id', 'instrument_id', 'start_time', 'end_time', 'duration_minutes', 'achieved_bpm', 'accuracy_rate', 'rating', 'notes'])]
class PracticeSession extends Model
{
    /** @use HasFactory<PracticeSessionFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'duration_minutes' => 'int',
            'achieved_bpm' => 'int',
            'rating' => 'int',
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
}
