# Development

## Requirements

- Node.js 20 or newer (developed with Node 22)
- npm

## Getting started

```bash
npm install
npm run dev       # start dev server at http://localhost:5173
npm run build     # type-check + production build into dist/
npm run typecheck # type-check only
npm run preview   # serve the production build locally
```

## Project structure

```
/
├── doc/                         # this documentation + mockups
├── scripts/
│   ├── copy-stockfish.mjs       # copies the engine into public/stockfish (runs before dev/build)
│   ├── calibrate/calibrate.ts   # calibration matches for weak levels (npm run calibrate)
│   ├── check-lessons/           # lesson quality check (npm run check:lessons)
│   ├── puzzles/extract-puzzles.mjs # picks puzzles from the Lichess database (needs the .csv.zst download)
│   └── lib/nodeEngine.ts        # runs the app's engine class in Node
├── public/stockfish/            # generated: stockfish-19-lite-single.js + .wasm
├── src/
│   ├── main.tsx                 # entry point
│   ├── Root.tsx                 # Play | Learn switch (hash routing)
│   ├── App.tsx                  # Play screen: layout, sheets, tab bar
│   ├── styles.css               # mobile-first styles, light/dark tokens
│   ├── engine/
│   │   ├── StockfishEngine.ts   # UCI wrapper around the Web Worker (queued searches)
│   │   ├── uci.ts               # parsing of `info` / `bestmove` / option lines
│   │   ├── strength.ts          # Elo 100–3000 → limiter or own weakening
│   │   ├── openingBook.ts       # standard opening lines used by the computer
│   │   └── engines.ts           # shared engine instances (opponent/review, analyzer)
│   ├── analysis/
│   │   ├── useAnalysis.ts       # live analysis with a 2nd, full-strength engine
│   │   ├── format.ts            # score formatting, eval bar share, UCI → SAN lines
│   │   └── hints.ts             # hint toggles, saved in localStorage
│   ├── review/
│   │   ├── classify.ts          # move classes, win %, accuracy
│   │   └── useReview.ts         # analyses every position of a finished game
│   ├── explain/
│   │   └── explain.ts           # plain-language reasons for reviewed moves
│   ├── learn/
│   │   ├── LearnScreen.tsx      # Learn tab: overview, course page, routing (lazy-loaded)
│   │   ├── LessonPlayer.tsx     # step through a line with explanations
│   │   ├── PuzzlePlayer.tsx     # tactics puzzles (Lichess format), hints, solution
│   │   ├── PracticePlayer.tsx   # play one side, moves are checked
│   │   ├── LearnBoard.tsx       # board with arrows, highlights, tap-to-move
│   │   ├── pgnLesson.ts         # PGN + comments ([%cal], [%csl], [%mistake]) → lesson steps
│   │   ├── progress.ts          # practice progress (Leitner boxes) in localStorage
│   │   ├── learn.css
│   │   ├── courses/             # opening courses (italian, ruyLopez, queensGambit, london, sicilian, caroKann), types, index
│   │   └── middlegame/
│   │       ├── themes.ts        # tactics themes: text, lesson PGN, puzzle lookup
│   │       ├── puzzles.json     # 180 puzzles picked from the Lichess database (CC0)
│   │       └── puzzleProgress.ts # puzzle results in localStorage
│   ├── game/
│   │   ├── useChessGame.ts      # game state (chess.js) + computer moves
│   │   ├── settings.ts          # new-game settings, saved in localStorage
│   │   └── material.ts          # captured pieces and material balance
│   └── components/
│       ├── Board.tsx            # react-chessboard with tap-to-move and highlights
│       ├── PlayerBar.tsx            # name, Elo/status, captured pieces
│       ├── CapturedPieces.tsx
│       ├── useSquareMarks.ts    # right-click square highlights (all boards)
│       ├── ThemeSwitch.tsx      # Auto / Light / Dark switch in the top bar
│       ├── MoveList.tsx
│       ├── NewGameSheet.tsx     # colour, exact Elo, think time
│       ├── PromotionDialog.tsx
│       ├── EvalBar.tsx          # horizontal on phones, vertical from 768px
│       ├── AnalysisPanel.tsx    # top 1–3 lines with eval and depth
│       ├── HintsSheet.tsx
│       ├── ReviewPanel.tsx      # move card, eval graph, accuracy table, move list
│       ├── EvalGraph.tsx
│       ├── GameOverCard.tsx
│       └── Icons.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```


## Updating the puzzles

1. Download `https://database.lichess.org/lichess_db_puzzle.csv.zst`
   (about 310 MB) to a folder outside the project.
2. Run `node scripts/puzzles/extract-puzzles.mjs <path-to-.csv.zst> src/learn/middlegame/puzzles.json`.
   It decompresses with the dev dependency `fzstd` while reading and stops as
   soon as every theme is full (takes a few seconds).
3. Run `npm run check:lessons`.

## Conventions

- TypeScript in strict mode.
- Engine communication only through `StockfishEngine`; components never talk
  to the Worker directly.
- Scores are stored internally in centipawns from **White's** perspective;
  mate scores as a separate `mate` field.
- Moves are stored as UCI (`e2e4`) internally and converted to SAN (`e4`) only
  for display.

## Licensing note

Stockfish is licensed under the **GPL v3**. Distributing this app with the
Stockfish files bundled means the app must also be distributed under GPL v3
compatible terms (source code available). For private/local use this has no
effect.
