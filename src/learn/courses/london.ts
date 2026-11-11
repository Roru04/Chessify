import type { OpeningCourse } from "./types";

export const london: OpeningCourse = {
  id: "london",
  name: "London System",
  eco: "D02, A46, A48",
  side: "w",
  moves: "1.d4 and 2.Bf4",
  summary:
    "A system rather than an opening: White sets up the same solid structure against almost anything (d4, Bf4, e3, c3, Nf3, Nbd2, Bd3) and plays from there. It needs less theory than most openings and is very popular at club level.",
  ideas: [
    "Get the bishop out to f4 before playing e3, so it isn't locked in.",
    "The pawn triangle c3–d4–e3 makes the centre very solid.",
    "Typical plans: Ne5 with f4, or a kingside attack with Bd3 and Qc2/Qf3.",
    "Watch out for …Qb6 hitting b2 when the bishop has left c1.",
  ],
  profile: {
    tagline: "System · little theory · same set-up every game",
    style:
      "For players who want a reliable set-up without memorising lots of lines, and who are happy with a solid position and a slow build-up towards a kingside attack.",
    strengths: [
      "Very little theory: the same structure works against almost everything Black plays.",
      "Hard to lose quickly: the centre is solid and the king is safe.",
      "Good against tactical players who want sharp positions; the London takes the sharpness out of the opening.",
    ],
    watchOut: [
      "Objectively gives Black an easy, equal game; you have to win in the middlegame.",
      "Black can annoy you with …Qb6 (hitting b2) or …c5 with quick queenside play.",
      "Can become predictable: strong opponents prepare against it.",
    ],
    theory: "Low",
    level: "Beginner to intermediate",
  },
  lines: [
    {
      id: "main",
      name: "Main line against …d5 and …c5",
      description: "The standard London set-up against Black's most common reply.",
      pgn: `{You play White. The London System uses the same set-up against almost everything. Here it is against …d5, …Nf6, …c5 and …e6.}
1. d4 {White takes the centre. [%csl Gd4]}
1... d5 {Black does the same.}
2. Bf4 {The London: the bishop comes out before e3 blocks it. [%cal Gf4b8]}
2... Nf6 {Black develops.}
3. e3 {Builds the solid centre and opens the way for the other bishop. [%cal Gf1d3]}
3... c5 {Black attacks the centre. [%cal Gc5d4]}
4. c3 {The London triangle: c3, d4 and e3 hold the centre. [%csl Gc3,Gd4,Ge3]}
4... Nc6 {More pressure on d4.}
5. Nd2 {The knight goes to d2, not c3, because c3 belongs to the pawn. It also supports e4 later. [%cal Gd2e4]}
5... e6 {Black opens a diagonal for the dark-squared bishop.}
6. Ngf3 {The other knight develops to its natural square and eyes e5. [%cal Gf3e5]}
6... Bd6 {Black offers to trade bishops. [%cal Gd6f4]}
7. Bg3 {White keeps the bishop: after …Bxg3, hxg3 opens the h-file for the rook. [%cal Gh1h7]}
7... O-O {Black castles.}
8. Bd3 {The bishop aims at Black's king. [%cal Gd3h7]}
8... b6 {Black prepares …Bb7 to fight for e4. [%cal Gc8b7]}
9. Ne5 {The knight jumps to the strong e5 square, supported by d4. Typical plan: f4 and a kingside attack. [%csl Ge5]}`,
    },
    {
      id: "kingsindian",
      name: "Against a King's Indian set-up",
      description: "Black fianchettoes with …g6 and …Bg7. Keep the same structure.",
      pgn: `{Against …Nf6, …g6 and …Bg7 White still plays the London set-up, just with Nf3 and Be2 instead of Nd2 and Bd3.}
1. d4 {White takes the centre.}
1... Nf6 {Black develops and keeps options open.}
2. Bf4 {The London bishop comes out first.}
2... g6 {Black prepares to put the bishop on g7. [%cal Gf8g7]}
3. e3 {The solid centre again.}
3... Bg7 {Black's bishop aims at the long diagonal. [%cal Gg7b2]}
4. Nf3 {Develops and controls e5. [%cal Gf3e5]}
4... O-O {Black castles quickly.}
5. Be2 {Modest but solid: the bishop protects the kingside.}
5... d6 {Black prepares …e5.}
6. h3 {Gives the bishop on f4 a retreat on h2 if Black plays …Nh5. [%cal Gf4h2]}
6... c5 {Black attacks d4.}
7. c3 {The London triangle holds. [%csl Gc3,Gd4,Ge3]}
7... Nc6 {Pressure on d4. [%cal Gc6d4]}
8. O-O {White castles. Plans: Nbd2, a4 and play in the centre with Qc2 and e4. [%cal Ge3e4]}`,
    },
    {
      id: "qb6",
      name: "Watch out: the early …Qb6",
      description: "After Bf4 the b2 pawn is weak. How to answer …Qb6.",
      pgn: `{Once the bishop has left c1, the b2 pawn can only be defended by other pieces. Black often tries …Qb6 to attack it.}
1. d4 d5 2. Bf4 {The London bishop. Note that b2 has lost its defender on c1. [%csl Rb2]}
2... c5 {Black attacks the centre straight away. [%cal Gc5d4]}
3. e3 {Supports d4 and opens the diagonal for the other bishop.}
3... Nc6 {More pressure on d4. [%cal Gc6d4]}
4. c3 {The London triangle holds the centre. [%csl Gc3,Gd4,Ge3]}
4... Qb6 {Black attacks b2, which the bishop on c1 used to defend. [%cal Gb6b2][%csl Rb2]}
5. Qb3 {The best answer: White offers a queen trade, and b2 is defended. [%cal Gb3b6]}
5... c4 {Black avoids the trade by chasing the queen. [%cal Gc4b3]}
6. Qc2 {The queen retreats, still defends b2 and supports a later e4. [%cal Gc2b2,Gc2e4]}
6... Nf6 {Black develops calmly. (6…e5!? is a sharp alternative that leads to wild tactics.)}
7. Nd2 {White prepares e4: queen and knight both support it. When the centre opens, Black's pawn on c4 can become a target. [%cal Ge3e4,Gd2e4]}`,
    },
  ],
};
