// Copies the single-threaded "lite" Stockfish build from node_modules into
// public/stockfish so Vite serves it as a static file (used as a Web Worker).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "stockfish", "bin");
const dest = join(root, "public", "stockfish");
const files = ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"];

mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`Copied Stockfish engine to public/stockfish (${files.join(", ")})`);
