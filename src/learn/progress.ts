// Practice progress per opening line and side, saved in the browser.
// Simple Leitner boxes: a perfect run moves the line up one box, any
// mistake sends it back to box 0. Box 3 = mastered.

import type { Color } from "chess.js";

export interface LineProgress {
  box: 0 | 1 | 2 | 3;
  attempts: number;
  /** ISO date of the last practice run */
  last: string | null;
}

export type ProgressStatus = "new" | "learning" | "known" | "mastered";

const KEY = "chess-analyzer.learn.v1";
const EMPTY: LineProgress = { box: 0, attempts: 0, last: null };

function readAll(): Record<string, LineProgress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, LineProgress>) : {};
  } catch {
    return {};
  }
}

const keyOf = (course: string, line: string, side: Color) => `${course}.${line}.${side}`;

export function getProgress(course: string, line: string, side: Color): LineProgress {
  return readAll()[keyOf(course, line, side)] ?? EMPTY;
}

/** Records a finished practice run; returns the new progress. */
export function recordRun(course: string, line: string, side: Color, mistakes: number): LineProgress {
  const all = readAll();
  const k = keyOf(course, line, side);
  const old = all[k] ?? EMPTY;
  const box = (mistakes === 0 ? Math.min(3, old.box + 1) : 0) as LineProgress["box"];
  const next: LineProgress = { box, attempts: old.attempts + 1, last: new Date().toISOString() };
  all[k] = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
  return next;
}

export function statusOf(p: LineProgress): ProgressStatus {
  if (p.attempts === 0) return "new";
  return p.box >= 3 ? "mastered" : p.box === 2 ? "known" : "learning";
}

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  new: "New",
  learning: "Learning",
  known: "Known",
  mastered: "Mastered",
};
