# Music Practice Hub roadmap

Agreed with the owner on 2026-11-06.

- **Audience:** a public, multi-user app (anyone can register).
- **Admin:** a full admin area for the shared library, users and site stats.
- **Stack:** upgrade to React 19 and Inertia 3, as the RD specifies.
- **Scope:** build every phase below.

## Who we are designing for

The user is a music learner practising 20–60 minutes in the evening, with a phone on the music stand and their hands busy with an instrument.

1. **One tap to start practising.** The Today screen leads with "Practise" and a suggested piece.
2. **Minimal typing.** A timer measures duration and the metronome records tempo. Choices use chips and steppers instead of text fields.
3. **Mobile first.** Touch targets are at least 44px, there is a bottom tab bar, and the app is usable one-handed. Screen Wake Lock keeps the display on during practice.
4. **Encourage, don't scold.** No red "you failed" states. Streaks are forgiving and milestones are celebrated quietly.
5. **One visual language.** The staff is the signature visual. Colours are cobalt for actions, amber for goals and today, coral for streaks. Avoid generic stat-card grids.

## Information architecture

| Tab | Contents |
|---|---|
| Today | Daily progress, a suggested piece, the 4-week staff and the streak |
| Repertoire | My pieces → piece detail (tempo chart, journal, goal) |
| ● Practise | Full-screen practice mode (timer and metronome) |
| History | Session list with filters, edit and delete; a year heatmap |
| Me | Profile, daily goal, instruments, language, theme, export, delete account |
| Admin | Shared library, instruments, users, site stats (role-gated) |

## Phases

| # | Phase | Status |
|---|---|---|
| 0 | Foundations: React 19 / Inertia 3 upgrade, model bug fixes, shared UI kit, bottom tab bar, translated auth/profile pages, roles | done |
| 1 | Repertoire: user pieces (`user_songs`), private songs (`songs.user_id`), piece detail, auto progress, "practise next" | done |
| 2 | Practice mode: timer, Web Audio metronome with tap tempo, wake lock, resumable state, end-of-session sheet | done |
| 3 | Goals: tempo goal per piece with deadline, pace hint, auto-complete; "one active goal per song" constraint | done |
| 4 | History: grouped list with filters, edit sheet, delete with undo, year heatmap | done |
| 5 | Onboarding and settings: instruments and level, daily goal, first pieces, per-user timezone, Me page | done |
| 6 | Insights: weekly minutes by instrument, top pieces, time of day, tempo progress | done |
| 7 | RD backend: `PracticeSessionCompleted` event and listeners, cache, deferred props, policies, queued CSV import/export | done (cache: database store; switch CACHE_STORE=redis in prod) |
| 8 | Admin: library CRUD and moderation, instruments, users (role, suspend), site stats | done |
| 9 | Release: PWA, a11y and reduced-motion audit, Pest browser tests, deploy notes | todo: PWA manifest/icons, Pest browser tests, deploy notes |

## Definition of done for each phase

- Backend changes have Pest tests (happy path plus important failures), and the full suite passes.
- UI uses the shared kit and theme tokens; strings exist in both `lang/en` and `lang/vi`.
- Checked in a real browser at 375px and 1280px, in light and dark, in EN and VI, with no console errors.
