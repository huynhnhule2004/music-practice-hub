<?php

namespace App\Http\Controllers;

use App\Enums\SkillLevel;
use App\Models\Instrument;
use App\Models\Song;
use App\Models\UserSong;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->needsOnboarding()) {
            return to_route('dashboard');
        }

        return Inertia::render('Onboarding', [
            'instruments' => Instrument::orderBy('name')->get(['id', 'name', 'type']),
            'library' => Song::query()
                ->visibleTo($request->user())
                ->orderBy('title')
                ->get(['id', 'title', 'artist', 'instrument_id', 'difficulty']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'instruments' => ['required', 'array', 'min:1', 'max:6'],
            'instruments.*.id' => ['required', 'integer', 'exists:instruments,id'],
            'instruments.*.level' => ['required', Rule::enum(SkillLevel::class)],
            'daily_goal_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'timezone' => ['required', 'timezone:all'],
            'songs' => ['array', 'max:10'],
            'songs.*' => ['integer', 'exists:songs,id'],
        ]);

        $user = $request->user();

        $user->instruments()->sync(
            collect($data['instruments'])->mapWithKeys(fn ($i) => [$i['id'] => ['level' => $i['level']]])
        );

        foreach (Song::visibleTo($user)->whereIn('id', $data['songs'] ?? [])->get() as $song) {
            UserSong::firstOrCreate(
                ['user_id' => $user->id, 'song_id' => $song->id],
                ['instrument_id' => $song->instrument_id, 'target_bpm' => $song->default_target_bpm],
            );
        }

        $user->forceFill([
            'daily_goal_minutes' => $data['daily_goal_minutes'],
            'timezone' => $data['timezone'],
            'onboarded_at' => now(),
        ])->save();

        Inertia::flash('celebrate', ['kind' => 'welcome']);

        return to_route('dashboard');
    }
}
