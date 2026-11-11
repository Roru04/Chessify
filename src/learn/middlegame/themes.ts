// Middlegame tactics themes. Each theme has a short lesson (a real puzzle
// position explained move by move, PGN format as in pgnLesson.ts) and a set
// of puzzles from the Lichess puzzle database (CC0), see puzzles.json and
// scripts/puzzles/extract-puzzles.mjs.

import puzzleData from "./puzzles.json";

export interface Puzzle {
  id: string;
  /** Position before the opponent's move */
  fen: string;
  /** UCI moves: [opponent's move, your move, reply, your move, …] */
  moves: string[];
  rating: number;
  themes: string[];
}

export interface TacticTheme {
  /** Letters only (used in the page address) */
  id: string;
  /** Tag in the Lichess database */
  tag: string;
  name: string;
  summary: string;
  lookFor: string[];
  /** Lichess id of the puzzle used as the lesson example (left out of the puzzle set) */
  exampleId: string;
  lessonPgn: string;
}

export const PUZZLE_SOURCE = (puzzleData as { source: string }).source;

export const TACTIC_THEMES: TacticTheme[] = [
  {
    id: "hanging",
    tag: "hangingPiece",
    name: "Hanging pieces",
    summary: "A hanging piece is attacked and not defended. Taking it wins material for free, and most games at club level are decided this way.",
    lookFor: [
      "Before every move ask: what did my opponent's last move attack, and what did it leave undefended?",
      "Count attackers and defenders of every piece that is attacked.",
      "When one of your pieces is attacked, look for a square where it is safe and takes something at the same time.",
    ],
    exampleId: "1Nar1",
    lessonPgn: `[SetUp "1"]
[FEN "3r2k1/p4ppp/B7/4P3/3r4/3b4/PP4PP/3RR1K1 w - - 2 26"]

{A hanging piece is attacked and not defended. Capturing it wins material for free. You play Black. Watch White's move and look for something undefended.}
26. Re3 {[%mistake] White attacks the bishop on d3, which is now attacked by both rooks. But White forgot the own bishop on a6: nothing defends it. [%cal Ge3d3,Gd1d3][%csl Ra6]}
26... Bxa6 {Black's attacked bishop escapes and takes the free bishop at the same time. [%cal Gd3a6]}
27. Rxd4 {White trades a pair of rooks.}
27... Rxd4 {Black is a whole piece up. Lesson: when your piece is attacked, look for a safe square where it also captures something.}`,
  },
  {
    id: "fork",
    tag: "fork",
    name: "Forks",
    summary: "A fork is one piece attacking two or more enemy pieces at once. The opponent can only save one. Knights are the classic forkers, because their attack can't be blocked.",
    lookFor: [
      "Look for two enemy pieces (especially king, queen and rooks) that one of your pieces could attack from the same square.",
      "Checks make the best forks: the opponent must answer the check, and you take the other piece.",
      "Pawns and queens fork too, not only knights.",
    ],
    exampleId: "0CaO8",
    lessonPgn: `[SetUp "1"]
[FEN "8/2p3k1/6p1/1K6/5N1p/5P1P/3r2P1/8 b - - 2 53"]

{A fork: one piece attacks two enemy pieces at the same time. You play White. Watch where Black's rook goes.}
53... Rd4 {[%mistake] The rook attacks the knight on f4. But now the rook on d4 and the king on g7 are both a knight's jump away from e6. [%cal Gd4f4][%csl Rd4,Rg7,Ge6]}
54. Ne6+ {The fork: the knight gives check and attacks the rook at the same time. [%cal Ge6g7,Ge6d4]}
54... Kf6 {Black has to answer the check first.}
55. Nxd4 {…and White wins the rook. Look for forks whenever two valuable enemy pieces are a knight's jump from the same square.}`,
  },
  {
    id: "pin",
    tag: "pin",
    name: "Pins",
    summary: "A pinned piece can't move (or shouldn't) because a more valuable piece stands behind it on the same line. Against the king the pin is absolute: the pinned piece isn't allowed to move off the line at all.",
    lookFor: [
      "Look for an enemy piece standing on a line in front of its king or queen.",
      "Attack a pinned piece again: it can't run away.",
      "Bishops, rooks and queens pin; knights and kings can't.",
    ],
    exampleId: "5V3cJ",
    lessonPgn: `[SetUp "1"]
[FEN "3r2k1/p4ppp/8/8/5Rb1/1P2r3/P5PP/4Q2K w - - 0 29"]

{A pin: a piece can't move away because a more valuable piece stands behind it. You play Black. Watch where White's queen goes.}
29. Qg1 {[%mistake] The queen steps next to the king. Now queen and king stand on the same line, the first rank. [%csl Rg1,Rh1]}
29... Rd1 {Black's rook attacks the queen along the first rank. The queen is pinned: if it leaves the first rank, the king on h1 is in check. [%cal Gd1g1][%csl Rg1]}
30. Qxd1 {The only way out is to take the rook, giving the queen for a rook.}
30... Bxd1 {Black wins the queen for a rook. Pins against the king are the strongest: the pinned piece is not allowed to move off the line.}`,
  },
  {
    id: "skewer",
    tag: "skewer",
    name: "Skewers",
    summary: "A skewer is a pin in reverse: you attack a valuable piece, it has to move away, and the piece behind it on the same line is lost. Checks make the best skewers.",
    lookFor: [
      "Look for the enemy king and another piece on the same rank, file or diagonal.",
      "Give check along that line: the king moves, and you take what was behind it.",
      "Long-range pieces (queen, rook, bishop) skewer.",
    ],
    exampleId: "0YuLu",
    lessonPgn: `[SetUp "1"]
[FEN "8/8/1q2kp2/3p3P/6Q1/6P1/r4PK1/8 b - - 2 47"]

{A skewer: attack a valuable piece so that it moves, then take the piece behind it. You play White.}
47... f5 {[%mistake] Black attacks the queen, but the pawn leaves f6. Now the king on e6 and the queen on b6 stand on the same open rank. [%cal Gf5g4][%csl Re6,Rb6]}
48. Qg6+ {Check along the sixth rank. [%cal Gg6e6]}
48... Ke7 {The king has to move out of the check…}
49. Qxb6 {…and the queen behind it is lost. [%cal Gg6b6]}`,
  },
  {
    id: "discovered",
    tag: "discoveredAttack",
    name: "Discovered attacks",
    summary: "One piece moves out of the way and uncovers an attack by the piece behind it. Now two pieces attack at once. It is strongest when the moving piece gives check.",
    lookFor: [
      "Look for your own piece standing between your queen, rook or bishop and an enemy target.",
      "Move that piece with a threat or a check: the opponent can't deal with both attacks.",
      "Also watch out when your opponent has such a battery aimed at you.",
    ],
    exampleId: "09qMn",
    lessonPgn: `[SetUp "1"]
[FEN "r4rk1/p2b1p2/1qp2n1p/3p2p1/3N4/3B2PP/PPP3P1/R2Q1R1K b - - 2 17"]

{A discovered attack: one piece moves away and uncovers an attack by the piece behind it. You play White.}
17... Qxd4 {[%mistake] Black grabs the knight. But the queen on d4 now stands on the d-file in front of White's queen, with only White's bishop on d3 in between. [%cal Gd1d4][%csl Rd4]}
18. Bh7+ {The bishop moves away with check and uncovers the queen's attack on d4. [%cal Gd3h7,Gd1d4]}
18... Kxh7 {Black has to answer the check, here by taking the bishop…}
19. Qxd4 {…and White takes the queen. White gave a knight and a bishop for the queen.}`,
  },
  {
    id: "backrank",
    tag: "backRankMate",
    name: "Back-rank mates",
    summary: "A rook or queen gives check on the last rank, and the king can't escape because its own pawns block the way. A king behind three unmoved pawns is always in danger.",
    lookFor: [
      "Check the enemy back rank: is the king boxed in by its own pawns, and who defends the rank?",
      "Remove or distract the defender of the back rank, even with a sacrifice.",
      "Protect yourself with an escape square (luft), e.g. h3 or g3.",
    ],
    exampleId: "1qnTq",
    lessonPgn: `[SetUp "1"]
[FEN "r5k1/ppp2ppp/8/4rbq1/Q7/B1P2K2/P1P3PP/R3R3 b - - 0 17"]

{A back-rank mate: the king can't escape a check on the last rank because its own pawns block it. You play White.}
17... Rae8 {[%mistake] Black doubles rooks on the e-file. But now the back rank is defended only by the rook on e8, and the king has no escape square. [%csl Rf7,Rg7,Rh7]}
18. Qxe8+ {A queen sacrifice! The queen takes the rook with check. [%cal Ga4e8]}
18... Rxe8 {Black has to take back…}
19. Rxe8# {…and the other rook mates on the back rank. The pawns on f7, g7 and h7 take away all escape squares. In your own games, a move like …h6 or …g6 gives the king air. [%csl Rg8]}`,
  },
];

const ALL = (puzzleData as { themes: Record<string, Puzzle[]> }).themes;

/** Puzzles for a theme, easiest first, without the lesson example. */
export function puzzlesFor(theme: TacticTheme): Puzzle[] {
  return (ALL[theme.tag] ?? []).filter((p) => p.id !== theme.exampleId);
}

export function findTheme(id: string): TacticTheme | undefined {
  return TACTIC_THEMES.find((t) => t.id === id);
}
