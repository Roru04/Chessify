// Move-by-move review of a finished game: board with classification badges,
// eval bar, review panel and navigation. Used after a game against the
// computer and for imported games.

import { useEffect, useState, type ReactNode } from "react";
import { Chess, type Color, type Move } from "chess.js";
import type { StockfishEngine } from "../engine/StockfishEngine";
import { advantageFor, summarizeCaptures } from "../game/material";
import type { ChessGame, GameResult } from "../game/useChessGame";
import { useReview } from "../review/useReview";
import { Board } from "./Board";
import { EvalBar } from "./EvalBar";
import { CloseIcon, FirstIcon, LastIcon, NextIcon, PrevIcon } from "./Icons";
import { PlayerBar } from "./PlayerBar";
import { ReviewPanel } from "./ReviewPanel";

interface PlayerInfo {
  name: string;
  detail: string;
}

interface Props {
  history: Move[];
  result: GameResult | null;
  /** The side the user played; shown at the bottom and as "You". */
  playerColor: Color;
  orientation: "white" | "black";
  /** Player bars: the user (bottom) and the opponent (top). */
  you: PlayerInfo;
  opponent: PlayerInfo;
  /** Short name of the opponent for the review panel (e.g. "Stockfish"). */
  opponentName: string;
  /** Another accuracy to compare with ours, e.g. chess.com's own. */
  compareAccuracy?: { label: string; values: { w: number; b: number } } | null;
  /** The live game, if this reviews the game just played (the board needs it). */
  game?: ChessGame;
  /** false while another tab is shown: keyboard navigation and analysis pause. */
  active: boolean;
  /** Engine for the analysis (default: the idle opponent engine). */
  getEngine?: () => StockfishEngine;
  /** Half-moves known to be opening theory (shown as "Book"), e.g. from chess.com. */
  bookPlies?: number;
  onClose: () => void;
  closeLabel?: string;
  /** Shown above the board, e.g. a banner. */
  children?: ReactNode;
}

export function GameReview({
  history,
  result,
  playerColor,
  orientation,
  you,
  opponent,
  opponentName,
  compareAccuracy = null,
  game,
  active,
  getEngine,
  bookPlies = 0,
  onClose,
  closeLabel = "Done",
  children,
}: Props) {
  const [ply, setPly] = useState(0);
  const review = useReview(history, active, getEngine, bookPlies);
  const lastPly = history.length;
  const goTo = (p: number) => setPly(Math.max(0, Math.min(lastPly, p)));

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const step: Record<string, (p: number) => number> = {
        ArrowLeft: (p) => p - 1,
        ArrowRight: (p) => p + 1,
        ArrowUp: () => 0,
        Home: () => 0,
        ArrowDown: () => lastPly,
        End: () => lastPly,
      };
      const f = step[e.key];
      if (!f) return;
      e.preventDefault();
      setPly((p) => Math.max(0, Math.min(lastPly, f(p))));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lastPly, active]);

  const fen = ply === 0 ? (history[0]?.before ?? new Chess().fen()) : history[ply - 1].after;
  const m = ply > 0 ? history[ply - 1] : null;
  const pos = new Chess(fen);
  const view = {
    fen,
    lastMove: m ? { from: m.from, to: m.to } : null,
    checkSquare: pos.inCheck() ? (pos.findPiece({ type: "k", color: pos.turn() })[0] ?? null) : null,
    badge: review.moves[ply - 1]?.verdict.cls ?? null,
  };

  const caps = summarizeCaptures(history.slice(0, ply));
  const capturedBy = (c: Color) => (c === "w" ? caps.byWhite : caps.byBlack);
  const opponentColor: Color = playerColor === "w" ? "b" : "w";

  const top = (
    <PlayerBar
      name={opponent.name}
      detail={opponent.detail}
      color={opponentColor}
      active={false}
      captured={capturedBy(opponentColor)}
      advantage={advantageFor(opponentColor, caps.balance)}
    />
  );
  const bottom = (
    <PlayerBar
      name={you.name}
      detail={you.detail}
      color={playerColor}
      active={false}
      captured={capturedBy(playerColor)}
      advantage={advantageFor(playerColor, caps.balance)}
    />
  );
  const flippedView = orientation !== (playerColor === "w" ? "white" : "black");

  return (
    <div className="app with-analysis reviewing">
      {children}
      <main className="play">
        <section className="board-col">
          {flippedView ? bottom : top}
          <div className="board-row">
            <EvalBar
              score={review.evals[ply]?.score ?? null}
              lastCp={null}
              depth={99}
              result={ply === lastPly ? result : null}
              orientation={orientation}
            />
            <Board game={game} orientation={orientation} view={view} />
          </div>
          {flippedView ? top : bottom}
        </section>
        <aside className="side">
          <ReviewPanel
            review={review}
            history={history}
            ply={ply}
            playerColor={playerColor}
            onSelect={goTo}
            names={{ you: "You", opponent: opponentName }}
            compareAccuracy={compareAccuracy}
          />
        </aside>
      </main>

      <nav className="tabbar" aria-label="Review navigation">
        <button onClick={() => goTo(0)} disabled={ply === 0}>
          <FirstIcon />
          Start
        </button>
        <button onClick={() => goTo(ply - 1)} disabled={ply === 0}>
          <PrevIcon />
          Back
        </button>
        <button onClick={() => goTo(ply + 1)} disabled={ply === lastPly}>
          <NextIcon />
          Next
        </button>
        <button onClick={() => goTo(lastPly)} disabled={ply === lastPly}>
          <LastIcon />
          End
        </button>
        <button onClick={onClose}>
          <CloseIcon />
          {closeLabel}
        </button>
      </nav>
    </div>
  );
}
