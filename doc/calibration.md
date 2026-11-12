# Calibration of the weak computer levels

Goal: make the rating shown for the weak computer levels (1 – 6) match how
strong they really play, with even steps between levels. Status: **free Elo
input replaced by ten fixed levels (2026-11-12); full round robin done,
levels 1 – 6 match their labels within ≈ 25 Elo.** See [Difficulty levels](#difficulty-levels-2026-11-12).

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

## New move choice (2026-11-12)

The weak bot was rewritten ("candidate moves + blindness", see
[architecture.md](architecture.md#opponent-strength-levels-1--10)). A quick
check with the new bot, 24 games each, Stockfish 1 s per move:

| Pairing | W/D/L (first player) | Score | Elo diff (95 % range) |
|---------|----------------------|-------|------------------------|
| sf1320 vs t1 | 1/0/23 | 4 % | −545 (−1200 … −341) |
| sf1320 vs t0.5 | 15/0/9 | 62.5 % | +89 (−51 … +267) |

So the labels are still too low (same picture as the trial run); the full
calibration run is still needed.

### Move-quality statistics

`npm run bot-stats -- --levels 100,400,800,1200,1320 --games 16 --workers 8`
(`scripts/bot-stats/bot-stats.ts`) plays self-play games per level and has a
full-strength referee analyse every move: accuracy, move classes, the share of
moves that lose ≥ 1 / 2 / 3 pawns in still undecided positions, when the first
big blunder happens, how games end, and what kind of blunders the bot makes.
Use it to compare changes to the weak bot.

| Level | Lose ≥ 2 pawns (before → after) | First 3-pawn blunder, median move (before → after) | Games ending in mate (before → after) |
|-------|------|------|------|
| 100 | 21 % → 20 % | 11 → 8 | 3/16 → 31/32 |
| 300 | 18 % → 16 % | 13 → 10 | 4/16 → 32/32 |
| 500 | 13 % → 13 % | 13 → 11 | 7/16 → 32/32 |
| 700 | 6.5 % → 10 % | 19 → 12 | 6/16 → 32/32 |
| 900 | 3.0 % → 8.7 % | 34 → 12 | 4/16 → 32/32 |
| 1100 | 1.5 % → 6.5 % | 60 → 13 | 7/16 → 32/32 |
| 1300 | 0.8 % → 4.1 % | 34 → 20 | 5/16 → 30/32 |
| sf1320 | 9.7 % | 15 | 15/16 |

## Difficulty levels (2026-11-12)

The free Elo input (100 – 3000) was replaced by ten fixed levels
(`src/engine/levels.ts`, table in
[architecture.md](architecture.md#opponent-strength-levels-1--10)). Reasons,
from the measurements above:

- The old Elo → t line put the labels far too low (the "1319" bot beat
  Stockfish 1320 23–1), so there was a big jump in strength at 1320.
- Many neighbouring Elo values played the same, so an exact number promised
  more precision than there was.

Levels 1 – 6 are weak-bot settings picked so that each wins about two thirds
of its games against the one below (≈ 115 Elo per step) and level 6 is close
to Stockfish 1320. The lowest levels needed t below 0 (down to −1: depth 1,
one candidate move, high blindness).

### Level test

`npm run calibrate:levels` (= `--ladder --games 100 --workers 8 --movetime 1000`)
plays every level against the one below (L2:L1 … L7:L6) plus Stockfish 1320
against level 6, and marks a pairing **OK** when the difference of the shown
ratings lies inside the measured 95 % range.

Quick run, 2026-11-12: 24 games per pairing, 4 workers, Stockfish 500 ms per
move, 159 s in total. **Note:** 500 ms is half the app's default, so the two
Stockfish rows understate Stockfish; the full run below uses 1 s.

| Pairing | W/D/L (first player) | Score | Elo diff (95 % range) | Expected | Check |
|---------|----------------------|-------|------------------------|----------|-------|
| L2 vs L1 | 17/1/6 | 72.9 % | +172 (+37 … +393) | +100 | OK |
| L3 vs L2 | 17/0/7 | 70.8 % | +154 (+16 … +371) | +150 | OK |
| L4 vs L3 | 14/0/10 | 58.3 % | +58 (−84 … +225) | +100 | OK |
| L5 vs L4 | 18/0/6 | 75.0 % | +191 (+51 … +441) | +100 | OK |
| L6 vs L5 | 17/1/6 | 72.9 % | +172 (+37 … +393) | +100 | OK |
| L7 vs L6 | 21/0/3 | 87.5 % | +338 (+182 … +1200) | +300 | OK |
| sf1320 vs L6 | 17/0/7 | 70.8 % | +154 (+16 … +371) | +20 | OK |

Findings: every level beats the one below and there is no jump at level 7.
With 24 games the ranges are too wide (±150 – 200 Elo) for more. The apparent
"level 6 ≈ 1170" came from the short Stockfish time and was disproved by the
full run.

### Full run (2026-11-12)

1 800 games, 4 workers, Stockfish 1 s per move (the app's default), referee as
above. Bot-vs-bot games are not affected by the move time (the weak bot's
strength does not depend on it).

Round robin of levels 1 – 6, 100 games per pairing (score of the row level):

| | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|
| **L1** | – | 38 % | 21.5 % | 10 % | 7.5 % | 2.5 % |
| **L2** | 62 % | – | 24.5 % | 27 % | 10 % | 8 % |
| **L3** | 78.5 % | 75.5 % | – | 36 % | 29 % | 15 % |
| **L4** | 90 % | 73 % | 64 % | – | 40 % | 28.5 % |
| **L5** | 92.5 % | 90 % | 71 % | 60 % | – | 31.5 % |
| **L6** | 97.5 % | 92 % | 85 % | 71.5 % | 68.5 % | – |

Anchor matches, 100 games each:

| Pairing | W/D/L (first player) | Score | Elo diff (95 % range) |
|---------|----------------------|-------|------------------------|
| sf1320 vs L6 | 51/0/49 | 51 % | +7 (−62 … +77) |
| sf1320 vs L5 | 71/0/29 | 71 % | +156 (+85 … +240) |
| L7 vs L6 | 80/0/20 | 80 % | +241 (+165 … +344) |

Ratings fitted from all 18 pairings (maximum likelihood, sf1320 fixed at
1320; uncertainty about ±50):

| Level | Label | Measured |
|-------|-------|----------|
| 1 | 750 | 757 |
| 2 | 850 | 853 |
| 3 | 1000 | 1013 |
| 4 | 1100 | 1104 |
| 5 | 1200 | 1177 |
| 6 | 1300 | 1302 |
| 7 (`UCI_Elo=1600`) | 1600 → **1550** | 1543 |

Findings:

1. **The levels work.** Every level beats every weaker level, and levels
   1 – 6 match their labels within ≈ 25 Elo. Level 6 is as strong as
   Stockfish 1320, so there is no jump into the Stockfish levels.
2. Steps are uneven but all clear: 1 → 2 +96, 2 → 3 +160, 3 → 4 +91,
   4 → 5 +73, 5 → 6 +125, 6 → 7 +241 (fitted).
3. Level 7 plays ≈ 60 Elo below `UCI_Elo=1600` (lite network, fixed move
   time), so its label was changed to ≈ 1550. Levels 8 – 9 are not measured.

### Move quality per level

`npm run bot-stats -- --levels 1,2,3,4,5,6,7 --games 12 --workers 4 --depth 10`,
2026-11-12 (self-play, referee depth 10). "Undecided" = positions with
|eval| < 3 pawns.

| Level | Undecided moves losing ≥ 2 pawns | First 3-pawn blunder (median move) | Avg game length (plies) | Endings |
|-------|------|------|------|------|
| 1 | 26 % | 6 | 96 | 9 mate, 2 insufficient material, 1 move limit |
| 2 | 32 % | 6 | 77 | 10 mate, 2 move limit |
| 3 | 24 % | 7 | 73 | 11 mate, 1 move limit |
| 4 | 17 % | 12 | 68 | 12 mate |
| 5 | 12 % | 12 | 78 | 12 mate |
| 6 | 13 % | 10 | 64 | 12 mate |
| 7 (sf1600) | 7 % | 16 | 88 | 12 mate |

- The blunder rate falls from levels 1 – 3 (about a quarter of undecided
  moves) to level 7 (7 %). Levels 1 – 3 are very close to each other here
  (12 games each, so ±5 % noise), and 5 and 6 are too.
- Levels 1 – 3 blunder early (median move 6, right after the book); from
  level 4 the first big blunder comes around move 10 – 12.
- Most blunders are beginner-like: leaving a piece hanging, moving a piece to
  an attacked square, capturing a defended piece. Level 7's errors are more
  often "missed winning material".
- Almost every game ends in mate. Only levels 1 – 3 sometimes fail to finish
  a won game (move limit, or trading down to insufficient material).
