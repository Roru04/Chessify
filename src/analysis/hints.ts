// Which analysis hints are shown. Saved per browser.

export interface HintSettings {
  evalBar: boolean;
  bestMoves: boolean;
  /** Hide all hints while it's the player's turn (so they move first, then compare). */
  hideOnMyTurn: boolean;
  /** Number of best lines shown (1–3). */
  lines: 1 | 2 | 3;
}

export const DEFAULT_HINTS: HintSettings = { evalBar: true, bestMoves: true, hideOnMyTurn: false, lines: 3 };

const KEY = "chess-analyzer.hints.v1";

export function loadHints(): HintSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HINTS;
    const s = JSON.parse(raw) as Partial<HintSettings>;
    const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
    return {
      evalBar: bool(s.evalBar, DEFAULT_HINTS.evalBar),
      bestMoves: bool(s.bestMoves, DEFAULT_HINTS.bestMoves),
      hideOnMyTurn: bool(s.hideOnMyTurn, DEFAULT_HINTS.hideOnMyTurn),
      lines: s.lines === 1 || s.lines === 2 || s.lines === 3 ? s.lines : DEFAULT_HINTS.lines,
    };
  } catch {
    return DEFAULT_HINTS;
  }
}

export function saveHints(h: HintSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* storage unavailable: hints just aren't remembered */
  }
}

export const anyHintOn = (h: HintSettings) => h.evalBar || h.bestMoves;
