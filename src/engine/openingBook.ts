// Small opening book with standard lines that club players actually play.
// Even beginners usually know these, so the computer follows them at every
// level (lower levels leave the book earlier). Weights ≈ popularity.

import { Chess } from "chess.js";

const LINES: [number, string][] = [
  // 1.e4 e5
  [14, "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O"],
  [8, "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6"],
  [10, "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6"],
  [4, "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 Re1 Nd6 Nxe5 Be7"],
  [6, "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7"],
  [5, "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6"],
  [3, "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Be7"],
  [3, "e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7 Bc4 Be7 O-O O-O"],
  [3, "e4 e5 Nc3 Nf6 Bc4 Nc6 d3 Bc5 Nf3 d6"],
  // Sicilian
  [8, "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5"],
  [6, "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6"],
  [4, "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7"],
  [4, "e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6"],
  [3, "e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6"],
  // French, Caro-Kann, Scandinavian, Pirc
  [5, "e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6"],
  [4, "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6"],
  [5, "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6"],
  [4, "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5"],
  [4, "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 Bf5"],
  [3, "e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O"],
  // 1.d4
  [8, "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6"],
  [4, "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5"],
  [6, "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5"],
  [8, "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6"],
  [4, "d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3 Nc6"],
  [5, "d4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6"],
  [6, "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5"],
  [5, "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5"],
  [3, "d4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2 Be7"],
  [3, "d4 Nf6 c4 e6 Nf3 d5 Nc3 Be7 Bf4 O-O"],
  [2, "d4 f5 g3 Nf6 Bg2 e6 Nf3 Be7 O-O O-O"],
  // Flank openings
  [3, "c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5 Bg2 Nb6"],
  [2, "c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 Nf3 e6"],
  [3, "Nf3 d5 g3 Nf6 Bg2 e6 O-O Be7 d3 O-O"],
  [2, "Nf3 Nf6 d4 d5 c4 e6 Nc3 Be7"],
];

/** Position key without move counters, so transpositions match. */
const key = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

let book: Map<string, Map<string, number>> | null = null;

function build() {
  const map = new Map<string, Map<string, number>>();
  for (const [weight, line] of LINES) {
    const g = new Chess();
    for (const san of line.split(" ")) {
      const k = key(g.fen());
      let m;
      try {
        m = g.move(san);
      } catch {
        break; // a typo in a line only cuts that line short
      }
      const moves = map.get(k) ?? new Map<string, number>();
      moves.set(m.lan, (moves.get(m.lan) ?? 0) + weight);
      map.set(k, moves);
    }
  }
  return map;
}

/** A book move (UCI) for this position, chosen by popularity, or null. */
export function bookMove(fen: string): string | null {
  book ??= build();
  const moves = book.get(key(fen));
  if (!moves) return null;
  const entries = [...moves.entries()];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [uci, w] of entries) {
    r -= w;
    if (r <= 0) return uci;
  }
  return entries[entries.length - 1][0];
}

/** Is this move (UCI) one of the book's moves in this position? */
export function isBookMove(fen: string, uci: string): boolean {
  book ??= build();
  return book.get(key(fen))?.has(uci) ?? false;
}

/** Number of half-moves played so far, from a FEN. */
export function pliesFromFen(fen: string): number {
  const parts = fen.split(" ");
  return (Number(parts[5]) - 1) * 2 + (parts[1] === "b" ? 1 : 0);
}

/** Exposed for tests: all lines and whether they are legal. */
export function validateBook(): string[] {
  const bad: string[] = [];
  for (const [, line] of LINES) {
    const g = new Chess();
    for (const san of line.split(" ")) {
      try {
        g.move(san);
      } catch {
        bad.push(`${line} → ${san}`);
        break;
      }
    }
  }
  return bad;
}
