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

### Two instances

| Instance | Purpose | Settings |
|----------|---------|----------|
| Opponent | Chooses the computer's move | Depends on target Elo (see below), fixed `movetime` |
| Analyzer | Shows best moves to the user | Full strength, `MultiPV=3`, runs until stopped or a depth limit |

Keeping them separate means the weakened opponent settings never affect the
analysis, and analysis can keep running while the opponent is thinking.

### Opponent strength (Elo 100 – 3000)

The user enters an exact target Elo from **100 to 3000**. Stockfish's own
limiter (`UCI_LimitStrength` + `UCI_Elo`) only goes down to **1320**, so two
modes are used:

| Target Elo | Method |
|------------|--------|
| 1320 – 3000 | Stockfish's built-in limiter: `UCI_LimitStrength=true`, `UCI_Elo=<target>`. Calibrated by the Stockfish team. |
| 100 – 1319 | Human-like weakening (no random moves): Stockfish scores **every legal move** (MultiPV = all moves, depth 4–8). Each move also gets a *plausibility* weight for how natural it looks to a beginner. The bot draws a move with weight `plausibility^k × exp(−loss / T)`; the lower the Elo, the higher the temperature `T` and the more it trusts "looks natural" over "is good". |

**Opening book (all levels):** the computer first follows a small book of
standard opening lines that club players actually play
(`src/engine/openingBook.ts`: about 35 lines – Italian, Ruy Lopez, Scotch,
Sicilian, French, Caro-Kann, Scandinavian, Queen's Gambit, Slav, London, King's
Indian, Nimzo-Indian, English, Réti, …), chosen by popularity. It leaves the
book after 8 half-moves at 100 Elo, up to 12 at 1300 and above, or as soon as
the position isn't in the book. In the first 10 moves the weak bot also uses a
much lower temperature (60 → 25 cp), so even 100-Elo openings are sound; the
beginner mistakes happen in the middlegame. Example: the 100-Elo bot answered
1.e4 with e5 17/40, c5 8/40, c6 6/40, e6 5/40, d5 3/40, d6 1/40.

Plausibility rules (`plausibility()` in `src/engine/strength.ts`):

- More likely: captures (beginners love them, even bad ones), checks,
  promotions, castling, moves toward the centre, forward moves, rescuing a
  piece that is under attack (noticed more often at higher Elo).
- Opening habits (first 12 moves): develop knights and bishops, push d/e
  pawns; edge pawns, early queen and rook moves are less likely.
- Less likely: king walks, retreats, knights to the rim.
- Evaluations are clipped at ±15 pawns, so a mate counts like a big material
  win and a weak bot can miss a mate or walk into one.

Typical result (self-play test, 6 games × 40 plies per level, referee at
depth 10): share of moves that lose ≥ 2 pawns — 100 Elo: 21 %, 500: 9 %,
900: 3 %, 1300: 0 %. The mistakes are beginner-like (walking into forks,
grabbing defended material, overlooking threats).

Below 1320 the Elo is an **approximation**, not a calibrated rating. All
parameters live in `weakParams()` so they can be calibrated later by
automated matches against Stockfish's own 1320 level.

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
