# Music Practice Hub

Public, multi-user music-practice log with an admin area. Product/tech spec: `music_practice_hub_rd.md` (Vietnamese). Phase plan and status: `docs/ROADMAP.md`.

## Running locally (ports are deliberately non-default)

Another project on this machine owns 8000/5173/3306/8080. Never start this app on those ports.

- App: http://127.0.0.1:8010 (`SERVER_PORT` in `.env`, used by `php artisan serve` / `composer dev`)
- Vite: 5180 (`VITE_PORT`, `strictPort: true` in `vite.config.js`)
- MySQL: Docker container from `compose.yaml`, published on 3307. Start with `docker compose up -d mysql`. PHP runs on the host (Laragon), so `DB_HOST=127.0.0.1`.
- Stop `php artisan serve` before `composer install/update`, or Windows file locks corrupt `vendor/`.
- npm: `npm install --legacy-peer-deps` (`@vitejs/plugin-react@4` doesn't declare Vite 8 support).
- Seed: `php artisan db:seed`. Accounts (password `password`): `admin@example.com` (admin), `test@example.com` (member with ~10 weeks of demo practice), `linh@example.com` (member with a pending library submission).
- Tests share the MySQL `testing` database: never run two `php artisan test` processes at once.

## Stack

Laravel 13, Inertia 3 (`inertiajs/inertia-laravel` 3.x, `@inertiajs/react` 3.x), React 19, TypeScript, Tailwind 3, Pest 5.

## Domain

- `songs.user_id` null = shared library (admin-curated). Non-null = a member's private piece; `library_status` (`App\Enums\LibraryStatus`) moves private → pending → approved/rejected. Use `Song::visibleTo($user)` and `SongPolicy::use` whenever a member picks a song.
- `user_songs` = a member's repertoire (status `App\Enums\SongStatus`, best/target tempo, minutes, last practised).
- `practice_goals`: one *active* goal per piece, enforced in `GoalController` (the old DB unique index was dropped).
- `practice_sessions` are soft-deleted (History offers Undo). Times are stored in UTC; `App\Support\UserClock` converts to the user's `timezone` for "today", streaks and day buckets.
- Roles: `users.role` (`App\Enums\UserRole`), `users.suspended_at`, `users.onboarded_at`. Middleware aliases: `admin`, `onboarded`; `EnsureUserIsActive` signs suspended users out.

## Architecture

- Controller → service (`PracticeService`, `InsightsService`, `StreakCalculator`) → repository interfaces (`App\Repositories\Contracts`, bound in `AppServiceProvider`). Keep controllers thin.
- Every create/edit/delete/restore of a session dispatches `App\Events\PracticeSessionLogged` (RD §3.1). Listeners (auto-discovered) are idempotent and recompute from sessions: `UpdateRepertoireProgress`, `CompleteReachedGoals` (flashes `goalReached`), `RefreshStreak` (persists streak on users), `ForgetDashboardCache`.
- Insights are cached per user (`InsightsService::cacheKey`) and served as Inertia deferred props; History uses `Inertia::scroll` + `<InfiniteScroll>` and a deferred year heatmap.
- Session owner always comes from `$request->user()`, never the payload.
- Toasts/celebrations use Inertia flash data: `Inertia::flash('toast', ['message' => ..., 'undo' => url])`, `Inertia::flash('celebrate', [...])`. `Components/ui/Toaster.tsx` listens via `router.on('flash')`.

## Frontend

- Shared UI kit in `resources/js/Components/ui` (Button/LinkButton/IconButton, Field/Input/Select/Textarea/ChoiceChips, Sheet, EmptyState, Badge, Progress, PageHeader, ConfirmButton, Toaster). Reuse these instead of hand-rolling classes.
- Layouts: `AuthenticatedLayout` (top bar on desktop, bottom tab bar with raised Practise button on mobile), `AdminLayout`, `GuestLayout`.
- i18n: every string goes in both `lang/en/*.php` and `lang/vi/*.php` (`app.php`, `admin.php` for admins, `auth_ui.php` for auth/profile forms); read with `useTrans()` from `@/lib/i18n` (`t('key')`, `t('admin.key')`, `list('weekday_short')`). `SetLocale` must stay before `HandleInertiaRequests`.
- Theme tokens in `resources/css/app.css` (light + dark): cobalt `primary` for actions, amber `brass` for goals/today, `coral` for streaks, `.staff-panel` for the cobalt block behind the staff, per-instrument colours from `lib/instrumentColor.ts`. Never hardcode `gray-*`/`zinc-*`/`white`.
- Signature visual: `Components/PracticeStaff.tsx` (28 days as four bars of 7/4; pitch = minutes, filled = goal met, rest = day off). Practice mode (`Pages/Practice/Session.tsx`) uses `lib/metronome.ts` (Web Audio lookahead scheduler), `useWakeLock`, and persists state to localStorage so a refresh never loses a session.
- Mobile first: touch targets ≥ 44px, check 390px width for horizontal overflow, respect `prefers-reduced-motion`.
