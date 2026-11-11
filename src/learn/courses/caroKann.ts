import type { OpeningCourse } from "./types";

export const caroKann: OpeningCourse = {
  id: "carokann",
  name: "Caro-Kann Defence",
  eco: "B10–B19",
  side: "b",
  moves: "1.e4 c6 2.d4 d5",
  summary:
    "A rock-solid answer to 1.e4. Black prepares …d5 with the c-pawn, so after an exchange on d5 or e4 Black never has to accept a weak centre. Unlike in the French Defence, the light-squared bishop usually gets out before …e6 locks it in.",
  ideas: [
    "…c6 supports …d5: Black challenges e4 without giving up the centre.",
    "Get the light-squared bishop out (…Bf5 or …Bg4) before playing …e6.",
    "Typical pawn breaks later: …c5 or …e5 to free the position.",
    "Against the Advance Variation: …Bf5, …e6 and …c5 to attack White's pawn chain at its base.",
  ],
  profile: {
    tagline: "Solid · healthy pawns · counterattack later",
    style:
      "For solid, positional players who prefer a safe position and good endgames to an early fight. You accept a slightly passive start in return for a structure without weaknesses.",
    strengths: [
      "Very sound pawn structure: Black rarely gets weak pawns, so endgames are often good for Black.",
      "Good against attacking 1.e4 players: it is hard for White to get a quick attack going.",
      "Less theory than the Sicilian, and the plans are similar in most lines.",
    ],
    watchOut: [
      "Can become passive: if Black never plays …c5 or …e5, White keeps a space advantage.",
      "The Advance Variation (3.e5) gives White a lot of space; you need to know the …c5 plan.",
      "Winning against solid opponents can be hard, because the positions are often balanced.",
    ],
    theory: "Medium",
    level: "Beginner to advanced",
  },
  lines: [
    {
      id: "classical",
      name: "Main line: Classical (4…Bf5)",
      description: "3.Nc3 dxe4 4.Nxe4 Bf5. The bishop comes out before …e6. Learn this first.",
      pgn: `{You play Black. The Caro-Kann starts with 1.e4 c6 2.d4 d5. This is the Classical main line.}
1. e4 {White takes the centre.}
1... c6 {The Caro-Kann: prepares …d5 so that d5 is supported. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {Black challenges e4 at once. [%cal Gd5e4]}
3. Nc3 {White defends e4 with the knight. [%cal Gc3e4]}
3... dxe4 {Black takes. White's e-pawn is gone and Black has no weaknesses.}
4. Nxe4 {White recaptures.}
4... Bf5 {The Classical Variation: the bishop comes out before …e6 blocks it, and attacks the knight. [%cal Gf5e4]}
5. Ng3 {The knight retreats and attacks the bishop. [%cal Gg3f5]}
5... Bg6 {The bishop stays on the good diagonal.}
6. h4 {White threatens h5, trapping the bishop. [%cal Gh4h5]}
6... h6 {Gives the bishop a retreat square on h7. [%cal Gg6h7]}
7. Nf3 {Develops.}
7... Nd7 {Stops Ne5, which would attack the bishop. [%cal Rf3e5]}
8. h5 {Gains space and chases the bishop.}
8... Bh7 {The bishop keeps its diagonal. [%cal Gh7b1]}
9. Bd3 {White offers to trade bishops.}
9... Bxd3 {Black trades the good bishop for White's good bishop.}
10. Qxd3 {White recaptures.}
10... e6 {Now that the bishop is outside, …e6 is no problem. Black has a very solid position. [%csl Gc6,Gd5,Ge6]}
11. Bd2 {White prepares to castle queenside.}
11... Ngf6 {Black develops and prepares to castle.}
12. O-O-O {White castles long.}
12... Be7 {Black will castle kingside or queenside. The structure is sound, and Black's plan is …c5 or …Qc7 and …O-O-O. [%cal Gc6c5]}`,
    },
    {
      id: "advance",
      name: "Advance Variation (3.e5)",
      description: "White gains space with 3.e5. Develop the bishop to f5, then attack the chain with …c5.",
      pgn: `{With 3.e5 White grabs space instead of exchanging. It is the most popular line at club level.}
1. e4 c6 2. d4 d5
3. e5 {The Advance Variation: White locks the centre and gains space on the kingside. [%csl Ge5]}
3... Bf5 {The bishop comes out before …e6. This is the big difference to the French Defence. [%cal Gf5b1]}
4. Nf3 {White develops calmly (the Short System).}
4... e6 {Now the bishop is outside, so Black can play …e6 and prepare …c5.}
5. Be2 {White prepares to castle.}
5... c5 {The key move: Black attacks the base of White's pawn chain. [%cal Gc5d4]}
6. Be3 {White defends d4. [%cal Ge3d4]}
6... cxd4 {Black takes.}
7. Nxd4 {White recaptures with the knight.}
7... Ne7 {The knight heads for c6 or g6 and doesn't block the f-pawn. [%cal Ge7c6]}
8. c4 {White opens lines on the queenside.}
8... Nbc6 {Black develops and challenges the knight on d4. Black has a good game with play against e5 and d4. [%cal Gc6d4]}`,
    },
    {
      id: "exchange",
      name: "Exchange Variation (3.exd5)",
      description: "White exchanges on d5. A calm, symmetrical structure with clear plans.",
      pgn: `{With 3.exd5 White makes the position symmetrical. Black is very comfortable if the pieces are developed actively.}
1. e4 c6 2. d4 d5
3. exd5 {The Exchange Variation.}
3... cxd5 {Black recaptures with the c-pawn. The structure is symmetrical.}
4. Bd3 {The bishop aims at Black's kingside. [%cal Gd3h7]}
4... Nc6 {Develops and attacks d4. [%cal Gc6d4]}
5. c3 {Defends d4. [%cal Gc3d4]}
5... Nf6 {Develops.}
6. Bf4 {White develops the other bishop actively.}
6... Bg4 {Black's bishop comes out actively. If White plays Nf3, the knight will be pinned against the queen. [%cal Gg4d1]}
7. Qb3 {White attacks b7. [%cal Gb3b7]}
7... Qd7 {Defends b7 and connects the pieces. [%cal Gd7b7]}
8. Nd2 {White develops.}
8... e6 {Opens the diagonal for the dark-squared bishop.}
9. Ngf3 {White develops the last knight.}
9... Bd6 {Black offers to trade the dark-squared bishops. [%cal Gd6f4]}
10. Bxd6 {White trades.}
10... Qxd6 {Black recaptures. Both sides are developed. Black's typical plan: the minority attack with …b5–b4. [%cal Gb7b5]}`,
    },
    {
      id: "twoknights",
      name: "Against 2.Nc3 / 2.Nf3 (Two Knights)",
      description: "White develops knights instead of playing d4. Answer with …d5 and …Bg4.",
      pgn: `{Instead of 2.d4, White can develop the knights first: the Two Knights Variation. 2.Nf3 d5 3.Nc3 reaches the same position.}
1. e4 c6
2. Nc3 {White develops and defends e4, but doesn't build a pawn centre with d4 yet. [%cal Gc3e4]}
2... d5 {Black plays the Caro-Kann move anyway and challenges e4. [%cal Gd5e4]}
3. Nf3 {The second knight: the Two Knights Variation.}
3... Bg4 {Black's light-squared bishop comes out and pins the knight against the queen. [%cal Gg4f3,Gf3d1]}
4. h3 {White asks the bishop to decide.}
4... Bxf3 {Black gives up the bishop for the knight. The point: White's pawn structure stays healthy, but Black gets a quick, solid development. [%cal Gg4f3]}
5. Qxf3 {The queen recaptures and now aims at f7 and d5. [%cal Gf3f7]}
5... e6 {Supports d5 and opens the diagonal for the dark-squared bishop. Black has the typical solid Caro-Kann pawn chain. [%csl Gc6,Gd5,Ge6]}
6. d4 {Now White builds the centre after all.}
6... Nf6 {Black develops and puts pressure on e4. Plans: …Nbd7, …Bb4 or …Be7 and castle. White has the bishop pair, Black a very solid position with no weaknesses. [%cal Gf6e4]}`,
    },
    {
      id: "smothered",
      name: "Trap: smothered mate after 4…Nd7",
      description: "A famous trap in the Karpov line: 5.Qe2 and …Ngf6?? walks into mate.",
      pgn: `{After 4…Nd7 (the Karpov Variation), White can set a deadly trap with 5.Qe2. Every Caro-Kann player has to know it.}
1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4
4... Nd7 {The Karpov Variation: Black prepares …Ngf6 so the knight on f6 can be supported.}
5. Qe2 {A sneaky move: the queen looks harmless, but it is now on the e-file behind the knight. [%cal Ge2e7]}
5... Ngf6 {[%mistake] The natural move, and a terrible blunder. Correct is 5…Ndf6, keeping d7 free for the king's escape. [%csl Rd7,Re7]}
6. Nd6# {Smothered mate: the e7 pawn is pinned by the queen on e2, so it can't take the knight, and the king is surrounded by its own pieces. [%csl Re8][%cal Gd6e8]}`,
    },
  ],
};
