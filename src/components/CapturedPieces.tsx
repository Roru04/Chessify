import type { Color, PieceSymbol } from "chess.js";
import { defaultPieces } from "react-chessboard";

interface Props {
  /** Pieces captured by this player (sorted, all of `pieceColor`). */
  pieces: PieceSymbol[];
  pieceColor: Color;
  /** Material advantage of this player; shown as "+N" when > 0. */
  advantage: number;
}

const NAMES: Record<PieceSymbol, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

/** Small, overlapping piece icons grouped by type, followed by "+N". */
export function CapturedPieces({ pieces, pieceColor, advantage }: Props) {
  const groups: { type: PieceSymbol; count: number }[] = [];
  for (const p of pieces) {
    const last = groups[groups.length - 1];
    if (last && last.type === p) last.count++;
    else groups.push({ type: p, count: 1 });
  }
  const label =
    groups.map((g) => `${g.count} ${NAMES[g.type]}${g.count > 1 ? "s" : ""}`).join(", ") +
    (advantage > 0 ? `, +${advantage}` : "");

  return (
    <div className="captured" aria-label={pieces.length ? `Captured: ${label}` : "No captures"}>
      {groups.map((g) => (
        <span key={g.type} className="cap-group">
          {Array.from({ length: g.count }, (_, i) => {
            const render = defaultPieces[`${pieceColor}${g.type.toUpperCase()}`];
            return (
              <span key={i} className="cap-piece" aria-hidden="true">
                {render()}
              </span>
            );
          })}
        </span>
      ))}
      {advantage > 0 && <span className="cap-adv">+{advantage}</span>}
    </div>
  );
}
