import { useEffect, useRef, useState } from "react";
import type { Color } from "chess.js";
import { LearnBoard } from "./LearnBoard";
import type { CourseLine, OpeningCourse } from "./courses";
import type { ParsedLesson } from "./pgnLesson";
import { STATUS_LABEL, getProgress, recordRun, statusOf } from "./progress";

interface Props {
  course: OpeningCourse;
  line: CourseLine;
  lesson: ParsedLesson;
}

type Feedback = { kind: "ok" | "wrong" | "info"; text: string } | null;

const OPPONENT_DELAY_MS = 550;

/** You play one side of the line; the app plays the other and checks every move. */
export function PracticePlayer({ course, line, lesson }: Props) {
  const [side, setSide] = useState<Color>(course.side);
  const [ply, setPly] = useState(0);
  const [mistakePlies, setMistakePlies] = useState<Set<number>>(new Set());
  const [wrongTries, setWrongTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [progress, setProgress] = useState(() => getProgress(course.id, line.id, course.side));
  const recorded = useRef(false);

  const steps = lesson.steps;
  const last = steps.length;
  const done = ply >= last;
  const next = steps[ply];
  const yourTurn = !done && next.color === side;

  function restart(newSide: Color = side) {
    setSide(newSide);
    setPly(0);
    setMistakePlies(new Set());
    setWrongTries(0);
    setHint(false);
    setFeedback(null);
    setProgress(getProgress(course.id, line.id, newSide));
    recorded.current = false;
  }

  // The app plays the other side's moves.
  useEffect(() => {
    if (done || next.color === side) return;
    const t = setTimeout(() => setPly((p) => p + 1), OPPONENT_DELAY_MS);
    return () => clearTimeout(t);
  }, [ply, done, next, side]);

  // Record the run once the line is finished.
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    setProgress(recordRun(course.id, line.id, side, mistakePlies.size));
  }, [done, course.id, line.id, side, mistakePlies.size]);

  function onMove(from: string, to: string, promotion?: string): boolean {
    if (!yourTurn) return false;
    if (`${from}${to}${promotion ?? ""}` === next.lan) {
      setPly((p) => p + 1);
      setWrongTries(0);
      setHint(false);
      setFeedback({ kind: "ok", text: next.text });
      return true;
    }
    setMistakePlies((s) => new Set(s).add(ply));
    setWrongTries((n) => n + 1);
    if (wrongTries >= 1) setHint(true);
    setFeedback({
      kind: "wrong",
      text: wrongTries >= 1 ? `Not quite. The line continues with ${next.san}: the arrow shows it.` : "That's not the move of this line. Try again.",
    });
    return false;
  }

  function showMove() {
    setMistakePlies((s) => new Set(s).add(ply));
    setHint(true);
    setFeedback({ kind: "info", text: `The move here is ${next.san}.` });
  }

  const prev = ply > 0 ? steps[ply - 1] : null;
  const fen = prev ? prev.fenAfter : lesson.startFen;
  const opponentText = prev && prev.color !== side ? prev.text : null;
  const status = statusOf(progress);
  const perfect = mistakePlies.size === 0;

  return (
    <div className="learn-play">
      <div className="learn-board-col">
        <LearnBoard
          fen={fen}
          orientation={side === "w" ? "white" : "black"}
          lastMove={prev ? { from: prev.from, to: prev.to } : null}
          arrows={hint && next ? [{ from: next.from, to: next.to, color: "rgba(21, 128, 61, 0.85)" }] : []}
          interactiveColor={yourTurn ? side : null}
          onMove={onMove}
        />
      </div>
      <section className="learn-panel" aria-live="polite">
        <div className="label">
          <span>Practice · {line.name}</span>
          <span className={`pill s-${status}`}>{STATUS_LABEL[status]}</span>
        </div>

        <div className="side-switch" role="group" aria-label="Your side">
          {(["w", "b"] as Color[]).map((c) => (
            <button key={c} type="button" className={side === c ? "on" : ""} aria-pressed={side === c} onClick={() => restart(c)}>
              Play {c === "w" ? "White" : "Black"}
            </button>
          ))}
        </div>

        {done ? (
          <div className={`practice-done ${perfect ? "ok" : ""}`}>
            <p className="lesson-move">
              <b>{perfect ? "Perfect! Line complete." : "Line complete."}</b>
            </p>
            <p className="lesson-text">
              {perfect
                ? progress.box >= 3
                  ? "No mistakes. This line is mastered."
                  : "No mistakes. Practice it again later to move it up to the next level."
                : `${mistakePlies.size} ${mistakePlies.size === 1 ? "move" : "moves"} needed another try. The line goes back to "Learning"; practice it again.`}
            </p>
            <div className="sheet-actions">
              <a className="btn ghost" href={`#learn-${course.id}`}>
                Back to course
              </a>
              <button className="btn" onClick={() => restart()}>
                Practice again
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="lesson-move">
              {yourTurn ? (
                <b>Your move{next.moveLabel ? ` (${next.moveLabel})` : ""}</b>
              ) : (
                <b>Opponent is moving…</b>
              )}
            </p>
            {feedback && <p className={`feedback ${feedback.kind}`}>{feedback.kind === "ok" ? "✓ " : ""}{feedback.text}</p>}
            {opponentText && feedback?.kind !== "wrong" && (
              <p className="lesson-text">
                <b>
                  {prev!.moveLabel} {prev!.san}:
                </b>{" "}
                {opponentText}
              </p>
            )}
            {yourTurn && !hint && (
              <button className="link" onClick={showMove}>
                Show the move
              </button>
            )}
          </>
        )}
        <p className="hint">
          Move {Math.min(ply + 1, last)} of {last} · {mistakePlies.size} {mistakePlies.size === 1 ? "mistake" : "mistakes"}
        </p>
      </section>
      <nav className="tabbar learn-nav" aria-label="Practice actions">
        <a href={`#learn-${course.id}-${line.id}`}>Lesson</a>
        <button onClick={() => restart()}>Restart</button>
        <a href={`#learn-${course.id}`}>Course</a>
      </nav>
    </div>
  );
}
