// Captured pieces and material balance, shown next to each player like on chess.com.

import type { Color, Move, PieceSymbol } from "chess.js";

export const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Display order: pawns first, then knights, bishops, rooks, queens. */
const ORDER: PieceSymbol[] = ["p", "n", "b", "r", "q"];

export interface CapturedSummary {
  /** Pieces each side has captured (pieces of the other colour), sorted. */
  byWhite: PieceSymbol[];
  byBlack: PieceSymbol[];
  /** Material balance from White's perspective (+2 = White is two pawns up). */
  balance: number;
}

export function summarizeCaptures(history: Move[]): CapturedSummary {
  const byWhite: PieceSymbol[] = [];
  const byBlack: PieceSymbol[] = [];
  let balance = 0;
  for (const m of history) {
    const sign = m.color === "w" ? 1 : -1;
    if (m.captured) {
      (m.color === "w" ? byWhite : byBlack).push(m.captured);
      balance += sign * PIECE_VALUE[m.captured];
    }
    // A promotion turns a pawn into a stronger piece.
    if (m.promotion) balance += sign * (PIECE_VALUE[m.promotion] - PIECE_VALUE.p);
  }
  const sort = (a: PieceSymbol, b: PieceSymbol) => ORDER.indexOf(a) - ORDER.indexOf(b);
  return { byWhite: byWhite.sort(sort), byBlack: byBlack.sort(sort), balance };
}

/** Material advantage for one side, or 0 if that side isn't ahead. */
export function advantageFor(color: Color, balance: number): number {
  const v = color === "w" ? balance : -balance;
  return v > 0 ? v : 0;
}
