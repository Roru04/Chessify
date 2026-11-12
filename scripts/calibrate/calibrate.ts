// Calibration matches for the weak computer levels (development tool, not shipped).
//
// Plays games between "players" in parallel Node worker threads, using the
// same Stockfish build and the same move-choice code as the app, and reports
// the score and the Elo difference with a 95 % confidence interval.
//
// Players:
//   sf1320   Stockfish with its calibrated limiter at that Elo (+ opening book, like the app)
//   t0.75    the app's human-like weak bot at internal strength t (0 … 1)
//   L4       the app's difficulty level 4 (engine/levels.ts)
//
// Usage:
//   npm run calibrate -- --pair sf1320:t1 --pair t1:t0.75 --games 20 --workers 3 --movetime 500
//   npm run calibrate -- --ladder --games 100 --workers 8   (level test, see below)
//
// --ladder checks the difficulty levels: every level against the one below
// (L2:L1 … L7:L6) plus Stockfish 1320 against level 6. For each pairing it
// compares the measured Elo difference with the difference of the levels'
// shown ratings and marks it OK when the expected value lies in the 95 % range.
//
// Adjudication: a full-strength referee (depth 8) checks every 2nd half-move
// from move 8; ≥ 10 pawns for one side on 3 checks in a row = win. A game is
// a draw by the rules or after 200 half-moves.

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { Chess } from "chess.js";

interface GameTask {
  id: number;
  white: string;
  black: string;
  movetime: number;
}
interface GameResult {
  id: number;
  white: string;
  black: string;
  /** Points for White: 1, 0.5 or 0 */
  score: number;
  reason: string;
  plies: number;
  ms: number;
  moves: string;
}

// ---------------------------------------------------------------------------
// Worker: plays single games

async function workerMain() {
  const require = createRequire(import.meta.url);
  const sfFactory = require("stockfish");
  // Stand-in for the browser Web Worker API, backed by the Node engine build.
  class NodeWorker {
    onmessage: ((e: { data: string }) => void) | null = null;
    private sf: { processCommand: (c: string) => void };
    constructor() {
      this.sf = sfFactory("lite-single", (line: string) => this.onmessage?.({ data: line }));
    }
    postMessage(cmd: string) {
      this.sf.processCommand(cmd);
    }
    addEventListener() {}
    removeEventListener() {}
    terminate() {}
  }
  (globalThis as unknown as { Worker: unknown }).Worker = NodeWorker;

  const { StockfishEngine } = await import("../../src/engine/StockfishEngine");
  const { paramsForT, weakBotMove } = await import("../../src/engine/strength");
  const { bookMove, pliesFromFen } = await import("../../src/engine/openingBook");
  const { scoreToCp, splitUciMove } = await import("../../src/engine/uci");

  const engine = new StockfishEngine("node");
  await engine.ready;

  const { levelById } = await import("../../src/engine/levels");

  async function chooseMove(spec: string, g: Chess, movetime: number): Promise<string | null> {
    if (spec.startsWith("L")) {
      const opp = levelById(Number(spec.slice(1))).opponent;
      spec = opp.kind === "weak" ? `t${opp.t}` : opp.kind === "limiter" ? `sf${opp.elo}` : "full";
    }
    if (spec === "full") {
      const fen = g.fen();
      if (pliesFromFen(fen) < 12) {
        const b = bookMove(fen);
        if (b) return b;
      }
      await engine.setOptions({ UCI_LimitStrength: false });
      return (await engine.search(fen, { movetime, multiPv: 1 })).bestMove;
    }
    if (spec.startsWith("sf")) {
      const elo = Number(spec.slice(2));
      const fen = g.fen();
      if (pliesFromFen(fen) < 12) {
        const b = bookMove(fen);
        if (b) return b;
      }
      await engine.setOptions({ UCI_LimitStrength: true, UCI_Elo: elo });
      return (await engine.search(fen, { movetime, multiPv: 1 })).bestMove;
    }
    const t = Number(spec.slice(1));
    return weakBotMove(engine, new Chess(g.fen()), paramsForT(t));
  }

  async function refereeCp(g: Chess): Promise<number> {
    await engine.setOptions({ UCI_LimitStrength: false });
    const r = await engine.search(g.fen(), { depth: 8, multiPv: 1 });
    const s = r.lines[0]?.score;
    if (!s) return 0;
    const cp = Math.max(-10000, Math.min(10000, scoreToCp(s)));
    return g.turn() === "w" ? cp : -cp;
  }

  async function playGame(task: GameTask): Promise<GameResult> {
    const started = Date.now();
    const g = new Chess();
    await engine.newGame();
    let streak = 0;
    let streakSign = 0;
    let score = 0.5;
    let reason = "200 half-moves";
    for (let ply = 0; ply < 200; ply++) {
      const spec = g.turn() === "w" ? task.white : task.black;
      const uci = await chooseMove(spec, g, task.movetime);
      if (!uci) break;
      g.move(splitUciMove(uci));
      if (g.isCheckmate()) {
        score = g.turn() === "w" ? 0 : 1;
        reason = "checkmate";
        break;
      }
      if (g.isDraw()) {
        reason = g.isStalemate() ? "stalemate" : g.isThreefoldRepetition() ? "repetition" : g.isInsufficientMaterial() ? "material" : "50 moves";
        break;
      }
      if (ply >= 15 && ply % 2 === 1) {
        const cp = await refereeCp(g);
        const sign = cp >= 1000 ? 1 : cp <= -1000 ? -1 : 0;
        streak = sign !== 0 && sign === streakSign ? streak + 1 : sign !== 0 ? 1 : 0;
        streakSign = sign;
        if (streak >= 3) {
          score = sign > 0 ? 1 : 0;
          reason = "adjudicated";
          break;
        }
      }
    }
    const h = g.history();
    return { id: task.id, white: task.white, black: task.black, score, reason, plies: h.length, ms: Date.now() - started, moves: h.slice(0, 16).join(" ") };
  }

  parentPort!.on("message", async (task: GameTask | null) => {
    if (!task) process.exit(0);
    parentPort!.postMessage(await playGame(task));
  });
  parentPort!.postMessage({ ready: true });
}

// ---------------------------------------------------------------------------
// Main: schedules games and reports results

function eloFromScore(s: number): number {
  const c = Math.min(0.999, Math.max(0.001, s));
  return -400 * Math.log10(1 / c - 1);
}

function summarize(a: string, b: string, games: GameResult[]) {
  // points for player a in each game
  const pts = games.map((r) => (r.white === a ? r.score : 1 - r.score));
  const n = pts.length;
  const mean = pts.reduce((x, y) => x + y, 0) / n;
  const sd = Math.sqrt(pts.reduce((x, y) => x + (y - mean) ** 2, 0) / Math.max(1, n - 1));
  const margin = (1.96 * sd) / Math.sqrt(n);
  const wins = pts.filter((p) => p === 1).length;
  const draws = pts.filter((p) => p === 0.5).length;
  const avgMs = games.reduce((x, r) => x + r.ms, 0) / n;
  const avgPlies = games.reduce((x, r) => x + r.plies, 0) / n;
  const reasons: Record<string, number> = {};
  for (const r of games) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  return {
    pairing: `${a} vs ${b}`,
    games: n,
    "W/D/L": `${wins}/${draws}/${n - wins - draws}`,
    score: `${(mean * 100).toFixed(1)} %`,
    "Elo diff": `${Math.round(eloFromScore(mean))}`,
    "95 % range": `${Math.round(eloFromScore(mean - margin))} … ${Math.round(eloFromScore(mean + margin))}`,
    "avg plies": Math.round(avgPlies),
    "avg s/game": (avgMs / 1000).toFixed(1),
    endings: Object.entries(reasons).map(([k, v]) => `${k} ${v}`).join(", "),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name: string, def: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
  };
  const pairs: [string, string][] = [];
  args.forEach((v, i) => {
    if (v === "--pair") pairs.push(args[i + 1].split(":") as [string, string]);
  });
  const ladder = args.includes("--ladder");
  const { LEVELS } = await import("../../src/engine/levels");
  const expected = new Map<string, number>();
  if (ladder) {
    const rated = LEVELS.filter((l) => l.approxElo !== null && l.id <= 7);
    for (let i = 1; i < rated.length; i++) {
      const [lo, hi] = [rated[i - 1], rated[i]];
      pairs.push([`L${hi.id}`, `L${lo.id}`]);
      expected.set(`L${hi.id} vs L${lo.id}`, hi.approxElo! - lo.approxElo!);
    }
    const l6 = LEVELS.find((l) => l.id === 6)!;
    pairs.push(["sf1320", "L6"]);
    expected.set("sf1320 vs L6", 1320 - l6.approxElo!);
  }
  if (pairs.length === 0) pairs.push(["sf1320", "t1"]);
  const gamesPer = Number(opt("games", "20"));
  const workers = Number(opt("workers", "3"));
  const movetime = Number(opt("movetime", "500"));

  const tasks: GameTask[] = [];
  for (const [a, b] of pairs) {
    for (let i = 0; i < gamesPer; i++) tasks.push({ id: tasks.length, white: i % 2 ? b : a, black: i % 2 ? a : b, movetime });
  }
  console.log(`Calibration: ${pairs.map((p) => p.join(" vs ")).join(", ")} · ${gamesPer} games each · ${workers} workers · Stockfish movetime ${movetime} ms`);

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
          const res = msg.score === 1 ? "1-0" : msg.score === 0 ? "0-1" : "½-½";
          console.log(`[${results.length}/${tasks.length} · ${sec}s] ${msg.white} vs ${msg.black}: ${res} (${msg.reason}, ${msg.plies} plies, ${(msg.ms / 1000).toFixed(1)}s)  ${msg.moves}`);
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
  const rows = pairs.map(([a, b]) => {
    const row: Record<string, string | number> = summarize(a, b, results.filter((r) => (r.white === a && r.black === b) || (r.white === b && r.black === a)));
    const exp = expected.get(`${a} vs ${b}`);
    if (exp !== undefined) {
      const [lo, hi] = String(row["95 % range"]).split(" … ").map(Number);
      row.expected = exp;
      row.check = exp >= lo && exp <= hi ? "OK" : Number(row["Elo diff"]) < exp ? "too close" : "too far apart";
      delete row.endings;
    }
    return row;
  });
  console.table(rows);
  if (ladder) {
    const bad = rows.filter((r) => r.check && r.check !== "OK");
    console.log(bad.length === 0 ? "Level test: all steps OK" : `Level test: ${bad.length} of ${rows.length} pairings outside the expected range`);
  }
}

if (isMainThread) void main();
else if ((workerData as { worker?: boolean })?.worker) void workerMain();
