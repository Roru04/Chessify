import type { Color } from "chess.js";
import type { EndReason, GameResult } from "../game/useChessGame";

const REASONS: Record<EndReason, string> = {
  checkmate: "by checkmate",
  resignation: "by resignation",
  stalemate: "Stalemate",
  repetition: "Threefold repetition",
  "fifty-moves": "50-move rule",
  "insufficient-material": "Insufficient material",
};

interface Props {
  result: GameResult;
  playerColor: Color;
  moveCount: number;
  onRematch: () => void;
  onNewGame: () => void;
  /** Opens the move-by-move review; null when there is nothing to review. */
  onReview: (() => void) | null;
  onClose: () => void;
}

export function GameOverCard({ result, playerColor, moveCount, onRematch, onNewGame, onReview, onClose }: Props) {
  const draw = result.winner === null;
  const won = result.winner === playerColor;
  const title = draw ? "Draw" : won ? "You win" : "Stockfish wins";
  const detail = REASONS[result.reason];
  const score = draw ? "½ – ½" : result.winner === "w" ? "1 – 0" : "0 – 1";

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="result" role="dialog" aria-label="Game over" onClick={(e) => e.stopPropagation()}>
        <div className={`big ${won ? "win" : draw ? "" : "loss"}`}>{title}</div>
        <div className="detail">{detail}</div>
        <div className="score">
          {score} · {moveCount} {moveCount === 1 ? "move" : "moves"}
        </div>
        {onReview && (
          <button className="btn review-btn" onClick={onReview}>
            Review game
          </button>
        )}
        <div className="btns">
          <button className="btn ghost" onClick={onNewGame}>
            New game
          </button>
          <button className={onReview ? "btn ghost" : "btn"} onClick={onRematch}>
            Rematch
          </button>
        </div>
        <button className="link" onClick={onClose}>
          View board
        </button>
      </div>
    </div>
  );
}
