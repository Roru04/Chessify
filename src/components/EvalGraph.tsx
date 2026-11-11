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
const SHOWN: MoveClass[] = ["inaccuracy", "mistake", "blunder"];

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

  function pick(clientX: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onSelect(Math.round(t * n));
  }

  return (
    <div
      className="evalgraph"
      role="slider"
      tabIndex={0}
      aria-label="Evaluation graph, choose a move"
      aria-valuemin={0}
      aria-valuemax={n}
      aria-valuenow={ply}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e.clientX, e.currentTarget);
      }}
      onPointerMove={(e) => e.buttons && pick(e.clientX, e.currentTarget)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width={W} height={H} fill="var(--eval-black)" />
        {area && <path d={area} fill="var(--eval-white)" />}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.6" />
        <line x1={(ply / n) * W} y1="0" x2={(ply / n) * W} y2={H} stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
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
    </div>
  );
}
