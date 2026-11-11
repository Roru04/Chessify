import type { Color } from "chess.js";

export interface CourseLine {
  /** Letters/digits only (used in the page address) */
  id: string;
  name: string;
  description: string;
  /** PGN with comments, see pgnLesson.ts */
  pgn: string;
}

/** "Is this opening for you?" */
export interface OpeningProfile {
  /** One line for the overview card, e.g. "Classical · clear plans" */
  tagline: string;
  /** Which playing style it suits */
  style: string;
  /** What the opening is good at / strong against */
  strengths: string[];
  /** Weaknesses and what opponents try against it */
  watchOut: string[];
  /** How much theory you need */
  theory: "Low" | "Medium" | "High";
  /** Suggested level */
  level: string;
}

export interface OpeningCourse {
  /** Letters/digits only (used in the page address) */
  id: string;
  name: string;
  eco: string;
  /** The side this opening is mainly learned for */
  side: Color;
  moves: string;
  summary: string;
  ideas: string[];
  profile: OpeningProfile;
  lines: CourseLine[];
}
