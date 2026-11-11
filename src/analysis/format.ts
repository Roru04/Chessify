// Display helpers for engine output.

import { Chess, type Color } from "chess.js";
import type { Score } from "../engine/uci";
import { splitUciMove } from "../engine/uci";

/** Converts a side-to-move score into White's perspective. */
export function toWhitePerspective(score: Score, turn: Color): Score {
  if (turn === "w") return score;
  return score.mate !== undefined ? { mate: -score.mate } : { cp: -score.cp };
}

/** "+1.30", "-0.42", "0.00", "+12.3", "M5", "-M3" (White's perspective). */
export function formatScore(score: Score): string {
  if (score.mate !== undefined) return `${score.mate < 0 ? "-" : ""}M${Math.abs(score.mate)}`;
  const pawns = score.cp / 100;
  if (Math.abs(pawns) < 0.005) return "0.00";
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(Math.abs(pawns) >= 10 ? 1 : 2)}`;
}

/** Share of the eval bar that is White's, 0–100. Uses a logistic curve so ±4 pawns ≈ 90 %. */
export function whiteShare(score: Score): number {
  if (score.mate !== undefined) return score.mate > 0 ? 100 : 0;
  const p = 1 / (1 + Math.exp(-0.0055 * score.cp));
  return Math.min(97, Math.max(3, p * 100));
}

export interface PvMove {
  san: string;
  /** Move number label shown before this move, e.g. "4." or "3…", or "" */
  label: string;
}

/** Converts a UCI line into SAN with move numbers. Stops at the first illegal move. */
export function pvToSan(fen: string, pv: string[], maxMoves = 8): PvMove[] {
  const chess = new Chess(fen);
  const out: PvMove[] = [];
  for (const uci of pv.slice(0, maxMoves)) {
    const turn = chess.turn();
    const moveNo = chess.moveNumber();
    let san: string;
    try {
      san = chess.move(splitUciMove(uci)).san;
    } catch {
      break;
    }
    const label = turn === "w" ? `${moveNo}.` : out.length === 0 ? `${moveNo}…` : "";
    out.push({ san, label });
  }
  return out;
}
