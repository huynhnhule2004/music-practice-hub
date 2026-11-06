<?php

namespace App\Models;

use App\Enums\LibraryStatus;
use Database\Factories\SongFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'artist', 'genre', 'instrument_id', 'difficulty', 'default_target_bpm'])]
class Song extends Model
{
    /** @use HasFactory<SongFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'library_status' => LibraryStatus::class,
            'default_target_bpm' => 'int',
        ];
    }

    public function instrument(): BelongsTo
    {
        return $this->belongsTo(Instrument::class);
    }

    /** The user who created it; null for songs curated into the shared library by admins. */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function repertoireEntries(): HasMany
    {
        return $this->hasMany(UserSong::class);
    }

    public function practiceGoals(): HasMany
    {
        return $this->hasMany(PracticeGoal::class);
    }

    public function practiceSessions(): HasMany
    {
        return $this->hasMany(PracticeSession::class);
    }

    public function isInLibrary(): bool
    {
        return $this->library_status === LibraryStatus::Approved;
    }

    /**
     * Songs a user may pick: everything approved in the shared library,
     * plus the user's own private or pending pieces.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $q) use ($user) {
            $q->where('library_status', LibraryStatus::Approved)
                ->orWhere('user_id', $user->id);
        });
    }
}
