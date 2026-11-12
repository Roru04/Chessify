import type { PositionEval, MoveClass } from "../review/classify";
import { whiteWinPercent } from "../review/classify";

interface Props {
  evals: (PositionEval | undefined)[];
  /** Classification of move i (shown as a dot at position i + 1). */
  marks: (MoveClass | undefined)[];
  /** Currently shown position (0 = start). */
  ply: number;
  onSelect: (ply: number) => void;
}

const W = 300;
const H = 80;
const SHOWN: MoveClass[] = ["brilliant", "great", "inaccuracy", "mistake", "miss", "blunder"];

/** White's winning chances over the game: white area below the line, dark above. */
export function EvalGraph({ evals, marks, ply, onSelect }: Props) {
  const n = Math.max(1, evals.length - 1);
  // Only draw the analysed prefix of the game.
  const pts: [number, number][] = [];
  for (let i = 0; i < evals.length; i++) {
    const e = evals[i];
    if (!e) break;
    pts.push([(i / n) * W, (1 - whiteWinPercent(e) / 100) * H]);
  }
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L0,${H} Z` : "";

  return (
    <div className="evalgraph">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width={W} height={H} fill="var(--eval-black)" />
        {area && <path d={area} fill="var(--eval-white)" />}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.6" />
      </svg>
      {marks.map((m, i) =>
        m && SHOWN.includes(m) && pts[i + 1] ? (
          <span
            key={i}
            className={`gdot c-${m}`}
            style={{ left: `${((i + 1) / n) * 100}%`, top: `${(pts[i + 1][1] / H) * 100}%` }}
          />
        ) : null,
      )}
      {/* Only the handle reacts to the pointer (see CSS); tapping the graph itself does nothing. */}
      <input
        className="graph-slider"
        type="range"
        min={0}
        max={n}
        step={1}
        value={Math.min(ply, n)}
        aria-label="Move in the game"
        aria-valuetext={ply === 0 ? "Start of the game" : `After half-move ${ply}`}
        onChange={(e) => onSelect(Number(e.target.value))}
      />
    </div>
  );
}
