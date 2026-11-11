// Puzzle results, saved in the browser: "clean" = solved at the first try,
// "retry" = solved after a wrong move or with the solution shown.

export type PuzzleResult = "clean" | "retry";

const KEY = "chess-analyzer.puzzles.v1";

function readAll(): Record<string, PuzzleResult> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, PuzzleResult>) : {};
  } catch {
    return {};
  }
}

export function puzzleResult(id: string): PuzzleResult | undefined {
  return readAll()[id];
}

/** Records a result; a clean solve is never downgraded by a later retry. */
export function recordPuzzle(id: string, result: PuzzleResult) {
  const all = readAll();
  if (all[id] === "clean" && result === "retry") return;
  all[id] = result;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: results just aren't remembered */
  }
}

/** Number of puzzles solved at the first try, out of the given ids. */
export function cleanCount(ids: string[]): number {
  const all = readAll();
  return ids.filter((id) => all[id] === "clean").length;
}

/** First puzzle that hasn't been solved cleanly yet (index), or 0. */
export function firstOpen(ids: string[]): number {
  const all = readAll();
  const i = ids.findIndex((id) => all[id] !== "clean");
  return i < 0 ? 0 : i;
}
