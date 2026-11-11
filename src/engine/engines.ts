// Shared engine instances (each is its own Web Worker).
//
// - Opponent: plays the computer's moves (weakened). After a game it is idle
//   and is reused for the post-game review at full strength.
// - Analyzer: live analysis during the game, always full strength.

import { StockfishEngine } from "./StockfishEngine";

let opponent: StockfishEngine | null = null;
let analyzer: StockfishEngine | null = null;

export function getOpponentEngine(): StockfishEngine {
  if (!opponent) opponent = new StockfishEngine();
  return opponent;
}

export function getAnalyzer(): StockfishEngine {
  if (!analyzer) analyzer = new StockfishEngine();
  return analyzer;
}

/** The analyzer, but only if it was already started (used for cleanup). */
export function existingAnalyzer(): StockfishEngine | null {
  return analyzer;
}

/** Engine used for the post-game review (the idle opponent engine). */
export const getReviewEngine = getOpponentEngine;
