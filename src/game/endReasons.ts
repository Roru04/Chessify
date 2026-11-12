import type { EndReason } from "./useChessGame";

/** How a game ended, as shown to the user ("by checkmate", "Stalemate", …). */
export const REASONS: Record<EndReason, string> = {
  checkmate: "by checkmate",
  resignation: "by resignation",
  stalemate: "Stalemate",
  repetition: "Threefold repetition",
  "fifty-moves": "50-move rule",
  "insufficient-material": "Insufficient material",
  timeout: "on time",
  abandoned: "by abandonment",
  agreement: "Draw by agreement",
  "timeout-vs-insufficient": "Timeout vs. insufficient material",
};
