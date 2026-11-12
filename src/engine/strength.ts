// How the opponent engine plays at each difficulty level (see levels.ts).
//
// The strong levels use Stockfish's calibrated strength limiter (or full
// strength). The weak levels use the app's own human-like bot, which imitates how a
// human beginner thinks (see humanLikeMove):
//   1. only a few moves that catch the eye are considered (candidates),
//   2. they are looked at shallowly (low search depth),
//   3. for some of them the opponent's reply is simply not checked
//      ("blindness"), which produces realistic blunders such as leaving a
//      piece hanging,
//   4. when clearly winning, the bot plays purposefully towards mate instead
//      of shuffling around.
// The lower the internal strength t, the fewer candidates, the shallower the
// look and the more blindness.

import type { Chess, Move, Square } from "chess.js";
import type { StockfishEngine } from "./StockfishEngine";
import { bookMove, pliesFromFen } from "./openingBook";
import type { Level } from "./levels";
import type { Score } from "./uci";

export interface WeakParams {
  /** Search depth used to score the moves (how far ahead the bot "sees"). */
  depth: number;
  /** How many eye-catching moves are considered each turn. */
  candidates: number;
  /** Chance that the engine's best move is among the candidates ("spots the right idea"). */
  spotBest: number;
  /** Chance that the opponent's reply to a candidate is not checked. */
  blindness: number;
  /** Small randomness among the candidates as seen (centipawns). */
  temperatureCp: number;
  /** How strongly natural-looking moves are preferred as candidates (exponent on plausibility). */
  naturalWeight: number;
  /** Extra preference for rescuing a piece that is under attack (beginners often don't notice). */
  noticeThreats: number;
  /** How many half-moves the bot follows the opening book. */
  bookPlies: number;
  /** Chance per move to play purposefully (full look) when clearly winning. */
  convertChance: number;
}

/** Material evaluations are clipped to this; forced mates rank above it (shorter = higher). */
const CLIP_CP = 1500;
/** "Clearly winning" from the bot's point of view (centipawns). */
const WINNING_CP = 500;
/** Depth for purposeful moves in won positions. */
const CONVERT_DEPTH = 10;
/** A move whose reply was not checked looks this much worse than the best checked move (before material won). */
const BLIND_MARGIN_CP = 40;
/** Upper limit for MultiPV (number of moves scored). */
const MAX_LINES = 60;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * All weak-bot settings as a function of the internal strength t.
 * t = 1 is the strongest weak setting; t = 0 the old weakest one. Values below
 * 0 (down to −1) make the bot weaker still, for the lowest levels.
 */
export function paramsForT(t: number): WeakParams {
  return {
    depth: clamp(1 + Math.round(t * 5), 1, 6), // 1 … 6
    candidates: clamp(2 + Math.round(t * 6), 1, 8), // 1 … 8
    spotBest: clamp(0.6 + 0.35 * t, 0.15, 0.95), // 0.25 at t=−1, 0.6 at 0, 0.95 at 1
    blindness: clamp(0.06 + 0.3 * Math.pow(1 - t, 1.5), 0, 0.85), // 0.85 at t=−1, 0.36 at 0, 0.06 at 1
    temperatureCp: 15 + 35 * (1 - t), // 85 … 15
    naturalWeight: 1.0 - 0.6 * t, // 1.6 … 0.4
    noticeThreats: clamp(0.4 + 2.1 * t, 0, 2.5), // 0 … 2.5
    bookPlies: clamp(8 + Math.round(t * 4), 8, 12), // 8 … 12 (4 … 6 moves per side)
    convertChance: clamp(0.6 + 0.35 * t, 0.35, 0.95), // 0.35 … 0.95
  };
}

// ---------------------------------------------------------------------------
// "Does this move look natural to a beginner?"

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CENTER = new Set(["d4", "e4", "d5", "e5"]);
const WIDE_CENTER = new Set(["c3", "d3", "e3", "f3", "c4", "f4", "c5", "f5", "c6", "d6", "e6", "f6"]);

function isAttacked(game: Chess, sq: Square, byColor: "w" | "b"): boolean {
  return game.attackers(sq, byColor).length > 0;
}

/** Positive weight; higher = more likely to catch a beginner's eye. */
export function plausibility(game: Chess, m: Move, noticeThreats: number): number {
  const opp = m.color === "w" ? "b" : "w";
  const moveNo = Number(game.fen().split(" ")[5]);
  const fromRank = Number(m.from[1]);
  const toRank = Number(m.to[1]);
  const forward = m.color === "w" ? toRank - fromRank : fromRank - toRank;
  let w = 1;

  if (m.captured) {
    // Beginners love captures; grabbing a defended piece with a more valuable one is a bit less tempting.
    const defended = game.attackers(m.to as Square, opp).length > 0;
    w += defended && VALUE[m.piece] > VALUE[m.captured] ? 0.6 + VALUE[m.captured] / 6 : 1.5 + VALUE[m.captured] / 3;
  }
  if (m.san.includes("+")) w += 1;
  if (m.promotion) w += 2;
  if (m.flags.includes("k") || m.flags.includes("q")) w += 1.2;

  // Opening habits every beginner is taught
  const castled = m.flags.includes("k") || m.flags.includes("q");
  if (moveNo <= 12 && !m.captured) {
    const backRank = m.color === "w" ? "1" : "8";
    const file = m.from[0];
    if ((m.piece === "n" || m.piece === "b") && m.from[1] === backRank) w += 2; // develop pieces
    if (m.piece === "p") {
      if (file === "d" || file === "e") w += 1.5; // centre pawns
      else if (file === "c") w += 0.6;
      else if (file === "f") w *= 0.6;
      else w *= 0.35; // a, b, g, h pawns
    }
    if (m.piece === "q") w *= 0.6;
    if (m.piece === "r" && !castled) w *= 0.4;
  }
  if (CENTER.has(m.to)) w += 0.6;
  else if (WIDE_CENTER.has(m.to)) w += 0.25;
  if (forward > 0) w += 0.3;

  // Rescuing a piece that is attacked (better players notice this more often)
  if (!m.captured && m.piece !== "k" && isAttacked(game, m.from as Square, opp)) w += noticeThreats;

  // Moves beginners rarely choose
  if (m.piece === "k" && !m.flags.includes("k") && !m.flags.includes("q") && !game.inCheck()) w *= 0.3;
  if (forward < 0 && !m.captured) w *= 0.7;
  if ((m.piece === "n" && (m.to[0] === "a" || m.to[0] === "h")) || (m.piece === "p" && (m.to[0] === "a" || m.to[0] === "h") && moveNo <= 10)) w *= 0.6;

  return Math.max(0.05, w);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Score from the mover's point of view as one comparable number: mates above any material, shorter mates higher. */
function perceivedCp(score: Score): number {
  if (score.mate !== undefined) {
    const n = Math.min(Math.abs(score.mate), 50);
    return (score.mate > 0 ? 1 : -1) * (CLIP_CP + 1000 - n * 10);
  }
  return Math.max(-CLIP_CP, Math.min(CLIP_CP, score.cp));
}

/** Material the move wins immediately, in centipawns (what a "blind" look sees). */
function immediateGain(m: Move): number {
  return (m.captured ? VALUE[m.captured] * 100 : 0) + (m.promotion ? (VALUE[m.promotion] - 1) * 100 : 0);
}

/** Draws k distinct items, each draw weighted by `weights`. */
function sampleDistinct<T>(items: T[], weights: number[], k: number): T[] {
  const pool = items.map((item, i) => ({ item, w: weights[i] }));
  const out: T[] = [];
  while (out.length < k && pool.length > 0) {
    const total = pool.reduce((a, p) => a + p.w, 0);
    let r = Math.random() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    out.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return out;
}

/**
 * Human-like move choice:
 *   1. Stockfish scores every legal move at a shallow depth.
 *   2. Clearly winning? Then usually play the best move at a deeper look, so won games get finished.
 *   3. Otherwise a few eye-catching candidates are drawn (by plausibility);
 *      often the engine's best move is "spotted" and added to them.
 *   4. Each candidate is judged by its score, or, if the bot is "blind" to the
 *      opponent's reply for it, only by the material it wins right away.
 *   5. The best-looking candidate is played (with a little randomness).
 */
export async function humanLikeMove(engine: StockfishEngine, game: Chess, p: WeakParams): Promise<string | null> {
  const legal = game.moves({ verbose: true });
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0].lan;

  const { bestMove, lines } = await engine.search(game.fen(), {
    depth: p.depth,
    multiPv: Math.min(legal.length, MAX_LINES),
  });
  if (lines.length === 0) return bestMove;

  const scoreOf = new Map<string, number>();
  for (const l of lines) if (!scoreOf.has(l.pv[0])) scoreOf.set(l.pv[0], perceivedCp(l.score));
  const best = Math.max(...scoreOf.values());
  const worst = Math.min(...scoreOf.values());

  // Clearly winning: mostly play with purpose so the game gets finished.
  if (best >= WINNING_CP && Math.random() < p.convertChance) {
    const focused = await engine.search(game.fen(), { depth: CONVERT_DEPTH, multiPv: 1 });
    if (focused.bestMove) return focused.bestMove;
  }

  // Candidates: the moves that catch the eye.
  const plaus = legal.map((m) => plausibility(game, m, p.noticeThreats));
  // Early in the game the bot is more careful: it spots the right idea more often and checks replies more.
  const opening = Number(game.fen().split(" ")[5]) <= 10;
  const spotBest = opening ? 1 - (1 - p.spotBest) / 2 : p.spotBest;
  const blindness = opening ? p.blindness / 3 : p.blindness;
  const candidates = sampleDistinct(legal, plaus.map((w) => Math.pow(w, p.naturalWeight)), p.candidates);
  const bestLegal = legal.find((m) => m.lan === lines[0].pv[0]);
  if (bestLegal && !candidates.includes(bestLegal) && Math.random() < spotBest) candidates.push(bestLegal);

  // Judge them; sometimes without checking the opponent's reply.
  const seen = candidates.map((m) => {
    const real = scoreOf.get(m.lan) ?? worst; // more than MAX_LINES legal moves: count as the worst scored one
    // Blind: the move looks "about as good as the best" plus whatever it captures, but a checked move of the same value is preferred.
    return Math.random() < blindness ? Math.max(real, best - BLIND_MARGIN_CP + immediateGain(m)) : real;
  });
  const top = Math.max(...seen);
  const weights = candidates.map((m, i) => Math.exp((seen[i] - top) / p.temperatureCp) * Math.sqrt(plaus[legal.indexOf(m)]));
  return pickWeighted(candidates, weights).lan;
}

/** Half-moves the computer follows the opening book at the strong levels. */
const STRONG_BOOK_PLIES = 12;

/**
 * Chooses the computer's move (UCI notation) for the current position.
 * `thinkMs` is the time per move; the weak bot waits at least that long so the
 * computer doesn't answer instantly.
 */
export async function chooseComputerMove(
  engine: StockfishEngine,
  game: Chess,
  level: Level,
  thinkMs: number,
): Promise<string | null> {
  await engine.ready;
  const fen = game.fen();
  const opp = level.opponent;

  // Standard openings at every level: follow the book while the position is in it.
  const bookPlies = opp.kind === "weak" ? paramsForT(opp.t).bookPlies : STRONG_BOOK_PLIES;
  if (pliesFromFen(fen) < bookPlies) {
    const move = bookMove(fen);
    if (move) {
      await sleep(Math.min(thinkMs, 600));
      return move;
    }
  }

  if (opp.kind !== "weak") {
    await engine.setOptions(
      opp.kind === "limiter"
        ? { UCI_LimitStrength: true, UCI_Elo: Math.max(engine.eloRange.min, Math.min(opp.elo, engine.eloRange.max)) }
        : { UCI_LimitStrength: false },
    );
    const { bestMove } = await engine.search(fen, { movetime: thinkMs, multiPv: 1 });
    return bestMove;
  }

  const started = performance.now();
  const move = await weakBotMove(engine, game, paramsForT(opp.t));
  const elapsed = performance.now() - started;
  if (elapsed < thinkMs) await sleep(thinkMs - elapsed);
  return move;
}

/** Weak bot move without the think-time delay (also used by the calibration script). */
export async function weakBotMove(engine: StockfishEngine, game: Chess, p: WeakParams): Promise<string | null> {
  const fen = game.fen();
  if (pliesFromFen(fen) < p.bookPlies) {
    const move = bookMove(fen);
    if (move) return move;
  }
  await engine.setOptions({ UCI_LimitStrength: false });
  return humanLikeMove(engine, game, p);
}
