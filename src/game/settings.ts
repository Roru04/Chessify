import { clampElo } from "../engine/strength";

export type ColorChoice = "w" | "b" | "random";

export interface GameSettings {
  color: ColorChoice;
  elo: number;
  /** Computer think time per move in milliseconds. */
  thinkMs: number;
}

export const DEFAULT_SETTINGS: GameSettings = { color: "w", elo: 1200, thinkMs: 1000 };

export const ELO_PRESETS = [
  { label: "Beginner", elo: 400 },
  { label: "Casual", elo: 800 },
  { label: "Club", elo: 1200 },
  { label: "Strong", elo: 1800 },
  { label: "Master", elo: 2400 },
  { label: "Max", elo: 3000 },
];

const KEY = "chess-analyzer.settings.v1";

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<GameSettings>;
    return {
      color: s.color === "w" || s.color === "b" || s.color === "random" ? s.color : DEFAULT_SETTINGS.color,
      elo: clampElo(Number(s.elo)),
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
