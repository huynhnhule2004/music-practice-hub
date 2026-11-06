<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_songs', function (Blueprint $table) {
            $table->integer('target_bpm')->nullable()->after('progress_percentage');
            $table->integer('best_bpm')->nullable()->after('target_bpm');
            $table->unsignedInteger('total_minutes')->default(0)->after('best_bpm');
            $table->timestamp('last_practised_at')->nullable()->after('total_minutes');
        });

        // Align the old free-text statuses with App\Enums\SongStatus.
        DB::table('user_songs')->where('status', 'practicing')->update(['status' => 'learning']);
        DB::table('user_songs')->where('status', 'completed')->update(['status' => 'polishing']);

        Schema::table('user_songs', function (Blueprint $table) {
            $table->string('status')->default('learning')->change();
        });
    }

    public function down(): void
    {
        Schema::table('user_songs', function (Blueprint $table) {
            $table->dropColumn(['target_bpm', 'best_bpm', 'total_minutes', 'last_practised_at']);
            $table->string('status')->default('practicing')->change();
        });
    }
};
