<?php

namespace App\Models;

use Database\Factories\PracticeGoalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A tempo target for one piece, with a deadline.
 */
#[Fillable(['user_id', 'song_id', 'title', 'target_bpm', 'start_bpm', 'deadline_date', 'is_completed', 'completed_at'])]
class PracticeGoal extends Model
{
    /** @use HasFactory<PracticeGoalFactory> */
    use HasFactory;

    protected $attributes = [
        'is_completed' => false,
    ];

    protected function casts(): array
    {
        return [
            'target_bpm' => 'int',
            'start_bpm' => 'int',
            'deadline_date' => 'date',
            'is_completed' => 'bool',
            'completed_at' => 'datetime',
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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_completed', false);
    }
}
