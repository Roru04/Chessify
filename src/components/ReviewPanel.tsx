import type { Color, Move } from "chess.js";
import { formatScore } from "../analysis/format";
import { explainMove } from "../explain/explain";
import { CLASS_INFO, CLASS_ORDER } from "../review/classify";
import type { ReviewState } from "../review/useReview";
import { EvalGraph } from "./EvalGraph";
import { MoveList } from "./MoveList";

interface Props {
  review: ReviewState;
  history: Move[];
  ply: number;
  playerColor: Color;
  onSelect: (ply: number) => void;
  /** Column names in the summary (default "You" / "Stockfish"). */
  names?: { you: string; opponent: string };
  /** Another accuracy to compare with ours, e.g. chess.com's own. */
  compareAccuracy?: { label: string; values: { w: number; b: number } } | null;
}

export function ReviewPanel({
  review,
  history,
  ply,
  playerColor,
  onSelect,
  names = { you: "You", opponent: "Stockfish" },
  compareAccuracy = null,
}: Props) {
  const opp: Color = playerColor === "w" ? "b" : "w";
  const current = ply > 0 ? review.moves[ply - 1] : undefined;
  const move = ply > 0 ? history[ply - 1] : null;
  const evalAfter = review.evals[ply];
  const fmtAcc = (v: number | null) => (v === null ? "–" : v.toFixed(1));
  const whoMoved = move ? (move.color === playerColor ? "Your move" : `${names.opponent}'s move`) : "";
  const moveNo = move ? `${move.before.split(" ")[5]}${move.color === "w" ? "." : "…"} ${move.san}` : "";
  const before = ply > 0 ? review.evals[ply - 1] : undefined;
  const explanation = current && move && before && evalAfter ? explainMove(move, current.verdict.cls, before, evalAfter, ply > 1 ? history[ply - 2] : null) : null;

  return (
    <section className="review" aria-label="Game review">
      {!review.done && (
        <div className="review-progress">
          <div className="label">
            <span>Analysing game</span>
            <span className="value">
              {review.analysed}/{review.total}
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${(review.analysed / review.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="move-card" aria-live="polite">
        {ply === 0 ? (
          <p className="mc-text">Start of the game. Step through the moves with ▶ or tap the graph.</p>
        ) : current ? (
          <>
            <span className={`badge c-${current.verdict.cls}`} aria-hidden="true">
              {CLASS_INFO[current.verdict.cls].symbol}
            </span>
            <div className="mc-body">
              <p className="mc-text">
                <b>{moveNo}</b> {CLASS_INFO[current.verdict.cls].phrase}
              </p>
              <p className="mc-sub">
                {whoMoved}
                {evalAfter && !evalAfter.terminal && <> · eval {formatScore(evalAfter.score)}</>}
                {current.verdict.loss >= 0.5 && current.verdict.cls !== "best" && <> · −{current.verdict.loss.toFixed(0)}% win chance</>}
              </p>
              {explanation && explanation.text.length > 0 && <p className="mc-explain">{explanation.text.join(" ")}</p>}
              {current.bestSan && (
                <p className="mc-best">
                  Best was <b>{current.bestSan}</b>
                  {explanation?.best && explanation.best.startsWith(current.bestSan + ":") && (
                    <>{explanation.best.slice(current.bestSan.length)}</>
                  )}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mc-text">
            <b>{moveNo}</b> is being analysed…
          </p>
        )}
      </div>

      <EvalGraph evals={review.evals} marks={review.moves.map((m) => m?.verdict.cls)} ply={ply} onSelect={onSelect} />

      <table className="summary">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">{names.you}</th>
            <th scope="col">{names.opponent}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="acc">
            <th scope="row">Accuracy</th>
            <td>{fmtAcc(review.accuracy[playerColor])}</td>
            <td>{fmtAcc(review.accuracy[opp])}</td>
          </tr>
          {compareAccuracy && (
            <tr className="acc-compare">
              <th scope="row">{compareAccuracy.label}</th>
              <td>{compareAccuracy.values[playerColor].toFixed(1)}</td>
              <td>{compareAccuracy.values[opp].toFixed(1)}</td>
            </tr>
          )}
          {CLASS_ORDER.map((c) => (
            <tr key={c}>
              <th scope="row">
                <span className={`badge sm c-${c}`} aria-hidden="true">
                  {CLASS_INFO[c].symbol}
                </span>
                {CLASS_INFO[c].label}
              </th>
              <td>{review.counts[playerColor][c]}</td>
              <td>{review.counts[opp][c]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="moves-box">
        <h2 className="label">Moves</h2>
        <MoveList
          history={history}
          currentPly={ply}
          marks={review.moves.map((m) => m?.verdict.cls)}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
