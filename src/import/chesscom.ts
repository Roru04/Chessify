// Loads a player's games from chess.com's public API (no login, CORS enabled).
//
//   /pub/player/{name}/games/archives  → one URL per month with games
//   /pub/player/{name}/games/{YYYY}/{MM} → all games of that month (with PGN)
//
// Months are loaded one at a time, newest first, and kept in memory for the
// session. Only standard chess from the normal start position is returned
// (no Chess960, bughouse, etc.), because that's what the review handles.

import { Chess, type Color, type Move } from "chess.js";
import type { EndReason, GameResult } from "../game/useChessGame";

const API = "https://api.chess.com/pub";
const START_FEN = new Chess().fen();

export type TimeClass = "bullet" | "blitz" | "rapid" | "daily";

export interface ChessComSide {
  username: string;
  rating: number;
  /** chess.com's result code for this side, e.g. "win", "resigned", "timeout", "agreed". */
  result: string;
}

export interface ChessComGame {
  /** Unique id (chess.com uuid, or the game URL if missing). */
  id: string;
  /** Link to the game on chess.com. */
  url: string;
  pgn: string;
  timeClass: TimeClass;
  /** e.g. "180", "180+2", "1/86400" (daily). */
  timeControl: string;
  rated: boolean;
  /** End of the game, ms since epoch. */
  endTime: number;
  white: ChessComSide;
  black: ChessComSide;
  /** chess.com's own accuracy (only for games it has analysed). */
  accuracies: { w: number; b: number } | null;
  /** Opening name from chess.com's opening link, e.g. "Italian Game Two Knights Defense". */
  opening: string | null;
  /** How many half-moves chess.com counts as the named opening (book), 0 if unknown. */
  openingPlies: number;
}

export type ChessComErrorKind = "not-found" | "rate-limit" | "network" | "bad-response";

export class ChessComError extends Error {
  constructor(
    public kind: ChessComErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ChessComError";
  }
}

async function getJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ChessComError("network", "Couldn't reach chess.com. Check your connection and try again.");
  }
  if (res.status === 404) throw new ChessComError("not-found", "No chess.com player with that username.");
  if (res.status === 429) throw new ChessComError("rate-limit", "chess.com is limiting requests. Wait a moment and try again.");
  if (!res.ok) throw new ChessComError("bad-response", `chess.com answered with an error (${res.status}). Try again later.`);
  try {
    return await res.json();
  } catch {
    throw new ChessComError("bad-response", "chess.com sent an unexpected answer. Try again later.");
  }
}

/** chess.com usernames: letters, digits, "_" and "-", 3–25 characters. */
export function normalizeUsername(name: string): string | null {
  const n = name.trim().replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_-]{3,25}$/.test(n) ? n : null;
}

const archiveCache = new Map<string, Promise<string[]>>();
const monthCache = new Map<string, Promise<ChessComGame[]>>();

/** Month archive URLs of a player, newest first. Empty if the player has no games. */
export function fetchArchives(username: string): Promise<string[]> {
  const key = username.toLowerCase();
  let p = archiveCache.get(key);
  if (!p) {
    p = getJson(`${API}/player/${encodeURIComponent(key)}/games/archives`).then((data) => {
      const list = (data as { archives?: unknown }).archives;
      if (!Array.isArray(list)) throw new ChessComError("bad-response", "chess.com sent an unexpected answer. Try again later.");
      return list.filter((u): u is string => typeof u === "string").reverse();
    });
    p.catch(() => archiveCache.delete(key)); // don't cache failures
    archiveCache.set(key, p);
  }
  return p;
}

/** Standard-chess games of one month archive, newest first. */
export function fetchMonth(archiveUrl: string): Promise<ChessComGame[]> {
  let p = monthCache.get(archiveUrl);
  if (!p) {
    p = getJson(archiveUrl).then((data) => {
      const games = (data as { games?: unknown }).games;
      if (!Array.isArray(games)) throw new ChessComError("bad-response", "chess.com sent an unexpected answer. Try again later.");
      return games
        .map(toGame)
        .filter((g): g is ChessComGame => g !== null)
        .sort((a, b) => b.endTime - a.endTime);
    });
    p.catch(() => monthCache.delete(archiveUrl));
    monthCache.set(archiveUrl, p);
  }
  return p;
}

/** Forget loaded data, e.g. to see games finished since the last load. */
export function clearChessComCache(): void {
  archiveCache.clear();
  monthCache.clear();
}

/** "https://…/games/2026/11" → "November 2026". */
export function monthLabel(archiveUrl: string): string {
  const m = archiveUrl.match(/(\d{4})\/(\d{2})$/);
  if (!m) return archiveUrl;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Raw API data → ChessComGame

interface RawSide {
  username?: unknown;
  rating?: unknown;
  result?: unknown;
}

const TIME_CLASSES: TimeClass[] = ["bullet", "blitz", "rapid", "daily"];

function side(raw: unknown): ChessComSide | null {
  const s = raw as RawSide | undefined;
  if (!s || typeof s.username !== "string" || typeof s.result !== "string") return null;
  return { username: s.username, rating: typeof s.rating === "number" ? s.rating : 0, result: s.result };
}

function toGame(raw: unknown): ChessComGame | null {
  const g = raw as Record<string, unknown>;
  if (!g || typeof g.pgn !== "string" || g.pgn.trim() === "") return null;
  if (g.rules !== "chess") return null; // variants
  if (typeof g.initial_setup === "string" && g.initial_setup !== "" && g.initial_setup !== START_FEN) return null;
  const white = side(g.white);
  const black = side(g.black);
  if (!white || !black) return null;
  const tc = TIME_CLASSES.includes(g.time_class as TimeClass) ? (g.time_class as TimeClass) : "rapid";
  const acc = g.accuracies as { white?: unknown; black?: unknown } | undefined;
  const url = typeof g.url === "string" ? g.url : "";
  return {
    id: typeof g.uuid === "string" ? g.uuid : url,
    url,
    pgn: g.pgn,
    timeClass: tc,
    timeControl: typeof g.time_control === "string" ? g.time_control : "",
    rated: g.rated === true,
    endTime: typeof g.end_time === "number" ? g.end_time * 1000 : 0,
    white,
    black,
    accuracies: acc && typeof acc.white === "number" && typeof acc.black === "number" ? { w: acc.white, b: acc.black } : null,
    opening: openingName(typeof g.eco === "string" ? g.eco : null),
    openingPlies: openingPlies(typeof g.eco === "string" ? g.eco : null),
  };
}

/**
 * Half-moves covered by chess.com's opening link. The link ends with the moves
 * past the named line, e.g. "…-Defense-3.Nd2-h6-4.Bh4-c5-5.e3" → up to White's
 * 5th move = 9 half-moves. 0 if the link lists no moves.
 */
export function openingPlies(ecoUrl: string | null): number {
  const slug = ecoUrl?.match(/\/openings\/([^/?#]+)/)?.[1];
  if (!slug) return 0;
  let ply = 0;
  let inMoves = false;
  for (const w of decodeURIComponent(slug).split("-")) {
    const numbered = w.match(/^(\d+)(\.\.\.|\.)/);
    if (numbered) {
      inMoves = true;
      const n = Number(numbered[1]);
      ply = numbered[2] === "..." ? 2 * n : 2 * n - 1;
    } else if (inMoves && w) {
      ply++; // Black's reply after a numbered White move
    }
  }
  return ply;
}

/** Opening name from chess.com's opening link: the words before the first move number. */
export function openingName(ecoUrl: string | null): string | null {
  const slug = ecoUrl?.match(/\/openings\/([^/?#]+)/)?.[1];
  if (!slug) return null;
  const words: string[] = [];
  for (const w of decodeURIComponent(slug).split("-")) {
    if (/^\d+\./.test(w)) break; // "3.Nd2" — the move sequence starts
    words.push(w);
  }
  return words.join(" ") || null;
}

// ---------------------------------------------------------------------------
// Helpers for the UI

/** The colour the given user played, or null if they didn't play this game. */
export function userColor(game: ChessComGame, username: string): Color | null {
  const u = username.toLowerCase();
  if (game.white.username.toLowerCase() === u) return "w";
  if (game.black.username.toLowerCase() === u) return "b";
  return null;
}

/** chess.com result codes of the losing side (or both sides, for draws) → our end reason. */
const LOSS_REASONS: Record<string, EndReason> = {
  checkmated: "checkmate",
  resigned: "resignation",
  timeout: "timeout",
  abandoned: "abandoned",
  lose: "resignation",
};
const DRAW_REASONS: Record<string, EndReason> = {
  agreed: "agreement",
  repetition: "repetition",
  stalemate: "stalemate",
  insufficient: "insufficient-material",
  "50move": "fifty-moves",
  timevsinsufficient: "timeout-vs-insufficient",
};

export function gameResult(game: ChessComGame): GameResult {
  if (game.white.result === "win") return { winner: "w", reason: LOSS_REASONS[game.black.result] ?? "resignation" };
  if (game.black.result === "win") return { winner: "b", reason: LOSS_REASONS[game.white.result] ?? "resignation" };
  return { winner: null, reason: DRAW_REASONS[game.white.result] ?? DRAW_REASONS[game.black.result] ?? "agreement" };
}

/** The game's moves, for the review. Throws if the PGN can't be read. */
export function gameMoves(game: ChessComGame): Move[] {
  const chess = new Chess();
  chess.loadPgn(game.pgn); // clock comments ({[%clk …]}) are ignored
  return chess.history({ verbose: true });
}
