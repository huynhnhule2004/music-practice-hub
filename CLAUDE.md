@AGENTS.md

===

<laravel-boost-guidelines>
=== .ai/music-practice-hub rules ===

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
- Palette "concert hall" (tokens in `resources/css/app.css`, light + dark): crimson `primary` (velvet curtain), gold `brass` (stage light: goals, today, highlights), peacock `teal`, flame `coral` (streaks), on ivory paper with plum ink; `panel` is the dark curtain behind the staff. `.bg-brand` = crimson velvet hero with a gold spotlight (large surfaces only), `.btn-brand` = solid crimson primary button, `.staff-panel` = dark staff block. Cards are tinted with their instrument colour via `instrumentColor(id, alpha)` in `lib/instrumentColor.ts`. No purple/indigo gradients (reads as generic AI UI). Never hardcode `gray-*`/`zinc-*`; white is only for text on dark surfaces.
- Signature visual: `Components/PracticeStaff.tsx` (28 days as four bars of 7/4; pitch = minutes, filled = goal met, rest = day off). Practice mode (`Pages/Practice/Session.tsx`) uses `lib/metronome.ts` (Web Audio lookahead scheduler), `useWakeLock`, and persists state to localStorage so a refresh never loses a session.
- Mobile first: touch targets ≥ 44px, check 390px width for horizontal overflow, respect `prefers-reduced-motion`.

=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.4. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Add or update tests for behavior and logic changes when a test provides meaningful regression coverage.
- Pure copy, styling, and layout-only changes do not require new or updated tests.
- When test coverage applies, run the affected tests and ensure they pass.
- Test the changed behavior and its important failure modes, but do not add tests beyond them.
- Read the `testing-best-practices` skill before writing tests.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/Pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

# Pest

- This project uses Pest. Create tests with `php artisan make:test --pest {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.
- Do not delete tests or test files without approval. They are part of the application.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/pest` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
