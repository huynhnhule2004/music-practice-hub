<?php

namespace App\Http\Controllers;

use App\Services\PracticeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, PracticeService $practice): Response
    {
        return Inertia::render('Dashboard', $practice->today($request->user()));
    }
}
