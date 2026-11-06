<?php

namespace App\Http\Controllers;

use App\Enums\LibraryStatus;
use App\Models\Song;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Members editing their own private pieces and submitting them to the shared library.
 */
class SongController extends Controller
{
    public function update(Request $request, Song $song): RedirectResponse
    {
        $this->authorize('update', $song);

        $song->update($request->validate([
            'title' => ['required', 'string', 'max:160'],
            'artist' => ['nullable', 'string', 'max:120'],
            'genre' => ['nullable', 'string', 'max:60'],
            'instrument_id' => ['required', 'integer', 'exists:instruments,id'],
            'difficulty' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'default_target_bpm' => ['nullable', 'integer', 'min:20', 'max:400'],
        ]));

        Inertia::flash('toast', ['message' => __('app.saved')]);

        return back();
    }

    public function submit(Song $song): RedirectResponse
    {
        $this->authorize('submitToLibrary', $song);

        $song->library_status = LibraryStatus::Pending;
        $song->rejection_reason = null;
        $song->save();

        Inertia::flash('toast', ['message' => __('app.submitted_for_review')]);

        return back();
    }
}
