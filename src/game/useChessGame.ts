// Game state for a game against the computer: rules via chess.js,
// computer moves via Stockfish.

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Color, type Move, type Square } from "chess.js";
import { getOpponentEngine as getEngine } from "../engine/engines";
import { levelById } from "../engine/levels";
import { chooseComputerMove } from "../engine/strength";
import { splitUciMove } from "../engine/uci";
import type { GameSettings } from "./settings";

export type EndReason = "checkmate" | "stalemate" | "repetition" | "fifty-moves" | "insufficient-material" | "resignation";

export interface GameResult {
  /** null = draw */
  winner: Color | null;
  reason: EndReason;
}

export type EngineStatus = "loading" | "ready" | "error";

function resultOf(game: Chess, resignedBy: Color | null): GameResult | null {
  if (resignedBy) return { winner: resignedBy === "w" ? "b" : "w", reason: "resignation" };
  if (game.isCheckmate()) return { winner: game.turn() === "w" ? "b" : "w", reason: "checkmate" };
  if (game.isStalemate()) return { winner: null, reason: "stalemate" };
  if (game.isThreefoldRepetition()) return { winner: null, reason: "repetition" };
  if (game.isInsufficientMaterial()) return { winner: null, reason: "insufficient-material" };
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: "fifty-moves" };
  return null;
}

export function useChessGame(initial: GameSettings) {
  const gameRef = useRef(new Chess());
  const gameIdRef = useRef(0);
  const [, setVersion] = useState(0);
  const rerender = useCallback(() => setVersion((v) => v + 1), []);

  const [settings, setSettings] = useState<GameSettings>(initial);
  const settingsRef = useRef(settings);
  const [playerColor, setPlayerColor] = useState<Color>(initial.color === "b" ? "b" : "w");
  const playerColorRef = useRef(playerColor);
  const [thinking, setThinking] = useState(false);
  const [resignedBy, setResignedBy] = useState<Color | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("loading");

  useEffect(() => {
    let alive = true;
    const engine = getEngine();
    engine.ready
      .then(() => {
        if (!alive) return;
        setEngineStatus("ready");
      })
      .catch(() => alive && setEngineStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  /** Invalidates any pending computer search (after new game / undo). */
  const invalidate = useCallback(() => {
    gameIdRef.current++;
    getEngine().stop(); // ignored by Stockfish when it isn't searching
    setThinking(false);
  }, []);

  const computerMove = useCallback(async () => {
    const game = gameRef.current;
    if (game.isGameOver() || game.turn() === playerColorRef.current) return;
    const id = gameIdRef.current;
    setThinking(true);
    try {
      const { level, thinkMs } = settingsRef.current;
      const uci = await chooseComputerMove(getEngine(), new Chess(game.fen()), levelById(level), thinkMs);
      if (id !== gameIdRef.current || !uci) return;
      game.move(splitUciMove(uci));
      rerender();
    } catch {
      if (id === gameIdRef.current) setEngineStatus("error");
    } finally {
      if (id === gameIdRef.current) setThinking(false);
    }
  }, [rerender]);

  const startGame = useCallback(
    (next: GameSettings) => {
      invalidate();
      const color: Color = next.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : next.color;
      gameRef.current = new Chess();
      settingsRef.current = next;
      playerColorRef.current = color;
      setSettings(next);
      setPlayerColor(color);
      setResignedBy(null);
      rerender();
      void getEngine().newGame().catch(() => undefined);
      if (color === "b") void computerMove();
    },
    [invalidate, rerender, computerMove],
  );

  const game = gameRef.current;
  const result = resultOf(game, resignedBy);
  const isPlayersTurn = !result && !thinking && game.turn() === playerColor;

  const isPromotion = useCallback((from: Square, to: Square) => {
    const piece = gameRef.current.get(from);
    if (!piece || piece.type !== "p") return false;
    return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
  }, []);

  /** Tries the player's move. Returns true if it was legal and played. */
  const playMove = useCallback(
    (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n"): boolean => {
      const g = gameRef.current;
      if (resultOf(g, resignedBy) || thinking || g.turn() !== playerColorRef.current) return false;
      try {
        g.move({ from, to, promotion });
      } catch {
        return false;
      }
      rerender();
      void computerMove();
      return true;
    },
    [resignedBy, thinking, rerender, computerMove],
  );

  const legalTargets = useCallback((from: Square): Move[] => gameRef.current.moves({ square: from, verbose: true }), []);

  const history = game.history({ verbose: true });
  const canUndo = history.some((m) => m.color === playerColor);

  /** Takes back the player's last move (and the computer's reply, if any). */
  const undo = useCallback(() => {
    const g = gameRef.current;
    if (!g.history({ verbose: true }).some((m) => m.color === playerColorRef.current)) return;
    invalidate();
    setResignedBy(null);
    for (;;) {
      const m = g.undo();
      if (!m || m.color === playerColorRef.current) break;
    }
    rerender();
    if (g.turn() !== playerColorRef.current) void computerMove();
  }, [invalidate, rerender, computerMove]);

  const resign = useCallback(() => {
    if (resultOf(gameRef.current, resignedBy)) return;
    invalidate();
    setResignedBy(playerColorRef.current);
  }, [invalidate, resignedBy]);

  const lastMove = history.length ? history[history.length - 1] : null;
  const checkSquare = game.inCheck() ? (game.findPiece({ type: "k", color: game.turn() })[0] ?? null) : null;

  return {
    fen: game.fen(),
    turn: game.turn(),
    inCheck: game.inCheck(),
    history,
    lastMove,
    checkSquare,
    settings,
    playerColor,
    thinking,
    engineStatus,
    result,
    isPlayersTurn,
    canUndo,
    startGame,
    playMove,
    isPromotion,
    legalTargets,
    undo,
    resign,
  };
}

export type ChessGame = ReturnType<typeof useChessGame>;
