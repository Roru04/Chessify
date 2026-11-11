# Calibration of the weak computer levels

Goal: make the Elo shown for the computer below 1320 match how strong it
really plays. Status: **trial run done (2026-11-11), full calibration not yet.**

## Method

- Tool: `npm run calibrate -- --pair A:B [--pair …] --games N --workers 3 --movetime 1000`
  (`scripts/calibrate/calibrate.ts`, development only). Plays games in parallel
  Node worker threads with the same Stockfish build (lite, single-threaded) and
  the same move-choice code as the app.
- Players: `sf1320` = Stockfish with its own Elo limiter (+ the app's opening
  book), `t0.5` = the app's human-like weak bot at internal strength t
  (0 = weakest, 1 = strongest weak level; all its settings derive from t).
- Anchor: Stockfish's limiter at 1320, the only calibrated level below 1500.
  Weaker levels are measured in a ladder against neighbours that are already
  measured. Elo difference from score s: −400 · log₁₀(1/s − 1).
- Adjudication: full-strength referee (depth 8) every 2nd half-move from
  move 8; ≥ 10 pawns for one side on 3 checks in a row = win; draw after 200
  half-moves.

### Caveats

- Stockfish's limiter is calibrated on an engine rating scale (CCRL) with the
  **full** network at 60 s + 0.6 s. The app uses the **lite** network and a
  fixed time per move, so "sf1320" here is probably somewhat weaker than 1320.
- These ratings are on Stockfish's scale, not chess.com or Lichess human
  ratings.

## Trial run (2026-11-11)

36 games, 3 workers, Stockfish 1 s per move, 235 s in total.

| Pairing | Games | W/D/L (first player) | Score | Elo diff (95 % range) |
|---------|-------|----------------------|-------|------------------------|
| sf1320 vs t1 | 12 | 0/0/12 | 0 % | < −400 (too lopsided to measure) |
| sf1320 vs t0.5 | 12 | 6/1/5 | 54 % | +29 (−182 … +268) |
| t1 vs t0.5 | 12 | 12/0/0 | 100 % | > +400 (too lopsided to measure) |

Time per game: about 4 s bot vs bot, 20–35 s with Stockfish (1 s per move).

### Findings

1. The weak bot is **much stronger than its labels**. t = 0.5 (labelled 710
   Elo) plays about as strong as Stockfish 1320; t = 1 (labelled 1319) beats
   Stockfish 1320 in every game.
2. So there is a **jump at 1320**: choosing 1319 gives a much stronger
   opponent than choosing 1320.
3. Steps of 0.5 in t are far too big to measure; the ladder needs steps of
   about 0.1.

### Plan for the full run

1. Anchor: `sf1320` vs t = 0.4, 0.5, 0.6 (near 50 %), ~100 games each.
2. Ladder: t = 0.5 → 0.4 → … → 0 against the next level up, ~100 games each.
3. Fit the measured curve, invert it into a table Elo → t in
   `src/engine/strength.ts`, and make the level just below 1320 match
   Stockfish 1320 (no jump).
4. If even t = 0 is stronger than about 100, extend the weakening so the
   lowest levels can be reached.
