<?php

use Inertia\Testing\AssertableInertia as Assert;

test('switching language changes the translations shared with the page', function () {
    $this->get(route('language.switch', ['locale' => 'vi']))->assertRedirect();

    $this->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'vi')
            ->where('translations.log_session', 'Ghi buổi tập'));
});

test('unsupported languages are ignored', function () {
    $this->get(route('language.switch', ['locale' => 'xx']));

    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
});
