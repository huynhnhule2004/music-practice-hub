<?php

use App\Events\PracticeSessionLogged;
use App\Models\Instrument;
use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->instrument = Instrument::factory()->create(['name' => 'Piano']);
    $this->song = Song::factory()->create(['instrument_id' => $this->instrument->id, 'default_target_bpm' => 80]);
    $this->user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);
});

function sessionPayload(array $overrides = []): array
{
    return [
        'song_id' => test()->song->id,
        'instrument_id' => test()->instrument->id,
        'start_time' => '2026-11-06 19:00',
        'duration_minutes' => 45,
        ...$overrides,
    ];
}

test('guests cannot log a session', function () {
    $this->post(route('practice.store'), sessionPayload())->assertRedirect(route('login'));

    expect(PracticeSession::count())->toBe(0);
});

test('a session is stored for the signed-in user, converting local time to UTC', function () {
    $this->actingAs($this->user)
        ->post(route('practice.store'), sessionPayload(['achieved_bpm' => 72, 'rating' => 4, 'notes' => 'Bar 9 rushed']))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('dashboard'));

    $session = PracticeSession::sole();

    // 19:00 in Ho Chi Minh City (UTC+7) is 12:00 UTC.
    expect($session->user_id)->toBe($this->user->id)
        ->and($session->start_time->toDateTimeString())->toBe('2026-11-06 12:00:00')
        ->and($session->end_time->toDateTimeString())->toBe('2026-11-06 12:45:00')
        ->and($session->achieved_bpm)->toBe(72)
        ->and($session->rating)->toBe(4);
});

test('a user_id in the payload cannot attribute the session to someone else', function () {
    $other = User::factory()->create();

    $this->actingAs($this->user)->post(route('practice.store'), sessionPayload(['user_id' => $other->id]));

    expect(PracticeSession::sole()->user_id)->toBe($this->user->id);
});

test('logging a session adds the piece to the repertoire and records progress', function () {
    $this->actingAs($this->user)->post(route('practice.store'), sessionPayload(['achieved_bpm' => 60]));
    $this->actingAs($this->user)->post(route('practice.store'), sessionPayload(['achieved_bpm' => 72, 'duration_minutes' => 15]));

    $entry = UserSong::sole();

    expect($entry->user_id)->toBe($this->user->id)
        ->and($entry->best_bpm)->toBe(72)
        ->and($entry->target_bpm)->toBe(80)
        ->and($entry->total_minutes)->toBe(60)
        ->and($entry->progress_percentage)->toBe(90)
        ->and($entry->last_practised_at)->not->toBeNull();
});

test('reaching the target tempo completes the goal and flashes a celebration', function () {
    $goal = PracticeGoal::factory()->create([
        'user_id' => $this->user->id,
        'song_id' => $this->song->id,
        'target_bpm' => 80,
    ]);

    $this->actingAs($this->user)
        ->post(route('practice.store'), sessionPayload(['achieved_bpm' => 82]))
        ->assertInertiaFlash('goalReached.target_bpm', 80);

    expect($goal->fresh())
        ->is_completed->toBeTrue()
        ->completed_at->not->toBeNull();
});

test('a goal is not completed by a slower session', function () {
    $goal = PracticeGoal::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id, 'target_bpm' => 80]);

    $this->actingAs($this->user)->post(route('practice.store'), sessionPayload(['achieved_bpm' => 70]));

    expect($goal->fresh()->is_completed)->toBeFalse();
});

test('the streak is persisted on the user after logging', function () {
    $this->travelTo('2026-11-06 21:00:00', fn () => null);
    Carbon::setTestNow('2026-11-06 14:00:00'); // 21:00 local

    foreach (['2026-11-04 19:00', '2026-11-05 19:00', '2026-11-06 19:00'] as $start) {
        $this->actingAs($this->user)->post(route('practice.store'), sessionPayload(['start_time' => $start]));
    }

    expect($this->user->fresh())
        ->current_streak->toBe(3)
        ->highest_streak->toBe(3);
});

test('members cannot log against another member\'s private piece', function () {
    $private = Song::factory()->ownedBy(User::factory()->create())->create(['instrument_id' => $this->instrument->id]);

    $this->actingAs($this->user)
        ->post(route('practice.store'), sessionPayload(['song_id' => $private->id]))
        ->assertSessionHasErrors('song_id');
});

test('invalid sessions are rejected', function (array $overrides, string $field) {
    $this->actingAs($this->user)
        ->post(route('practice.store'), sessionPayload($overrides))
        ->assertSessionHasErrors($field);

    expect(PracticeSession::count())->toBe(0);
})->with([
    'missing piece' => [['song_id' => null], 'song_id'],
    'unknown instrument' => [['instrument_id' => 999], 'instrument_id'],
    'zero minutes' => [['duration_minutes' => 0], 'duration_minutes'],
    'tempo too slow' => [['achieved_bpm' => 5], 'achieved_bpm'],
    'rating out of range' => [['rating' => 6], 'rating'],
]);

test('a session can be edited by its owner and the event fires', function () {
    Event::fake([PracticeSessionLogged::class]);
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id]);

    $this->actingAs($this->user)
        ->put(route('sessions.update', $session), sessionPayload(['duration_minutes' => 25]))
        ->assertSessionHasNoErrors();

    expect($session->fresh()->duration_minutes)->toBe(25);
    Event::assertDispatched(PracticeSessionLogged::class);
});

test('a session cannot be edited or deleted by someone else', function () {
    $session = PracticeSession::factory()->create(['song_id' => $this->song->id]);

    $this->actingAs($this->user)->put(route('sessions.update', $session), sessionPayload())->assertForbidden();
    $this->actingAs($this->user)->delete(route('sessions.destroy', $session))->assertForbidden();
});

test('deleting a session can be undone', function () {
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id]);

    $this->actingAs($this->user)
        ->delete(route('sessions.destroy', $session))
        ->assertInertiaFlash('toast.undo', route('sessions.restore', $session->id));

    expect(PracticeSession::count())->toBe(0);

    $this->actingAs($this->user)->post(route('sessions.restore', $session->id));

    expect(PracticeSession::count())->toBe(1);
});

test('someone else cannot restore my deleted session', function () {
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id, 'song_id' => $this->song->id]);
    $session->delete();

    $this->actingAs(User::factory()->create())
        ->post(route('sessions.restore', $session->id))
        ->assertNotFound();
});

test('the practice screens render', function (string $route) {
    $this->actingAs($this->user)->get(route($route))->assertOk();
})->with(['practice.session', 'practice.create']);
