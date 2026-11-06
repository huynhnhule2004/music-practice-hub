<?php

namespace Database\Factories;

use App\Models\Instrument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Instrument>
 */
class InstrumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement(['Cello', 'Viola', 'Harp', 'Clarinet', 'Oboe', 'Bassoon', 'Trumpet', 'Banjo', 'Mandolin', 'Accordion']).' '.fake()->unique()->numberBetween(1, 9999),
            'type' => fake()->randomElement(['String', 'Keyboard', 'Wind', 'Percussion']),
        ];
    }
}
