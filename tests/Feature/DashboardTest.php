<?php

use App\Models\PracticeGoal;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use App\Models\UserSong;
use App\Services\StreakCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-11-06 13:00:00'); // 20:00 in Ho Chi Minh City

    $this->song = Song::factory()->create();
    $this->user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh', 'daily_goal_minutes' => 30]);
});

function practise(User $user, string $utcStart, int $minutes, ?Song $song = null): PracticeSession
{
    $song ??= test()->song;

    return PracticeSession::factory()->create([
        'user_id' => $user->id,
        'song_id' => $song->id,
        'instrument_id' => $song->instrument_id,
        'start_time' => $utcStart,
        'end_time' => Carbon::parse($utcStart)->addMinutes($minutes),
        'duration_minutes' => $minutes,
    ]);
}

test('today shows four weeks ending on the user\'s local today', function () {
    practise($this->user, '2026-11-06 01:00:00', 20);   // 08:00 local, today
    practise($this->user, '2026-11-06 11:00:00', 25);   // 18:00 local, today
    practise($this->user, '2026-11-05 18:00:00', 10);   // 01:00 local on the 6th
    practise($this->user, '2026-10-01 11:00:00', 60);   // outside the window

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('days', 28)
            ->where('days.0.date', '2026-10-10')
            ->where('days.27', ['date' => '2026-11-06', 'minutes' => 55])
            ->where('todayMinutes', 55)
            ->where('totals', ['sessions' => 4, 'minutes' => 115, 'pieces' => 1])
            ->has('recentSessions', 4));
});

test('other users\' sessions are not counted', function () {
    practise(User::factory()->create(), '2026-11-06 11:00:00', 30);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('totals.sessions', 0)
            ->has('recentSessions', 0));
});

test('suggestions put pieces with a goal first, then the longest-waiting', function () {
    $recent = UserSong::factory()->create(['user_id' => $this->user->id, 'last_practised_at' => now()->subDay()]);
    $stale = UserSong::factory()->create(['user_id' => $this->user->id, 'last_practised_at' => now()->subDays(9)]);
    $withGoal = UserSong::factory()->create(['user_id' => $this->user->id, 'last_practised_at' => now()]);
    PracticeGoal::factory()->create(['user_id' => $this->user->id, 'song_id' => $withGoal->song_id]);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('nextUp.0.id', $withGoal->id)
            ->where('nextUp.0.has_goal', true)
            ->where('nextUp.1.id', $stale->id)
            ->where('nextUp.2.id', $recent->id)
            ->has('goals', 1));
});

test('new members are sent to onboarding first', function () {
    $this->actingAs(User::factory()->notOnboarded()->create())
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.show'));
});

test('streaks count consecutive days and survive until today is over', function (array $dates, int $current, int $best) {
    $result = (new StreakCalculator)->fromDates(collect($dates), CarbonImmutable::parse('2026-11-06'));

    expect($result['current'])->toBe($current)->and($result['best'])->toBe($best);
})->with([
    'no practice' => [[], 0, 0],
    'through today' => [['2026-11-06', '2026-11-05', '2026-11-04'], 3, 3],
    'through yesterday, today not yet played' => [['2026-11-05', '2026-11-04'], 2, 2],
    'broken two days ago' => [['2026-11-04', '2026-11-03', '2026-11-02', '2026-11-01'], 0, 4],
    'gap resets current, keeps best' => [['2026-11-06', '2026-11-05', '2026-10-22', '2026-10-21', '2026-10-20'], 2, 3],
]);
