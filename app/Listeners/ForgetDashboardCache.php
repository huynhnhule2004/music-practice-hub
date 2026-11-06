<?php

namespace App\Listeners;

use App\Events\PracticeSessionLogged;
use App\Services\InsightsService;
use Illuminate\Support\Facades\Cache;

/**
 * Cache busting for the per-user insights computed by InsightsService (RD §3.1).
 */
class ForgetDashboardCache
{
    public function handle(PracticeSessionLogged $event): void
    {
        Cache::forget(InsightsService::cacheKey($event->userId));
    }
}
