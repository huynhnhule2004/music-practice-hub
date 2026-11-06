<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * New members go through the short welcome flow before reaching the app.
 */
class EnsureUserIsOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->needsOnboarding()) {
            return to_route('onboarding.show');
        }

        return $next($request);
    }
}
