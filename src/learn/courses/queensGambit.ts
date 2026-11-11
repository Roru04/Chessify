import type { OpeningCourse } from "./types";

export const queensGambit: OpeningCourse = {
  id: "queensgambit",
  name: "Queen's Gambit",
  eco: "D06–D69",
  side: "w",
  moves: "1.d4 d5 2.c4",
  summary:
    "White offers the c-pawn to pull Black's d-pawn away from the centre. It isn't a real sacrifice: White can almost always win the pawn back. The Queen's Gambit leads to rich, strategic positions and has been a top-level main line for over a hundred years.",
  ideas: [
    "c4 attacks d5: if Black takes, White gets the centre with e4.",
    "If Black takes on c4, don't chase the pawn: develop and win it back with Bxc4.",
    "Typical plan against …e6: Nc3, Bg5, e3, Bd3 and castle; later the minority attack with b4–b5.",
    "Beware the Elephant Trap: the knight on d5 is often defended indirectly.",
  ],
  profile: {
    tagline: "Positional · solid centre · strategic edge",
    style:
      "For positional players who like a strong centre, space and slow pressure more than early tactics. The plans (minority attack, central break e4) are clear and repeat from game to game.",
    strengths: [
      "Very sound: White keeps a small, safe advantage in almost all lines.",
      "Good against 1…d5 players: the gambit is not a real sacrifice, so there is little risk.",
      "Teaches pawn structures (isolated pawn, Carlsbad structure, minority attack) that appear in many other openings.",
    ],
    watchOut: [
      "Black has several sound defences (Declined, Accepted, Slav, Semi-Slav), each with its own ideas.",
      "Against 1…Nf6 players you need another plan (Nimzo-Indian, King's Indian, …).",
      "Traps like the Elephant Trap punish greedy captures on d5.",
    ],
    theory: "Medium",
    level: "Beginner to advanced",
  },
  lines: [
    {
      id: "qgd",
      name: "Queen's Gambit Declined: Exchange",
      description: "Black defends d5 with 2…e6. White exchanges on d5 and plays the minority attack.",
      pgn: `{You play White. Against the Queen's Gambit Declined, the Exchange Variation gives White clear and simple plans.}
1. d4 {White takes the centre with the queen's pawn. [%csl Gd4]}
1... d5 {Black does the same and stops e4. [%cal Gd5e4]}
2. c4 {The Queen's Gambit: White attacks d5 from the side. [%cal Gc4d5]}
2... e6 {The Queen's Gambit Declined: Black keeps the pawn on d5. Solid, but the bishop on c8 is blocked. [%cal Ge6d5][%csl Rc8]}
3. Nc3 {More pressure on d5. [%cal Gc3d5]}
3... Nf6 {Defends d5 again.}
4. cxd5 {The Exchange Variation: White fixes the pawn structure.}
4... exd5 {Black's bishop on c8 is free again, but the structure is now fixed.}
5. Bg5 {Pins the knight against the queen. [%cal Gg5f6]}
5... c6 {Supports d5 and gives the queen a way to a5 or b6.}
6. Qc2 {Stops …Bf5 for good: the queen controls f5. [%cal Gc2f5]}
6... Be7 {Breaks the pin.}
7. e3 {Opens the diagonal for the bishop on f1.}
7... Nbd7 {Black develops the last knight.}
8. Bd3 {The bishop aims at h7. [%cal Gd3h7]}
8... O-O {Black castles.}
9. Nf3 {Develops and controls e5. [%cal Gf3e5]}
9... Re8 {The rook takes the half-open e-file. [%cal Ge8e3]}
10. O-O {White's main plan now is the minority attack: push the b-pawn to b5 and create a weak pawn on c6. [%cal Gb2b4,Gb4b5][%csl Rc6]}`,
    },
    {
      id: "qga",
      name: "Queen's Gambit Accepted",
      description: "Black takes on c4. Develop, don't chase the pawn, and take it back with the bishop.",
      pgn: `{If Black accepts the gambit with 2…dxc4, don't panic and don't defend the pawn: develop, and it comes back by itself.}
1. d4 d5 2. c4
2... dxc4 {The Queen's Gambit Accepted. Black gives up the centre for the moment. [%csl Rc4]}
3. Nf3 {Develops and stops …e5. [%cal Rf3e5]}
3... Nf6 {Black develops too.}
4. e3 {Opens the diagonal for the bishop, which will take back on c4. [%cal Gf1c4]}
4... e6 {Black opens a diagonal for the dark-squared bishop.}
5. Bxc4 {The pawn is back, and White has a nice centre and a developed bishop. [%csl Gc4]}
5... c5 {Black attacks White's centre. [%cal Gc5d4]}
6. O-O {King safety first.}
6... a6 {Prepares …b5 to chase the bishop and gain space. [%cal Gb7b5]}
7. a4 {Stops …b5. [%cal Rb7b5]}
7... Nc6 {Develops, putting more pressure on d4. White's plan: Nc3, Qe2, Rd1 and push in the centre.}`,
    },
    {
      id: "slav",
      name: "Slav Defence",
      description: "Black defends d5 with 2…c6, keeping the c8 bishop free.",
      pgn: `{The Slav defends d5 with the c-pawn instead of the e-pawn, so the bishop on c8 can still come out.}
1. d4 d5 2. c4
2... c6 {The Slav Defence: d5 is defended and the c8 bishop is not blocked. [%cal Gc6d5,Gc8f5]}
3. Nf3 {Develops and prepares to defend c4.}
3... Nf6 {Black develops.}
4. Nc3 {More pressure on d5. [%cal Gc3d5]}
4... dxc4 {Now Black takes the pawn and hopes to keep it with …b5.}
5. a4 {Stops …b5, so the pawn can't be held. [%cal Rb7b5]}
5... Bf5 {The bishop gets out before …e6. That is the point of the Slav. [%cal Gf5b1]}
6. e3 {Opens the diagonal for the bishop, which will take on c4. [%cal Gf1c4]}
6... e6 {Black opens the diagonal for the dark-squared bishop.}
7. Bxc4 {White wins the pawn back.}
7... Bb4 {Pins the knight and develops.}
8. O-O {White castles.}
8... O-O {So does Black.}
9. Qe2 {The queen supports e4. [%cal Ge2e4]}
9... Nbd7 {A balanced classical position. White's plan: e4 to gain space in the centre. [%cal Ge3e4]}`,
    },
    {
      id: "elephant",
      name: "Trap: the Elephant Trap",
      description: "Why White must not grab the d5 pawn with the knight in the Queen's Gambit Declined.",
      pgn: `{A classic trap every Queen's Gambit player has to know. It looks as if the knight on d5 just wins a pawn, but it loses a piece.}
1. d4 d5 2. c4 e6 3. Nc3 Nf6
4. Bg5 {Pins the knight against the queen. [%cal Gg5f6]}
4... Nbd7 {This looks like it leaves d5 weak. [%csl Rd5]}
5. cxd5 {White exchanges in the centre.}
5... exd5 {Black recaptures. The pawn on d5 now looks undefended.}
6. Nxd5 {[%mistake] White grabs the pawn, thinking the knight on f6 is pinned. But it isn't really pinned. [%cal Gc3d5]}
6... Nxd5 {Black takes anyway and gives up the queen! [%cal Gf6d5]}
7. Bxd8 {White takes the queen…}
7... Bb4+ {…but this check wins it back: White must block with the queen. [%cal Gb4e1]}
8. Qd2 {White has to block the check with the queen.}
8... Bxd2+ {Black takes the queen.}
9. Kxd2 {White takes back.}
9... Kxd8 {Material count: Black has won a whole knight. Lesson: in this structure, the knight on d5 is only taken when the queen on d8 is really safe. [%csl Gd5]}`,
    },
  ],
};
