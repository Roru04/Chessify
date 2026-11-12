import { useState } from "react";
import type { Square } from "chess.js";
import { anyHintOn, loadHints, saveHints, type HintSettings } from "./analysis/hints";
import { useAnalysis } from "./analysis/useAnalysis";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { Board } from "./components/Board";
import { EvalBar } from "./components/EvalBar";
import { HintsSheet } from "./components/HintsSheet";
import { GameOverCard } from "./components/GameOverCard";
import { GameReview } from "./components/GameReview";
import {
  BulbIcon,
  ChartIcon,
  FlagIcon,
  FlipIcon,
  PlusIcon,
  UndoIcon,
} from "./components/Icons";
import { MoveList } from "./components/MoveList";
import { NewGameSheet } from "./components/NewGameSheet";
import { levelById, levelLabel } from "./engine/levels";
import { PlayerBar } from "./components/PlayerBar";
import { PromotionDialog } from "./components/PromotionDialog";
import { loadSettings, saveSettings, type GameSettings } from "./game/settings";
import { advantageFor, summarizeCaptures } from "./game/material";
import { useChessGame } from "./game/useChessGame";

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
  /** Post-game review is shown. */
  const [reviewing, setReviewing] = useState(false);

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

  function openReview() {
    setResultHidden(true);
    setReviewing(true);
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

  const engineBanner = engineStatus === "error" && (
    <div className="banner" role="alert">
      Stockfish could not start. Reload the page; if it keeps failing, try another browser.
    </div>
  );

  // Post-game review (uses the idle opponent engine).
  if (reviewing) {
    return (
      <GameReview
        key={gameKey}
        history={history}
        result={result}
        playerColor={playerColor}
        orientation={orientation}
        you={{ name: "You", detail: "Game review" }}
        opponent={{ name: "Stockfish", detail: levelLabel(levelById(settings.level)) }}
        opponentName="Stockfish"
        game={game}
        active={active}
        onClose={() => setReviewing(false)}
      >
        {engineBanner}
      </GameReview>
    );
  }

  const caps = summarizeCaptures(history);
  const capturedBy = (c: "w" | "b") => (c === "w" ? caps.byWhite : caps.byBlack);

  const top = (
    <PlayerBar
      name="Stockfish"
      detail={levelLabel(levelById(settings.level))}
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
    <div className={`app ${hints.bestMoves ? "with-analysis" : ""}`}>
      {engineBanner}
      <main className="play">
        <section className="board-col">
          {flippedView ? bottom : top}
          <div className={`board-row ${hints.evalBar ? "" : "no-eval"}`}>
            {hints.evalBar && (
              <EvalBar
                key={gameKey}
                score={bestLine?.score ?? null}
                lastCp={analysis.lastCp}
                depth={analysis.depth}
                result={result}
                orientation={orientation}
                hidden={hiddenOnMyTurn}
              />
            )}
            <Board game={game} orientation={orientation} onPromotion={(from, to) => setPromo({ from, to })} />
          </div>
          {flippedView ? top : bottom}
        </section>
        <aside className="side">
          {hints.bestMoves && <AnalysisPanel analysis={analysis} lines={hints.lines} hiddenReason={hiddenReason} />}
          <div className="moves-box">
            <h2 className="label">Moves</h2>
            <MoveList history={history} />
          </div>
        </aside>
      </main>

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

      {sheet === "new" && (
        <NewGameSheet
          initial={settings}
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
