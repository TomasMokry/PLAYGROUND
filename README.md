# Matika: matematika pro děti

A small React app where kids practice math through games. It runs entirely in the browser, with no backend. All progress is stored in `localStorage`.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm test           # unit tests (Vitest)
npm run lint       # oxlint
```

## What's inside

- **Player profiles:** each child picks a name and an animal avatar. Stars, points, records and the mute setting are saved per player.
- **Home page:** a panel for each game. Games not built yet show as "Již brzy".
- **Four arithmetic games** with the same modes: **Násobilka** (×), **Sčítání** (+), **Odčítání** (−) and **Dělení** (:, as Czech schools write it).
  - Násobilka and Dělení are practiced by table (×1 … ×10, :1 … :10). Dělení is the multiplication table read backwards, so every result is a whole number.
  - Sčítání and Odčítání are practiced by level: **do 20**, **desítky** (30 + 40), **do 100** (no carrying / borrowing), **přes 10** (with carrying / borrowing) and **do 1000** (round tens, 340 + 250).
- **Modes**
  - **Řada** (tables only): walks through one table in order (1 × 6, 2 × 6 … 10 × 6). Solved rows stay visible as a ladder so the pattern shows. A wrong answer shows the right one, and the child types it again.
  - **Trénink:** 15 random questions from the selected tables or levels. Wrong answers come back at the end of the round.
  - **Závod s časem:** 60 seconds, as many correct answers as possible. The personal record is saved.

### Gamification rules

| What | Rule |
|---|---|
| Points | 10 per correct answer, ×2 from a 5-answer streak, ×3 from a 10-answer streak |
| Streak milestones | every 5 correct in a row: confetti, sound and praise |
| Stars per table / level (Řada, Trénink) | based on that table's or level's questions answered right **on the first try**: 100% = ★★★, ≥80% = ★★, ≥60% = ★. The best result is kept. |
| Time-attack stars | 10 correct = ★, 20 = ★★, 30 = ★★★ (shown only, not saved per table) |
| Records | longest streak and best time-attack score per game, with "Nový rekord!" when beaten. The home page shows totals across all games. |

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router (HashRouter) · canvas-confetti · Web Audio API (sounds generated in code, no audio files) · Vitest

## Project layout

```
src/
  App.tsx                      routes + profile guard
  pages/Home.tsx               greeting + game panels
  games/registry.ts            list of game panels on the home page
  games/arithmetic/            shared engine for ×, +, − and :
    operations.ts              each operation: groups (tables/levels), question pools, texts, colors + tests
    logic.ts                   pure game rules (picking questions, scoring, stars) + tests
    progress.ts                folding a finished round into saved progress + tests
    OperationHome.tsx          table/level selection + mode cards
    SequenceMode.tsx / PracticeMode.tsx / TimeAttackMode.tsx
    QuestionCard.tsx           equation, answer input, numpad, feedback
    GameShell.tsx              in-game top bar (back, progress, streak, points)
    ResultScreen.tsx           stars, stats, confetti
    useRound.ts                streak/points/praise state for one round
    useSaveRound.ts            saves a round to the active profile's progress for that operation
  profiles/                    profile context, provider, picker
  components/                  Header, StarRating, NumPad, ProgressBar, MuteButton
  lib/storage.ts               localStorage data model (key `mathkids:v1`)
  lib/sound.ts, lib/confetti.ts
```

## Adding a new game

1. Add an entry to `src/games/registry.ts`, with a `path` so the panel becomes clickable.
2. Create `src/games/<game>/` with its screens. Put the rules in a pure `logic.ts` with tests.
3. Register the routes in `src/App.tsx`, wrapped in `<RequireProfile>`.
4. If it stores progress, add a field to `Profile` in `src/lib/storage.ts`, with a default in `loadData` so existing saves keep working.

A new arithmetic operation only needs an entry in `OPERATIONS` (`games/arithmetic/operations.ts`), its id in `OPERATION_IDS` (`lib/storage.ts`) and a panel in the registry. Routes and saved progress follow automatically.
