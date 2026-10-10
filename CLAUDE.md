# CLAUDE.md

Math and English practice app for kids (ages 8–10). Frontend only: no backend, everything persists in `localStorage`. See README.md for features and layout.

## Commands
- `npm run dev`: dev server
- `npm test`: Vitest unit tests (game logic only)
- `npm run lint`: oxlint (keep it warning-free)
- `npm run build`: `tsc -b` + Vite build. Run it before calling work done.

## Conventions
- **All UI text is Czech.** Code, comments and identifiers are English.
- Game rules live in pure functions (`games/<game>/logic.ts`), with tests next to them. Components stay thin.
- New games: add to their subject in `games/registry.ts` and to the routes in `App.tsx` (inside `RequireProfile`). Rules shared by all games (points, stars, shuffling) live in `games/shared/rules.ts`.
- Persisted data shape is `AppData` in `lib/storage.ts` (key `mathkids:v1`). When adding fields, fill in defaults in `loadData` so old saves still load. Bump the version only for breaking changes.
- Profile updates go through `updateActiveProfile` (immutable updaters).
- Styling: Tailwind v4 utilities. Theme tokens and keyframes (`animate-pop`, `animate-shake`, `animate-star`, `animate-float`, `animate-float-up`) live in `src/index.css`. Tailwind class strings must be literal (no string building like `bg-${color}`).
- Sounds are synthesized in `lib/sound.ts` (no audio files). English words are spoken with `speak()` there (browser speech synthesis, respects mute). Celebrations go through `lib/confetti.ts`.
- Callbacks fired from timers/intervals must read the latest props through a ref (see `QuestionCard` `onNextRef` and `TimeAttackMode` `finishRef`). Otherwise they see stale points/streak.
- React Router is v8; import from `react-router`.
