# Škola hrou: matematika, angličtina a zábava pro děti

A small React app where kids (ages 8–10) practice math and English through games. It runs entirely in the browser, with no backend. All progress is stored in `localStorage`.

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
- **Home page:** a panel for each subject, **Matematika** (`/matika`), **Angličtina** (`/anglictina`) and **Zábava** (`/zabava`). Each subject page lists its games. Games not built yet show as "Již brzy".

### Matematika

- **Four arithmetic games** with the same modes: **Násobilka** (×), **Sčítání** (+), **Odčítání** (−) and **Dělení** (:, as Czech schools write it).
  - Násobilka and Dělení are practiced by table (×1 … ×10, :1 … :10). Dělení is the multiplication table read backwards, so every result is a whole number.
  - Sčítání and Odčítání are practiced by level: **do 20**, **desítky** (30 + 40), **do 100** (no carrying / borrowing), **přes 10** (with carrying / borrowing) and **do 1000** (round tens, 340 + 250).
- **Modes**
  - **Řada** (tables only): walks through one table in order (1 × 6, 2 × 6 … 10 × 6). Solved rows stay visible as a ladder so the pattern shows. A wrong answer shows the right one, and the child types it again.
  - **Trénink:** 15 random questions from the selected tables or levels. Wrong answers come back at the end of the round.
  - **Závod s časem:** 60 seconds, as many correct answers as possible. The personal record is saved.

### Angličtina

- **Barvy** (red, blue, green, yellow, orange, purple, pink, brown, black, white, grey) and **Čísla 1–10** (one … ten).
- **Jak se to řekne?** (`/vyber`): 10 multiple-choice questions. The child sees the picture (a color swatch, or a number with dots to count) and picks the English word.
- **Najdi barvu / Najdi číslo** (`/najdi`): 10 multiple-choice questions the other way round. The child sees and hears the English word and picks the picture.
- **Napiš:** 10 words to type in English, with an on-screen keyboard. It shows the letter count, and **💡 Nápověda** fills in the next letter, but then the word doesn't count towards stars. Capitals are ignored, and "gray" counts as well as "grey".
- **Slovníček:** the word list on each topic page. Click a word to hear it.
- Words are read out loud in British English with the browser's built-in speech synthesis (no audio files). It respects the mute button, and the 🔊 buttons hide where speech isn't available.
- Wrong answers come back at the end of the round, as in Trénink. Stars are saved per mode.

### Zábava

- **Tetris** (`/tetris`): classic falling blocks on a 10 × 20 board, with a ghost piece showing where the piece lands and a preview of the next one. Pieces come in shuffled bags of all seven.
  - Controls: arrows ← → move, ↑ (or X) turns, ↓ drops faster, space drops at once, P / Esc pauses. Big on-screen buttons do the same on tablets. The game pauses when the tab is hidden.
  - Score: 100 / 300 / 500 / 800 × level for 1–4 lines at once, plus 1 per row of soft drop and 2 per row of hard drop. The level goes up every 10 lines and the pieces fall faster. Clearing 4 lines at once ("TETRIS!") sets off confetti.
  - Stars by lines cleared in one game: 5 = ★, 20 = ★★, 40 = ★★★ (best kept). The best score is saved as the record. Tetris score does not count towards the learning points (Body) on the home page.

- **Piškvorky** (`/piskvorky`): tic tac toe on a 3 × 3 board. Pick an opponent: the computer at **Lehká** (plays at random, but takes a win it sees), **Střední** (also blocks and takes the middle), **Těžká** (plays perfectly, so a draw is the best result), or **Dva hráči** on one device. Who starts swaps every game, and the score of the session is shown.
  - Stars against the computer (best kept): beat Lehká = ★, beat Střední = ★★, draw or win against Těžká = ★★★.

- **Dino** (`/dino`): a runner like Chrome's offline dinosaur, drawn on a canvas. The dino runs by itself and speeds up; jump over cacti (space, ↑, a tap on the board or the **Skok** button) and duck under birds (↓ or hold **Skrčit**). Birds come from 150 points, groups of three cacti from 100. A jump pressed just before landing still counts, and the hitbox is a bit smaller than the picture.
  - Score grows with distance (about 9 a second at the start), with a sound every 100. Stars by score in one run: 100 = ★, 300 = ★★, 600 = ★★★ (best kept). The best score is saved as the record.

- **Pexeso** (`/pexeso`): the memory card game. Pick pictures (**Zvířátka**, **Jídlo**, **Doprava**), alone or **Dva hráči**, and a size: **Malé** (6 pairs), **Střední** (8), **Velké** (12). Cards flip in 3D; a missed pair stays face up for a second. With two players a found pair earns another turn and a miss passes it on; whoever finds more pairs wins.
  - Stars when playing alone, per size, by moves per pair: ≤ 1.75 = ★★★, ≤ 2.5 = ★★, ≤ 3.5 = ★ (best kept). Two-player games are not saved.

### Gamification rules

| What | Rule |
|---|---|
| Points | 10 per correct answer, ×2 from a 5-answer streak, ×3 from a 10-answer streak |
| Streak milestones | every 5 correct in a row: confetti, sound and praise |
| Stars per table / level / mode (Řada, Trénink, Jak se to řekne?, Najdi, Napiš) | based on that table's, level's or mode's questions answered right **on the first try**: 100% = ★★★, ≥80% = ★★, ≥60% = ★. The best result is kept. |
| Time-attack stars | 10 correct = ★, 20 = ★★, 30 = ★★★ (shown only, not saved per table) |
| Records | longest streak and best time-attack score per game, with "Nový rekord!" when beaten. The home page shows totals across all games. |

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router (HashRouter) · canvas-confetti · Web Audio API (sounds generated in code, no audio files) · Vitest

## Project layout

```
src/
  App.tsx                      routes + profile guard
  pages/Home.tsx               greeting + subject panels
  pages/SubjectHome.tsx        game panels of one subject
  games/registry.ts            subjects and their game panels
  games/shared/                used by every game
    rules.ts                   points, streaks, stars, shuffling + tests
    progress.ts                folding a finished round into saved progress + tests
    GameShell.tsx              in-game top bar (back, progress, streak, points)
    ResultScreen.tsx           stars, stats, confetti
    useRound.ts                streak/points/praise state for one round
    useSaveRound.ts            saves a round to the active profile's progress for that game
  games/arithmetic/            Matematika: shared engine for ×, +, − and :
    operations.ts              each operation: groups (tables/levels), question pools, texts, colors + tests
    logic.ts                   picking questions, stars per group + tests
    OperationHome.tsx          table/level selection + mode cards
    SequenceMode.tsx / PracticeMode.tsx / TimeAttackMode.tsx
    QuestionCard.tsx           equation, answer input, numpad, feedback
  games/tetris/                Zábava: Tetris
    logic.ts                   board, pieces, moves, line clears, scoring (pure reducer) + tests
    TetrisGame.tsx             board, side panel, keyboard + touch controls
  games/tictactoe/             Zábava: Piškvorky
    logic.ts                   board, winner, computer player (incl. minimax), stars + tests
    TicTacToeGame.tsx          opponent picker + board
  games/dino/                  Zábava: Dino
    logic.ts                   running, jumping, ducking, obstacles, collisions, scoring + tests
    DinoGame.tsx               canvas drawing, animation loop, keyboard + touch controls
  games/memory/                Zábava: Pexeso
    logic.ts                   themes, sizes, dealing, flipping, turns, stars + tests
    MemoryGame.tsx             setup (pictures, players, size) + board of flipping cards
  games/english/               Angličtina
    topics.ts                  word lists (colors, numbers) and topic texts + tests
    logic.ts                   rounds, answer options, spelling check, hints + tests
    TopicHome.tsx              mode cards + Slovníček
    EnglishMode.tsx            one round of any English mode
    ChoiceCard.tsx / SpellingCard.tsx / WordPicture.tsx / SpeakButton.tsx
  profiles/                    profile context, provider, picker
  components/                  Header, BackLink, GamePanel, ModeCard, StarRating, NumPad, LetterPad, ProgressBar, MuteButton
  lib/storage.ts               localStorage data model (key `mathkids:v1`)
  lib/sound.ts                 synthesized sounds + English speech
  lib/confetti.ts
```

## Adding a new game

1. Add a panel to its subject's `games` in `src/games/registry.ts`, with a `path` so the panel becomes clickable.
2. Create `src/games/<game>/` with its screens. Put the rules in a pure `logic.ts` with tests.
3. Register the routes in `src/App.tsx`, wrapped in `<RequireProfile>`.
4. If it stores progress, add its id to `OPERATION_IDS`, `TOPIC_IDS`, `FUN_IDS` or a new list in `GAME_IDS` (`src/lib/storage.ts`). `loadData` fills in empty progress for every id, so existing saves keep working.

A new English topic only needs a `TOPICS` entry (`games/english/topics.ts`), its id in `TOPIC_IDS` and a panel in the registry.

A new arithmetic operation only needs an entry in `OPERATIONS` (`games/arithmetic/operations.ts`), its id in `OPERATION_IDS` (`lib/storage.ts`) and a panel in the registry. Routes and saved progress follow automatically.
