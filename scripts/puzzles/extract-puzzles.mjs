// Picks tactics puzzles for the Learn tab from the Lichess puzzle database
// (public domain, CC0: https://database.lichess.org/#puzzles). Development
// tool, not shipped.
//
// Usage: node scripts/puzzles/extract-puzzles.mjs <lichess_db_puzzle.csv.zst> <out.json>
//
// For each theme it keeps well-tested, popular puzzles (≥ 2000 plays,
// popularity ≥ 85, rating deviation ≤ 90), spread over rating bands from
// 600 to 1900, short enough for learners, and verifies every move with
// chess.js. Each puzzle is used for one theme only.

import { createReadStream, writeFileSync } from "node:fs";
import { Decompress } from "fzstd";
import { Chess } from "chess.js";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("Usage: node extract-puzzles.mjs <lichess_db_puzzle.csv.zst> <out.json>");
  process.exit(1);
}

/** Lichess theme tag → how many puzzles per rating band */
export const THEMES = ["hangingPiece", "fork", "pin", "skewer", "discoveredAttack", "backRankMate"];
const BANDS = [
  { min: 600, max: 900, n: 8 },
  { min: 900, max: 1200, n: 8 },
  { min: 1200, max: 1500, n: 8 },
  { min: 1500, max: 1900, n: 6 },
];

const picked = Object.fromEntries(THEMES.map((t) => [t, BANDS.map(() => [])]));
const used = new Set();
const full = () => THEMES.every((t) => picked[t].every((b, i) => b.length >= BANDS[i].n));

function legal(fen, moves) {
  try {
    const g = new Chess(fen);
    for (const m of moves) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
    return true;
  } catch {
    return false;
  }
}

let rows = 0;
let rest = "";
let done = false;
const decoder = new TextDecoder();

function handleLine(line) {
  if (!line || line.startsWith("PuzzleId")) return;
  rows++;
  const [id, fen, movesStr, ratingStr, rdStr, popStr, playsStr, themesStr] = line.split(",");
  const rating = Number(ratingStr);
  if (Number(rdStr) > 90 || Number(popStr) < 85 || Number(playsStr) < 2000) return;
  const moves = movesStr.split(" ");
  // first move is the opponent's; keep puzzles with at most 3 moves to find (≤ 4 below 1500)
  const maxPlies = rating < 1500 ? 6 : 8;
  if (moves.length > maxPlies) return;
  const tags = themesStr.split(" ");
  for (const theme of THEMES) {
    if (!tags.includes(theme) || used.has(id)) continue;
    const bi = BANDS.findIndex((b) => rating >= b.min && rating < b.max);
    if (bi < 0 || picked[theme][bi].length >= BANDS[bi].n) continue;
    if (!legal(fen, moves)) continue;
    picked[theme][bi].push({ id, fen, moves, rating, themes: tags });
    used.add(id);
    return;
  }
}

const stream = new Decompress((chunk, final) => {
  if (done) return;
  const text = rest + decoder.decode(chunk, { stream: !final });
  const lines = text.split("\n");
  rest = lines.pop() ?? "";
  for (const l of lines) handleLine(l);
  if (final) handleLine(rest);
  if (full()) done = true;
});

const file = createReadStream(input);
file.on("data", (buf) => {
  if (done) {
    file.destroy();
    finish();
    return;
  }
  stream.push(new Uint8Array(buf));
});
file.on("end", () => {
  stream.push(new Uint8Array(0), true);
  finish();
});

let finished = false;
function finish() {
  if (finished) return;
  finished = true;
  const out = {
    source: "Lichess puzzle database (CC0), https://database.lichess.org/#puzzles",
    generated: new Date().toISOString().slice(0, 10),
    themes: Object.fromEntries(THEMES.map((t) => [t, picked[t].flat().sort((a, b) => a.rating - b.rating)])),
  };
  writeFileSync(output, JSON.stringify(out));
  console.log(`Read ${rows.toLocaleString("en")} puzzles${done ? " (stopped early, all themes full)" : ""}.`);
  for (const t of THEMES) {
    const list = out.themes[t];
    console.log(`  ${t.padEnd(17)} ${list.length} puzzles, ratings ${list[0]?.rating}–${list[list.length - 1]?.rating}`);
  }
}
