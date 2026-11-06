<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Instrument;
use App\Models\Song;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Accounts (password: "password"):
     * - admin@example.com  admin
     * - test@example.com   member with ~10 weeks of demo practice
     */
    public function run(): void
    {
        $this->call([
            InstrumentSeeder::class,
            SongSeeder::class,
        ]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            User::factory()->raw(['name' => 'Admin', 'email' => 'admin@example.com']),
        );
        $admin->forceFill(['role' => UserRole::Admin, 'onboarded_at' => $admin->onboarded_at ?? now()])->save();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            User::factory()->raw(['name' => 'Test User', 'email' => 'test@example.com']),
        );

        $this->call(DemoSeeder::class);

        // A member submission so the admin review queue isn't empty.
        $member = User::firstOrCreate(
            ['email' => 'linh@example.com'],
            User::factory()->raw(['name' => 'Nguyễn Thảo Linh', 'email' => 'linh@example.com']),
        );

        if (! Song::where('title', 'Diễm xưa (guitar arrangement)')->exists()) {
            Song::factory()->pending($member)->create([
                'title' => 'Diễm xưa (guitar arrangement)',
                'artist' => 'Trịnh Công Sơn',
                'genre' => 'Nhạc Việt',
                'instrument_id' => Instrument::firstWhere('name', 'Guitar')->id,
                'difficulty' => 'intermediate',
                'default_target_bpm' => 72,
            ]);
        }
    }
}
