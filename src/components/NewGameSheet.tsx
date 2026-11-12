import { useState } from "react";
import { LEVELS, levelById } from "../engine/levels";
import type { ColorChoice, GameSettings } from "../game/settings";

interface Props {
  initial: GameSettings;
  canCancel: boolean;
  onStart: (s: GameSettings) => void;
  onCancel: () => void;
}

const COLORS: { value: ColorChoice; label: string; glyph: string }[] = [
  { value: "w", label: "White", glyph: "♔" },
  { value: "random", label: "Random", glyph: "⚄" },
  { value: "b", label: "Black", glyph: "♚" },
];

export function NewGameSheet({ initial, canCancel, onStart, onCancel }: Props) {
  const [color, setColor] = useState<ColorChoice>(initial.color);
  const [level, setLevel] = useState(levelById(initial.level).id);
  const [thinkMs, setThinkMs] = useState(initial.thinkMs);

  function start() {
    onStart({ color, level, thinkMs });
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

        <fieldset className="field">
          <legend className="label">Opponent</legend>
          <div className="levels" role="radiogroup" aria-label="Opponent level">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l.id}
                role="radio"
                aria-checked={level === l.id}
                className={level === l.id ? "on" : ""}
                onClick={() => setLevel(l.id)}
              >
                <span className="level-name">
                  <span className="level-no">{l.id}</span>
                  {l.name}
                </span>
                <span className="level-elo">{l.approxElo === null ? "max" : `≈ ${l.approxElo}`}</span>
              </button>
            ))}
          </div>
          <p className="hint">{levelById(level).blurb} Ratings are rough estimates.</p>
        </fieldset>

        <div className="field">
          <label className="label" htmlFor="think-slider">
            <span>Computer think time</span>
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
            aria-describedby="think-hint"
          />
          <p className="hint" id="think-hint">
            Only affects strength at levels 7–10. At levels 1–6 it just sets how quickly the computer replies.
          </p>
        </div>

        <div className="sheet-actions">
          {canCancel && (
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn">
            Start game
          </button>
        </div>
      </form>
    </div>
  );
}
