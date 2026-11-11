# Chess Analyzer — Project Documentation

A browser-based chess app where you play against a computer opponent while
the Stockfish engine shows you the best moves and the evaluation of the
position in real time.

Everything runs locally in the browser: no backend server, no account, and no
engine installation. Stockfish is loaded as a WebAssembly module.

The UI is designed **mobile first**: phones are the primary target, and
larger screens get an adapted two-column layout.

## Documents

| File | Contents |
|------|----------|
| [overview.md](overview.md) | Goals, target users, scope of the first version |
| [architecture.md](architecture.md) | Tech stack, components, data flow, engine integration |
| [features.md](features.md) | Feature specification for version 1 |
| [roadmap.md](roadmap.md) | Planned phases after version 1 |
| [development.md](development.md) | Setup, scripts, project structure, conventions |
| [calibration.md](calibration.md) | Measuring the real strength of the weak computer levels |
| [hosting.md](hosting.md) | Free hosting options and deployment (Cloudflare Pages) |
| [mockups/mockups.html](mockups/mockups.html) | Mobile-first UI mockups (open in a browser) |

## Status

| Item | State |
|------|-------|
| Documentation | Initial draft (2026-11-11) |
| Mockups | Mobile screens for version 1 (2026-11-11) |
| Step 1: play against the computer (no analysis) | Implemented (2026-11-11) |
| Step 2: live analysis (eval bar, best moves, hints) | Implemented (2026-11-11) |
| Captured pieces + material advantage | Implemented (2026-11-11) |
| Post-game review (classification, accuracy, eval graph) | Implemented (2026-11-11) |
| Move explanations (review only) | Implemented (2026-11-11) |
| Weak levels: human-like play + opening book | Implemented (2026-11-11) |
| Calibration of levels below 1320 | Trial run done, full run pending |
| Learn tab: 5 openings (White: Italian, Ruy Lopez, Queen's Gambit, London; Black: Sicilian, Caro-Kann), "Is this opening for you?" profiles | Implemented (2026-11-11) |
| Hosting | Live on GitHub Pages: https://roru04.github.io/Chessify/ |
| AI explanations | Deferred, optional (see roadmap phase 3b) |
