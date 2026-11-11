// Analyses every position of a finished game, one after another, and
// classifies each move. Results stream in so the user can browse while the
// review is still running, and are cached per position.

import { useEffect, useMemo, useState } from "react";
import { Chess, type Move } from "chess.js";
import { getReviewEngine } from "../engine/engines";
import { pvToSan, toWhitePerspective } from "../analysis/format";
import { classifyMove, gameAccuracy, type MoveClass, type MoveVerdict, type PositionEval } from "./classify";

/** Search depth per position: a balance between quality and speed on phones. */
export const REVIEW_DEPTH = 14;

const START_FEN = new Chess().fen();
const cache = new Map<string, PositionEval>();

export interface ReviewedMove {
  move: Move;
  verdict: MoveVerdict;
  /** Best move in the position before this move (SAN), if it wasn't played. */
  bestSan: string | null;
}

export interface ReviewState {
  /** Evaluations of positions 0..N (index = number of moves played); undefined = not analysed yet. */
  evals: (PositionEval | undefined)[];
  /** Verdict for move i (index into history); undefined = not analysed yet. */
  moves: (ReviewedMove | undefined)[];
  analysed: number;
  total: number;
  done: boolean;
  accuracy: { w: number | null; b: number | null };
  counts: { w: Record<MoveClass, number>; b: Record<MoveClass, number> };
}

function terminalEval(fen: string): PositionEval | null {
  const g = new Chess(fen);
  if (g.isCheckmate()) {
    const whiteWins = g.turn() === "b";
    return { score: { mate: whiteWins ? 1 : -1 }, bestMove: null, terminal: whiteWins ? "white-wins" : "black-wins" };
  }
  if (g.isDraw() || g.isStalemate()) return { score: { cp: 0 }, bestMove: null, terminal: "draw" };
  return null;
}

const zeroCounts = (): Record<MoveClass, number> => ({ best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 });

export function useReview(history: Move[], active: boolean): ReviewState {
  const fens = useMemo(
    () => (history.length ? [history[0].before, ...history.map((m) => m.after)] : [START_FEN]),
    // history objects change identity on every render; the move list defines the game
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.map((m) => m.lan).join(" ")],
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const engine = getReviewEngine();
    (async () => {
      await engine.setOptions({ UCI_LimitStrength: false });
      for (const fen of fens) {
        if (cancelled) return;
        if (cache.has(fen)) continue;
        const terminal = terminalEval(fen);
        if (terminal) {
          cache.set(fen, terminal);
        } else {
          const res = await engine.search(fen, { depth: REVIEW_DEPTH, multiPv: 1 });
          if (cancelled) return;
          const line = res.lines[0];
          const turn = new Chess(fen).turn();
          cache.set(fen, {
            score: line ? toWhitePerspective(line.score, turn) : { cp: 0 },
            bestMove: res.bestMove,
            pv: line?.pv ?? (res.bestMove ? [res.bestMove] : []),
          });
        }
        setTick((t) => t + 1);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      engine.stop();
    };
  }, [active, fens]);

  const evals = fens.map((f) => cache.get(f));
  const moves: (ReviewedMove | undefined)[] = history.map((m, i) => {
    const before = evals[i];
    const after = evals[i + 1];
    if (!before || !after) return undefined;
    const verdict = classifyMove(m.color, m.lan, before, after);
    const bestSan = before.bestMove && before.bestMove !== m.lan ? (pvToSan(m.before, [before.bestMove])[0]?.san ?? null) : null;
    return { move: m, verdict, bestSan };
  });

  const acc = { w: [] as number[], b: [] as number[] };
  const counts = { w: zeroCounts(), b: zeroCounts() };
  for (const r of moves) {
    if (!r) continue;
    acc[r.move.color].push(r.verdict.accuracy);
    counts[r.move.color][r.verdict.cls]++;
  }
  const analysed = evals.filter(Boolean).length;

  return {
    evals,
    moves,
    analysed,
    total: fens.length,
    done: analysed === fens.length,
    accuracy: { w: gameAccuracy(acc.w), b: gameAccuracy(acc.b) },
    counts,
  };
}
