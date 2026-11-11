// Lessons are written as PGN with comments. Inside a comment, the standard
// commands [%cal Gf3e5,Rd8h4] (arrows) and [%csl Gf7] (highlighted squares)
// draw on the board, and [%mistake] marks a deliberately bad move.
// Colours: G green, R red, Y yellow, B blue.

import { Chess, type Color } from "chess.js";

export interface LessonArrow {
  from: string;
  to: string;
  color: string;
}
export interface LessonMark {
  square: string;
  color: string;
}

export interface LessonStep {
  san: string;
  /** Move in UCI/long algebraic form, e.g. "e2e4", "e1g1" */
  lan: string;
  from: string;
  to: string;
  color: Color;
  /** e.g. "3." or "3…" */
  moveLabel: string;
  fenBefore: string;
  fenAfter: string;
  text: string;
  arrows: LessonArrow[];
  marks: LessonMark[];
  mistake: boolean;
}

export interface ParsedLesson {
  startFen: string;
  intro: { text: string; arrows: LessonArrow[]; marks: LessonMark[] };
  steps: LessonStep[];
}

const COLORS: Record<string, string> = {
  G: "rgba(21, 128, 61, 0.85)",
  R: "rgba(200, 40, 30, 0.85)",
  Y: "rgba(214, 160, 0, 0.9)",
  B: "rgba(42, 98, 216, 0.85)",
};

function parseComment(raw: string | undefined) {
  const arrows: LessonArrow[] = [];
  const marks: LessonMark[] = [];
  let mistake = false;
  const text = (raw ?? "")
    .replace(/\[%cal ([^\]]+)\]/g, (_, list: string) => {
      for (const a of list.split(",")) {
        const m = /^([GRYB])([a-h][1-8])([a-h][1-8])$/.exec(a.trim());
        if (m) arrows.push({ color: COLORS[m[1]], from: m[2], to: m[3] });
      }
      return "";
    })
    .replace(/\[%csl ([^\]]+)\]/g, (_, list: string) => {
      for (const a of list.split(",")) {
        const m = /^([GRYB])([a-h][1-8])$/.exec(a.trim());
        if (m) marks.push({ color: COLORS[m[1]], square: m[2] });
      }
      return "";
    })
    .replace(/\[%mistake\]/g, () => {
      mistake = true;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { text, arrows, marks, mistake };
}

const cache = new Map<string, ParsedLesson>();

export function parseLesson(pgn: string): ParsedLesson {
  const hit = cache.get(pgn);
  if (hit) return hit;
  const g = new Chess();
  g.loadPgn(pgn);
  const comments = new Map(g.getComments().map((c) => [c.fen, c.comment]));
  const history = g.history({ verbose: true });
  const startFen = history[0]?.before ?? new Chess().fen();
  const intro = parseComment(comments.get(startFen));
  const steps: LessonStep[] = history.map((m) => {
    const c = parseComment(comments.get(m.after));
    const n = m.before.split(" ")[5];
    return {
      san: m.san,
      lan: m.lan,
      from: m.from,
      to: m.to,
      color: m.color,
      moveLabel: m.color === "w" ? `${n}.` : `${n}…`,
      fenBefore: m.before,
      fenAfter: m.after,
      text: c.text,
      arrows: c.arrows,
      marks: c.marks,
      mistake: c.mistake,
    };
  });
  const lesson = { startFen, intro: { text: intro.text, arrows: intro.arrows, marks: intro.marks }, steps };
  cache.set(pgn, lesson);
  return lesson;
}
