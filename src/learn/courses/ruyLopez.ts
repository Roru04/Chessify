import type { OpeningCourse } from "./types";

export const ruyLopez: OpeningCourse = {
  id: "ruylopez",
  name: "Ruy Lopez",
  eco: "C60–C99",
  side: "w",
  moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
  summary:
    "Also called the Spanish Game, the Ruy Lopez has been a favourite of world champions for over a century. Instead of aiming at f7 like in the Italian, the bishop puts pressure on the knight that defends e5. White plays for a long-lasting initiative in the centre.",
  ideas: [
    "The bishop on b5 attacks the c6 knight, the defender of e5.",
    "After …a6 White usually keeps the bishop with Ba4 and later Bb3 or Bc2.",
    "Castle quickly, put the rook on e1, prepare d4 with c3 and h3.",
    "If Black plays …Nf6 early (Berlin), White gets an endgame-like position with a better pawn structure.",
  ],
  profile: {
    tagline: "Strategic · long-term pressure · world-class classic",
    style:
      "For patient, positional players who like slow manoeuvring and a lasting initiative instead of quick tactics. The middlegames are rich and teach a lot about pawn structures.",
    strengths: [
      "One of the most respected answers to 1…e5: White keeps a small, long-lasting edge in many lines.",
      "Puts pressure on e5 for the whole game, which restricts Black's pieces.",
      "Teaches deep strategic ideas (the Spanish bishop, d4 timing, kingside manoeuvres) that help in every opening.",
    ],
    watchOut: [
      "Lots of theory: Black has many defences (Berlin, Marshall Gambit, Open, Closed, Schliemann…).",
      "Against the Berlin, the queens come off early, which can feel dull if you want to attack.",
      "Only for 1.e4 e5; you need separate answers to the Sicilian, French and Caro-Kann.",
    ],
    theory: "High",
    level: "Intermediate to advanced",
  },
  lines: [
    {
      id: "closed",
      name: "Main line: Closed Ruy Lopez",
      description: "The classical main line after 3…a6 4.Ba4 Nf6 5.O-O Be7. Learn this first.",
      pgn: `{The Ruy Lopez starts with 1.e4 e5 2.Nf3 Nc6 3.Bb5. You play White. This is the classical main line.}
1. e4 {White takes the centre and opens lines for the queen and bishop. [%csl Ge4]}
1... e5 {Black claims an equal share of the centre. [%csl Ge5]}
2. Nf3 {Develops and attacks e5. [%cal Gf3e5]}
2... Nc6 {Develops and defends e5. [%cal Gc6e5]}
3. Bb5 {The Ruy Lopez. The bishop attacks the knight that defends e5. It is not a real threat yet (Bxc6 and Nxe5 can be met by …Qd4), but the pressure lasts the whole game. [%cal Gb5c6,Rc6e5]}
3... a6 {The Morphy Defence: Black asks the bishop what it wants to do. [%cal Ga6b5]}
4. Ba4 {White keeps the bishop and the pin-like pressure on c6. [%cal Ga4c6]}
4... Nf6 {Develops and attacks e4. [%cal Gf6e4]}
5. O-O {White castles and does not bother to defend e4: if …Nxe4, Re1 wins the pawn back with a good game. [%csl Gg1]}
5... Be7 {The Closed Defence: Black calmly develops and prepares to castle.}
6. Re1 {Now e4 is defended, and White threatens Bxc6 followed by Nxe5. [%cal Ge1e4]}
6... b5 {Drives the bishop away so it no longer pressures c6. [%cal Gb5a4]}
7. Bb3 {The bishop moves to an excellent diagonal aiming at f7. [%cal Gb3f7]}
7... d6 {Defends e5 with a pawn and frees the light-squared bishop. [%cal Gd6e5]}
8. c3 {Prepares d4 and gives the bishop a retreat square on c2. [%cal Gd2d4]}
8... O-O {Black castles. Both kings are safe.}
9. h3 {Stops …Bg4 pinning the knight before White plays d4. [%cal Rc8g4]}
9... Na5 {The Chigorin plan: the knight attacks the bishop and frees the c-pawn to go to c5. [%cal Ga5b3]}
10. Bc2 {The bishop retreats but keeps aiming towards Black's kingside. [%cal Gc2h7]}
10... c5 {Black gains space on the queenside and fights for d4. [%cal Gc5d4]}
11. d4 {White finally strikes in the centre. This is the main position of the Closed Ruy Lopez. [%csl Gd4,Ge4]}`,
    },
    {
      id: "berlin",
      name: "Berlin Defence",
      description: "3…Nf6: the solid choice of top players. Leads to the famous Berlin endgame.",
      pgn: `{With 3…Nf6 Black ignores the bishop and attacks e4 at once. This is the Berlin Defence, made famous by Kramnik in his 2000 World Championship match against Kasparov.}
1. e4 e5 2. Nf3 Nc6 3. Bb5
3... Nf6 {The Berlin: Black attacks e4. [%cal Gf6e4]}
4. O-O {White castles and lets Black take on e4: the pawn can be won back. [%csl Gg1]}
4... Nxe4 {Black takes the pawn.}
5. d4 {Opens the centre while Black's king is still there. [%cal Gd4e5]}
5... Nd6 {The knight retreats and attacks the bishop on b5. [%cal Gd6b5]}
6. Bxc6 {White gives up the bishop to damage Black's pawns. [%cal Gb5c6]}
6... dxc6 {Taking towards the centre opens the d-file for Black's queen and frees the bishop on c8.}
7. dxe5 {White wins back the pawn and chases the knight. [%cal Ge5d6]}
7... Nf5 {The knight finds a good square.}
8. Qxd8+ {Queens come off. [%cal Gd1d8]}
8... Kxd8 {The Berlin endgame. Black has lost the right to castle and has doubled pawns, but the bishop pair and a very solid position. White's plan: use the kingside pawn majority. [%csl Gd8]}`,
    },
    {
      id: "exchange",
      name: "Exchange Variation",
      description: "4.Bxc6: White gives up the bishop for a better pawn structure and simple play.",
      pgn: `{In the Exchange Variation White takes on c6 at once. It is a simple, practical choice: Black gets the two bishops, White gets the better pawn structure.}
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
4. Bxc6 {The Exchange Variation. [%cal Gb5c6]}
4... dxc6 {Taking with the d-pawn opens lines for Black's queen and bishop. Black now has doubled c-pawns. [%csl Rc6,Rc7]}
5. O-O {White castles first. Taking on e5 right away doesn't win a pawn: after Nxe5, …Qd4 attacks the knight and e4 and wins the pawn back.}
5... f6 {The most solid way to defend e5. [%cal Gf6e5]}
6. d4 {White opens the centre. [%cal Gd4e5]}
6... exd4 {Black takes.}
7. Nxd4 {White's long-term plan: on the kingside White has four pawns against three, and that majority can create a passed pawn in the endgame. [%csl Ge4,Gf2,Gg2,Gh2]}
7... c5 {Chases the knight away. [%cal Gc5d4]}
8. Nb3 {The knight retreats and offers to trade queens.}
8... Qxd1 {Black trades queens.}
9. Rxd1 {An endgame-like position early on: White plays for the pawn majority on the kingside, Black for the bishop pair.}`,
    },
  ],
};
