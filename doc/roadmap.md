# Roadmap

## Phase 1 — Play + live analysis (version 1)

See [features.md](features.md).

## Phase 2 — Post-game review (implemented 2026-11-11, see features.md §4)

- Re-analyse every position of a finished game at fixed depth.
- Classify each move by evaluation loss:

  | Class | Eval loss (approx.) |
  |-------|---------------------|
  | Best | 0 (engine's top move) |
  | Good | < 50 centipawns |
  | Inaccuracy | 50 – 100 |
  | Mistake | 100 – 300 |
  | Blunder | > 300, or a missed/allowed forced mate |

- Stats per player: accuracy %, average centipawn loss (ACPL), count of each
  move class.
- Evaluation graph over the whole game; click a point to jump to that move.
- Step through moves with ← / → keys.

## Phase 3 — Import / export and free analysis

- Import and export PGN (full games) and FEN (single positions).
- Analysis-only mode: set up any position or paste a game and analyse it
  without playing.
- Start a game against the computer from any position.

## Phase 3b — AI explanations (optional)

Richer, conversational explanations ("What's the plan here?") using a large
language model.

- The model gets the position (FEN), the Stockfish lines and the detected
  patterns, and only puts them into words. It must not choose moves itself,
  because language models alone make chess mistakes.
- Needs an API key, which must not be shipped to the browser. A small
  serverless function (e.g. Cloudflare Pages Functions) holds the key and
  forwards requests.
- Costs a small amount per explanation, so it should be optional and
  rate-limited.

## Phase 4 — Comfort features

- Save games locally (browser storage) and a game history list.
- Opening name detection.
- Clocks / time controls.
- Sound effects and board/piece themes.
- Multi-threaded Stockfish (needs cross-origin isolation headers).
