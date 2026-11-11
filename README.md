# Chessify

A mobile-first chess web app: play against Stockfish at any strength from
100 to 3000 Elo, with live analysis while you play and a full game review
afterwards. Everything runs in the browser; the engine is Stockfish compiled
to WebAssembly, so no server is needed.

## Features

- **Play against the computer** as White, Black or random, with an exact
  opponent Elo (100–3000). Below 1320 the computer plays human-like
  beginner moves and standard openings.
- **Live analysis** (optional): evaluation bar, the engine's top 1–3 moves
  with their lines and search depth, "hide hints on my turn".
- **Captured pieces** and material advantage next to each player.
- **Game review**: every move graded (Best, Excellent, Good, Inaccuracy,
  Mistake, Blunder) with a plain-language explanation, accuracy per player,
  evaluation graph and move-by-move navigation.

**Play it:** https://roru04.github.io/Chessify/

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
```

## Documentation

See [doc/README.md](doc/README.md) for the overview, architecture, features,
roadmap, hosting notes, calibration and mockups.

## License

Stockfish is licensed under the GPL v3. Distributing this app with the
Stockfish files means the app must also be distributed under GPL v3
compatible terms.
