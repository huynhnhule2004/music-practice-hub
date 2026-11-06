<?php

namespace App\Providers;

use App\Repositories\Contracts\PracticeGoalRepositoryInterface;
use App\Repositories\Contracts\PracticeSessionRepositoryInterface;
use App\Repositories\Eloquent\PracticeGoalRepository;
use App\Repositories\Eloquent\PracticeSessionRepository;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PracticeSessionRepositoryInterface::class, PracticeSessionRepository::class);
        $this->app->bind(PracticeGoalRepositoryInterface::class, PracticeGoalRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Branded error pages in production; keep Laravel's debug screens locally.
        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            if (app()->hasDebugModeEnabled() || ! in_array($response->statusCode(), [403, 404, 419, 429, 500, 503], true)) {
                return null;
            }

            return $response
                ->render('Error', ['status' => $response->statusCode()])
                ->withSharedData();
        });
    }
}
