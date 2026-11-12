// Import tab: load a chess.com player's recent games and review one.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Move } from "chess.js";
import { GameReview } from "../components/GameReview";
import { REASONS } from "../game/endReasons";
import { getImportReviewEngine } from "../engine/engines";
import {
  ChessComError,
  clearChessComCache,
  fetchArchives,
  fetchMonth,
  gameMoves,
  gameResult,
  monthLabel,
  normalizeUsername,
  userColor,
  type ChessComGame,
  type TimeClass,
} from "./chesscom";
import "./import.css";

const USER_KEY = "chess-analyzer.import.user";
/** Empty months (only variants, or no games) are skipped, up to this many in a row. */
const MAX_EMPTY_MONTHS = 6;
/** Long games take a while to analyse; show a note above this many moves. */
const LONG_GAME_MOVES = 60;

type Outcome = "win" | "loss" | "draw";
type TimeFilter = "all" | TimeClass;
type ResultFilter = "all" | Outcome;

const TIME_LABEL: Record<TimeClass, string> = { bullet: "Bullet", blitz: "Blitz", rapid: "Rapid", daily: "Daily" };
const OUTCOME_LABEL: Record<Outcome, string> = { win: "Won", loss: "Lost", draw: "Draw" };

function readSavedUser(): string {
  try {
    return localStorage.getItem(USER_KEY) ?? "";
  } catch {
    return "";
  }
}
function saveUser(name: string) {
  try {
    localStorage.setItem(USER_KEY, name);
  } catch {
    // storage blocked: the field just starts empty next time
  }
}

function outcomeFor(g: ChessComGame, user: string): Outcome {
  const w = gameResult(g).winner;
  if (w === null) return "draw";
  return w === userColor(g, user) ? "win" : "loss";
}

/** "Won by checkmate", "Lost on time", "Draw by agreement", "Stalemate". */
function endText(outcome: Outcome, game: ChessComGame): string {
  const reason = REASONS[gameResult(game).reason];
  return outcome === "draw" ? reason : `${OUTCOME_LABEL[outcome]} ${reason}`;
}

/** "180+2" → "3+2", "600" → "10 min", "1/86400" → "1 day". */
function formatTimeControl(tc: string): string {
  const daily = tc.match(/^1\/(\d+)$/);
  if (daily) {
    const days = Math.round(Number(daily[1]) / 86400);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  const [base, inc] = tc.split("+").map(Number);
  if (!Number.isFinite(base)) return tc;
  const min = base >= 60 ? `${+(base / 60).toFixed(1)}` : `${base}s`;
  return inc ? `${min}+${inc}` : base >= 60 ? `${min} min` : min;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

interface Loaded {
  user: string;
  /** Month archive URLs, newest first. */
  archives: string[];
  /** How many archives have been loaded. */
  next: number;
  games: ChessComGame[];
}

interface Selected {
  game: ChessComGame;
  moves: Move[];
}

export default function ImportScreen({ active }: { active: boolean }) {
  const [input, setInput] = useState(readSavedUser);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [selected, setSelected] = useState<Selected | null>(null);

  /** Loads archives from `from` on until one month with games is found (skipping empty ones). */
  async function loadMore(base: Loaded): Promise<Loaded> {
    let { next, games } = base;
    let empty = 0;
    while (next < base.archives.length) {
      const month = await fetchMonth(base.archives[next]);
      next++;
      if (month.length > 0) {
        games = [...games, ...month];
        break;
      }
      if (++empty >= MAX_EMPTY_MONTHS) break;
    }
    return { ...base, next, games };
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof ChessComError ? e.message : "Something went wrong while loading the games. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function search(e?: FormEvent) {
    e?.preventDefault();
    const user = normalizeUsername(input);
    if (!user) {
      setError("Enter a chess.com username (3–25 letters, digits, _ or -).");
      return;
    }
    void run(async () => {
      const archives = await fetchArchives(user);
      saveUser(input.trim());
      setTimeFilter("all");
      setResultFilter("all");
      setLoaded(await loadMore({ user, archives, next: 0, games: [] }));
    });
  }

  function refresh() {
    if (!loaded) return;
    clearChessComCache();
    void run(async () => {
      const archives = await fetchArchives(loaded.user);
      setLoaded(await loadMore({ user: loaded.user, archives, next: 0, games: [] }));
    });
  }

  function older() {
    if (!loaded) return;
    void run(async () => setLoaded(await loadMore(loaded)));
  }

  function open(game: ChessComGame) {
    try {
      setSelected({ game, moves: gameMoves(game) });
    } catch {
      setError("This game's moves couldn't be read, so it can't be reviewed.");
    }
  }

  // Load the remembered player's games when the tab is first opened.
  useEffect(() => {
    if (input && !loaded) search();
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => {
    if (!loaded) return [];
    return loaded.games.filter(
      (g) => (timeFilter === "all" || g.timeClass === timeFilter) && (resultFilter === "all" || outcomeFor(g, loaded.user) === resultFilter),
    );
  }, [loaded, timeFilter, resultFilter]);

  const timeClasses = useMemo(() => {
    const present = new Set(loaded?.games.map((g) => g.timeClass));
    return (Object.keys(TIME_LABEL) as TimeClass[]).filter((t) => present.has(t));
  }, [loaded]);

  if (selected && loaded) {
    const { game, moves } = selected;
    const color = userColor(game, loaded.user) ?? "w";
    const me = color === "w" ? game.white : game.black;
    const opp = color === "w" ? game.black : game.white;
    const result = gameResult(game);
    const outcome = outcomeFor(game, loaded.user);
    const long = moves.length / 2 > LONG_GAME_MOVES;
    return (
      <GameReview
        key={game.id}
        history={moves}
        result={result}
        playerColor={color}
        orientation={color === "w" ? "white" : "black"}
        you={{ name: me.username, detail: `${me.rating} · ${endText(outcome, game)}` }}
        opponent={{ name: opp.username, detail: String(opp.rating) }}
        opponentName={opp.username}
        compareAccuracy={game.accuracies ? { label: "chess.com", values: game.accuracies } : null}
        active={active}
        getEngine={getImportReviewEngine}
        bookPlies={game.openingPlies}
        onClose={() => setSelected(null)}
        closeLabel="Games"
      >
        {long && (
          <div className="import-note" role="status">
            Long game ({Math.ceil(moves.length / 2)} moves): the analysis takes a while. You can browse while it runs.
          </div>
        )}
      </GameReview>
    );
  }

  return (
    <div className="import-page">
      <header className="import-head">
        <h1>Review your chess.com games</h1>
        <p>Enter your chess.com username to load your recent games, then pick one for a full review.</p>
      </header>

      <form className="import-search" onSubmit={search}>
        <label className="label" htmlFor="cc-user">
          chess.com username
        </label>
        <div className="import-search-row">
          <input
            id="cc-user"
            className="text"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="e.g. magnuscarlsen"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn" disabled={busy || input.trim() === ""}>
            Load games
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      {busy && !loaded && <p className="loading">Loading games…</p>}

      {loaded && (
        <section className="import-results" aria-label="Games">
          <div className="import-toolbar">
            <span className="label">
              {loaded.games.length === 0
                ? "No games found"
                : `${shown.length} of ${loaded.games.length} games · since ${monthLabel(loaded.archives[loaded.next - 1] ?? "")}`}
            </span>
            <button type="button" className="link" onClick={refresh} disabled={busy}>
              Refresh
            </button>
          </div>

          {loaded.games.length > 0 && (
            <div className="import-filters">
              <div className="chips" role="group" aria-label="Time control">
                {(["all", ...timeClasses] as TimeFilter[]).map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={timeFilter === t ? "on" : ""}
                    aria-pressed={timeFilter === t}
                    onClick={() => setTimeFilter(t)}
                  >
                    {t === "all" ? "All" : TIME_LABEL[t]}
                  </button>
                ))}
              </div>
              <div className="chips" role="group" aria-label="Result">
                {(["all", "win", "loss", "draw"] as ResultFilter[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={resultFilter === r ? "on" : ""}
                    aria-pressed={resultFilter === r}
                    onClick={() => setResultFilter(r)}
                  >
                    {r === "all" ? "All" : OUTCOME_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loaded.archives.length === 0 && <p className="hint">This player hasn't finished any games on chess.com yet.</p>}
          {loaded.games.length > 0 && shown.length === 0 && <p className="hint">No games match these filters. Load older games or change the filters.</p>}

          <ul className="game-list">
            {shown.map((g) => {
              const color = userColor(g, loaded.user) ?? "w";
              const opp = color === "w" ? g.black : g.white;
              const me = color === "w" ? g.white : g.black;
              const outcome = outcomeFor(g, loaded.user);
              return (
                <li key={g.id}>
                  <button type="button" className="game-row" onClick={() => open(g)}>
                    <span className={`outcome o-${outcome}`} aria-label={OUTCOME_LABEL[outcome]}>
                      {outcome === "win" ? "W" : outcome === "loss" ? "L" : "D"}
                    </span>
                    <span className="game-main">
                      <span className="game-players">
                        <span className={`piece-dot ${color === "w" ? "white" : "black"}`} aria-label={color === "w" ? "You played White" : "You played Black"} />
                        vs <b>{opp.username}</b> <span className="muted">({opp.rating})</span>
                      </span>
                      <span className="game-meta">
                        {TIME_LABEL[g.timeClass]} {formatTimeControl(g.timeControl)} · {formatDate(g.endTime)} · {endText(outcome, g)}
                      </span>
                      {g.opening && <span className="game-opening">{g.opening}</span>}
                    </span>
                    <span className="game-side">
                      <span className="game-rating">{me.rating}</span>
                      {g.accuracies && (
                        <span className="game-acc" title="chess.com accuracy (you)">
                          {g.accuracies[color].toFixed(1)}%
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {loaded.next < loaded.archives.length && (
            <button type="button" className="btn ghost import-more" onClick={older} disabled={busy}>
              {busy ? "Loading…" : `Load older games (${monthLabel(loaded.archives[loaded.next])})`}
            </button>
          )}
        </section>
      )}

      <p className="hint import-privacy">
        Games are loaded directly from chess.com's public API. Only the username is sent; nothing is stored except the last username, in this
        browser.
      </p>
    </div>
  );
}
