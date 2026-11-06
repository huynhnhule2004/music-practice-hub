<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Songs with a null user_id belong to the shared library (curated by admins).
     * Songs with a user_id are that user's private pieces; they can be submitted
     * to the shared library for moderation.
     */
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('library_status', 20)->default('approved')->after('default_target_bpm')->index();
            $table->string('rejection_reason')->nullable()->after('library_status');
        });
    }

    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropIndex(['library_status']);
            $table->dropColumn(['library_status', 'rejection_reason']);
        });
    }
};
