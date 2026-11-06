<?php

namespace App\Models;

use Database\Factories\InstrumentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'type'])]
class Instrument extends Model
{
    /** @use HasFactory<InstrumentFactory> */
    use HasFactory;

    public function songs(): HasMany
    {
        return $this->hasMany(Song::class);
    }

    public function practiceSessions(): HasMany
    {
        return $this->hasMany(PracticeSession::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_instruments')
            ->withPivot(['level'])
            ->using(UserInstrument::class)
            ->withTimestamps();
    }
}
