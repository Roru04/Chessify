import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import type { ChessGame } from "../game/useChessGame";
import { CLASS_INFO, type MoveClass } from "../review/classify";
import { useSquareMarks } from "./useSquareMarks";

/** Read-only position shown in review mode instead of the live game. */
export interface BoardView {
  fen: string;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  /** Classification badge on the destination square of the last move. */
  badge: MoveClass | null;
}

interface Props {
  /** The live game. Without it the board is read-only and shows `view`. */
  game?: ChessGame;
  orientation: "white" | "black";
  onPromotion?: (from: Square, to: Square) => void;
  view?: BoardView;
}

const HL_LAST = "rgba(232, 196, 64, 0.45)";
const HL_SELECTED = "rgba(42, 98, 216, 0.35)";
const DOT = "radial-gradient(circle, rgba(20, 24, 32, 0.28) 22%, transparent 24%)";
const RING = "radial-gradient(circle, transparent 62%, rgba(20, 24, 32, 0.28) 64%)";
const CHECK = "radial-gradient(circle, rgba(220, 40, 30, 0.85) 0%, rgba(220, 40, 30, 0.35) 45%, transparent 72%)";

export function Board({ game, orientation, onPromotion, view }: Props) {
  const [selected, setSelected] = useState<Square | null>(null);
  // Each board needs its own id: react-chessboard finds squares with
  // document.querySelector(`#${id}-square-…`) when animating, so two boards
  // with the same id (e.g. the hidden Play board and an import review) clash.
  // useId() contains ":" which isn't valid in a CSS selector, so strip it.
  const boardId = `board-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerColor = game?.playerColor;
  const live = !view && game ? game : null;
  const fen = live ? live.fen : (view?.fen ?? "start");
  const lastMove = live ? live.lastMove : (view?.lastMove ?? null);
  const checkSquare = live ? live.checkSquare : (view?.checkSquare ?? null);
  const isPlayersTurn = !!live?.isPlayersTurn;

  // Right-click highlights (cleared by a left click or a new position).
  const marks = useSquareMarks(fen);

  // Clear the selection whenever the position changes.
  useEffect(() => setSelected(null), [fen]);

  // fen is a dependency because the targets change with the position.
  const targets = useMemo(() => (selected && live ? live.legalTargets(selected) : []), [selected, live, fen]);

  function tryMove(from: Square, to: Square): boolean {
    if (!live || !live.legalTargets(from).some((m) => m.to === to)) return false;
    if (live.isPromotion(from, to)) {
      onPromotion?.(from, to);
      return false; // the board shows the move once a piece is chosen
    }
    return live.playMove(from, to);
  }

  function onSquareClick({ square, piece }: { square: string; piece: { pieceType: string } | null }) {
    marks.clear();
    const sq = square as Square;
    if (!isPlayersTurn) return setSelected(null);
    if (selected && targets.some((m) => m.to === sq)) {
      tryMove(selected, sq);
      setSelected(null);
      return;
    }
    if (piece && piece.pieceType[0] === playerColor && sq !== selected) setSelected(sq);
    else setSelected(null);
  }

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const add = (sq: string, s: CSSProperties) => (styles[sq] = { ...styles[sq], ...s });
    if (lastMove) {
      add(lastMove.from, { background: HL_LAST });
      add(lastMove.to, { background: HL_LAST });
    }
    if (checkSquare) add(checkSquare, { background: CHECK });
    for (const [sq, st] of Object.entries(marks.styles)) add(sq, st);
    if (selected) add(selected, { background: HL_SELECTED });
    for (const m of targets) add(m.to, { backgroundImage: m.captured ? RING : DOT });
    return styles;
  }, [lastMove, checkSquare, selected, targets, marks.styles]);

  return (
    <div className="board" aria-label="Chess board">
      <Chessboard
        options={{
          id: boardId,
          position: fen,
          boardOrientation: orientation,
          allowDragging: isPlayersTurn,
          // Right-drag draws arrows, right-click highlights a square, left-click clears both.
          allowDrawingArrows: true,
          clearArrowsOnClick: true,
          clearArrowsOnPositionChange: true,
          onSquareRightClick: ({ square }) => marks.toggle(square),
          animationDurationInMs: view ? 120 : 180,
          dragActivationDistance: 6,
          canDragPiece: ({ piece }) => isPlayersTurn && piece.pieceType[0] === playerColor,
          onPieceDrag: ({ square }) => square && setSelected(square as Square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            setSelected(null);
            if (!targetSquare || sourceSquare === targetSquare) return false;
            return tryMove(sourceSquare as Square, targetSquare as Square);
          },
          onSquareClick,
          squareStyles,
          lightSquareStyle: { backgroundColor: "var(--sq-light)" },
          darkSquareStyle: { backgroundColor: "var(--sq-dark)" },
          lightSquareNotationStyle: { color: "var(--sq-dark)" },
          darkSquareNotationStyle: { color: "var(--sq-light)" },
          dropSquareStyle: { boxShadow: "inset 0 0 0 3px var(--accent)" },
          boardStyle: { borderRadius: "4px", overflow: "hidden" },
        }}
      />
      {view?.badge && view.lastMove && <MoveBadge square={view.lastMove.to} cls={view.badge} orientation={orientation} />}
    </div>
  );
}

/** Round classification badge at the top-right corner of a square. */
function MoveBadge({ square, cls, orientation }: { square: string; cls: MoveClass; orientation: "white" | "black" }) {
  const file = square.charCodeAt(0) - 97; // 0 = a
  const rank = Number(square[1]); // 1..8
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 8 - rank : rank - 1;
  return (
    <div className="badge-cell" style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }} aria-hidden="true">
      <span className={`badge c-${cls}`}>{CLASS_INFO[cls].symbol}</span>
    </div>
  );
}
