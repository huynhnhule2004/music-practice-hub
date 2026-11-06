<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tempo and accuracy are optional when logging a session.
     */
    public function up(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->integer('achieved_bpm')->nullable()->change();
            $table->decimal('accuracy_rate', 5, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('practice_sessions', function (Blueprint $table) {
            $table->integer('achieved_bpm')->nullable(false)->change();
            $table->decimal('accuracy_rate', 5, 2)->nullable(false)->change();
        });
    }
};
