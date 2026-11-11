import { useState } from "react";
import { ELO_MAX, ELO_MIN, clampElo } from "../engine/strength";
import { ELO_PRESETS, type ColorChoice, type GameSettings } from "../game/settings";

interface Props {
  initial: GameSettings;
  /** Stockfish's own Elo limiter minimum; below it the strength is approximate. */
  limiterMin: number;
  canCancel: boolean;
  onStart: (s: GameSettings) => void;
  onCancel: () => void;
}

const COLORS: { value: ColorChoice; label: string; glyph: string }[] = [
  { value: "w", label: "White", glyph: "♔" },
  { value: "random", label: "Random", glyph: "⚄" },
  { value: "b", label: "Black", glyph: "♚" },
];

export function NewGameSheet({ initial, limiterMin, canCancel, onStart, onCancel }: Props) {
  const [color, setColor] = useState<ColorChoice>(initial.color);
  const [elo, setElo] = useState(initial.elo);
  const [eloText, setEloText] = useState(String(initial.elo));
  const [thinkMs, setThinkMs] = useState(initial.thinkMs);

  const eloInvalid = eloText.trim() === "" || Number(eloText) < ELO_MIN || Number(eloText) > ELO_MAX;

  function setEloBoth(v: number) {
    const c = clampElo(v);
    setElo(c);
    setEloText(String(c));
  }

  function start() {
    onStart({ color, elo: clampElo(Number(eloText) || elo), thinkMs });
  }

  return (
    <div className="overlay" onClick={canCancel ? onCancel : undefined}>
      <form
        className="sheet"
        role="dialog"
        aria-label="New game"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <div className="grab" />
        <h2>New game</h2>

        <fieldset className="field">
          <legend className="label">Play as</legend>
          <div className="seg">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                className={color === c.value ? "on" : ""}
                aria-pressed={color === c.value}
                onClick={() => setColor(c.value)}
              >
                <span aria-hidden="true">{c.glyph}&#xFE0E;</span>
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="label" htmlFor="elo-input">
            Opponent Elo
          </label>
          <div className="elo">
            <input
              id="elo-input"
              className="num"
              type="number"
              inputMode="numeric"
              min={ELO_MIN}
              max={ELO_MAX}
              step={1}
              value={eloText}
              aria-invalid={eloInvalid}
              onChange={(e) => {
                setEloText(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value !== "" && n >= ELO_MIN && n <= ELO_MAX) setElo(Math.round(n));
              }}
              onBlur={() => setEloBoth(Number(eloText) || elo)}
            />
            <input
              id="elo-slider"
              className="range"
              type="range"
              min={ELO_MIN}
              max={ELO_MAX}
              step={10}
              value={elo}
              aria-label="Opponent Elo slider"
              onChange={(e) => setEloBoth(Number(e.target.value))}
            />
          </div>
          <div className="range-ends">
            <span>{ELO_MIN}</span>
            <span>{ELO_MAX}</span>
          </div>
          {eloInvalid && <p className="error">Enter a number from {ELO_MIN} to {ELO_MAX}.</p>}
          <div className="presets">
            {ELO_PRESETS.map((p) => (
              <button type="button" key={p.elo} className={elo === p.elo ? "on" : ""} onClick={() => setEloBoth(p.elo)}>
                {p.label} {p.elo}
              </button>
            ))}
          </div>
          {elo < limiterMin && (
            <p className="hint">Below {limiterMin} Elo the app weakens Stockfish itself, so this strength is an approximation.</p>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="think-slider">
            <span>Time per computer move</span>
            <span className="value">{(thinkMs / 1000).toFixed(1)} s</span>
          </label>
          <input
            id="think-slider"
            className="range"
            type="range"
            min={200}
            max={3000}
            step={100}
            value={thinkMs}
            onChange={(e) => setThinkMs(Number(e.target.value))}
          />
        </div>

        <div className="sheet-actions">
          {canCancel && (
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn" disabled={eloInvalid}>
            Start game
          </button>
        </div>
      </form>
    </div>
  );
}
