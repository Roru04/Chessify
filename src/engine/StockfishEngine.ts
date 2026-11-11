// Thin wrapper around the Stockfish WebAssembly build running in a Web Worker.
// Components never talk to the worker directly; they use this class.

import { parseBestMove, parseInfo, parseSpinOption, type InfoLine } from "./uci";

export interface SearchOptions {
  /** Think time in milliseconds. */
  movetime?: number;
  /** Fixed search depth (used instead of movetime when set). */
  depth?: number;
  /** Number of best lines to return. */
  multiPv?: number;
}

export interface SearchResult {
  bestMove: string | null;
  /** Latest line for each multipv index (index 0 = best line). */
  lines: InfoLine[];
}

// `import.meta.env` only exists under Vite; the Node calibration script passes its own engine.
const ENGINE_URL = `${import.meta.env?.BASE_URL ?? "/"}stockfish/stockfish-19-lite-single.js`;

export class StockfishEngine {
  private worker: Worker;
  private listeners = new Set<(line: string) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private options = new Map<string, string>();
  readonly ready: Promise<void>;
  /** Range of the UCI_Elo option, read during the handshake. */
  eloRange = { min: 1320, max: 3190 };

  constructor(url: string = ENGINE_URL) {
    this.worker = new Worker(url);
    this.worker.onmessage = (e: MessageEvent) => {
      const line = String(e.data);
      for (const l of this.listeners) l(line);
    };
    this.ready = this.handshake();
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  /** Sends a command and resolves with the first line matching `until`. */
  private waitFor(cmd: string, until: (line: string) => boolean, onLine?: (line: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const onError = (e: ErrorEvent) => {
        cleanup();
        reject(new Error(e.message || "Stockfish failed to load"));
      };
      const listener = (line: string) => {
        onLine?.(line);
        if (until(line)) {
          cleanup();
          resolve(line);
        }
      };
      const cleanup = () => {
        this.listeners.delete(listener);
        this.worker.removeEventListener("error", onError);
      };
      this.listeners.add(listener);
      this.worker.addEventListener("error", onError);
      this.send(cmd);
    });
  }

  private async handshake() {
    await this.waitFor("uci", (l) => l === "uciok", (l) => {
      const range = parseSpinOption(l, "UCI_Elo");
      if (range) this.eloRange = range;
    });
    await this.waitFor("isready", (l) => l === "readyok");
  }

  /** Runs a task after all previously queued tasks, so searches never overlap. */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  /** Sets UCI options; only sends the ones that changed. */
  setOptions(opts: Record<string, string | number | boolean>): Promise<void> {
    return this.enqueue(async () => {
      await this.ready;
      let changed = false;
      for (const [name, raw] of Object.entries(opts)) {
        const value = String(raw);
        if (this.options.get(name) === value) continue;
        this.options.set(name, value);
        this.send(`setoption name ${name} value ${value}`);
        changed = true;
      }
      if (changed) await this.waitFor("isready", (l) => l === "readyok");
    });
  }

  newGame(): Promise<void> {
    return this.enqueue(async () => {
      await this.ready;
      this.send("ucinewgame");
      await this.waitFor("isready", (l) => l === "readyok");
    });
  }

  /** Searches the given position and resolves when Stockfish reports its best move. */
  search(fen: string, { movetime, depth, multiPv = 1 }: SearchOptions = {}): Promise<SearchResult> {
    return this.enqueue(async () => {
      await this.ready;
      if (this.options.get("MultiPV") !== String(multiPv)) {
        this.options.set("MultiPV", String(multiPv));
        this.send(`setoption name MultiPV value ${multiPv}`);
      }
      this.send(`position fen ${fen}`);
      const lines: InfoLine[] = [];
      const go = depth ? `go depth ${depth}` : `go movetime ${movetime ?? 1000}`;
      const last = await this.waitFor(go, (l) => l.startsWith("bestmove"), (l) => {
        const info = parseInfo(l);
        if (info) lines[info.multipv - 1] = info;
      });
      return { bestMove: parseBestMove(last) ?? null, lines: lines.filter(Boolean) };
    });
  }

  private analysisToken = 0;

  /**
   * Analyses a position and streams every `info` line to `onInfo` until the
   * depth limit is reached or the analysis is replaced/cancelled. Starting a
   * new analysis stops the previous one; analyses that were replaced before
   * they started are skipped.
   */
  analyze(fen: string, { multiPv = 3, depth = 22 }: { multiPv?: number; depth?: number }, onInfo: (info: InfoLine) => void): Promise<void> {
    const token = ++this.analysisToken;
    this.stop();
    return this.enqueue(async () => {
      await this.ready;
      if (token !== this.analysisToken) return;
      if (this.options.get("MultiPV") !== String(multiPv)) {
        this.options.set("MultiPV", String(multiPv));
        this.send(`setoption name MultiPV value ${multiPv}`);
      }
      this.send(`position fen ${fen}`);
      await this.waitFor(`go depth ${depth}`, (l) => l.startsWith("bestmove"), (l) => {
        if (token !== this.analysisToken) return;
        const info = parseInfo(l);
        if (info) onInfo(info);
      });
    });
  }

  /** Stops the running analysis and drops any queued one. */
  cancelAnalysis() {
    this.analysisToken++;
    this.stop();
  }

  /** Asks Stockfish to finish the current search immediately. */
  stop() {
    this.send("stop");
  }

  terminate() {
    this.worker.terminate();
  }
}
