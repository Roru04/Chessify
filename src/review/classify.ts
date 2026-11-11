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
// Accuracy uses the published Lichess formula (chess.com's is not public).

import type { Color } from "chess.js";
import { scoreToCp, type Score } from "../engine/uci";

export type MoveClass = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

export const CLASS_INFO: Record<MoveClass, { label: string; symbol: string; phrase: string }> = {
  best: { label: "Best", symbol: "★", phrase: "is the best move" },
  excellent: { label: "Excellent", symbol: "!", phrase: "is excellent" },
  good: { label: "Good", symbol: "✓", phrase: "is good" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", phrase: "is an inaccuracy" },
  mistake: { label: "Mistake", symbol: "?", phrase: "is a mistake" },
  blunder: { label: "Blunder", symbol: "??", phrase: "is a blunder" },
};

export const CLASS_ORDER: MoveClass[] = ["best", "excellent", "good", "inaccuracy", "mistake", "blunder"];

/** Evaluation of one position of the game (White's perspective). */
export interface PositionEval {
  score: Score;
  /** Engine's best move here (UCI), null in final positions. */
  bestMove: string | null;
  /** Engine's main line from this position (UCI), used for explanations. */
  pv?: string[];
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
