<?php

use App\Enums\LibraryStatus;
use App\Enums\UserRole;
use App\Models\Instrument;
use App\Models\PracticeSession;
use App\Models\Song;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->member = User::factory()->create();
});

test('members cannot reach any admin page', function (string $route) {
    $this->actingAs($this->member)->get(route($route))->assertForbidden();
})->with(['admin.overview', 'admin.library.index', 'admin.instruments.index', 'admin.users.index']);

test('admins can open every admin page', function (string $route) {
    $this->actingAs($this->admin)->get(route($route))->assertOk();
})->with(['admin.overview', 'admin.library.index', 'admin.instruments.index', 'admin.users.index']);

test('admins add pieces straight into the shared library', function () {
    $instrument = Instrument::factory()->create();

    $this->actingAs($this->admin)->post(route('admin.library.store'), [
        'title' => 'Nocturne Op. 9 No. 2',
        'artist' => 'Chopin',
        'instrument_id' => $instrument->id,
        'difficulty' => 'advanced',
    ])->assertSessionHasNoErrors();

    expect(Song::firstWhere('title', 'Nocturne Op. 9 No. 2'))
        ->user_id->toBeNull()
        ->library_status->toBe(LibraryStatus::Approved);
});

test('pending submissions can be approved or rejected with a reason', function () {
    $a = Song::factory()->pending($this->member)->create();
    $b = Song::factory()->pending($this->member)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.library.index', ['status' => 'pending']))
        ->assertInertia(fn (Assert $page) => $page->has('songs.data', 2)->where('counts.pending', 2));

    $this->actingAs($this->admin)->post(route('admin.library.approve', $a));
    $this->actingAs($this->admin)->post(route('admin.library.reject', $b), ['reason' => 'Duplicate']);

    expect($a->fresh()->library_status)->toBe(LibraryStatus::Approved)
        ->and($b->fresh()->library_status)->toBe(LibraryStatus::Rejected)
        ->and($b->fresh()->rejection_reason)->toBe('Duplicate');
});

test('a piece with practice history cannot be deleted', function () {
    $song = Song::factory()->create();
    PracticeSession::factory()->create(['song_id' => $song->id]);

    $this->actingAs($this->admin)->delete(route('admin.library.destroy', $song))->assertSessionHasErrors('song');

    expect($song->fresh())->not->toBeNull();
});

test('instruments can be managed but not deleted while in use', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.instruments.store'), ['name' => 'Cello', 'type' => 'String'])
        ->assertSessionHasNoErrors();

    $cello = Instrument::firstWhere('name', 'Cello');
    Song::factory()->create(['instrument_id' => $cello->id]);

    $this->actingAs($this->admin)->delete(route('admin.instruments.destroy', $cello))->assertSessionHasErrors('instrument');

    $this->actingAs($this->admin)
        ->post(route('admin.instruments.store'), ['name' => 'Cello', 'type' => 'String'])
        ->assertSessionHasErrors('name');
});

test('admins can promote and suspend members', function () {
    $this->actingAs($this->admin)->patch(route('admin.users.update', $this->member), ['role' => 'admin']);
    expect($this->member->fresh()->role)->toBe(UserRole::Admin);

    $this->actingAs($this->admin)->patch(route('admin.users.update', $this->member), ['suspended' => true]);
    expect($this->member->fresh()->isSuspended())->toBeTrue();
});

test('admins cannot demote or suspend themselves', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.users.update', $this->admin), ['role' => 'member'])
        ->assertStatus(422);

    expect($this->admin->fresh()->isAdmin())->toBeTrue();
});

test('suspended users are signed out on their next request', function () {
    $suspended = User::factory()->suspended()->create();

    $this->actingAs($suspended)
        ->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('the user list can be searched', function () {
    User::factory()->create(['name' => 'Trần Minh Anh']);

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['q' => 'Minh']))
        ->assertInertia(fn (Assert $page) => $page->has('users.data', 1));
});
