<?php

namespace Database\Seeders;

use App\Models\Instrument;
use Illuminate\Database\Seeder;

class InstrumentSeeder extends Seeder
{
    public function run(): void
    {
        $instruments = [
            ['name' => 'Piano', 'type' => 'Keyboard'],
            ['name' => 'Guitar', 'type' => 'String'],
            ['name' => 'Violin', 'type' => 'String'],
            ['name' => 'Ukulele', 'type' => 'String'],
            ['name' => 'Flute', 'type' => 'Wind'],
            ['name' => 'Drums', 'type' => 'Percussion'],
        ];

        foreach ($instruments as $instrument) {
            Instrument::updateOrCreate(['name' => $instrument['name']], $instrument);
        }
    }
}
