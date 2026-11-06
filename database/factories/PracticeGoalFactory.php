<?php

namespace Database\Factories;

use App\Models\PracticeGoal;
use App\Models\Song;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PracticeGoal>
 */
class PracticeGoalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'song_id' => Song::factory(),
            'title' => 'Reach target tempo',
            'target_bpm' => 120,
            'start_bpm' => 90,
            'deadline_date' => now()->addWeeks(4)->toDateString(),
            'is_completed' => false,
        ];
    }
}
