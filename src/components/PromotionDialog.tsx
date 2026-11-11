import type { Color } from "chess.js";

type Promo = "q" | "r" | "b" | "n";

const GLYPHS: Record<Color, Record<Promo, string>> = {
  w: { q: "♕", r: "♖", b: "♗", n: "♘" },
  b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};
const NAMES: Record<Promo, string> = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };

interface Props {
  color: Color;
  onChoose: (p: Promo) => void;
  onCancel: () => void;
}

export function PromotionDialog({ color, onChoose, onCancel }: Props) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-label="Choose promotion piece" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Promote pawn to</h2>
        <div className="promo-grid">
          {(["q", "r", "b", "n"] as Promo[]).map((p) => (
            <button key={p} className="promo" onClick={() => onChoose(p)}>
              <span aria-hidden="true">{GLYPHS[color][p]}&#xFE0E;</span>
              {NAMES[p]}
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
