// Simple piece-safety checks shared by the move classification and the explanations.

import type { Chess, Color, PieceSymbol, Square } from "chess.js";

export const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

export const other = (c: Color): Color => (c === "w" ? "b" : "w");

/** Is the piece on `sq` (of colour `color`) in danger: attacked and undefended, or attacked by something cheaper? */
export function isHanging(g: Chess, sq: Square, color: Color): boolean {
  const piece = g.get(sq);
  if (!piece || piece.color !== color || piece.type === "k") return false;
  const attackers = g.attackers(sq, other(color));
  if (attackers.length === 0) return false;
  const defenders = g.attackers(sq, color);
  const cheapest = Math.min(...attackers.map((s) => VALUE[g.get(s)!.type]));
  return defenders.length === 0 || cheapest < VALUE[piece.type];
}

export function hangingPieces(g: Chess, color: Color): Square[] {
  const out: Square[] = [];
  for (const row of g.board()) for (const p of row) if (p && p.color === color && isHanging(g, p.square, color)) out.push(p.square);
  return out;
}
