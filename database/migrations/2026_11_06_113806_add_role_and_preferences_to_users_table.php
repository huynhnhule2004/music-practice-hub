<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('member')->after('password')->index();
            $table->string('timezone', 64)->default('UTC')->after('role');
            $table->string('locale', 5)->nullable()->after('timezone');
            $table->timestamp('onboarded_at')->nullable()->after('locale');
            $table->timestamp('suspended_at')->nullable()->after('onboarded_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn(['role', 'timezone', 'locale', 'onboarded_at', 'suspended_at']);
        });
    }
};
