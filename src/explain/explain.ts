// Plain-language explanations for reviewed moves.
//
// Stockfish only gives moves and numbers, so the reasons are worked out here
// from the position and the engine's main line with simple pattern checks:
// material won or lost along the line, forced mates, hanging pieces, forks,
// attacks, escaping a threat, defending a piece, castling, development and
// promotion. Sentences use "White"/"Black" so they are unambiguous.

import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { formatScore } from "../analysis/format";
import { splitUciMove } from "../engine/uci";
import { GOOD_CLASSES, winPercentFor, type MoveClass, type PositionEval } from "../review/classify";
import { VALUE, hangingPieces, isHanging, other } from "../review/hanging";

const NAME: Record<PieceSymbol, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const SIDE: Record<Color, string> = { w: "White", b: "Black" };

/** "the queen", "a pawn", "the knight on c6" */
function pieceRef(type: PieceSymbol, square?: string): string {
  if (square) return `the ${NAME[type]} on ${square}`;
  return type === "p" ? "a pawn" : `the ${NAME[type]}`;
}

function material(g: Chess, color: Color): number {
  let sum = 0;
  for (const row of g.board()) for (const p of row) if (p && p.color === color && p.type !== "k") sum += VALUE[p.type];
  return sum;
}

function tryMove(g: Chess, uci: string): Move | null {
  try {
    return g.move(splitUciMove(uci));
  } catch {
    return null;
  }
}

/**
 * Plays a line and returns the material change for `color` once the captures
 * have settled (stops after the first quiet move that follows ≥ 2 plies).
 * Also returns the most valuable piece of each side captured on the way.
 */
function playLine(fen: string, ucis: string[], color: Color, maxPlies = 8) {
  const g = new Chess(fen);
  const start = material(g, color) - material(g, other(color));
  type Swing = { type: PieceSymbol; square: string; by: string; ply: number };
  const lost: Swing[] = [];
  const won: Swing[] = [];
  const sans: string[] = [];
  for (let i = 0; i < Math.min(ucis.length, maxPlies); i++) {
    const m = tryMove(g, ucis[i]);
    if (!m) break;
    sans.push(m.san);
    if (m.captured) (m.color === color ? won : lost).push({ type: m.captured, square: m.to, by: m.san, ply: i });
    if (m.promotion) (m.color === color ? won : lost).push({ type: m.promotion, square: m.to, by: m.san, ply: i });
    const next = ucis[i + 1];
    if (i >= 1 && next) {
      // stop when the next move is quiet: the exchange is over
      const peek = new Chess(g.fen());
      const nm = tryMove(peek, next);
      if (!nm || (!nm.captured && !nm.promotion)) break;
    }
  }
  const delta = material(g, color) - material(g, other(color)) - start;
  const biggest = (xs: typeof lost) => xs.sort((a, b) => VALUE[b.type] - VALUE[a.type])[0];
  return { delta, lost: biggest(lost), won: biggest(won), sans, game: g };
}

/** Mate in N for `color` according to an evaluation, or null. */
function mateFor(e: PositionEval | undefined, color: Color): number | null {
  if (!e || e.terminal || e.score.mate === undefined) return null;
  const m = e.score.mate;
  if (color === "w" ? m > 0 : m < 0) return Math.abs(m);
  return null;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Reasons why a move is good (used for good moves and for "Best was …").
 * `continuation` is the engine line after the move; `evalAfter` its evaluation.
 */
export function goodReasons(
  fenBefore: string,
  uci: string,
  continuation: string[],
  evalAfter: PositionEval | undefined,
  prev?: Move | null,
): string[] {
  const g0 = new Chess(fenBefore);
  const g1 = new Chess(fenBefore);
  const m = tryMove(g1, uci);
  if (!m) return [];
  const me = m.color;
  const opp = other(me);
  const reasons: string[] = [];

  if (g1.isCheckmate()) return ["Checkmate."];
  const mate = mateFor(evalAfter, me);
  if (mate) reasons.push(mate === 1 ? "Forces mate next move." : `Forces mate in ${mate} more moves.`);

  if (m.promotion) reasons.push(`Promotes the pawn to a ${NAME[m.promotion]}.`);

  if (m.captured) {
    const line = playLine(fenBefore, [uci, ...continuation], me);
    if (prev?.captured && prev.to === m.to) reasons.push(`Recaptures the ${NAME[m.captured]}.`);
    else if (line.delta >= 1) reasons.push(`Wins ${pieceRef(m.captured)}.`);
    else if (line.delta > -1) {
      reasons.push(
        m.piece === m.captured
          ? `Trades ${NAME[m.piece]}s.`
          : `Trades the ${NAME[m.piece]} for the ${NAME[m.captured]}; material stays even.`,
      );
    }
  }

  if (m.flags.includes("k") || m.flags.includes("q")) reasons.push("Castles: brings the king to safety and connects the rooks.");

  // Escaping a threat
  if (!m.captured && isHanging(g0, m.from, me) && !isHanging(g1, m.to, me)) {
    reasons.push(`Moves the ${NAME[m.piece]} out of danger; it was attacked on ${m.from}.`);
  }

  // Fork / attack: what the moved piece now attacks
  const targets: { type: PieceSymbol; square: Square }[] = [];
  for (const row of g1.board()) {
    for (const p of row) {
      if (!p || p.color !== opp) continue;
      if (!g1.attackers(p.square, me).includes(m.to)) continue;
      const undefended = g1.attackers(p.square, opp).length === 0;
      if (p.type === "k" || VALUE[p.type] > VALUE[m.piece] || (undefended && p.type !== "p")) targets.push(p);
    }
  }
  const movedSafe = !isHanging(g1, m.to, me);
  if (targets.length >= 2 && movedSafe) {
    const names = targets.sort((a, b) => VALUE[b.type] - VALUE[a.type]).slice(0, 2).map((t) => pieceRef(t.type, t.type === "k" ? undefined : t.square));
    reasons.push(`Forks ${names[0]} and ${names[1]}.`);
  } else if (g1.inCheck()) {
    reasons.push("Gives check.");
  } else if (targets.length === 1 && movedSafe && !m.captured) {
    reasons.push(`Attacks ${pieceRef(targets[0].type, targets[0].square)}.`);
  }

  // Defending a piece that was in danger
  if (reasons.length < 2) {
    for (const sq of hangingPieces(g0, me)) {
      if (sq === m.from) continue;
      if (!isHanging(g1, sq, me)) {
        reasons.push(`Defends ${pieceRef(g1.get(sq)!.type, sq)}.`);
        break;
      }
    }
  }

  // Opening principles
  const moveNo = Number(fenBefore.split(" ")[5]);
  if (reasons.length === 0 && moveNo <= 12) {
    const backRank = me === "w" ? "1" : "8";
    if ((m.piece === "n" || m.piece === "b") && m.from[1] === backRank) reasons.push(`Develops the ${NAME[m.piece]}.`);
    else if (m.piece === "p" && ["d4", "e4", "d5", "e5", "c4", "c5"].includes(m.to)) reasons.push("Claims space in the center.");
  }

  if (reasons.length === 0 && evalAfter) {
    const w = winPercentFor(me, evalAfter);
    reasons.push(w > 60 ? "Keeps the advantage." : w >= 40 ? "Keeps the position balanced." : "The most stubborn defence.");
  }
  return reasons.slice(0, 2);
}

export interface Explanation {
  /** Why the played move is good or bad. */
  text: string[];
  /** For a weaker move: what the best move would have done. */
  best: string | null;
}

/**
 * Explains a played move. `before`/`after` are the evaluations of the
 * positions before and after it.
 */
export function explainMove(move: Move, cls: MoveClass, before: PositionEval, after: PositionEval, prev?: Move | null): Explanation {
  const me = move.color;
  const opp = other(me);
  const bestUci = before.bestMove;
  const bestSan = bestUci && bestUci !== move.lan ? (tryMove(new Chess(move.before), bestUci)?.san ?? null) : null;
  const bestWhy = (): string | null => {
    if (!bestUci || !bestSan) return null;
    const r = goodReasons(move.before, bestUci, (before.pv ?? []).slice(1), before, prev);
    return r.length ? `${bestSan}: ${r.map((s, i) => (i === 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s)).join(" ")}` : bestSan;
  };

  if (GOOD_CLASSES.includes(cls)) {
    const text = goodReasons(move.before, move.lan, after.pv ?? [], after, prev);
    if (cls === "book") return { text: ["A known opening move.", ...text.slice(0, 1)], best: null };
    if (cls === "great") return { text: ["The only good move: every other move is clearly worse.", ...text.slice(0, 1)], best: null };
    if (cls === "brilliant") {
      const g = new Chess(move.after);
      const sac = hangingPieces(g, me).find((sq) => VALUE[g.get(sq)!.type] >= 3);
      const piece = sac ? pieceRef(g.get(sac)!.type, sac) : "material";
      return { text: [`Sacrifices ${piece}, and it works: taking it doesn't pay off for ${SIDE[opp]}.`, ...text.slice(0, 1)], best: bestWhy() };
    }
    return { text, best: cls === "best" ? null : bestWhy() };
  }

  // Inaccuracy, mistake or blunder: what goes wrong?
  const text: string[] = [];
  const reply = after.bestMove ? tryMove(new Chess(move.after), after.bestMove) : null;
  const oppMate = mateFor(after, opp);
  if (oppMate) {
    text.push(
      oppMate === 1
        ? `It allows mate in one: ${SIDE[opp]} plays ${reply?.san ?? "the mating move"}.`
        : `It allows a forced mate in ${oppMate}, starting with ${reply?.san ?? "the engine's move"}.`,
    );
  } else {
    const line = playLine(move.before, [move.lan, ...(after.pv ?? [])], me);
    if (line.delta <= -2 && line.lost && line.lost.ply <= 3) {
      text.push(`It loses ${pieceRef(line.lost.type)}: ${SIDE[opp]} answers ${reply?.san ?? line.sans[1] ?? "…"}${reply && reply.san !== line.lost.by ? ` and later ${line.lost.by}` : ""}.`);
    } else {
      const hanging = hangingPieces(new Chess(move.after), me);
      const myMate = mateFor(before, me);
      const bestLine = bestUci ? playLine(move.before, before.pv?.length ? before.pv : [bestUci], me) : null;
      if (myMate) text.push(`It misses a forced mate in ${myMate}.`);
      else if (
        bestLine &&
        bestLine.delta >= 2 &&
        bestLine.won &&
        (bestLine.won.ply === 0 || (bestLine.won.ply === 2 && bestLine.sans[0]?.includes("+")))
      )
        text.push(`It misses a chance to win ${pieceRef(bestLine.won.type)}.`);
      else if (hanging.length && reply?.captured) text.push(`It leaves ${pieceRef(new Chess(move.after).get(hanging[0])!.type, hanging[0])} unprotected.`);
      else {
        const from = formatScore(before.score);
        const to = after.terminal ? "" : formatScore(after.score);
        const mine = winPercentFor(me, after);
        const what = mine > 55 ? "It gives away part of the advantage" : mine >= 45 ? `It lets ${SIDE[opp]} equalize` : `${SIDE[opp]} gets the better chances`;
        text.push(`${what}${to ? `: the evaluation goes from ${from} to ${to}` : ""}.`);
      }
    }
    if (reply && !text[0].includes(reply.san)) text.push(`${SIDE[opp]}'s best reply is ${reply.san}.`);
  }
  if (cls === "miss" && !mateFor(before, me) && prev) {
    text.unshift(`${SIDE[opp]}'s last move (${prev.san}) was a mistake, but this doesn't punish it.`);
  }
  return { text: text.map(cap), best: bestWhy() };
}
