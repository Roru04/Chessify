// Move-quality statistics for the computer opponent (development tool, not shipped).
//
// Each level plays self-play games (the bot against itself at the same level),
// then a full-strength referee analyses every position. Per level it reports
// accuracy, move classes (same model as the post-game review) and what kind of
// blunders the bot makes, so changes to the weak bot can be compared.
//
// Levels: the app's difficulty levels 1 … 10 (engine/levels.ts), played
// exactly like chooseComputerMove but without the think-time delay.
//
// Usage:
//   npm run bot-stats -- --levels 1,2,3,4,5,6,7 --games 16 --workers 16 --depth 12

import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { Chess, type Move } from "chess.js";

interface GameTask {
  id: number;
  level: number;
  movetime: number;
  refDepth: number;
  maxPlies: number;
}

/** One analysed move. */
interface MoveStat {
  ply: number;
  book: boolean;
  phase: "opening" | "middlegame" | "endgame";
  san: string;
  capture: boolean;
  /** Win-% lost by the mover (review model). */
  loss: number;
  accuracy: number;
  cls: string;
  /** Rough centipawn loss (clipped to ±1500). */
  cpLoss: number;
  /** Mover's eval before the move (cp, clipped). */
  evalBefore: number;
  /** For moves losing ≥ 200 cp in an undecided position: what kind of error. */
  kind?: string;
  fenBefore: string;
}

interface GameResult {
  id: number;
  level: number;
  result: string;
  reason: string;
  plies: number;
  ms: number;
  moves: MoveStat[];
  pgn: string;
}

// ---------------------------------------------------------------------------
// Worker: plays and analyses single games

async function workerMain() {
  const { createNodeEngine } = await import("../lib/nodeEngine");
  const { weakBotMove, paramsForT } = await import("../../src/engine/strength");
  const { levelById } = await import("../../src/engine/levels");
  const { bookMove, pliesFromFen } = await import("../../src/engine/openingBook");
  const { scoreToCp, splitUciMove } = await import("../../src/engine/uci");
  const { classifyMove } = await import("../../src/review/classify");
  type PositionEval = import("../../src/review/classify").PositionEval;

  const engine = await createNodeEngine();

  /** Returns [uci, fromBook]. Mirrors chooseComputerMove without the think-time delay. */
  async function chooseMove(levelId: number, g: Chess, movetime: number): Promise<[string | null, boolean]> {
    const fen = g.fen();
    const opp = levelById(levelId).opponent;
    const bookPlies = opp.kind === "weak" ? paramsForT(opp.t).bookPlies : 12;
    if (pliesFromFen(fen) < bookPlies) {
      const b = bookMove(fen);
      if (b) return [b, true];
    }
    if (opp.kind !== "weak") {
      await engine.setOptions(opp.kind === "limiter" ? { UCI_LimitStrength: true, UCI_Elo: opp.elo } : { UCI_LimitStrength: false });
      return [(await engine.search(fen, { movetime, multiPv: 1 })).bestMove, false];
    }
    return [await weakBotMove(engine, new Chess(fen), paramsForT(opp.t)), false];
  }

  async function evaluate(g: Chess, depth: number): Promise<PositionEval> {
    if (g.isCheckmate()) return { score: { cp: 0 }, bestMove: null, terminal: g.turn() === "w" ? "black-wins" : "white-wins" };
    if (g.isDraw()) return { score: { cp: 0 }, bestMove: null, terminal: "draw" };
    await engine.setOptions({ UCI_LimitStrength: false });
    const r = await engine.search(g.fen(), { depth, multiPv: 1 });
    const line = r.lines[0];
    const s = line?.score ?? { cp: 0 };
    // to White's perspective
    const white = g.turn() === "w" ? s : "mate" in s && s.mate !== undefined ? { mate: -s.mate } : { cp: -(s.cp ?? 0) };
    return { score: white, bestMove: r.bestMove, pv: line?.pv };
  }

  const clipCp = (e: PositionEval) =>
    e.terminal === "white-wins" ? 1500 : e.terminal === "black-wins" ? -1500 : e.terminal === "draw" ? 0 : Math.max(-1500, Math.min(1500, scoreToCp(e.score)));

  function phaseOf(g: Chess, ply: number): MoveStat["phase"] {
    let pieces = 0;
    const val: Record<string, number> = { n: 3, b: 3, r: 5, q: 9 };
    for (const row of g.board()) for (const sq of row) if (sq && val[sq.type]) pieces += val[sq.type];
    if (pieces <= 26) return "endgame"; // e.g. rooks + one minor each, or less
    return ply < 20 ? "opening" : "middlegame";
  }

  function mateFor(e: PositionEval): number | null {
    return "mate" in e.score && e.score.mate !== undefined ? e.score.mate : null;
  }

  /** What kind of error was it? (only called for mistakes and blunders) */
  function errorKind(color: "w" | "b", played: Move, before: PositionEval, after: PositionEval, gAfter: Chess): string {
    const sign = color === "w" ? 1 : -1;
    const mb = mateFor(before);
    const ma = mateFor(after);
    if (ma !== null && ma * sign < 0) return "allowed mate";
    if (mb !== null && mb * sign > 0 && !(ma !== null && ma * sign > 0)) return "missed mate";
    // opponent's refutation
    const reply = after.bestMove;
    if (reply) {
      const m = gAfter.moves({ verbose: true }).find((x) => x.lan === reply);
      if (m?.captured) {
        if (played.captured && m.to === played.to) return "bad capture (piece was defended)";
        if (m.to === played.to) return "moved piece to attacked square";
        return "left another piece hanging";
      }
    }
    // missed a free capture?
    if (before.bestMove) {
      const gb = new Chess(played.before);
      const bm = gb.moves({ verbose: true }).find((x) => x.lan === before.bestMove);
      if (bm?.captured && !played.captured) return "missed winning material";
    }
    return "other (deeper tactic / positional)";
  }

  async function playGame(task: GameTask): Promise<GameResult> {
    const started = Date.now();
    const g = new Chess();
    await engine.newGame();
    const played: { move: Move; book: boolean }[] = [];
    let reason = `${task.maxPlies} half-moves`;
    for (let ply = 0; ply < task.maxPlies; ply++) {
      const [uci, book] = await chooseMove(task.level, g, task.movetime);
      if (!uci) break;
      const m = g.move(splitUciMove(uci));
      played.push({ move: m, book });
      if (g.isGameOver()) {
        reason = g.isCheckmate() ? "checkmate" : g.isStalemate() ? "stalemate" : g.isThreefoldRepetition() ? "repetition" : g.isInsufficientMaterial() ? "insufficient material" : "50 moves";
        break;
      }
    }
    const result = g.isCheckmate() ? (g.turn() === "w" ? "0-1" : "1-0") : g.isDraw() ? "1/2-1/2" : "*";

    // Referee analysis of every position
    await engine.newGame();
    const r = new Chess();
    const evals: PositionEval[] = [await evaluate(r, task.refDepth)];
    for (const p of played) {
      r.move(p.move.san);
      evals.push(await evaluate(r, task.refDepth));
    }
    const r2 = new Chess();
    const moves: MoveStat[] = [];
    played.forEach((p, i) => {
      const color = p.move.color;
      const phase = phaseOf(r2, i);
      r2.move(p.move.san);
      const v = classifyMove(color, p.move.lan, evals[i], evals[i + 1]);
      const sign = color === "w" ? 1 : -1;
      const cpLoss = Math.max(0, sign * (clipCp(evals[i]) - clipCp(evals[i + 1])));
      const stat: MoveStat = {
        ply: i,
        book: p.book,
        phase,
        san: p.move.san,
        capture: !!p.move.captured,
        loss: v.loss,
        accuracy: v.accuracy,
        cls: v.cls,
        cpLoss,
        evalBefore: sign * clipCp(evals[i]),
        fenBefore: p.move.before,
      };
      if (cpLoss >= 200 && Math.abs(clipCp(evals[i])) < 300) stat.kind = errorKind(color, p.move, evals[i], evals[i + 1], new Chess(r2.fen()));
      moves.push(stat);
    });
    return { id: task.id, level: task.level, result, reason, plies: played.length, ms: Date.now() - started, moves, pgn: g.pgn() };
  }

  parentPort!.on("message", async (task: GameTask | null) => {
    if (!task) process.exit(0);
    parentPort!.postMessage(await playGame(task));
  });
  parentPort!.postMessage({ ready: true });
}

// ---------------------------------------------------------------------------
// Main: schedules games and prints the report

const pct = (a: number, b: number) => (b === 0 ? "–" : `${((100 * a) / b).toFixed(1)} %`);

function report(level: number, games: GameResult[]) {
  const all = games.flatMap((g) => g.moves);
  const own = all.filter((m) => !m.book);
  const n = own.length;
  const count = (c: string) => own.filter((m) => m.cls === c).length;
  const acc = own.reduce((a, m) => a + m.accuracy, 0) / Math.max(1, n);
  const caps = own.filter((m) => m.capture);
  const phase = (p: MoveStat["phase"]) => {
    const ms = own.filter((m) => m.phase === p);
    return ms.length ? `${pct(ms.filter((m) => m.cls === "blunder").length, ms.length)} (${ms.length})` : "–";
  };
  // Undecided positions (|eval| < 3 pawns): here every mistake still matters.
  const und = own.filter((m) => Math.abs(m.evalBefore) < 300);
  const lose = (cp: number) => pct(und.filter((m) => m.cpLoss >= cp).length, und.length);
  const undCaps = und.filter((m) => m.capture);
  const firstBigBlunder = games.map((g) => g.moves.find((m) => !m.book && m.cpLoss >= 300 && Math.abs(m.evalBefore) < 300)?.ply);
  const fb = firstBigBlunder.filter((x): x is number => x !== undefined);
  const endings: Record<string, number> = {};
  for (const g of games) endings[g.reason] = (endings[g.reason] ?? 0) + 1;
  return {
    level,
    games: games.length,
    "moves (non-book)": n,
    "book moves": all.length - n,
    accuracy: `${acc.toFixed(1)} %`,
    "avg cp loss": Math.round(own.reduce((a, m) => a + m.cpLoss, 0) / Math.max(1, n)),
    "best+exc+good": pct(count("best") + count("excellent") + count("good"), n),
    inaccuracy: pct(count("inaccuracy"), n),
    mistake: pct(count("mistake"), n),
    blunder: pct(count("blunder"), n),
    "blunder: opening / middle / end": `${phase("opening")} / ${phase("middlegame")} / ${phase("endgame")}`,
    "undecided moves": und.length,
    "undecided: avg cp loss": Math.round(und.reduce((a, m) => a + m.cpLoss, 0) / Math.max(1, und.length)),
    "undecided: lose ≥1 pawn": lose(100),
    "undecided: lose ≥2 pawns": lose(200),
    "undecided: lose ≥3 pawns": lose(300),
    "first ≥3-pawn blunder (median move no.)": fb.length ? Math.ceil((fb.sort((a, b) => a - b)[Math.floor(fb.length / 2)] + 1) / 2) : "–",
    captures: pct(caps.length, n),
    "undecided captures losing ≥2 pawns": pct(undCaps.filter((m) => m.cpLoss >= 200).length, undCaps.length),
    "avg plies": Math.round(games.reduce((a, g) => a + g.plies, 0) / games.length),
    endings: Object.entries(endings).map(([k, v]) => `${k} ${v}`).join(", "),
  };
}

function kinds(level: number, games: GameResult[]) {
  const errs = games.flatMap((g) => g.moves).filter((m) => !m.book && m.kind);
  const out: Record<string, string | number> = { level, "≥2-pawn errors in undecided positions": errs.length };
  const k: Record<string, number> = {};
  for (const e of errs) k[e.kind!] = (k[e.kind!] ?? 0) + 1;
  for (const [name, v] of Object.entries(k).sort((a, b) => b[1] - a[1])) out[name] = pct(v, errs.length);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name: string, def: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
  };
  const levels = opt("levels", "1,2,3,4,5,6,7").split(",").map(Number);
  const gamesPer = Number(opt("games", "10"));
  const workers = Number(opt("workers", "8"));
  const movetime = Number(opt("movetime", "300"));
  const refDepth = Number(opt("depth", "12"));
  const maxPlies = Number(opt("plies", "160"));
  const out = opt("out", "");

  const tasks: GameTask[] = [];
  for (const level of levels) for (let i = 0; i < gamesPer; i++) tasks.push({ id: tasks.length, level, movetime, refDepth, maxPlies });
  console.log(`Bot stats: levels ${levels.join(", ")} · ${gamesPer} self-play games each · referee depth ${refDepth} · ${workers} workers`);

  const started = Date.now();
  const results: GameResult[] = [];
  let next = 0;
  await new Promise<void>((resolve) => {
    let alive = workers;
    for (let w = 0; w < workers; w++) {
      const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { worker: true } });
      const feed = () => worker.postMessage(next < tasks.length ? tasks[next++] : null);
      worker.on("message", (msg: GameResult | { ready: true }) => {
        if ("id" in msg) {
          results.push(msg);
          const sec = ((Date.now() - started) / 1000).toFixed(0);
          console.log(`[${results.length}/${tasks.length} · ${sec}s] level ${msg.level}: ${msg.result} (${msg.reason}, ${msg.plies} plies)`);
        }
        feed();
      });
      worker.on("exit", () => {
        if (--alive === 0) resolve();
      });
      worker.on("error", (e) => console.error("worker error:", e));
    }
  });

  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(0)} s\n`);
  const by = (l: number) => results.filter((r) => r.level === l);
  console.log(JSON.stringify(levels.map((l) => report(l, by(l))), null, 1));
  console.log("\nKinds of ≥2-pawn errors in undecided positions:");
  console.log(JSON.stringify(levels.map((l) => kinds(l, by(l))), null, 1));
  if (out) {
    writeFileSync(out, JSON.stringify(results, null, 1));
    console.log(`\nRaw data: ${out}`);
  }
}

if (isMainThread) void main();
else if ((workerData as { worker?: boolean })?.worker) void workerMain();
