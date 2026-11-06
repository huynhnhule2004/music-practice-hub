<?php

namespace Database\Seeders;

use App\Models\Instrument;
use App\Models\Song;
use Illuminate\Database\Seeder;

class SongSeeder extends Seeder
{
    public function run(): void
    {
        $instrumentIds = Instrument::pluck('id', 'name');

        // Public-domain repertoire and standard exercises.
        $songs = [
            ['Piano', 'Prelude in C major, BWV 846', 'J. S. Bach', 'Baroque', 'intermediate', 66],
            ['Piano', 'Für Elise', 'L. van Beethoven', 'Classical', 'intermediate', 72],
            ['Piano', 'Gymnopédie No. 1', 'Erik Satie', 'Romantic', 'beginner', 60],
            ['Piano', 'Hanon exercise No. 1', 'C.-L. Hanon', 'Technique', 'beginner', 108],
            ['Guitar', 'Romance (Spanish Romance)', 'Anonymous', 'Classical', 'intermediate', 80],
            ['Guitar', 'Lágrima', 'Francisco Tárrega', 'Romantic', 'intermediate', 70],
            ['Guitar', 'Major scale, CAGED shapes', null, 'Technique', 'beginner', 90],
            ['Violin', 'Meditation from Thaïs', 'Jules Massenet', 'Romantic', 'advanced', 54],
            ['Violin', 'Twinkle variations', 'Shinichi Suzuki', 'Pedagogical', 'beginner', 92],
            ['Ukulele', 'Aloha ʻOe', 'Liliʻuokalani', 'Folk', 'beginner', 84],
            ['Flute', 'Syrinx', 'Claude Debussy', 'Impressionist', 'advanced', 56],
            ['Drums', 'Paradiddle rudiments', null, 'Technique', 'beginner', 100],
        ];

        foreach ($songs as [$instrument, $title, $artist, $genre, $difficulty, $bpm]) {
            Song::updateOrCreate(
                ['title' => $title],
                [
                    'artist' => $artist,
                    'genre' => $genre,
                    'instrument_id' => $instrumentIds[$instrument],
                    'difficulty' => $difficulty,
                    'default_target_bpm' => $bpm,
                ],
            );
        }
    }
}
