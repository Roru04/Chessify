import type { OpeningCourse } from "./types";

export const italian: OpeningCourse = {
  id: "italian",
  name: "Italian Game",
  eco: "C50–C54",
  side: "w",
  moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
  summary:
    "One of the oldest openings in chess and a great first opening. White develops quickly, castles early and aims the bishop at f7, the weakest square in Black's position. The moves are natural and the plans are easy to understand.",
  ideas: [
    "Develop the knights and bishops early and castle before starting any action.",
    "The bishop on c4 aims at f7, which only Black's king defends.",
    "Prepare d4 with c3, or play the calm d3 and build up slowly.",
    "Typical manoeuvre: knight from b1 via d2 and f1 to g3, plus h3 so Black can't pin the f3 knight with …Bg4.",
  ],
  profile: {
    tagline: "Classical · natural moves · great first opening",
    style:
      "For players who like quick, natural development and clear plans. It can be played calmly (c3 and d3) or sharply (early d4, or 4.Ng5 against the Two Knights), so it suits both quiet and attacking players.",
    strengths: [
      "Easy to learn: the moves follow the basic opening principles.",
      "Good against 1…e5 players at every level; many club players fall for f7 tricks such as the Fried Liver.",
      "The same set-up (c3, d3, Nbd2–f1–g3) works against most of Black's replies, so it needs little memorising.",
    ],
    watchOut: [
      "Only works after 1.e4 e5 2.Nf3 Nc6. Against the Sicilian, French or Caro-Kann you need other answers.",
      "The calm lines give Black an easy, equal game; to win you have to outplay your opponent later.",
      "After 3…Nf6 4.Ng5 you need to know the sharp theory if Black answers correctly with 4…d5 5.exd5 Na5.",
    ],
    theory: "Low",
    level: "Beginner to advanced",
  },
  lines: [
    {
      id: "main",
      name: "Main line: Giuoco Pianissimo",
      description: "The calm modern main line with c3, d3 and slow manoeuvring. Learn this first.",
      pgn: `{The Italian Game starts with 1.e4 e5 2.Nf3 Nc6 3.Bc4. You play White. Step through the moves and read why each one is played.}
1. e4 {White puts a pawn in the centre and opens lines for the queen and the light-squared bishop. [%csl Ge4]}
1... e5 {Black does the same and claims an equal share of the centre. [%csl Ge5]}
2. Nf3 {Develops a knight towards the centre and attacks the pawn on e5 straight away. [%cal Gf3e5]}
2... Nc6 {The most natural reply: develops a piece and defends e5. [%cal Gc6e5]}
3. Bc4 {This is the Italian Game. The bishop aims at f7, the weakest square in Black's camp because only the king defends it. [%cal Gc4f7][%csl Rf7]}
3... Bc5 {The Giuoco Piano, Italian for "quiet game". Black copies White and aims the bishop at f2. [%cal Gc5f2]}
4. c3 {Prepares d4 to build a big pawn centre and gives the bishop a retreat square later. [%cal Gd2d4]}
4... Nf6 {Develops and attacks e4. Black wants counterplay before White gets d4 in. [%cal Gf6e4]}
5. d3 {The modern, calm approach: defends e4 and keeps the centre closed. White will build up slowly, which is why this line is called the Giuoco Pianissimo, the "very quiet game". [%cal Gd3e4]}
5... d6 {Black also defends e5 and opens the diagonal for the light-squared bishop. [%cal Gd6e5,Gc8g4]}
6. O-O {King safety first: castling tucks the king away and brings the rook closer to the centre.}
6... O-O {Black castles too. Both sides have developed and castled; now the manoeuvring starts.}
7. Re1 {The rook defends e4 and supports a later d4. [%cal Ge1e4]}
7... a6 {Makes room for the bishop: if White plays b4 or d4, it can drop back to a7 and stay on its good diagonal. [%cal Gc5a7]}
8. Bb3 {White moves the bishop out of reach of …d5 and …b5 ideas while keeping the pressure on f7. [%cal Gb3f7]}
8... Ba7 {Same idea for Black: the bishop is safe on a7 and still aims at f2. [%cal Ga7f2]}
9. h3 {Stops …Bg4, which would pin the knight on f3 to the queen. A typical useful waiting move here. [%cal Rc8g4]}
9... h6 {Black returns the favour and stops Bg5. [%cal Rc1g5]}
10. Nbd2 {The last minor piece joins the game. Its route is d2, f1, g3, where it eyes f5. This slow regrouping is the typical plan in the Italian. [%cal Gd2f1,Gf1g3]}`,
    },
    {
      id: "twoknights",
      name: "Two Knights Defence with 4.d3",
      description: "Black attacks e4 with 3…Nf6 instead of 3…Bc5. The calm 4.d3 keeps things simple.",
      pgn: `{Black's most popular alternative on move 3 is 3…Nf6, the Two Knights Defence. You play White and answer calmly.}
1. e4 e5 2. Nf3 Nc6 3. Bc4 {The Italian Game position.}
3... Nf6 {The Two Knights Defence. Instead of developing the bishop, Black attacks e4 at once. [%cal Gf6e4]}
4. d3 {The calm answer: defends e4 and avoids sharp complications. (4.Ng5 is the aggressive alternative, see the "Fried Liver" lesson.) [%cal Gd3e4]}
4... Bc5 {Black develops the bishop to its best diagonal, aiming at f2. [%cal Gc5f2]}
5. c3 {Same plan as in the main line: prepare d4 and give the bishop a retreat square. [%cal Gc3d4]}
5... d6 {Defends e5 and frees the light-squared bishop.}
6. O-O {King safety first.}
6... a6 {Prepares …Ba7, so the bishop can't be chased by b4 or d4. [%cal Gc5a7]}
7. a4 {Stops …b5, which would chase the bishop from c4 and gain space on the queenside. [%cal Rb7b5]}
7... Ba7 {The bishop steps back in advance and keeps aiming at f2. [%cal Ga7f2]}
8. Re1 {The rook defends e4 and supports d4 later. [%cal Ge1e4]}
8... O-O {Black castles. We have reached the same kind of position as in the main line.}
9. h3 {Stops …Bg4 pinning the knight. [%cal Rc8g4]}
9... h6 {Stops Bg5. Both sides now regroup slowly; White's typical plan is again Nbd2, Nf1 and Ng3. [%cal Rc1g5]}`,
    },
    {
      id: "friedliver",
      name: "Trap: the Fried Liver Attack",
      description: "What happens if Black recaptures the wrong way after 4.Ng5 d5 5.exd5. Know this trap from both sides.",
      pgn: `{After 3…Nf6, White can attack at once with 4.Ng5. If Black defends correctly, the game is balanced, but one natural mistake runs into a famous attack.}
1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6
4. Ng5 {The aggressive try: knight and bishop both attack f7, which only the king defends. [%cal Gg5f7,Gc4f7][%csl Rf7]}
4... d5 {The right defence: the pawn blocks the bishop's diagonal towards f7. [%cal Gd5c4]}
5. exd5 {White takes, and the bishop's line to f7 is open again if Black's pawn disappears.}
5... Nxd5 {[%mistake] The natural recapture is a mistake. Correct is 5…Na5, chasing the bishop away. Now f7 is attacked twice and defended only by the king. [%cal Gg5f7,Gc4f7][%csl Rf7]}
6. Nxf7 {The Fried Liver Attack: White gives up the knight to drag Black's king into the open. It is very hard to defend over the board. [%csl Rf7]}
6... Kxf7 {Black takes the knight; there is nothing better.}
7. Qf3+ {Check, and the queen also attacks the knight on d5, which is pinned against the king by the bishop on c4. [%cal Gf3f7,Gf3d5,Gc4d5]}
7... Ke6 {The only way to keep the knight: the king must defend it and walks into the middle of the board. [%csl Re6]}
8. Nc3 {Another attacker against the pinned knight on d5. Black's king is stuck in the centre and White's attack is very dangerous. Lesson for Black: answer 5.exd5 with 5…Na5! [%cal Gc3d5]}`,
    },
  ],
};
