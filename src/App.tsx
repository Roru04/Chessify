import { useEffect, useState } from "react";
import { Chess, type Square } from "chess.js";
import { anyHintOn, loadHints, saveHints, type HintSettings } from "./analysis/hints";
import { useAnalysis } from "./analysis/useAnalysis";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { Board, type BoardView } from "./components/Board";
import { EvalBar } from "./components/EvalBar";
import { HintsSheet } from "./components/HintsSheet";
import { GameOverCard } from "./components/GameOverCard";
import {
  BulbIcon,
  ChartIcon,
  CloseIcon,
  FirstIcon,
  FlagIcon,
  FlipIcon,
  LastIcon,
  NextIcon,
  PlusIcon,
  PrevIcon,
  UndoIcon,
} from "./components/Icons";
import { MoveList } from "./components/MoveList";
import { NewGameSheet } from "./components/NewGameSheet";
import { PlayerBar } from "./components/PlayerBar";
import { PromotionDialog } from "./components/PromotionDialog";
import { ReviewPanel } from "./components/ReviewPanel";
import { loadSettings, saveSettings, type GameSettings } from "./game/settings";
import { advantageFor, summarizeCaptures } from "./game/material";
import { useChessGame } from "./game/useChessGame";
import { useReview } from "./review/useReview";

type Sheet = "new" | "resign" | "hints" | null;

const initialSettings = loadSettings();
const initialHints = loadHints();

/** The Play screen. `active` is false while the Learn tab is shown (keys are then ignored). */
export default function App({ active = true }: { active?: boolean }) {
  const game = useChessGame(initialSettings);
  const [sheet, setSheet] = useState<Sheet>("new");
  const [started, setStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [resultHidden, setResultHidden] = useState(false);
  const [hints, setHintsState] = useState<HintSettings>(initialHints);
  /** Changes on every new game so the eval bar starts again from 0.00. */
  const [gameKey, setGameKey] = useState(0);
  /** Post-game review: which position is shown (0 = start, N = after the last move). */
  const [reviewing, setReviewing] = useState(false);
  const [reviewPly, setReviewPly] = useState(0);

  const { playerColor, settings, result, thinking, engineStatus, history } = game;
  const opponentColor = playerColor === "w" ? "b" : "w";
  const orientation = (playerColor === "w") !== flipped ? "white" : "black";
  const moveCount = Math.ceil(history.length / 2);

  function setHints(h: HintSettings) {
    saveHints(h);
    setHintsState(h);
  }

  // Live analysis (separate full-strength engine).
  const hiddenOnMyTurn = hints.hideOnMyTurn && game.turn === playerColor && !result;
  const analysisOn = started && !result && anyHintOn(hints) && !hiddenOnMyTurn;
  const analysis = useAnalysis(game.fen, game.turn, analysisOn, hints.bestMoves ? hints.lines : 1);
  const bestLine = analysis.lines[0] ?? null;
  const hiddenReason = !started
    ? "Start a game to see the engine's best moves."
    : result
      ? "The game is over."
      : hiddenOnMyTurn
        ? "Hidden until you've made your move."
        : null;

  // Post-game review (uses the idle opponent engine).
  const review = useReview(history, reviewing);
  const lastPly = history.length;
  const goTo = (p: number) => setReviewPly(Math.max(0, Math.min(lastPly, p)));

  function openReview() {
    setResultHidden(true);
    setReviewPly(0);
    setReviewing(true);
  }

  useEffect(() => {
    if (!reviewing || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const step: Record<string, (p: number) => number> = {
        ArrowLeft: (p) => p - 1,
        ArrowRight: (p) => p + 1,
        ArrowUp: () => 0,
        Home: () => 0,
        ArrowDown: () => lastPly,
        End: () => lastPly,
      };
      const f = step[e.key];
      if (!f) return;
      e.preventDefault();
      setReviewPly((p) => Math.max(0, Math.min(lastPly, f(p))));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewing, lastPly, active]);

  let boardView: BoardView | undefined;
  if (reviewing) {
    const fen = reviewPly === 0 ? (history[0]?.before ?? game.fen) : history[reviewPly - 1].after;
    const m = reviewPly > 0 ? history[reviewPly - 1] : null;
    const pos = new Chess(fen);
    boardView = {
      fen,
      lastMove: m ? { from: m.from, to: m.to } : null,
      checkSquare: pos.inCheck() ? (pos.findPiece({ type: "k", color: pos.turn() })[0] ?? null) : null,
      badge: review.moves[reviewPly - 1]?.verdict.cls ?? null,
    };
  }

  function start(s: GameSettings) {
    setReviewing(false);
    saveSettings(s);
    setFlipped(false);
    setResultHidden(false);
    setPromo(null);
    setSheet(null);
    setStarted(true);
    setGameKey((k) => k + 1);
    game.startGame(s);
  }

  function undo() {
    setReviewing(false);
    setResultHidden(false);
    game.undo();
  }

  let status = "Your move";
  if (!started) status = "Choose your settings";
  else if (reviewing) status = "Game review";
  else if (result) status = "Game over";
  else if (thinking) status = "Waiting for Stockfish";
  else if (game.turn !== playerColor) status = "";
  if (started && !result && game.inCheck && game.turn === playerColor) status = "Check! Your move";

  const opponentChip =
    engineStatus === "loading" ? (
      <span className="chip">Loading engine…</span>
    ) : engineStatus === "error" ? (
      <span className="chip bad">Engine error</span>
    ) : thinking ? (
      <span className="chip">Thinking…</span>
    ) : null;

  const caps = summarizeCaptures(reviewing ? history.slice(0, reviewPly) : history);
  const capturedBy = (c: "w" | "b") => (c === "w" ? caps.byWhite : caps.byBlack);

  const top = (
    <PlayerBar
      name="Stockfish"
      detail={`${settings.elo} Elo`}
      color={opponentColor}
      active={started && !result && game.turn === opponentColor}
      chip={opponentChip}
      captured={capturedBy(opponentColor)}
      advantage={advantageFor(opponentColor, caps.balance)}
    />
  );
  const bottom = (
    <PlayerBar
      name="You"
      detail={status || " "}
      color={playerColor}
      active={started && !result && game.turn === playerColor}
      captured={capturedBy(playerColor)}
      advantage={advantageFor(playerColor, caps.balance)}
    />
  );
  const flippedView = orientation !== (playerColor === "w" ? "white" : "black");

  return (
    <div className={`app ${hints.bestMoves || reviewing ? "with-analysis" : ""} ${reviewing ? "reviewing" : ""}`}>
      {engineStatus === "error" && (
        <div className="banner" role="alert">
          Stockfish could not start. Reload the page; if it keeps failing, try another browser.
        </div>
      )}
      <main className="play">
        <section className="board-col">
          {flippedView ? bottom : top}
          <div className={`board-row ${hints.evalBar || reviewing ? "" : "no-eval"}`}>
            {reviewing ? (
              <EvalBar
                key={`review-${gameKey}`}
                score={review.evals[reviewPly]?.score ?? null}
                lastCp={null}
                depth={99}
                result={reviewPly === lastPly ? result : null}
                orientation={orientation}
              />
            ) : (
              hints.evalBar && (
              <EvalBar
                key={gameKey}
                score={bestLine?.score ?? null}
                lastCp={analysis.lastCp}
                depth={analysis.depth}
                result={result}
                orientation={orientation}
                hidden={hiddenOnMyTurn}
              />
              )
            )}
            <Board
              game={game}
              orientation={orientation}
              onPromotion={(from, to) => setPromo({ from, to })}
              view={boardView}
            />
          </div>
          {flippedView ? top : bottom}
        </section>
        <aside className="side">
          {reviewing ? (
            <ReviewPanel review={review} history={history} ply={reviewPly} playerColor={playerColor} onSelect={goTo} />
          ) : (
            <>
              {hints.bestMoves && <AnalysisPanel analysis={analysis} lines={hints.lines} hiddenReason={hiddenReason} />}
              <div className="moves-box">
                <h2 className="label">Moves</h2>
                <MoveList history={history} />
              </div>
            </>
          )}
        </aside>
      </main>

      {reviewing ? (
        <nav className="tabbar" aria-label="Review navigation">
          <button onClick={() => goTo(0)} disabled={reviewPly === 0}>
            <FirstIcon />
            Start
          </button>
          <button onClick={() => goTo(reviewPly - 1)} disabled={reviewPly === 0}>
            <PrevIcon />
            Back
          </button>
          <button onClick={() => goTo(reviewPly + 1)} disabled={reviewPly === lastPly}>
            <NextIcon />
            Next
          </button>
          <button onClick={() => goTo(lastPly)} disabled={reviewPly === lastPly}>
            <LastIcon />
            End
          </button>
          <button onClick={() => setReviewing(false)}>
            <CloseIcon />
            Done
          </button>
        </nav>
      ) : (
      <nav className="tabbar" aria-label="Game actions">
        <button onClick={() => setSheet("new")}>
          <PlusIcon />
          New
        </button>
        <button onClick={undo} disabled={!game.canUndo}>
          <UndoIcon />
          Undo
        </button>
        <button onClick={() => setFlipped((f) => !f)}>
          <FlipIcon />
          Flip
        </button>
        <button onClick={() => setSheet("hints")} className={anyHintOn(hints) ? "" : "off"}>
          <BulbIcon />
          Hints
        </button>
        {result && history.length > 0 ? (
          <button onClick={openReview}>
            <ChartIcon />
            Review
          </button>
        ) : (
          <button onClick={() => setSheet("resign")} disabled={!started || !!result}>
            <FlagIcon />
            Resign
          </button>
        )}
      </nav>
      )}

      {sheet === "new" && (
        <NewGameSheet
          initial={settings}
          limiterMin={game.limiterMin}
          canCancel={started}
          onStart={start}
          onCancel={() => setSheet(null)}
        />
      )}

      {sheet === "hints" && <HintsSheet hints={hints} onChange={setHints} onClose={() => setSheet(null)} />}

      {sheet === "resign" && (
        <div className="overlay" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-label="Resign" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <h2>Resign this game?</h2>
            <p className="hint">Stockfish wins. You can still undo moves afterwards.</p>
            <div className="sheet-actions">
              <button className="btn ghost" onClick={() => setSheet(null)}>
                Keep playing
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  game.resign();
                  setResultHidden(false);
                  setSheet(null);
                }}
              >
                Resign
              </button>
            </div>
          </div>
        </div>
      )}

      {promo && (
        <PromotionDialog
          color={playerColor}
          onCancel={() => setPromo(null)}
          onChoose={(p) => {
            game.playMove(promo.from, promo.to, p);
            setPromo(null);
          }}
        />
      )}

      {result && !resultHidden && !sheet && (
        <GameOverCard
          result={result}
          playerColor={playerColor}
          moveCount={moveCount}
          onRematch={() => start(settings)}
          onNewGame={() => setSheet("new")}
          onReview={history.length > 0 ? openReview : null}
          onClose={() => setResultHidden(true)}
        />
      )}
    </div>
  );
}
