import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import type { LessonArrow, LessonMark } from "./pgnLesson";
import { useSquareMarks } from "../components/useSquareMarks";

interface Props {
  fen: string;
  orientation: "white" | "black";
  arrows?: LessonArrow[];
  marks?: LessonMark[];
  lastMove?: { from: string; to: string } | null;
  /** Badge on the last move's square, e.g. a "?" for a lesson mistake. */
  badge?: { symbol: string; cls: string } | null;
  /** When set, the player can move pieces of this colour. */
  interactiveColor?: "w" | "b" | null;
  /** Called with a legal move; return true if it was accepted. */
  onMove?: (from: string, to: string, promotion?: string) => boolean;
}

const HL_LAST = "rgba(232, 196, 64, 0.45)";
const HL_SELECTED = "rgba(42, 98, 216, 0.35)";
const DOT = "radial-gradient(circle, rgba(20, 24, 32, 0.28) 22%, transparent 24%)";
const RING = "radial-gradient(circle, transparent 62%, rgba(20, 24, 32, 0.28) 64%)";

/** Board for lessons and practice: arrows, highlighted squares, tap-to-move. */
export function LearnBoard({ fen, orientation, arrows = [], marks = [], lastMove, badge, interactiveColor, onMove }: Props) {
  const [selected, setSelected] = useState<Square | null>(null);
  useEffect(() => setSelected(null), [fen]);
  // Right-click highlights (cleared by a left click or a new position).
  const userMarks = useSquareMarks(fen);

  const game = useMemo(() => new Chess(fen), [fen]);
  const canMove = !!interactiveColor && game.turn() === interactiveColor && !!onMove;
  const targets = useMemo(() => (selected && canMove ? game.moves({ square: selected, verbose: true }) : []), [selected, canMove, game]);

  function attempt(from: string, to: string): boolean {
    const legal = game.moves({ square: from as Square, verbose: true }).find((m) => m.to === to);
    if (!legal || !onMove) return false;
    return onMove(from, to, legal.promotion ? "q" : undefined);
  }

  const squareStyles = useMemo(() => {
    const s: Record<string, CSSProperties> = {};
    const add = (sq: string, st: CSSProperties) => (s[sq] = { ...s[sq], ...st });
    if (lastMove) {
      add(lastMove.from, { background: HL_LAST });
      add(lastMove.to, { background: HL_LAST });
    }
    for (const m of marks) add(m.square, { boxShadow: `inset 0 0 0 4px ${m.color}`, background: m.color.replace(/[\d.]+\)$/, "0.25)") });
    for (const [sq, st] of Object.entries(userMarks.styles)) add(sq, st);
    if (selected) add(selected, { background: HL_SELECTED });
    for (const t of targets) add(t.to, { backgroundImage: t.captured ? RING : DOT });
    return s;
  }, [lastMove, marks, selected, targets, userMarks.styles]);

  return (
    <div className="board learn-board" aria-label="Lesson board">
      <Chessboard
        options={{
          id: "learn-board",
          position: fen,
          boardOrientation: orientation,
          allowDragging: canMove,
          // Right-drag draws arrows, right-click highlights a square, left-click clears both.
          allowDrawingArrows: true,
          clearArrowsOnClick: true,
          clearArrowsOnPositionChange: true,
          onSquareRightClick: ({ square }) => userMarks.toggle(square),
          animationDurationInMs: 200,
          dragActivationDistance: 6,
          arrows: arrows.map((a) => ({ startSquare: a.from, endSquare: a.to, color: a.color })),
          canDragPiece: ({ piece }) => canMove && piece.pieceType[0] === interactiveColor,
          onPieceDrag: ({ square }) => square && setSelected(square as Square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            setSelected(null);
            if (!targetSquare || sourceSquare === targetSquare) return false;
            return attempt(sourceSquare, targetSquare);
          },
          onSquareClick: ({ square, piece }) => {
            userMarks.clear();
            if (!canMove) return;
            if (selected && targets.some((t) => t.to === square)) {
              attempt(selected, square);
              setSelected(null);
            } else if (piece && piece.pieceType[0] === interactiveColor && square !== selected) {
              setSelected(square as Square);
            } else {
              setSelected(null);
            }
          },
          squareStyles,
          lightSquareStyle: { backgroundColor: "var(--sq-light)" },
          darkSquareStyle: { backgroundColor: "var(--sq-dark)" },
          lightSquareNotationStyle: { color: "var(--sq-dark)" },
          darkSquareNotationStyle: { color: "var(--sq-light)" },
          dropSquareStyle: { boxShadow: "inset 0 0 0 3px var(--accent)" },
          boardStyle: { borderRadius: "4px", overflow: "hidden" },
        }}
      />
      {badge && lastMove && <Badge square={lastMove.to} orientation={orientation} {...badge} />}
    </div>
  );
}

function Badge({ square, orientation, symbol, cls }: { square: string; orientation: "white" | "black"; symbol: string; cls: string }) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 8 - rank : rank - 1;
  return (
    <div className="badge-cell" style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }} aria-hidden="true">
      <span className={`badge ${cls}`}>{symbol}</span>
    </div>
  );
}
