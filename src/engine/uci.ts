// Parsing helpers for the UCI protocol spoken by Stockfish.

export type Score = { cp: number; mate?: undefined } | { mate: number; cp?: undefined };

export interface InfoLine {
  depth: number;
  multipv: number;
  score: Score;
  /** Principal variation in UCI notation (e.g. "e2e4"). */
  pv: string[];
}

/** Parses an `info ... pv ...` line. Returns null for info lines without a scored PV. */
export function parseInfo(line: string): InfoLine | null {
  if (!line.startsWith("info ") || !line.includes(" pv ")) return null;
  const tokens = line.split(/\s+/);
  let depth = 0;
  let multipv = 1;
  let score: Score | null = null;
  let pv: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "depth") depth = Number(tokens[++i]);
    else if (t === "multipv") multipv = Number(tokens[++i]);
    else if (t === "score") {
      const kind = tokens[++i];
      const value = Number(tokens[++i]);
      score = kind === "mate" ? { mate: value } : { cp: value };
    } else if (t === "pv") {
      pv = tokens.slice(i + 1);
      break;
    }
  }
  if (!score || pv.length === 0) return null;
  return { depth, multipv, score, pv };
}

/** Parses `bestmove e2e4 [ponder ...]`. Returns the move, or null for "(none)". */
export function parseBestMove(line: string): string | null | undefined {
  const m = /^bestmove (\S+)/.exec(line);
  if (!m) return undefined;
  return m[1] === "(none)" ? null : m[1];
}

/** Reads the min/max of a spin option from the `uci` handshake output. */
export function parseSpinOption(line: string, name: string): { min: number; max: number } | null {
  const re = new RegExp(`^option name ${name} type spin .*min (-?\\d+) max (-?\\d+)`);
  const m = re.exec(line);
  return m ? { min: Number(m[1]), max: Number(m[2]) } : null;
}

/** Converts a score to a single comparable number (mates become very large). */
export function scoreToCp(score: Score): number {
  if (score.mate !== undefined) {
    const sign = score.mate > 0 ? 1 : -1;
    return sign * (100000 - Math.abs(score.mate) * 100);
  }
  return score.cp;
}

/** Splits a UCI move like "e7e8q" into its parts. */
export function splitUciMove(move: string): { from: string; to: string; promotion?: string } {
  return { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] };
}
