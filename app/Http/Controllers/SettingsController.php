<?php

namespace App\Http\Controllers;

use App\Enums\SkillLevel;
use App\Http\Middleware\SetLocale;
use App\Jobs\ExportPracticeHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Practice preferences on the "Me" page (account details stay in ProfileController).
 */
class SettingsController extends Controller
{
    public function updatePractice(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'daily_goal_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'timezone' => ['required', 'timezone:all'],
            'locale' => ['required', Rule::in(SetLocale::SUPPORTED)],
        ]);

        $request->user()->update($data);
        $request->session()->put('locale', $data['locale']);

        Inertia::flash('toast', ['message' => __('app.saved', [], $data['locale'])]);

        return back();
    }

    public function updateInstruments(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'instruments' => ['present', 'array', 'max:12'],
            'instruments.*.id' => ['required', 'integer', 'exists:instruments,id'],
            'instruments.*.level' => ['required', Rule::enum(SkillLevel::class)],
        ]);

        $request->user()->instruments()->sync(
            collect($data['instruments'])->mapWithKeys(fn ($i) => [$i['id'] => ['level' => $i['level']]])
        );

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }

    /** Queue a CSV export of all sessions (RD §3.3); the file appears on the Me page when ready. */
    public function export(Request $request): RedirectResponse
    {
        ExportPracticeHistory::dispatch($request->user()->id);

        Inertia::flash('toast', ['message' => __('app.export_started')]);

        return back();
    }

    public function download(Request $request): StreamedResponse
    {
        $path = ExportPracticeHistory::pathFor($request->user()->id);

        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path, 'musichub-practice-history.csv');
    }
}
