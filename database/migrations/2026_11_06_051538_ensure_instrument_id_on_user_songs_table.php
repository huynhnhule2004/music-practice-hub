<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Some databases were created from an earlier version of create_user_songs_table
     * that had no instrument_id. Add it (backfilled from the song) only when missing.
     */
    public function up(): void
    {
        if (Schema::hasColumn('user_songs', 'instrument_id')) {
            return;
        }

        Schema::table('user_songs', function (Blueprint $table) {
            $table->foreignId('instrument_id')->nullable()->after('song_id')->constrained()->cascadeOnDelete();
        });

        DB::table('user_songs')
            ->join('songs', 'songs.id', '=', 'user_songs.song_id')
            ->update(['user_songs.instrument_id' => DB::raw('songs.instrument_id')]);
    }

    public function down(): void
    {
        // Intentionally empty: the column belongs to the original table definition.
    }
};
