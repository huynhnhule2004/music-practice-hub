<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The original unique(user_id, song_id) meant a user could never set a second
     * goal on a piece, even after finishing the first. Uniqueness of the *active*
     * goal is now enforced in the application layer instead.
     */
    public function up(): void
    {
        Schema::table('practice_goals', function (Blueprint $table) {
            // MySQL backs the user_id FK with this composite index, so add a plain one first.
            $table->index('user_id', 'practice_goals_user_id_index');
            $table->dropUnique(['user_id', 'song_id']);

            $table->integer('start_bpm')->nullable()->after('target_bpm');
            $table->timestamp('completed_at')->nullable()->after('is_completed');
            $table->index(['user_id', 'is_completed']);
        });
    }

    public function down(): void
    {
        Schema::table('practice_goals', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_completed']);
            $table->dropColumn(['start_bpm', 'completed_at']);
            $table->unique(['user_id', 'song_id']);
            $table->dropIndex('practice_goals_user_id_index');
        });
    }
};
