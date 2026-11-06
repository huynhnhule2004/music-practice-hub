<?php

namespace Database\Factories;

use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<PracticeSession>
 */
class PracticeSessionFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::instance(fake()->dateTimeBetween('-20 days', 'now'));
        $minutes = fake()->numberBetween(10, 60);

        return [
            'user_id' => User::factory(),
            'song_id' => Song::factory(),
            'instrument_id' => fn (array $attributes) => Song::find($attributes['song_id'])->instrument_id,
            'start_time' => $start,
            'end_time' => $start->copy()->addMinutes($minutes),
            'duration_minutes' => $minutes,
        ];
    }
}
