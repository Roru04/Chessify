import type { Color, PieceSymbol } from "chess.js";
import type { ReactNode } from "react";
import { CapturedPieces } from "./CapturedPieces";

interface Props {
  name: string;
  detail: string;
  color: Color;
  active: boolean;
  chip?: ReactNode;
  /** Pieces this player has captured. */
  captured: PieceSymbol[];
  /** Material advantage of this player (0 if not ahead). */
  advantage: number;
}

export function PlayerBar({ name, detail, color, active, chip, captured, advantage }: Props) {
  return (
    <div className={`player ${active ? "active" : ""}`}>
      <span className={`swatch ${color === "w" ? "white" : "black"}`} aria-label={color === "w" ? "White" : "Black"} />
      <div className="who">
        <div className="pline">
          <span className="pname">{name}</span>
          <span className="psub">{detail}</span>
        </div>
        <CapturedPieces pieces={captured} pieceColor={color === "w" ? "b" : "w"} advantage={advantage} />
      </div>
      {chip}
    </div>
  );
}
