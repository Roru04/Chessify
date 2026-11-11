import { useEffect, useState } from "react";
import { FirstIcon, LastIcon, NextIcon, PrevIcon } from "../components/Icons";
import { LearnBoard } from "./LearnBoard";
import type { ParsedLesson } from "./pgnLesson";

interface Props {
  title: string;
  lesson: ParsedLesson;
  orientation: "white" | "black";
  /** Button shown at the end of the lesson, e.g. "Practice this line". */
  endAction?: { href: string; label: string };
}

/** Steps through a line move by move with explanations, arrows and highlights. */
export function LessonPlayer({ title, lesson, orientation, endAction }: Props) {
  const [step, setStep] = useState(0); // 0 = start position (intro)
  const last = lesson.steps.length;
  const go = (n: number) => setStep(Math.max(0, Math.min(last, n)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setStep((s) => Math.min(last, s + 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      else if (e.key === "Home") setStep(0);
      else if (e.key === "End") setStep(last);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  const s = step > 0 ? lesson.steps[step - 1] : null;
  const fen = s ? s.fenAfter : lesson.startFen;
  const text = s ? s.text : lesson.intro.text;
  const arrows = s ? s.arrows : lesson.intro.arrows;
  const marks = s ? s.marks : lesson.intro.marks;

  return (
    <div className="learn-play">
      <div className="learn-board-col">
        <LearnBoard
          fen={fen}
          orientation={orientation}
          arrows={arrows}
          marks={marks}
          lastMove={s ? { from: s.from, to: s.to } : null}
          badge={s?.mistake ? { symbol: "?", cls: "c-mistake" } : null}
        />
      </div>
      <section className="learn-panel" aria-live="polite">
        <div className="label">
          <span>{title}</span>
          <span className="value">
            {step}/{last}
          </span>
        </div>
        <p className="lesson-move">
          {s ? (
            <>
              <b>
                {s.moveLabel} {s.san}
              </b>
              {s.mistake && <span className="tag bad">Mistake</span>}
            </>
          ) : (
            <b>Start</b>
          )}
        </p>
        <p className="lesson-text">{text || "No comment for this move."}</p>
        <ol className="lesson-moves" aria-label="Moves of this line">
          {lesson.steps.map((m, i) => (
            <li key={i}>
              <button type="button" className={i + 1 === step ? "cur" : ""} onClick={() => go(i + 1)}>
                {m.color === "w" || i === 0 ? <span className="n">{m.moveLabel}</span> : null}
                {m.san}
              </button>
            </li>
          ))}
        </ol>
        {step === last && endAction && (
          <a className="btn" href={endAction.href}>
            {endAction.label}
          </a>
        )}
      </section>
      <nav className="tabbar learn-nav" aria-label="Lesson navigation">
        <button onClick={() => go(0)} disabled={step === 0}>
          <FirstIcon />
          Start
        </button>
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          <PrevIcon />
          Back
        </button>
        <button onClick={() => go(step + 1)} disabled={step === last}>
          <NextIcon />
          Next
        </button>
        <button onClick={() => go(last)} disabled={step === last}>
          <LastIcon />
          End
        </button>
      </nav>
    </div>
  );
}
