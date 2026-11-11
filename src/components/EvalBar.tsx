import { useRef } from "react";
import type { Score } from "../engine/uci";
import type { GameResult } from "../game/useChessGame";
import { formatScore, whiteShare } from "../analysis/format";

/**
 * Shallow searches swing back and forth; the bar only follows results from
 * this depth on, and otherwise keeps showing the last settled value.
 */
const MIN_DEPTH = 10;
/** Longer forced mates are shown as a normal score, like chess.com. */
const MAX_MATE_SHOWN = 8;

interface Props {
  score: Score | null;
  /** Latest centipawn score, used instead of a mate score longer than MAX_MATE_SHOWN. */
  lastCp: number | null;
  depth: number;
  result: GameResult | null;
  /** Vertical bar: White's part sits at the bottom when the board shows White at the bottom. */
  orientation: "white" | "black";
  /** Hints are hidden right now (e.g. on the player's turn). */
  hidden?: boolean;
}

/** Horizontal on phones, vertical next to the board from 768px (via CSS). */
export function EvalBar({ score: rawScore, lastCp, depth, result, orientation, hidden }: Props) {
  // Last settled value; kept while a new position is being analysed so the
  // bar doesn't fall back to the middle after every move.
  const settled = useRef<{ share: number; label: string }>({ share: 50, label: "0.00" });

  let score = rawScore;
  if (score?.mate !== undefined && Math.abs(score.mate) > MAX_MATE_SHOWN) {
    score = lastCp !== null ? { cp: lastCp } : null; // null = keep the last value
  }

  let share: number;
  let label: string;
  if (result) {
    share = result.winner === "w" ? 100 : result.winner === "b" ? 0 : 50;
    label = result.winner === "w" ? "1-0" : result.winner === "b" ? "0-1" : "½-½";
  } else {
    if (score && !hidden && (depth >= MIN_DEPTH || score.mate !== undefined)) {
      // Like chess.com: "M3" without a sign; the full bar shows which side mates.
      const label = score.mate !== undefined ? `M${Math.abs(score.mate)}` : formatScore(score);
      settled.current = { share: whiteShare(score), label };
    }
    share = settled.current.share;
    label = hidden ? "–" : settled.current.label;
  }
  const whiteAhead = share >= 50;

  return (
    <div
      className={`evalbar ${orientation === "black" ? "flipped" : ""}`}
      role="meter"
      aria-label="Evaluation"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share)}
      aria-valuetext={label}
      style={{ "--white": `${share}%` } as React.CSSProperties}
    >
      <div className="evalbar-track">
        <div className="evalbar-white" />
      </div>
      <span className={`evalbar-num ${whiteAhead ? "w" : "b"}`}>{label}</span>
    </div>
  );
}
