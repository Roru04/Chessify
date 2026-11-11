// Quality check for the Learn tab (development tool, not shipped).
//
// For every opening line and every tactics lesson:
//  - the PGN must load and contain only legal moves,
//  - every move is compared with Stockfish (depth 16): a normal move that
//    loses more than LOSS_LIMIT centipawns against the engine's best move is
//    reported, and a move marked [%mistake] that is NOT clearly worse is
//    reported too.
// Puzzles from the Lichess database are checked for legal moves.
//
// Usage: npm run check:lessons

import { Chess } from "chess.js";
import { createNodeEngine } from "../lib/nodeEngine";
import { OPENING_COURSES, lessonForLine } from "../../src/learn/courses";
import { TACTIC_THEMES, puzzlesFor } from "../../src/learn/middlegame/themes";
import { parseLesson, type ParsedLesson } from "../../src/learn/pgnLesson";
import { scoreToCp } from "../../src/engine/uci";

const DEPTH = 16;
const LOSS_LIMIT = 70;
const MISTAKE_MIN_LOSS = 100;

async function main() {
  const engine = await createNodeEngine();
  await engine.setOptions({ UCI_LimitStrength: false });

  /** Eval in centipawns from the side to move's point of view, mates clipped. */
  async function evalCp(fen: string): Promise<{ cp: number; best: string | null }> {
    const g = new Chess(fen);
    if (g.isCheckmate()) return { cp: -10000, best: null };
    if (g.isDraw()) return { cp: 0, best: null };
    const r = await engine.search(fen, { depth: DEPTH, multiPv: 1 });
    const s = r.lines[0]?.score;
    return { cp: s ? Math.max(-10000, Math.min(10000, scoreToCp(s))) : 0, best: r.bestMove };
  }

  let problems = 0;
  let checked = 0;

  async function checkLesson(title: string, load: () => ParsedLesson) {
    let lesson: ParsedLesson;
    try {
      lesson = load();
    } catch (e) {
      console.log(`✗ ${title}: PGN does not load (${(e as Error).message})`);
      problems++;
      return;
    }
    console.log(`\n${title} (${lesson.steps.length} moves)`);
    if (!lesson.intro.text) console.log("  ! no intro text");
    for (const step of lesson.steps) {
      checked++;
      const before = await evalCp(step.fenBefore);
      const after = await evalCp(step.fenAfter);
      const loss = before.cp + after.cp; // after.cp is from the opponent's view
      const bestSan = before.best
        ? new Chess(step.fenBefore).move({ from: before.best.slice(0, 2), to: before.best.slice(2, 4), promotion: before.best[4] })?.san
        : "?";
      const tag = `${step.moveLabel} ${step.san}`.padEnd(12);
      if (!step.text) console.log(`  ! ${tag} has no explanation`);
      if (step.mistake && loss < MISTAKE_MIN_LOSS) {
        console.log(`  ✗ ${tag} marked as mistake but only loses ${loss} cp (best ${bestSan})`);
        problems++;
      } else if (!step.mistake && loss > LOSS_LIMIT) {
        console.log(`  ✗ ${tag} loses ${loss} cp; engine prefers ${bestSan}`);
        problems++;
      } else {
        console.log(`  ✓ ${tag} loss ${String(Math.max(0, loss)).padStart(4)} cp${step.mistake ? " (marked mistake)" : ""}${bestSan !== step.san ? `  · engine: ${bestSan}` : ""}`);
      }
    }
  }

  for (const course of OPENING_COURSES) {
    for (const line of course.lines) {
      await checkLesson(`${course.name} – ${line.name}`, () => {
        parseLesson(line.pgn);
        return lessonForLine(course, line.id)!;
      });
    }
  }
  for (const theme of TACTIC_THEMES) {
    await checkLesson(`Tactics – ${theme.name}`, () => parseLesson(theme.lessonPgn));
    const list = puzzlesFor(theme);
    let bad = 0;
    for (const p of list) {
      try {
        const g = new Chess(p.fen);
        for (const m of p.moves) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
      } catch {
        bad++;
      }
    }
    console.log(`  puzzles: ${list.length}, ${bad} with illegal moves`);
    problems += bad;
  }

  console.log(`\n${checked} lesson moves checked, ${problems} problem(s).`);
  process.exit(problems ? 1 : 0);
}

void main();
