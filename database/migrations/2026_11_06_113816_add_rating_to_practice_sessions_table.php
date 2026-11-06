<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How the session felt, 1 (rough) to 5 (great). Chosen after a session instead
     * of the unused accuracy_rate percentage, which nobody can measure by ear.
     */
    public function up(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('accuracy_rate');
            $table->index(['user_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'start_time']);
            $table->dropColumn('rating');
        });
    }
};
