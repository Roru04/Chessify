# Overview

## Goal

Build a chess web app that combines two things:

1. **Playing** — a full game against a computer opponent of adjustable strength.
2. **Learning** — live engine analysis (best moves, evaluation) shown next to
   the board, so you can see what the strongest continuation would have been.

## Target users

- Players who want to practise against a computer at their own level.
- Players who want to understand positions by seeing what the engine
  recommends and why the evaluation changes after a move.

## Principles

- **Runs entirely in the browser.** Stockfish runs as WebAssembly inside a Web
  Worker. No server, no data leaves the machine.
- **Analysis is optional.** Every hint (eval bar, best-move list) can be
  turned off, so the app can also be used for "honest" games.
- **One engine, two roles.** The same Stockfish build is used both as the
  opponent (with reduced strength) and as the analyzer (at full strength).
  These run as two separate engine instances so they don't interfere.

## Scope of version 1

In scope:

- Play a game against Stockfish as White or Black.
- Adjustable opponent strength.
- Live analysis: evaluation bar, top 3 moves with lines (no best-move arrow on the board).
- Basic game controls: new game, undo, flip board, move list.

Out of scope for version 1 (see [roadmap.md](roadmap.md)):

- Post-game review (move classification, accuracy, eval graph).
- PGN/FEN import and export.
- Free analysis mode (set up arbitrary positions).
- Persistence of games between sessions.
