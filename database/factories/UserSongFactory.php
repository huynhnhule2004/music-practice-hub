<?php

namespace Database\Factories;

use App\Enums\SongStatus;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserSong>
 */
class UserSongFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'song_id' => Song::factory(),
            'instrument_id' => fn (array $attributes) => Song::find($attributes['song_id'])->instrument_id,
            'status' => SongStatus::Learning,
            'progress_percentage' => 0,
        ];
    }
}
