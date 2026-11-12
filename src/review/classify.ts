// Move classification and accuracy for the post-game review.
//
// Moves are judged by how much they lowered the mover's winning chances
// ("win %"), similar to chess.com's expected-points model:
//   Best        the engine's top move
//   Excellent   loses < 2 % win chance
//   Good        loses < 5 %
//   Inaccuracy  loses < 10 %
//   Mistake     loses < 20 %
//   Blunder     loses 20 % or more
// On top of that, the game context adds chess.com's other classes
// (classifyInContext):
//   Book        a known opening move
//   Brilliant   a (near-)best move that sacrifices a piece
//   Great       the only good move: every other move is clearly worse
//   Miss        failing to punish the opponent's mistake, or missing a forced mate
// Accuracy uses the published Lichess formula (chess.com's is not public).

import { Chess, type Color, type Move, type Square } from "chess.js";
import { scoreToCp, type Score } from "../engine/uci";
import { VALUE, hangingPieces, isHanging } from "./hanging";

export type MoveClass =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "miss"
  | "blunder";

export const CLASS_INFO: Record<MoveClass, { label: string; symbol: string; phrase: string }> = {
  brilliant: { label: "Brilliant", symbol: "!!", phrase: "is brilliant" },
  great: { label: "Great", symbol: "!", phrase: "is a great move" },
  best: { label: "Best", symbol: "★", phrase: "is the best move" },
  excellent: { label: "Excellent", symbol: "✓✓", phrase: "is excellent" },
  good: { label: "Good", symbol: "✓", phrase: "is good" },
  book: { label: "Book", symbol: "≡", phrase: "is a book move" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", phrase: "is an inaccuracy" },
  mistake: { label: "Mistake", symbol: "?", phrase: "is a mistake" },
  miss: { label: "Miss", symbol: "✗", phrase: "is a miss" },
  blunder: { label: "Blunder", symbol: "??", phrase: "is a blunder" },
};

/** Same order as chess.com's game review. */
export const CLASS_ORDER: MoveClass[] = ["brilliant", "great", "best", "excellent", "good", "book", "inaccuracy", "mistake", "miss", "blunder"];

/** Classes that count as a good move (explanations say why it works). */
export const GOOD_CLASSES: MoveClass[] = ["brilliant", "great", "best", "excellent", "good", "book"];

/** Evaluation of one position of the game (White's perspective). */
export interface PositionEval {
  score: Score;
  /** Engine's best move here (UCI), null in final positions. */
  bestMove: string | null;
  /** Engine's main line from this position (UCI), used for explanations. */
  pv?: string[];
  /** Score of the engine's second-best move (White's perspective), if there is one. Used for "Great". */
  second?: Score;
  /** Set for positions where the game is over. */
  terminal?: "white-wins" | "black-wins" | "draw";
}

/** White's winning chance in percent (Lichess model). */
export function whiteWinPercent(e: PositionEval): number {
  if (e.terminal === "white-wins") return 100;
  if (e.terminal === "black-wins") return 0;
  if (e.terminal === "draw") return 50;
  const cp = Math.max(-10000, Math.min(10000, scoreToCp(e.score)));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

export function winPercentFor(color: Color, e: PositionEval): number {
  const w = whiteWinPercent(e);
  return color === "w" ? w : 100 - w;
}

export interface MoveVerdict {
  cls: MoveClass;
  /** How many win-% points the mover lost (≥ 0). */
  loss: number;
  /** Lichess-style accuracy of this single move, 0–100. */
  accuracy: number;
}

export function classifyMove(color: Color, playedUci: string, before: PositionEval, after: PositionEval): MoveVerdict {
  const loss = Math.max(0, winPercentFor(color, before) - winPercentFor(color, after));
  const accuracy = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669 + 1));
  let cls: MoveClass;
  const deliveredMate = (after.terminal === "white-wins" && color === "w") || (after.terminal === "black-wins" && color === "b");
  if (deliveredMate || playedUci === before.bestMove) cls = "best";
  else if (loss < 2) cls = "excellent";
  else if (loss < 5) cls = "good";
  else if (loss < 10) cls = "inaccuracy";
  else if (loss < 20) cls = "mistake";
  else cls = "blunder";
  return { cls, loss, accuracy };
}

/** Game accuracy: average of the arithmetic and harmonic mean of the move accuracies. */
export function gameAccuracy(moveAccuracies: number[]): number | null {
  if (moveAccuracies.length === 0) return null;
  const n = moveAccuracies.length;
  const mean = moveAccuracies.reduce((a, b) => a + b, 0) / n;
  const harmonic = n / moveAccuracies.reduce((a, b) => a + 1 / Math.max(b, 1), 0);
  return (mean + harmonic) / 2;
}

// ---------------------------------------------------------------------------
// chess.com's extra classes

/** Brilliant: not if the mover was already this far ahead (win %) … */
const BRILLIANT_MAX_BEFORE = 95;
/** … and only if they are at least this well off afterwards. */
const BRILLIANT_MIN_AFTER = 50;
/** Great: the second-best move must be at least this much worse (win %) … */
const GREAT_MIN_GAP = 15;
/** … the best move must keep at least this much … */
const GREAT_MIN_BEST = 35;
/** … and the second-best must not still be clearly winning. */
const GREAT_MAX_SECOND = 80;
/** Miss: the opponent's previous move lost at least this much (win %) … */
const MISS_MIN_OPPONENT_LOSS = 10;
/** … and the mover still isn't worse than this afterwards (else it's a mistake or blunder). */
const MISS_MIN_AFTER = 40;
/** Missing a forced mate in up to this many moves is always a Miss. */
const MISS_MAX_MATE = 3;

export interface MoveContext {
  move: Move;
  before: PositionEval;
  after: PositionEval;
  /** The move is part of a known opening line. */
  inBook: boolean;
  /** The previous move (the opponent's), if any. */
  prev: Move | null;
  /** How many win-% points the opponent lost with the previous move. */
  prevLoss: number | null;
}

/**
 * Does the move leave a piece (knight or more) en prise that wasn't before,
 * worth clearly more than anything it captured? (A sacrifice.)
 */
function isSacrifice(move: Move): boolean {
  const me = move.color;
  const before = new Chess(move.before);
  const after = new Chess(move.after);
  const taken = move.captured ? VALUE[move.captured] : 0;
  for (const sq of hangingPieces(after, me)) {
    const piece = after.get(sq);
    if (!piece || VALUE[piece.type] < 3) continue;
    const wasHanging = sq !== move.to && isHanging(before, sq, me);
    if (!wasHanging && VALUE[piece.type] - taken >= 2) return true;
  }
  return false;
}

/** Mate in N for `color` according to an evaluation, or null. */
function mateFor(e: PositionEval, color: Color): number | null {
  if (e.terminal || e.score.mate === undefined) return null;
  const m = e.score.mate;
  return (color === "w" ? m > 0 : m < 0) ? Math.abs(m) : null;
}

/** The loss-based class, refined with chess.com's Book, Brilliant, Great and Miss. */
export function classifyInContext(ctx: MoveContext): MoveVerdict {
  const { move, before, after, inBook, prev, prevLoss } = ctx;
  const me = move.color;
  const base = classifyMove(me, move.lan, before, after);
  if (inBook) return { ...base, cls: "book" };

  const wpBefore = winPercentFor(me, before);
  const wpAfter = winPercentFor(me, after);
  const nearBest = base.cls === "best" || base.cls === "excellent";

  if (nearBest && wpBefore <= BRILLIANT_MAX_BEFORE && wpAfter >= BRILLIANT_MIN_AFTER && isSacrifice(move)) {
    return { ...base, cls: "brilliant" };
  }

  if (base.cls === "best" && before.second && !before.terminal) {
    const wpSecond = winPercentFor(me, { score: before.second, bestMove: null });
    const recapture = !!prev?.captured && prev.to === move.to;
    // Taking a piece that was simply hanging is the obvious move, not a great find.
    const freeCapture = !!move.captured && isHanging(new Chess(move.before), move.to as Square, move.color === "w" ? "b" : "w");
    if (!recapture && !freeCapture && wpBefore - wpSecond >= GREAT_MIN_GAP && wpBefore >= GREAT_MIN_BEST && wpSecond <= GREAT_MAX_SECOND) {
      return { ...base, cls: "great" };
    }
  }

  if (wpAfter >= MISS_MIN_AFTER) {
    // Not punishing the opponent's mistake (only counts if it cost a lot).
    const punishable = prevLoss !== null && prevLoss >= MISS_MIN_OPPONENT_LOSS;
    if (punishable && (base.cls === "mistake" || base.cls === "blunder")) return { ...base, cls: "miss" };
    // Missing a short forced mate, even if the position stays winning.
    const mate = mateFor(before, me);
    const missedMate = mate !== null && mate <= MISS_MAX_MATE && mateFor(after, me) === null && !after.terminal;
    if (missedMate && !nearBest) return { ...base, cls: "miss" };
  }
  return base;
}
