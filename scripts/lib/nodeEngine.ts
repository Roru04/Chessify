// Runs the app's StockfishEngine class in Node by standing in for the browser
// Web Worker API with the Node build of the same engine. Development scripts only.
// Note: the Node build allows one engine per thread.

import { createRequire } from "node:module";

export async function createNodeEngine() {
  const require = createRequire(import.meta.url);
  const sfFactory = require("stockfish");
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
  const engine = new StockfishEngine("node");
  await engine.ready;
  return engine;
}
