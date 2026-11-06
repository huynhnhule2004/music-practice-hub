<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Instrument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InstrumentController extends Controller
{
    public const TYPES = ['Keyboard', 'String', 'Wind', 'Brass', 'Percussion', 'Voice', 'Other'];

    public function index(): Response
    {
        return Inertia::render('Admin/Instruments', [
            'instruments' => Instrument::query()
                ->withCount(['songs', 'users', 'practiceSessions'])
                ->orderBy('name')
                ->get(),
            'types' => self::TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Instrument::create($request->validate([
            'name' => ['required', 'string', 'max:60', 'unique:instruments,name'],
            'type' => ['required', Rule::in(self::TYPES)],
        ]));

        Inertia::flash('toast', ['message' => __('admin.instrument_created')]);

        return back();
    }

    public function update(Request $request, Instrument $instrument): RedirectResponse
    {
        $instrument->update($request->validate([
            'name' => ['required', 'string', 'max:60', Rule::unique('instruments', 'name')->ignore($instrument)],
            'type' => ['required', Rule::in(self::TYPES)],
        ]));

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }

    public function destroy(Instrument $instrument): RedirectResponse
    {
        if ($instrument->songs()->exists() || $instrument->practiceSessions()->withTrashed()->exists()) {
            return back()->withErrors(['instrument' => __('admin.instrument_in_use')]);
        }

        $instrument->delete();

        Inertia::flash('toast', ['message' => __('admin.instrument_deleted')]);

        return back();
    }
}
