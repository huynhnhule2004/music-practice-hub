<?php

use App\Jobs\ExportPracticeHistory;
use App\Models\Instrument;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

test('onboarding saves instruments, goal, timezone and first pieces', function () {
    $user = User::factory()->notOnboarded()->create();
    $piano = Instrument::factory()->create();
    $song = Song::factory()->create(['instrument_id' => $piano->id]);

    $this->actingAs($user)->post(route('onboarding.store'), [
        'instruments' => [['id' => $piano->id, 'level' => 'intermediate']],
        'daily_goal_minutes' => 20,
        'timezone' => 'Asia/Ho_Chi_Minh',
        'songs' => [$song->id],
    ])->assertRedirect(route('dashboard'));

    $user->refresh();

    expect($user->needsOnboarding())->toBeFalse()
        ->and($user->daily_goal_minutes)->toBe(20)
        ->and($user->timezone)->toBe('Asia/Ho_Chi_Minh')
        ->and($user->instruments()->sole()->pivot->level->value)->toBe('intermediate')
        ->and(UserSong::where('user_id', $user->id)->pluck('song_id')->all())->toBe([$song->id]);
});

test('onboarded users skip the welcome flow', function () {
    $this->actingAs(User::factory()->create())->get(route('onboarding.show'))->assertRedirect(route('dashboard'));
});

test('practice settings update goal, timezone and language', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->put(route('settings.practice'), [
        'daily_goal_minutes' => 45,
        'timezone' => 'Europe/Paris',
        'locale' => 'vi',
    ])->assertSessionHasNoErrors();

    expect($user->fresh())
        ->daily_goal_minutes->toBe(45)
        ->timezone->toBe('Europe/Paris')
        ->locale->toBe('vi');
});

test('an invalid timezone is rejected', function () {
    $this->actingAs(User::factory()->create())
        ->put(route('settings.practice'), ['daily_goal_minutes' => 30, 'timezone' => 'Mars/Olympus', 'locale' => 'en'])
        ->assertSessionHasErrors('timezone');
});

test('export is queued from the Me page', function () {
    Queue::fake();
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('settings.export'))->assertRedirect();

    Queue::assertPushed(ExportPracticeHistory::class, fn ($job) => $job->userId === $user->id);
});

test('the export job writes every session to CSV', function () {
    Storage::fake('local');
    $user = User::factory()->create(['timezone' => 'UTC']);
    PracticeSession::factory()->count(3)->create(['user_id' => $user->id]);
    PracticeSession::factory()->create(); // someone else

    (new ExportPracticeHistory($user->id))->handle();

    $csv = Storage::disk('local')->get(ExportPracticeHistory::pathFor($user->id));

    expect(substr_count(trim($csv), "\n"))->toBe(3); // header + 3 rows
});

test('the Me page renders with preferences', function () {
    $this->actingAs(User::factory()->create())->get(route('profile.edit'))->assertOk();
});
