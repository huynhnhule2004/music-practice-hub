<?php

namespace Database\Factories;

use App\Enums\LibraryStatus;
use App\Models\Instrument;
use App\Models\Song;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Song>
 */
class SongFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(3, false),
            'artist' => fake()->name(),
            'genre' => fake()->randomElement(['Classical', 'Jazz', 'Folk', 'Pop']),
            'instrument_id' => Instrument::factory(),
            'difficulty' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'default_target_bpm' => fake()->numberBetween(60, 140),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Song $song) {
            $song->library_status ??= LibraryStatus::Approved;
        });
    }

    /** A private piece owned by a user. */
    public function ownedBy(User $user): static
    {
        return $this->state(fn () => [])->afterMaking(function (Song $song) use ($user) {
            $song->user_id = $user->id;
            $song->library_status = LibraryStatus::Private;
        });
    }

    public function pending(User $user): static
    {
        return $this->ownedBy($user)->afterMaking(function (Song $song) {
            $song->library_status = LibraryStatus::Pending;
        });
    }
}
