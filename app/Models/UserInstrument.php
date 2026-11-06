<?php

namespace App\Models;

use App\Enums\SkillLevel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Fillable(['user_id', 'instrument_id', 'level'])]
class UserInstrument extends Pivot
{
    protected $table = 'user_instruments';

    public $incrementing = true;

    protected function casts(): array
    {
        return [
            'level' => SkillLevel::class,
        ];
    }
}
