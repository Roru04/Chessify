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
- Choose the opponent from **ten difficulty levels**, each with a name, a
  rough rating and a one-line description of how it plays:
  1 Newcomer ≈ 750 · 2 Beginner ≈ 850 · 3 Novice ≈ 1000 · 4 Casual ≈ 1100
  (default) · 5 Intermediate ≈ 1200 · 6 Club ≈ 1300 · 7 Strong club ≈ 1550 ·
  8 Expert ≈ 2000 · 9 Master ≈ 2400 · 10 Maximum (full Stockfish).
  - The ratings are rough estimates on Stockfish's engine scale, not
    chess.com / Lichess ratings.
  - At every level the computer plays standard openings from a small
    opening book (e.g. 1.e4 e5 2.Nf3 Nc6).
  - Levels 1 – 6 play human-like beginner moves (only a few eye-catching
    moves considered, sometimes the opponent's reply not checked, so pieces
    get left hanging; no random moves). Levels 7 – 10 are Stockfish's own
    strength limiter or full strength (see
    [architecture.md](architecture.md#opponent-strength-levels-1--10)).
- **Computer think time** per move (0.2 s – 3 s, default 1 s). A hint under
  the slider explains that it only changes the strength at levels 7 – 10
  (Stockfish's thinking time); at levels 1 – 6 it only sets how quickly the
  computer replies. The level ratings were measured at 1 s.
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

## 2c. Light and dark theme

A switch in the top bar cycles **Auto** (follows the device setting) →
**Light** → **Dark**. The choice is saved in the browser and applied before
the first paint (inline script in `index.html`), so there is no flash of the
wrong theme. On narrow phones the switch shows only its icon.

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
  (full strength), with the two best lines (the second one is needed for
  "Great"). A progress bar shows how far it is; moves can be browsed
  while it is still running. Results are cached, so reopening is instant.
- Every move gets one of chess.com's ten classes. The base is how much the
  move lowered the mover's winning chances (win %, Lichess model); Book,
  Brilliant, Great and Miss come from the game context
  (`classifyInContext()` in `src/review/classify.ts`):

  | Class | Symbol | Rule |
  |-------|--------|------|
  | Brilliant | !! | Best or excellent move that leaves a knight or more en prise (worth ≥ 2 more than anything it captured), when the mover wasn't already ≥ 95 % winning and is still ≥ 50 % afterwards |
  | Great | ! | Best move, and the second-best move is ≥ 15 win-% worse (best ≥ 35 %, second ≤ 80 %); not for recaptures or taking a hanging piece |
  | Best | ★ | engine's top move (or a mating move) |
  | Excellent | ✓✓ | loses < 2 |
  | Good | ✓ | loses < 5 |
  | Book | ≡ | opening theory: for chess.com games as far as chess.com's opening tag goes, otherwise (and beyond it) moves in the app's opening book |
  | Inaccuracy | ?! | loses < 10 |
  | Mistake | ? | loses < 20 |
  | Miss | ✗ | a mistake or blunder right after the opponent's own mistake (≥ 10 win-% lost), when the mover is still ≥ 40 % afterwards; or missing a forced mate in ≤ 3 |
  | Blunder | ?? | loses 20 or more |

  Check on 8 real chess.com games (≈ 950 moves, 2026-11-12): 7 Brilliant,
  13 Great, 6 Miss; Book matched chess.com's opening length in every game.
  chess.com's exact rules aren't public, so the classes are close but won't
  always match chess.com.

- The board shows the selected position with a coloured badge on the moved
  piece. A card names the move's class, the evaluation, the win-% lost and
  the best move if a different one was played.
- Evaluation graph over the whole game (white area = White's winning
  chances), with dots on brilliant and great moves, inaccuracies, mistakes,
  misses and blunders. A handle at the shown move is a
  slider inside the graph: drag it to move through the game (or focus it and
  use the arrow keys). Tapping the graph itself does nothing.
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
- The move list marks brilliant, great, inaccurate, mistaken, missed and
  blundered moves with their symbol.

## 5. Learn tab

A **Play | Learn** switch at the top. The running game stays loaded while
you are in Learn. Pop-ups on the Play screen (new game, hints, result…)
start below the top bar, so the switch always stays usable. Pages have their own addresses (`#learn`,
`#learn-italian`, `#learn-italian-main`, `#practice-italian-main`).

- **Overview:** split into **Openings for White** and **Openings for Black**.
  Each card shows the moves, a one-line style hint, the amount of theory and
  progress. Then the **Middlegame: tactics** cards (see below). Endgame is
  marked "coming soon".
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
- **Opening content so far (22 lines):**
  - For White: Italian Game (main line, Two Knights 4.d3, Fried Liver trap),
    Ruy Lopez (Closed, Berlin, Exchange), Queen's Gambit (QGD Exchange,
    QGA, Slav, Elephant Trap), London System (main line, vs King's Indian
    set-up, the early …Qb6).
  - For Black: Sicilian Defence (Najdorf, vs 2.c3 Alapin, vs 2.Nc3 Closed,
    vs 3.Bb5+), Caro-Kann Defence (Classical 4…Bf5, Advance 3.e5,
    Exchange 3.exd5, against 2.Nc3 / 2.Nf3 Two Knights, smothered-mate trap
    after 4…Nd7 5.Qe2). The Two Knights line was added last and has not been
    through the Stockfish check yet.
  - Coming soon for Black: French, Queen's Gambit Declined, King's Indian.
- **Middlegame: tactics** (pages `#tactic-fork`, `#lesson-fork`,
  `#puzzles-fork`, …). Six themes: hanging pieces, forks, pins, skewers,
  discovered attacks, back-rank mates. Each theme has:
  - a short text ("what to look for"),
  - a **lesson**: a real puzzle position explained move by move,
  - **29 puzzles** from the Lichess puzzle database (CC0), rated about
    700–1900, easiest first. The opponent's first move is played
    automatically, then you find the rest. Any checkmate counts as a
    solution. A wrong move gives "Try again" and highlights the piece to
    move; "Hint" and "Show solution" are available. After solving, a short
    "Why it works" note (from the review's explanation rules). Each puzzle
    links to its page on Lichess.
  - Progress per puzzle in the browser ("clean" = solved at the first try);
    the trainer continues with the first puzzle not yet solved cleanly.
- **Quality check:** `npm run check:lessons` loads every opening line and
  tactics lesson, checks that all moves are legal and compares each move with
  Stockfish (depth 16): normal moves may lose at most 0.7 pawns, moves marked
  as mistakes must lose at least 1 pawn. It also checks that all puzzle
  solutions are legal. Last full run: 391 lesson moves, 0 problems (before
  the Caro-Kann Two Knights line was added).

## 5b. Import tab: chess.com games

A third tab in the top bar (Play | Learn | Import) reviews games played on
chess.com. Only chess.com for now (Lichess and PGN paste may follow).

- Enter a chess.com username. It is remembered in this browser, and its games
  load automatically the next time the tab is opened.
- The list shows the most recent month with games first, newest game on top.
  Each row: result (W / L / D), your colour, opponent and rating, time class
  and time control, date, how the game ended, opening name, your rating and,
  where available, chess.com's accuracy for you.
- Filters: time class (only those present) and result (won / lost / draw).
- **Load older games** loads the previous month; months without standard
  games are skipped. **Refresh** reloads, for games finished since.
- Tap a game to open the same review as after a game against the computer,
  from your side of the board. The summary shows our accuracy and, below it,
  **chess.com's accuracy for comparison** (only for games chess.com has
  analysed; the two use different engines and formulas, so they differ).
- Long games (over 60 moves) show a note that the analysis takes a while;
  the results stream in while browsing.
- Only standard chess from the normal start position is listed (no Chess960
  or other variants).
- Errors are explained in plain words: unknown username, chess.com limiting
  requests, no connection.
- Privacy: games are loaded directly from chess.com's public API; only the
  username is sent and nothing but the last username is stored.

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
