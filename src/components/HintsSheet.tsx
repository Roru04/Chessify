import type { HintSettings } from "../analysis/hints";

interface Props {
  hints: HintSettings;
  onChange: (h: HintSettings) => void;
  onClose: () => void;
}

const TOGGLES: { key: "evalBar" | "bestMoves" | "hideOnMyTurn"; label: string; help?: string }[] = [
  { key: "evalBar", label: "Evaluation bar" },
  { key: "bestMoves", label: "Best moves list" },
  { key: "hideOnMyTurn", label: "Hide hints on my turn", help: "Make your move first, then compare it with the engine." },
];

export function HintsSheet({ hints, onChange, onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Hints" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Hints</h2>
        <div className="toggles">
          {TOGGLES.map((t) => (
            <label key={t.key} className="toggle" htmlFor={`hint-${t.key}`}>
              <span>
                {t.label}
                {t.help && <small>{t.help}</small>}
              </span>
              <input
                id={`hint-${t.key}`}
                type="checkbox"
                role="switch"
                checked={hints[t.key]}
                onChange={(e) => onChange({ ...hints, [t.key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
        <fieldset className="field" disabled={!hints.bestMoves}>
          <legend className="label">Lines shown</legend>
          <div className="seg">
            {([1, 2, 3] as const).map((n) => (
              <button
                type="button"
                key={n}
                className={hints.lines === n ? "on" : ""}
                aria-pressed={hints.lines === n}
                onClick={() => onChange({ ...hints, lines: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <button className="btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
