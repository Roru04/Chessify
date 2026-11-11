# Features — Version 1

## 0. Mobile first

Phones are the primary target. See the screens in
[mockups/mockups.html](mockups/mockups.html).

- The board spans the full screen width. Other UI sits above and below it.
- Horizontal eval bar on phones, vertical eval bar beside the board from 768 px.
- Tap-to-move (tap a piece, then a target square, with legal squares shown as
  dots) as the main input. Drag and drop is also supported.
- Main actions in a bottom tab bar: New, Undo, Flip, Hints, Settings.
- New game and hint settings open as bottom sheets.
- Touch targets of at least 44 px.

## 1. Play against the computer

- Choose your color: **White**, **Black**, or random. When playing Black the
  board is shown from Black's side and the computer makes the first move.
- Choose the opponent's strength as an **exact Elo from 100 to 3000**:
  - number field for typing the exact value,
  - slider for quick adjustment,
  - presets: Beginner 400 / Casual 800 / Club 1200 / Strong 1800 /
    Master 2400 / Maximum 3000.
  - At every level the computer plays standard openings from a small
    opening book (e.g. 1.e4 e5 2.Nf3 Nc6).
  - Below 1320 Elo the bot plays human-like beginner moves (natural-looking
    moves, typical beginner mistakes, no random moves); the strength is
    approximated (see
    [architecture.md](architecture.md#opponent-strength-elo-100--3000)).
- Opponent think time per move (e.g. 0.5 s – 3 s).
- Tap-to-move or drag & drop; illegal moves are rejected.
- Pawn promotion dialog.
- Game end detection: checkmate, stalemate, threefold repetition,
  50-move rule, insufficient material. A result banner is shown.

## 2. Live analysis

All items can be toggled individually in a settings panel.

| Element | Description |
|---------|-------------|
| Evaluation bar | Horizontal above the board on phones, vertical beside it from 768 px. Shows `+1.30`, `-0.42` etc. from White's perspective. Moves slowly and smoothly (about 1.2 s), only follows results from depth 10 on and keeps its value while a new position is analysed, so it doesn't jump after every move. Forced mates of 8 moves or fewer are shown as `M8` … `M1` (no sign; the full bar shows which side mates); longer mates are shown as a normal score. |
| Top moves | The 3 best moves for the side to move, each with eval and the first moves of its line (SAN). |
| Depth indicator | Current search depth so the user can see how "settled" the evaluation is. |

Move explanations are shown **only in the post-game review** (see §4), not
during play.

Option: **"Hide hints during my turn"** — analysis only shown after you move,
so you can play first and compare afterwards.

## 2b. Board annotations (all boards)

Like on chess.com, on every board (play, review, lessons, practice, puzzles):

- **Right-click a square** to highlight it (again to remove).
- **Right-click and drag** to draw an arrow (Shift / Ctrl while drawing give
  other colours).
- **Left-click** on the board clears highlights and arrows; they also clear
  after every move. Mouse only; phones have no right click.

## 3. Captured pieces

Like on chess.com, each player bar shows the pieces that player has captured:

- Small piece icons, grouped by type in the order pawns, knights, bishops,
  rooks, queens. Pieces of the same type overlap.
- The side that is ahead in material gets a `+N` after its pieces (pawn 1,
  knight 3, bishop 3, rook 5, queen 9). A promotion counts as a gain
  (queen promotion = +8).
- Calculated from the move history (`src/game/material.ts`), so it updates
  with every move and with Undo.

## 4. Post-game review

When a game is over, **Review game** on the result card (or **Review** in the
tab bar) opens a move-by-move review, similar to chess.com's Game Review.

- The idle opponent engine analyses every position of the game at depth 14
  (full strength). A progress bar shows how far it is; moves can be browsed
  while it is still running. Results are cached, so reopening is instant.
- Every move is classified by how much it lowered the mover's winning
  chances (win %, Lichess model):

  | Class | Symbol | Win-% lost |
  |-------|--------|------------|
  | Best | ★ | engine's top move (or a mating move) |
  | Excellent | ! | < 2 |
  | Good | ✓ | < 5 |
  | Inaccuracy | ?! | < 10 |
  | Mistake | ? | < 20 |
  | Blunder | ?? | 20 or more |

- The board shows the selected position with a coloured badge on the moved
  piece. A card names the move's class, the evaluation, the win-% lost and
  the best move if a different one was played.
- Evaluation graph over the whole game (white area = White's winning
  chances), with dots on inaccuracies, mistakes and blunders. Tap or drag on
  it to jump to a move.
- Summary table: accuracy for you and Stockfish (Lichess accuracy formula,
  chess.com's is not public) and the number of moves in each class.
- Navigation: Start / Back / Next / End / Done in the tab bar, arrow keys
  (←/→, ↑/↓, Home/End) on a keyboard, or tap a move in the list.
- **Explanations** (review only): every move gets a short reason in plain
  language, and a weaker move also says what the best move would have done.
  Examples from test games:
  - "3… Nf6 is a blunder. It allows mate in one: White plays Qxf7#. Best was
    Qe7."
  - "2… Qh4 is a blunder. It loses the queen: White answers Nxh4. Best was
    Nc6: defends the pawn on e5."
  - "6. Rf1 is excellent. Moves the rook out of danger; it was attacked on h1."
  - "4… dxc6 is the best move. Recaptures the knight."

  They are generated locally (`src/explain/explain.ts`) from the position and
  Stockfish's main line with pattern checks: checkmate and forced mates,
  material won or lost within the next few moves, recaptures and trades,
  hanging (unprotected) pieces, forks, attacks, escaping a threat, defending a
  piece, castling, promotion and opening development. When none of these
  apply, the change in evaluation is described instead.
- Not included yet: Brilliant, Great, Book and Miss classes.

## 5. Learn tab

A **Play | Learn** switch at the top. The running game stays loaded while
you are in Learn. Pop-ups on the Play screen (new game, hints, result…)
start below the top bar, so the switch always stays usable. Pages have their own addresses (`#learn`,
`#learn-italian`, `#learn-italian-main`, `#practice-italian-main`).

- **Overview:** split into **Openings for White** and **Openings for Black**.
  Each card shows the moves, a one-line style hint, the amount of theory and
  progress. Middlegame and endgame are marked "coming soon".
- **Course page:** moves, summary, an **"Is this opening for you?"** block
  (playing style it suits, why it's strong and against what, what to watch
  out for, amount of theory, suggested level), key ideas and the lines, each
  with Learn and Practice and a progress pill per side.
- **Lesson:** step through a line (Start / Back / Next / End, arrow keys or
  tap a move). Every move has an explanation; arrows and highlighted squares
  show the ideas (arrows appear only in lessons, never in play). Deliberate
  mistakes in trap lines get a "?" badge.
- **Practice:** you play one side (White or Black), the app plays the other
  and checks every move. A wrong move is taken back with "Try again"; after a
  second wrong try an arrow shows the line move ("Show the move" also works).
- **Progress** per line and side, saved in the browser: a perfect run moves
  the line up (New → Learning → Known → Mastered), any mistake sends it back
  to Learning.
- **Content so far (21 lines, 367 moves):**
  - For White: Italian Game (main line, Two Knights 4.d3, Fried Liver trap),
    Ruy Lopez (Closed, Berlin, Exchange), Queen's Gambit (QGD Exchange,
    QGA, Slav, Elephant Trap), London System (main line, vs King's Indian
    set-up, the early …Qb6).
  - For Black: Sicilian Defence (Najdorf, vs 2.c3 Alapin, vs 2.Nc3 Closed,
    vs 3.Bb5+), Caro-Kann Defence (Classical 4…Bf5, Advance 3.e5,
    Exchange 3.exd5, smothered-mate trap after 4…Nd7 5.Qe2).
  - Coming soon for Black: French, Queen's Gambit Declined, King's Indian.
- **Quality check:** `npm run check:lessons` loads every lesson, checks that
  all moves are legal and compares each move with Stockfish (depth 16):
  normal moves may lose at most 0.7 pawns, moves marked as mistakes must lose
  at least 1 pawn.

## 6. Game controls

- New game
- Undo (takes back your move and the computer's reply)
- Flip board
- Move list in standard notation, highlighting the last move

## Acceptance criteria

- A complete game can be played to checkmate against the computer.
- The evaluation and top moves update within ~1 s after every move.
- Analysis on/off and strength changes take effect without reloading.
- The app works in current Chrome, Firefox, and Safari without any install
  step beyond `npm install`.
