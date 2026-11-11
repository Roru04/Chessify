import type { OpeningCourse } from "./types";

export const sicilian: OpeningCourse = {
  id: "sicilian",
  name: "Sicilian Defence",
  eco: "B20–B99",
  side: "b",
  moves: "1.e4 c5",
  summary:
    "The most popular answer to 1.e4. Instead of copying White with …e5, Black fights for the d4 square from the side. The position becomes unbalanced: White usually attacks on the kingside, Black counterattacks on the queenside along the half-open c-file.",
  ideas: [
    "…c5 controls d4 and later trades the c-pawn for White's d-pawn: Black gets more central pawns.",
    "The half-open c-file is Black's highway for the rook and queen.",
    "In the Najdorf, …a6 prepares …e5 or …b5 and keeps White's pieces off b5.",
    "Know how to meet White's side lines (2.c3, 2.Nc3, 3.Bb5+); club players use them a lot.",
  ],
  profile: {
    tagline: "Fighting · unbalanced · play for a win as Black",
    style:
      "For ambitious, tactical players who want to play for a win with Black. The positions are sharp and unbalanced; you need to be comfortable with attacks on both sides and some risk.",
    strengths: [
      "The most successful answer to 1.e4 at top level: Black gets real winning chances instead of just equality.",
      "Unbalanced positions make it hard for White to play safe and steer the game towards a draw.",
      "The extra central pawn after …cxd4 gives Black long-term chances in the endgame too.",
    ],
    watchOut: [
      "The Open Sicilian has a huge amount of theory, and White often attacks fast (English Attack, Yugoslav, Grand Prix).",
      "You must also know answers to the side lines: 2.c3, 2.Nc3, 3.Bb5+, the Smith-Morra Gambit.",
      "A single slow move can lose: precise play is required.",
    ],
    theory: "High",
    level: "Intermediate to advanced",
  },
  lines: [
    {
      id: "najdorf",
      name: "Open Sicilian: Najdorf",
      description: "The main line 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6, here against the English Attack.",
      pgn: `{You play Black. After 2.Nf3 and 3.d4 the centre opens: this is the Open Sicilian, and the Najdorf is its most famous system.}
1. e4 {White takes the centre.}
1... c5 {The Sicilian Defence: Black fights for d4 from the side instead of mirroring with …e5. [%cal Gc5d4]}
2. Nf3 {White develops and prepares d4.}
2... d6 {Controls e5 and prepares …Nf6. [%cal Gd6e5]}
3. d4 {White opens the centre.}
3... cxd4 {Black trades the c-pawn for White's d-pawn. Black now has two central pawns (d and e) against one. [%csl Gd6,Ge7,Ge4]}
4. Nxd4 {White recaptures with the knight.}
4... Nf6 {Develops with tempo: the knight attacks e4. [%cal Gf6e4]}
5. Nc3 {White defends e4. [%cal Gc3e4]}
5... a6 {The Najdorf. A small move with big ideas: it keeps White's knights and bishop off b5 and prepares …e5 and …b5. [%cal Ra6b5]}
6. Be3 {White prepares the English Attack: f3, Qd2 and castling queenside, followed by a kingside pawn storm.}
6... e5 {Black chases the knight and claims space. The d5 square becomes a little weak, but Black's pieces get active. [%cal Ge5d4][%csl Rd5]}
7. Nb3 {The knight retreats.}
7... Be6 {The bishop watches d5, the key square in this structure. [%cal Ge6d5]}
8. f3 {Stops …Ng4 hitting the bishop on e3 and prepares g4. [%cal Rf6g4]}
8... Be7 {Develops and prepares to castle.}
9. Qd2 {Connects White's plan: castle long and push the kingside pawns.}
9... O-O {Black castles.}
10. O-O-O {Opposite-side castling: the race begins. White attacks Black's king with g4–g5, Black attacks White's king with …b5–b4.}
10... Nbd7 {Develops the last minor piece and prepares …b5. [%cal Gb7b5]}`,
    },
    {
      id: "alapin",
      name: "Against 2.c3 (Alapin)",
      description: "White prepares d4 with c3. Strike back with 2…d5.",
      pgn: `{The Alapin, 2.c3, is a popular way to avoid the Open Sicilian: White wants to recapture on d4 with a pawn. Black answers in the centre at once.}
1. e4 c5
2. c3 {Prepares d4: after …cxd4 White will recapture with the c-pawn and keep two pawns in the centre. [%cal Gc3d4]}
2... d5 {Strike in the centre before White plays d4. [%cal Gd5e4]}
3. exd5 {White takes.}
3... Qxd5 {The queen recaptures. It can't be chased with Nc3 because c3 is taken by a pawn. [%csl Rc3]}
4. d4 {White builds the centre and attacks c5. [%cal Gd4c5]}
4... Nf6 {Develops and keeps the queen protected.}
5. Nf3 {White develops and defends d4.}
5... Bg4 {The bishop pins the knight and adds pressure on d4. [%cal Gg4f3]}
6. Be2 {Breaks the pin.}
6... e6 {Opens the diagonal for the dark-squared bishop.}
7. O-O {White castles.}
7... Nc6 {All of Black's pieces aim at d4. [%cal Gc6d4]}
8. h3 {Asks the bishop to decide.}
8... Bh5 {Keeps the pin.}
9. Be3 {Defends d4 once more.}
9... cxd4 {Black releases the tension.}
10. cxd4 {White recaptures with the pawn and gets an isolated d-pawn.}
10... Be7 {White has an isolated d-pawn: a strength now, a target later. Black blockades it and aims to attack it. [%csl Rd4]}`,
    },
    {
      id: "closed",
      name: "Against 2.Nc3 (Closed Sicilian)",
      description: "White keeps the centre closed and develops with g3 and Bg2. Mirror the set-up.",
      pgn: `{In the Closed Sicilian White does not play d4 and builds up slowly, often followed by a kingside attack with f4–f5.}
1. e4 c5
2. Nc3 {White keeps d4 for later and develops.}
2... Nc6 {Natural development, controlling d4. [%cal Gc6d4]}
3. g3 {White prepares to put the bishop on g2.}
3... g6 {Black does the same: both bishops will go to the long diagonals.}
4. Bg2 {The bishop aims along the long diagonal. [%cal Gg2b7]}
4... Bg7 {Black's bishop presses on the long diagonal towards b2 and supports d4. [%cal Gg7b2]}
5. d3 {Supports e4.}
5... d6 {Black supports the centre in the same way.}
6. f4 {White's typical plan: gain space on the kingside, later f5. [%cal Gf4f5]}
6... e6 {Stops f5 for now and prepares …Nge7. [%cal Re6f5]}
7. Nf3 {Develops and prepares to castle.}
7... Nge7 {The knight goes to e7 so the f-pawn and the g7 bishop are not blocked.}
8. O-O {White castles.}
8... O-O {Black castles too. Black's plan: …Rb8 and …b5 on the queenside; White's: attack on the kingside.}`,
    },
    {
      id: "bb5check",
      name: "Against 3.Bb5+ (Moscow)",
      description: "2.Nf3 d6 3.Bb5+: trade bishops and play for the centre.",
      pgn: `{After 2.Nf3 d6, many club players avoid the Open Sicilian with 3.Bb5+. Black simply blocks and trades bishops.}
1. e4 c5 2. Nf3 d6
3. Bb5+ {Check. White wants to trade the bishop and develop quickly. [%cal Gb5e8]}
3... Bd7 {Block with the bishop and offer a trade. [%cal Gd7b5]}
4. Bxd7+ {White trades the bishops.}
4... Qxd7 {The queen recaptures and stays flexible.}
5. O-O {White castles.}
5... Nc6 {Develops and controls d4. [%cal Gc6d4]}
6. c3 {White prepares d4.}
6... Nf6 {Develops and attacks e4. [%cal Gf6e4]}
7. Re1 {The rook supports e4 and a later e5. [%cal Ge1e4]}
7... e6 {Opens the diagonal for the bishop and supports …d5. [%cal Ge6d5]}
8. d4 {White builds the centre.}
8... cxd4 {Black trades the c-pawn for White's d-pawn.}
9. cxd4 {White recaptures and has two central pawns.}
9... d5 {Black strikes in the centre and challenges e4. [%cal Gd5e4]}
10. e5 {White closes the centre and attacks the knight. [%cal Ge5f6]}
10... Ne4 {The knight jumps to a strong outpost. Black has a comfortable position. [%csl Ge4]}`,
    },
  ],
};
