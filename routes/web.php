<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RepertoireController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SongController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'))->name('home');

Route::get('/language/{locale}', [LanguageController::class, 'switch'])->name('language.switch');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/welcome', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/welcome', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::middleware('onboarded')->group(function () {
        Route::get('/today', DashboardController::class)->name('dashboard');

        // Practising
        Route::get('/practise', [PracticeController::class, 'practise'])->name('practice.session');
        Route::get('/practise/log', [PracticeController::class, 'create'])->name('practice.create');
        Route::post('/sessions', [PracticeController::class, 'store'])->name('practice.store');
        Route::put('/sessions/{session}', [PracticeController::class, 'update'])->name('sessions.update');
        Route::delete('/sessions/{session}', [PracticeController::class, 'destroy'])->name('sessions.destroy');
        Route::post('/sessions/{session}/restore', [PracticeController::class, 'restore'])->name('sessions.restore');

        // Repertoire
        Route::get('/pieces', [RepertoireController::class, 'index'])->name('repertoire.index');
        Route::get('/pieces/add', [RepertoireController::class, 'create'])->name('repertoire.create');
        Route::post('/pieces', [RepertoireController::class, 'store'])->name('repertoire.store');
        Route::post('/pieces/custom', [RepertoireController::class, 'storeCustom'])->name('repertoire.store-custom');
        Route::get('/pieces/{entry}', [RepertoireController::class, 'show'])->name('repertoire.show');
        Route::patch('/pieces/{entry}', [RepertoireController::class, 'update'])->name('repertoire.update');
        Route::delete('/pieces/{entry}', [RepertoireController::class, 'destroy'])->name('repertoire.destroy');

        Route::put('/songs/{song}', [SongController::class, 'update'])->name('songs.update');
        Route::post('/songs/{song}/submit', [SongController::class, 'submit'])->name('songs.submit');

        // Goals
        Route::get('/goals', [GoalController::class, 'index'])->name('goals.index');
        Route::post('/goals', [GoalController::class, 'store'])->name('goals.store');
        Route::patch('/goals/{goal}', [GoalController::class, 'update'])->name('goals.update');
        Route::delete('/goals/{goal}', [GoalController::class, 'destroy'])->name('goals.destroy');

        // History & insights
        Route::get('/history', HistoryController::class)->name('history');
        Route::get('/insights', InsightsController::class)->name('insights');

        // Me
        Route::get('/me', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/me', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/me', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::put('/me/practice', [SettingsController::class, 'updatePractice'])->name('settings.practice');
        Route::put('/me/instruments', [SettingsController::class, 'updateInstruments'])->name('settings.instruments');
        Route::post('/me/export', [SettingsController::class, 'export'])->name('settings.export');
        Route::get('/me/export', [SettingsController::class, 'download'])->name('settings.export.download');
    });

    // Admin
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', Admin\OverviewController::class)->name('overview');

        Route::get('/library', [Admin\LibraryController::class, 'index'])->name('library.index');
        Route::post('/library', [Admin\LibraryController::class, 'store'])->name('library.store');
        Route::put('/library/{song}', [Admin\LibraryController::class, 'update'])->name('library.update');
        Route::post('/library/{song}/approve', [Admin\LibraryController::class, 'approve'])->name('library.approve');
        Route::post('/library/{song}/reject', [Admin\LibraryController::class, 'reject'])->name('library.reject');
        Route::delete('/library/{song}', [Admin\LibraryController::class, 'destroy'])->name('library.destroy');

        Route::get('/instruments', [Admin\InstrumentController::class, 'index'])->name('instruments.index');
        Route::post('/instruments', [Admin\InstrumentController::class, 'store'])->name('instruments.store');
        Route::put('/instruments/{instrument}', [Admin\InstrumentController::class, 'update'])->name('instruments.update');
        Route::delete('/instruments/{instrument}', [Admin\InstrumentController::class, 'destroy'])->name('instruments.destroy');

        Route::get('/users', [Admin\UserController::class, 'index'])->name('users.index');
        Route::patch('/users/{user}', [Admin\UserController::class, 'update'])->name('users.update');
    });
});

require __DIR__.'/auth.php';
