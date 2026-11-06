<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'daily_goal_minutes', 'current_streak', 'highest_streak', 'last_practice_date', 'timezone', 'locale'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'last_practice_date' => 'date',
            'current_streak' => 'int',
            'highest_streak' => 'int',
            'daily_goal_minutes' => 'int',
            'onboarded_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    public function needsOnboarding(): bool
    {
        return $this->onboarded_at === null;
    }

    public function instruments(): BelongsToMany
    {
        return $this->belongsToMany(Instrument::class, 'user_instruments')
            ->withPivot(['level'])
            ->using(UserInstrument::class)
            ->withTimestamps();
    }

    public function repertoire(): HasMany
    {
        return $this->hasMany(UserSong::class);
    }

    /** Songs this user created (private pieces and their library submissions). */
    public function ownedSongs(): HasMany
    {
        return $this->hasMany(Song::class);
    }

    public function practiceSessions(): HasMany
    {
        return $this->hasMany(PracticeSession::class);
    }

    public function practiceGoals(): HasMany
    {
        return $this->hasMany(PracticeGoal::class);
    }
}
