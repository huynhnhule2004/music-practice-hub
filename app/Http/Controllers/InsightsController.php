<?php

namespace App\Http\Controllers;

use App\Services\InsightsService;
use App\Services\StreakCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InsightsController extends Controller
{
    /**
     * The shell renders immediately; the heavy numbers arrive as a deferred prop (RD §3.2).
     */
    public function __invoke(Request $request, InsightsService $insights, StreakCalculator $streaks): Response
    {
        $user = $request->user();

        return Inertia::render('Insights/Index', [
            'streak' => $streaks->forUser($user),
            'insights' => Inertia::defer(fn () => $insights->forUser($user)),
        ]);
    }
}
