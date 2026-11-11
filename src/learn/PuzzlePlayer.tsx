import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { goodReasons } from "../explain/explain";
import { LearnBoard } from "./LearnBoard";
import type { Puzzle, TacticTheme } from "./middlegame/themes";
import { firstOpen, puzzleResult, recordPuzzle } from "./middlegame/puzzleProgress";

interface Props {
  theme: TacticTheme;
  puzzles: Puzzle[];
}

type Phase = "opponent" | "solve" | "solved";
type Feedback = { kind: "ok" | "wrong" | "info"; text: string } | null;

const REPLY_DELAY_MS = 500;

function fenAfter(p: Puzzle, plies: number): string {
  const g = new Chess(p.fen);
  for (const m of p.moves.slice(0, plies)) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
  return g.fen();
}

/** Lichess-style puzzle trainer: the first move is the opponent's, then you find the rest. */
export function PuzzlePlayer({ theme, puzzles }: Props) {
  const [index, setIndex] = useState(() => firstOpen(puzzles.map((p) => p.id)));
  const [ply, setPly] = useState(0);
  const [phase, setPhase] = useState<Phase>("opponent");
  const [hadMistake, setHadMistake] = useState(false);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [, bump] = useState(0);
  const recorded = useRef(false);

  const p = puzzles[index];
  const you = new Chess(fenAfter(p, 1)).turn();
  const fen = fenAfter(p, ply);
  const last = ply > 0 ? p.moves[ply - 1] : null;
  const expected = p.moves[ply];

  function load(i: number) {
    setIndex((i + puzzles.length) % puzzles.length);
    setPly(0);
    setPhase("opponent");
    setHadMistake(false);
    setHint(false);
    setFeedback(null);
    setWhy(null);
    recorded.current = false;
  }

  // Opponent's moves (the first move of the puzzle and each reply) are played automatically.
  useEffect(() => {
    if (phase !== "opponent") return;
    const t = setTimeout(
      () => {
        setPly((n) => n + 1);
        setPhase("solve");
      },
      ply === 0 ? 700 : REPLY_DELAY_MS,
    );
    return () => clearTimeout(t);
  }, [phase, ply]);

  function finish(mistake: boolean, keyFen: string, keyMove: string, rest: string[]) {
    setPhase("solved");
    if (!recorded.current) {
      recordPuzzle(p.id, mistake ? "retry" : "clean");
      recorded.current = true;
      bump((n) => n + 1);
    }
    const reasons = goodReasons(keyFen, keyMove, rest, undefined);
    setWhy(reasons.length ? reasons.join(" ") : null);
    setFeedback({ kind: "ok", text: mistake ? "Solved. Try this one again later for a clean solve." : "Correct! Puzzle solved." });
  }

  function onMove(from: string, to: string, promotion?: string): boolean {
    if (phase !== "solve") return false;
    const uci = `${from}${to}${promotion ?? ""}`;
    const g = new Chess(fen);
    const m = g.move({ from, to, promotion });
    const isMateAlt = g.isCheckmate(); // any mate counts as a solution
    if (uci !== expected && !isMateAlt) {
      setHadMistake(true);
      setFeedback({ kind: "wrong", text: hint ? "Not this one either. Look at the highlighted piece." : "That's not the best move. Try again." });
      setHint(true);
      return false;
    }
    const nextPly = ply + 1;
    setPly(nextPly);
    setHint(false);
    if (isMateAlt || nextPly >= p.moves.length) {
      // explain the first move you had to find (the key move)
      finish(hadMistake, fenAfter(p, 1), p.moves[1], p.moves.slice(2));
    } else {
      setFeedback({ kind: "ok", text: `${m.san} is right. Keep going.` });
      setPhase("opponent");
    }
    return true;
  }

  function showSolution() {
    setHadMistake(true);
    setHint(false);
    setFeedback({ kind: "info", text: `The solution: ${solutionSan()}.` });
    setPly(p.moves.length);
    finish(true, fenAfter(p, 1), p.moves[1], p.moves.slice(2));
  }

  function solutionSan(): string {
    const g = new Chess(fenAfter(p, 1));
    return p.moves
      .slice(1)
      .map((m) => g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }).san)
      .join(" ");
  }

  const result = puzzleResult(p.id);

  return (
    <div className="learn-play">
      <div className="learn-board-col">
        <LearnBoard
          fen={fen}
          orientation={you === "w" ? "white" : "black"}
          lastMove={last ? { from: last.slice(0, 2), to: last.slice(2, 4) } : null}
          marks={hint && phase === "solve" ? [{ square: expected.slice(0, 2), color: "rgba(21, 128, 61, 0.85)" }] : []}
          interactiveColor={phase === "solve" ? you : null}
          onMove={onMove}
        />
      </div>
      <section className="learn-panel" aria-live="polite">
        <div className="label">
          <span>
            {theme.name} · puzzle {index + 1}/{puzzles.length}
          </span>
          <span className="value">rating {p.rating}</span>
        </div>
        <p className="lesson-move">
          <b>
            {phase === "solved"
              ? "Solved"
              : phase === "opponent" && ply === 0
                ? "Watch the opponent's move…"
                : `${you === "w" ? "White" : "Black"} to move: find the best move`}
          </b>
          {result === "clean" && phase !== "solved" && <span className="pill s-mastered">Solved before</span>}
        </p>
        {feedback && <p className={`feedback ${feedback.kind}`}>{feedback.text}</p>}
        {why && (
          <p className="lesson-text">
            <b>Why it works:</b> {why}
          </p>
        )}
        {phase === "solve" && (
          <div className="puzzle-actions">
            {!hint && (
              <button className="link" onClick={() => setHint(true)}>
                Hint: show the piece
              </button>
            )}
            <button className="link" onClick={showSolution}>
              Show solution
            </button>
          </div>
        )}
        {phase === "solved" && (
          <div className="sheet-actions">
            <button className="btn ghost" onClick={() => load(index)}>
              Try again
            </button>
            <button className="btn" onClick={() => load(index + 1)}>
              Next puzzle
            </button>
          </div>
        )}
        <p className="hint">
          Puzzle from{" "}
          <a href={`https://lichess.org/training/${p.id}`} target="_blank" rel="noreferrer">
            Lichess
          </a>{" "}
          (CC0).
        </p>
      </section>
      <nav className="tabbar learn-nav" aria-label="Puzzle navigation">
        <button onClick={() => load(index - 1)}>Previous</button>
        <a href={`#tactic-${theme.id}`}>Theme</a>
        <button onClick={() => load(index + 1)}>Skip</button>
      </nav>
    </div>
  );
}
