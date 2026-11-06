<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('daily_goal_minutes')->default(30);
            $table->integer('current_streak')->default(0);
            $table->integer('highest_streak')->default(0);
            $table->date('last_practice_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['daily_goal_minutes', 'current_streak', 'highest_streak', 'last_practice_date']);
        });
    }
};
