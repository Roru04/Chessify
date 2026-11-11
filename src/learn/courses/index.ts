import { caroKann } from "./caroKann";
import { italian } from "./italian";
import { london } from "./london";
import { queensGambit } from "./queensGambit";
import { ruyLopez } from "./ruyLopez";
import { sicilian } from "./sicilian";
import type { OpeningCourse } from "./types";
import { parseLesson, type LessonStep, type ParsedLesson } from "../pgnLesson";

export const OPENING_COURSES: OpeningCourse[] = [italian, ruyLopez, queensGambit, london, sicilian, caroKann];

/** Shown as "coming soon" on the Learn page, per side. */
export const UPCOMING_OPENINGS: Record<"w" | "b", string[]> = {
  w: [],
  b: ["French Defence", "Queen's Gambit Declined (for Black)", "King's Indian Defence"],
};

export function findCourse(id: string): OpeningCourse | undefined {
  return OPENING_COURSES.find((c) => c.id === id);
}

export type { OpeningCourse, CourseLine } from "./types";

/**
 * Parses a line and fills moves without their own explanation from another
 * line of the same course that reaches the same position (e.g. 1.e4 e5
 * explained once in the main line).
 */
export function lessonForLine(course: OpeningCourse, lineId: string): ParsedLesson | null {
  const line = course.lines.find((l) => l.id === lineId);
  if (!line) return null;
  const lesson = parseLesson(line.pgn);
  const known = new Map<string, LessonStep>();
  for (const other of course.lines) {
    for (const s of parseLesson(other.pgn).steps) if (s.text && !known.has(s.fenAfter)) known.set(s.fenAfter, s);
  }
  return {
    ...lesson,
    steps: lesson.steps.map((s) => {
      if (s.text) return s;
      const k = known.get(s.fenAfter);
      return k ? { ...s, text: k.text, arrows: k.arrows, marks: k.marks } : s;
    }),
  };
}
