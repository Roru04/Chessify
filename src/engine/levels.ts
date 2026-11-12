// Difficulty levels for the computer opponent.
//
// Instead of a free Elo number the player picks one of ten levels. Each level
// is a fixed engine setting. Levels 1–6 (the app's weak bot) are measured in
// bot-vs-bot matches so that the steps are even (≈ 115 Elo, each level wins
// about two thirds of its games against the one below) and level 6 is as strong
// as Stockfish's limiter at 1320. See doc/calibration.md; check with
// `npm run calibrate:levels`.
//
// The Elo shown next to each level is on Stockfish's engine scale (anchored to
// its limiter at 1320), not a human chess.com / Lichess rating.

export type OpponentSpec =
  /** The app's human-like weak bot at internal strength t (−1 … 1), see strength.ts. */
  | { kind: "weak"; t: number }
  /** Stockfish's calibrated strength limiter. */
  | { kind: "limiter"; elo: number }
  /** Stockfish at full strength. */
  | { kind: "full" };

export interface Level {
  id: number;
  name: string;
  /** Rough rating, for orientation only (null = no meaningful number). */
  approxElo: number | null;
  /** One line about how this level plays. */
  blurb: string;
  opponent: OpponentSpec;
}

export const LEVELS: Level[] = [
  { id: 1, name: "Newcomer", approxElo: 750, blurb: "Knows the rules, often leaves pieces hanging.", opponent: { kind: "weak", t: -1 } },
  { id: 2, name: "Beginner", approxElo: 850, blurb: "Develops pieces, still misses many threats.", opponent: { kind: "weak", t: -0.58 } },
  { id: 3, name: "Novice", approxElo: 1000, blurb: "Sees simple threats, falls for forks and pins.", opponent: { kind: "weak", t: -0.15 } },
  { id: 4, name: "Casual", approxElo: 1100, blurb: "Solid opening, blunders now and then.", opponent: { kind: "weak", t: 0 } },
  { id: 5, name: "Intermediate", approxElo: 1200, blurb: "Punishes hanging pieces, misses deeper tactics.", opponent: { kind: "weak", t: 0.2 } },
  { id: 6, name: "Club", approxElo: 1300, blurb: "Few outright blunders, plays sensible plans.", opponent: { kind: "weak", t: 0.48 } },
  { id: 7, name: "Strong club", approxElo: 1550, blurb: "Stockfish, limited. Rarely gives anything away.", opponent: { kind: "limiter", elo: 1600 } },
  { id: 8, name: "Expert", approxElo: 2000, blurb: "Stockfish, limited. Strong tactics and technique.", opponent: { kind: "limiter", elo: 2000 } },
  { id: 9, name: "Master", approxElo: 2400, blurb: "Stockfish, limited. Very hard to beat.", opponent: { kind: "limiter", elo: 2400 } },
  { id: 10, name: "Maximum", approxElo: null, blurb: "Stockfish at full strength.", opponent: { kind: "full" } },
];

export const DEFAULT_LEVEL = 4;

export function levelById(id: number): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[DEFAULT_LEVEL - 1];
}

/** Nearest level for an old saved Elo setting. */
export function levelForElo(elo: number): Level {
  if (!Number.isFinite(elo)) return levelById(DEFAULT_LEVEL);
  if (elo >= 2800) return LEVELS[LEVELS.length - 1];
  let best = LEVELS[0];
  for (const l of LEVELS) {
    if (l.approxElo !== null && Math.abs(l.approxElo - elo) < Math.abs((best.approxElo ?? Infinity) - elo)) best = l;
  }
  return best;
}

/** "Casual · ≈ 800" */
export function levelLabel(l: Level): string {
  return l.approxElo === null ? l.name : `${l.name} · ≈ ${l.approxElo}`;
}
