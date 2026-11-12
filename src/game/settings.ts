import { DEFAULT_LEVEL, levelById, levelForElo } from "../engine/levels";

export type ColorChoice = "w" | "b" | "random";

export interface GameSettings {
  color: ColorChoice;
  /** Difficulty level id (1 … 10), see engine/levels.ts. */
  level: number;
  /** Computer think time per move in milliseconds. */
  thinkMs: number;
}

export const DEFAULT_SETTINGS: GameSettings = { color: "w", level: DEFAULT_LEVEL, thinkMs: 1000 };

const KEY = "chess-analyzer.settings.v1";

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<GameSettings> & { elo?: number };
    return {
      color: s.color === "w" || s.color === "b" || s.color === "random" ? s.color : DEFAULT_SETTINGS.color,
      // Older versions saved an exact Elo: use the nearest level.
      level: s.level !== undefined ? levelById(Number(s.level)).id : s.elo !== undefined ? levelForElo(Number(s.elo)).id : DEFAULT_LEVEL,
      thinkMs: Math.min(3000, Math.max(200, Number(s.thinkMs) || DEFAULT_SETTINGS.thinkMs)),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: GameSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: settings just aren't remembered */
  }
}
