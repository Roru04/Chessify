// Maps a target Elo (100 – 3000) to how the opponent engine plays.
//
// From Stockfish's own UCI_Elo minimum (about 1320) upward, Stockfish's
// calibrated strength limiter is used. Below that, the app makes the engine
// play like a human beginner (see humanLikeMove): Stockfish scores every
// legal move, each move also gets a "looks natural to a beginner" weight,
// and the bot picks a move weighing both. The lower the Elo, the more it
// trusts the natural-looking move over the objectively good one, so its
// mistakes are typical beginner mistakes (grabbing a defended piece,
// overlooking a threat, walking into a fork) instead of random moves.
// Ratings below the limiter's minimum are approximate (not yet calibrated).

import type { Chess, Move, Square } from "chess.js";
import type { StockfishEngine } from "./StockfishEngine";
import { bookMove, pliesFromFen } from "./openingBook";
import { scoreToCp } from "./uci";

export const ELO_MIN = 100;
export const ELO_MAX = 3000;

export interface WeakParams {
  /** Search depth used to score every legal move. */
  depth: number;
  /**
   * Softmax temperature in centipawns: how much worse a move may be and
   * still get picked. High = trusts "looks natural" more than the engine.
   */
  temperatureCp: number;
  /** How strongly a natural-looking move is preferred (exponent on plausibility). */
  naturalWeight: number;
  /** Extra preference for rescuing a piece that is under attack (beginners often don't notice). */
  noticeThreats: number;
  /** How many half-moves the bot follows the opening book. */
  bookPlies: number;
  /** Temperature during the first 10 moves: openings stay sound even at low Elo. */
  openingTemperatureCp: number;
}

/** Evaluations are clipped to this, so a mate counts like a big material win (a beginner can miss a mate). */
const CLIP_CP = 1500;
/** Upper limit for MultiPV (number of moves scored). */
const MAX_LINES = 60;

export function clampElo(elo: number): number {
  if (!Number.isFinite(elo)) return 1200;
  return Math.round(Math.min(ELO_MAX, Math.max(ELO_MIN, elo)));
}

/**
 * Internal strength t (0 = weakest, 1 = strongest weak level) for a target Elo.
 * Currently a straight line; to be replaced by the measured calibration table.
 */
export function tForElo(elo: number, limiterMin: number): number {
  return Math.min(1, Math.max(0, (elo - ELO_MIN) / (limiterMin - ELO_MIN)));
}

/** Tuning table for the human-like weakening below the limiter's minimum. */
export function weakParams(elo: number, limiterMin: number): WeakParams {
  return paramsForT(tForElo(elo, limiterMin));
}

/** All weak-bot settings as a function of the internal strength t (0 … 1). */
export function paramsForT(t: number): WeakParams {
  return {
    depth: 4 + Math.round(t * 4), // 4 … 8
    temperatureCp: 30 + 220 * Math.pow(1 - t, 2), // 250 at 100, ≈130 at 500, ≈55 at 900, 30 at 1319
    naturalWeight: 1.3 - 0.8 * t, // 1.3 … 0.5
    noticeThreats: 0.4 + 2.1 * t, // 0.4 … 2.5
    bookPlies: 8 + Math.round(t * 4), // 8 … 12 (4 … 6 moves per side)
    openingTemperatureCp: 25 + 35 * (1 - t), // 60 … 25
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

  if (m.captured) w += 1.5 + VALUE[m.captured] / 3; // beginners love captures
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

/**
 * Human-like move choice: Stockfish scores every legal move, then a move is
 * drawn with weight  plausibility^naturalWeight × exp(−loss / temperature).
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
  for (const l of lines) {
    const cp = Math.max(-CLIP_CP, Math.min(CLIP_CP, scoreToCp(l.score)));
    if (!scoreOf.has(l.pv[0])) scoreOf.set(l.pv[0], cp);
  }
  const best = Math.max(...scoreOf.values());
  const opening = Number(game.fen().split(" ")[5]) <= 10;
  const temperature = opening ? Math.min(p.temperatureCp, p.openingTemperatureCp) : p.temperatureCp;
  const worst = Math.min(...scoreOf.values());

  const weights = legal.map((m) => {
    // Moves outside the scored set (more than MAX_LINES legal moves) count as the worst scored one.
    const loss = best - (scoreOf.get(m.lan) ?? worst);
    return Math.pow(plausibility(game, m, p.noticeThreats), p.naturalWeight) * Math.exp(-loss / temperature);
  });
  return pickWeighted(legal, weights).lan;
}

/**
 * Chooses the computer's move (UCI notation) for the current position.
 * `thinkMs` is the time per move; weak mode waits at least that long so the
 * computer doesn't answer instantly.
 */
export async function chooseComputerMove(
  engine: StockfishEngine,
  game: Chess,
  elo: number,
  thinkMs: number,
): Promise<string | null> {
  await engine.ready;
  const limiterMin = engine.eloRange.min;
  const fen = game.fen();

  // Standard openings at every level: follow the book while the position is in it.
  const bookPlies = elo >= limiterMin ? 12 : weakParams(elo, limiterMin).bookPlies;
  if (pliesFromFen(fen) < bookPlies) {
    const move = bookMove(fen);
    if (move) {
      await sleep(Math.min(thinkMs, 600));
      return move;
    }
  }

  if (elo >= limiterMin) {
    await engine.setOptions({ UCI_LimitStrength: true, UCI_Elo: Math.min(elo, engine.eloRange.max) });
    const { bestMove } = await engine.search(game.fen(), { movetime: thinkMs, multiPv: 1 });
    return bestMove;
  }

  const started = performance.now();
  const move = await weakBotMove(engine, game, weakParams(elo, limiterMin));
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
