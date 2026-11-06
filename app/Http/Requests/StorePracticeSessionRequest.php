<?php

namespace App\Http\Requests;

use App\Models\Song;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Used for both creating and editing a session. The owner always comes from the
 * authenticated user; end time is derived from start time + duration.
 */
class StorePracticeSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'song_id' => ['required', 'integer', 'exists:songs,id'],
            'instrument_id' => ['required', 'integer', 'exists:instruments,id'],
            'start_time' => ['required', 'date', 'before_or_equal:'.now()->addDay()->toDateTimeString()],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'achieved_bpm' => ['nullable', 'integer', 'min:20', 'max:400'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * A user may only log against approved library songs or their own pieces.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $song = Song::find($this->integer('song_id'));

                if ($song && $this->user()->cannot('use', $song)) {
                    $validator->errors()->add('song_id', __('validation.exists', ['attribute' => __('validation.attributes.song_id')]));
                }
            },
        ];
    }
}
