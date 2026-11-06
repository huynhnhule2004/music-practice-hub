<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'onboarded_at' => now(),
        ];
    }

    /** A brand-new member who still has to go through the welcome flow. */
    public function notOnboarded(): static
    {
        return $this->state(fn () => ['onboarded_at' => null]);
    }

    public function admin(): static
    {
        return $this->afterMaking(fn ($user) => $user->role = UserRole::Admin);
    }

    public function suspended(): static
    {
        return $this->afterMaking(fn ($user) => $user->suspended_at = now());
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
