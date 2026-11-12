# Architecture

## Tech stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Build tool | Vite | Fast dev server, simple static build |
| UI | React + TypeScript | Component-based UI, typed engine messages |
| Chess rules | `chess.js` | Legal moves, check/mate/draw detection, FEN/PGN |
| Board | `react-chessboard` | Drag & drop, arrows, square highlighting |
| Engine | `stockfish` (npm, WebAssembly build) | Full-strength Stockfish in the browser |

Versions current at the time of writing: stockfish 19, chess.js 1.4,
react-chessboard 5, React 19, Vite 8. Exact versions are pinned in
`package.json` once the project is scaffolded.

## High-level structure

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                  │
│   React UI                                                       │
│   ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│   │ EvalBar    │  │ Board        │  │ AnalysisPanel          │   │
│   │            │  │ (+ arrows)   │  │ top moves, depth, eval │   │
│   └────────────┘  └──────────────┘  └────────────────────────┘   │
│          ▲               ▲   │                 ▲                 │
│          │               │   │ user move       │                 │
│          │        ┌──────┴───▼──────┐          │                 │
│          └────────┤  Game state     ├──────────┘                 │
│                   │  (chess.js)     │                            │
│                   └──┬───────────┬──┘                            │
│          position+go │           │ position+go                   │
│                ┌─────▼────┐ ┌────▼──────┐                        │
│                │ Opponent │ │ Analyzer  │   Web Workers           │
│                │ engine   │ │ engine    │   (Stockfish WASM)      │
│                └──────────┘ └───────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

## Engine integration

Stockfish speaks the **UCI protocol** (Universal Chess Interface) — a
line-based text protocol. In the browser, lines are sent with
`worker.postMessage(line)` and responses arrive as `message` events.

A small wrapper class (`StockfishEngine`) hides this:

- Starts the worker and waits for `uciok` / `readyok`.
- `setOption(name, value)` → `setoption name … value …`
- `analyze(fen, { multiPv, depth | movetime })` → `position fen …` + `go …`,
  parses `info` lines and emits updates.
- `stop()` → `stop`; resolves when `bestmove` arrives.

### Engine instances

| Instance | Purpose | Settings |
|----------|---------|----------|
| Opponent | Chooses the computer's move; after the game, reviews it | Depends on the difficulty level (see below), fixed `movetime`; review at full strength, depth 14, `MultiPV=2` |
| Analyzer | Shows best moves to the user | Full strength, `MultiPV=3`, runs until stopped or a depth limit |
| Import reviewer | Reviews imported chess.com games | Full strength, depth 14, `MultiPV=2`; started on first use |

Keeping them separate means the weakened opponent settings never affect the
analysis, and analysis can keep running while the opponent is thinking.
Imported games get their own engine because a game against the computer can
still be running in the Play tab: the opponent switches its strength limit
on and off per move, which would weaken a review sharing it.

### Opponent strength (levels 1 – 10)

The user picks one of **ten difficulty levels** instead of typing an Elo
number. Each level is a fixed engine setting, defined in
`src/engine/levels.ts`:

| Level | Name | Shown rating | Engine setting |
|-------|------|--------------|----------------|
| 1 | Newcomer | ≈ 750 | Weak bot, t = −1 |
| 2 | Beginner | ≈ 850 | Weak bot, t = −0.58 |
| 3 | Novice | ≈ 1000 | Weak bot, t = −0.15 |
| 4 | Casual (default) | ≈ 1100 | Weak bot, t = 0 |
| 5 | Intermediate | ≈ 1200 | Weak bot, t = 0.2 |
| 6 | Club | ≈ 1300 | Weak bot, t = 0.48 |
| 7 | Strong club | ≈ 1550 | Stockfish limiter, `UCI_Elo=1600` (measured ≈ 1540 on the app's scale, see below) |
| 8 | Expert | ≈ 2000 | Stockfish limiter, `UCI_Elo=2000` |
| 9 | Master | ≈ 2400 | Stockfish limiter, `UCI_Elo=2400` |
| 10 | Maximum | – | Stockfish at full strength (`UCI_LimitStrength=false`) |

- **Levels 7 – 10** use Stockfish's own limiter (`UCI_LimitStrength` +
  `UCI_Elo`, calibrated by the Stockfish team) or full strength, with the
  chosen think time per move.
- **Levels 1 – 6** use the app's human-like weak bot (below), because the
  limiter only goes down to 1320. *t* is its internal strength (−1 … 1);
  every weak-bot setting is derived from it in `paramsForT()`.
- The levels 1 – 6 were chosen so that the steps are even (each level should
  win about two thirds of its games against the one below, ≈ 115 Elo) and
  level 6 is about as strong as Stockfish's limiter at 1320. Check with
  `npm run calibrate:levels` (see [calibration.md](calibration.md)).
- Level 7 is labelled ≈ 1550 although it uses `UCI_Elo=1600`: the app runs
  the lite Stockfish build with a fixed time per move, which plays a bit
  weaker than Stockfish's official calibration (measured 2026-11-12, see
  [calibration.md](calibration.md)). Levels 8 – 9 are not measured and are
  probably also somewhat below their labels.
- The shown ratings are rough, on Stockfish's engine scale (anchored to its
  limiter at 1320), **not** chess.com or Lichess ratings.
- Settings saved by older versions (an exact Elo) are mapped to the level with
  the nearest shown rating (`levelForElo()`).

**Opening book (all levels):** the computer first follows a small book of
standard opening lines that club players actually play
(`src/engine/openingBook.ts`: about 35 lines – Italian, Ruy Lopez, Scotch,
Sicilian, French, Caro-Kann, Scandinavian, Queen's Gambit, Slav, London, King's
Indian, Nimzo-Indian, English, Réti, …), chosen by popularity. It leaves the
book after 8 half-moves at levels 1 – 4, 9 at level 5, 10 at level 6 and 12 at
levels 7 – 10, or as soon as the position isn't in the book. In the first 10
moves the weak bot is also more careful (spots the right idea more often,
checks replies three times as often), so even level-1 openings are mostly
sound.

**How the weak bot picks a move** (`humanLikeMove()` in `src/engine/strength.ts`):

1. Stockfish scores every legal move at a shallow depth.
2. **Clearly winning** (≥ 5 pawns, or a forced mate): with the "convert"
   chance the bot plays the best move at depth 10, so won games get finished
   instead of shuffling around. Forced mates rank above any material.
3. **Candidates:** a few moves are drawn by plausibility (see below). With
   the "spot best" chance the engine's best move is added too.
4. **Blindness:** for each candidate, with the "blindness" chance, the bot
   doesn't check the opponent's reply. It then judges that move only by what
   it captures right away (slightly below a checked move of equal value).
   This produces the typical beginner blunders: leaving a piece hanging,
   moving into an attack, grabbing a defended piece.
5. The best-looking candidate is played, with a little randomness.

Settings per level (from `paramsForT()`):

| Level | Depth | Candidates | Spot best | Blindness | Convert |
|-------|-------|------------|-----------|-----------|---------|
| 1 | 1 | 1 | 25 % | 85 % | 35 % |
| 2 | 1 | 1 | 40 % | 66 % | 40 % |
| 3 | 1 | 1 | 55 % | 43 % | 55 % |
| 4 | 1 | 2 | 60 % | 36 % | 60 % |
| 5 | 2 | 3 | 67 % | 27 % | 67 % |
| 6 | 3 | 5 | 77 % | 17 % | 77 % |

Levels 1 – 3 differ only in how often they spot the best move and how often
they check replies.

Plausibility rules (`plausibility()` in `src/engine/strength.ts`):

- More likely: captures (beginners love them; grabbing a defended piece with
  a more valuable one is less tempting), checks,
  promotions, castling, moves toward the centre, forward moves, rescuing a
  piece that is under attack (noticed more often at higher levels).
- Opening habits (first 12 moves): develop knights and bishops, push d/e
  pawns; edge pawns, early queen and rook moves are less likely.
- Less likely: king walks, retreats, knights to the rim.

Measured behaviour (move quality per level, level steps):
see [calibration.md](calibration.md).

### Move explanations

Shown only in the post-game review. Stockfish only returns moves and numbers, never reasons. Explanations are
generated by a separate module (`src/explain/`) that looks at the position
and the engine's line with `chess.js` and detects common patterns:

| Pattern | Example text |
|---------|--------------|
| Wins material | "Bxe5 wins a knight for nothing." |
| Escapes a threat | "Your bishop on b5 is attacked by the pawn on a6. Ba4 moves it to safety." |
| Hanging piece | "After your Nf6, the pawn on f7 is no longer defended." |
| Check / mate threat | "Qh5 threatens Qxf7#." |
| Fork | "Nd5 attacks the queen on c7 and the rook on e7 at the same time." |
| Pin | "Bb5 pins the knight on c6 to the king." |
| Promotion | "The pawn on b7 promotes next move." |
| Trade | "Bxc6 trades the bishop for the knight." |
| Castling / king safety | "O-O gets the king to safety and connects the rooks." |
| Development (opening) | "Nf3 develops a piece and controls e5 and d4." |

When no pattern matches, the text falls back to the line itself
("Stockfish prefers this; the main line is …") plus the change in evaluation.

The same module also explains **why your move was weaker**: it compares your
move with the best move and shows the opponent's best reply
("After Nf6?? White plays Qxf7#, checkmate").

An optional AI explanation layer is planned for later, see
[roadmap.md](roadmap.md).

### Parsing `info` lines

Example engine output:

```
info depth 18 multipv 1 score cp 34 nodes 812345 pv e2e4 e7e5 g1f3 ...
info depth 18 multipv 2 score cp 21 ... pv d2d4 d7d5 ...
info depth 18 multipv 3 score mate 5 ... pv ...
```

Fields used:

- `depth` — search depth reached.
- `multipv` — which line (1 = best).
- `score cp N` — evaluation in centipawns (100 = one pawn).
- `score mate N` — forced mate in N moves (negative = being mated).
- `pv` — the principal variation (line of moves) in UCI notation, converted to
  SAN (`Nf3`, `exd5`) with `chess.js` for display.

**Score perspective:** UCI scores are from the side to move. The app converts
them to White's perspective before displaying (positive = White better).

### Analysis lifecycle

1. Position changes (any move, undo, new game) → `stop` current analysis.
2. Send new `position fen …` and `go infinite` (or `go depth N`).
3. Stream `info` updates to the UI, throttled to avoid excessive re-renders.

## chess.com import

`src/import/chesscom.ts` talks to chess.com's public API directly from the
browser (no login, CORS allowed, so no server is needed on GitHub Pages):

1. `GET /pub/player/{user}/games/archives` → list of monthly archive URLs.
2. `GET /pub/player/{user}/games/{YYYY}/{MM}` → all games of that month,
   each with PGN, players, ratings, result codes, time class, opening link
   and (for analysed games) chess.com's accuracies.

Months are loaded one at a time, newest first, and cached in memory for the
session (failed requests are not cached). Games that aren't standard chess
from the normal start position are dropped. chess.com's result codes map to
our end reasons (`checkmated` → checkmate, `resigned`, `timeout`,
`abandoned`, `agreed`, `repetition`, `stalemate`, `insufficient`, `50move`,
`timevsinsufficient`). Errors become `ChessComError` with a kind
(`not-found`, `rate-limit`, `network`, `bad-response`) and a user-facing
message.

The PGN is read with chess.js (clock comments are ignored) and the move list
goes to `GameReview` (`src/components/GameReview.tsx`), the same component
the post-game review uses. `Board` can show a position without a live game
for this.

## State

Game state lives in one place (a React hook, e.g. `useChessGame`) wrapping a
`chess.js` instance:

- current FEN, move history (SAN), side to move, game-over status
- player color, opponent settings
- analysis results: list of `{ multipv, depth, score, pvSan[] }`

No global state library is needed for version 1.

## Deployment

`npm run build` produces static files in `dist/` that can be hosted anywhere
(or opened via `npm run preview`). See [hosting.md](hosting.md). Note: the multi-threaded Stockfish build
requires cross-origin isolation headers (`COOP`/`COEP`); version 1 uses the
**single-threaded** "lite" build to avoid that requirement.
