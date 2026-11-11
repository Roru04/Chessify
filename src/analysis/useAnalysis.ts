// Live analysis of the current position with a separate, full-strength
// Stockfish instance (independent of the weakened opponent engine).

import { useEffect, useState } from "react";
import type { Color } from "chess.js";
import { existingAnalyzer, getAnalyzer } from "../engine/engines";
import type { InfoLine, Score } from "../engine/uci";
import { pvToSan, toWhitePerspective, type PvMove } from "./format";

export interface AnalysisLine {
  multipv: number;
  /** Score from White's perspective. */
  score: Score;
  /** First move in UCI notation. */
  move: string;
  pv: PvMove[];
}

export interface AnalysisState {
  fen: string | null;
  depth: number;
  lines: AnalysisLine[];
  /** Latest centipawn score of the best line (White's perspective), ignoring mate scores. */
  lastCp: number | null;
}

const EMPTY: AnalysisState = { fen: null, depth: 0, lines: [], lastCp: null };
const MAX_DEPTH = 22;
const UPDATE_MS = 200;

export function useAnalysis(fen: string, turn: Color, enabled: boolean, multiPv: number): AnalysisState {
  const [state, setState] = useState<AnalysisState>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      existingAnalyzer()?.cancelAnalysis();
      return;
    }
    const engine = getAnalyzer();
    let alive = true;
    let pending: InfoLine[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Only show complete iterations: all lines of one depth together.
    let latestByPv: InfoLine[] = [];
    let lastCp: number | null = null;

    const flush = () => {
      timer = null;
      if (!alive || pending.length === 0) return;
      for (const info of pending) {
        latestByPv[info.multipv - 1] = info;
        if (info.multipv === 1 && info.score.cp !== undefined) {
          lastCp = toWhitePerspective(info.score, turn).cp ?? null;
        }
      }
      pending = [];
      const lines = latestByPv.filter(Boolean);
      const depth = lines[0]?.depth ?? 0;
      setState({
        fen,
        depth,
        lastCp,
        lines: lines.map((l) => ({
          multipv: l.multipv,
          score: toWhitePerspective(l.score, turn),
          move: l.pv[0],
          pv: pvToSan(fen, l.pv),
        })),
      });
    };

    setState({ fen, depth: 0, lines: [], lastCp: null });
    engine
      .analyze(fen, { multiPv, depth: MAX_DEPTH }, (info) => {
        if (!alive) return;
        pending.push(info);
        if (!timer) timer = setTimeout(flush, UPDATE_MS);
      })
      .then(() => alive && flush())
      .catch(() => undefined);

    return () => {
      alive = false;
      latestByPv = [];
      if (timer) clearTimeout(timer);
      engine.cancelAnalysis();
    };
  }, [fen, turn, enabled, multiPv]);

  return state.fen === fen ? state : EMPTY;
}
