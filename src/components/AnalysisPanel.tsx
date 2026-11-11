import type { AnalysisState } from "../analysis/useAnalysis";
import { formatScore } from "../analysis/format";

interface Props {
  analysis: AnalysisState;
  lines: number;
  /** Why no analysis is shown, if it isn't. */
  hiddenReason: string | null;
}

export function AnalysisPanel({ analysis, lines, hiddenReason }: Props) {
  return (
    <section className="analysis" aria-label="Best moves">
      <div className="label">
        <span>Best moves</span>
        {!hiddenReason && <span className="depth">{analysis.depth ? `depth ${analysis.depth}` : "thinking…"}</span>}
      </div>
      {hiddenReason ? (
        <p className="analysis-note">{hiddenReason}</p>
      ) : (
        <ol className="lines">
          {Array.from({ length: lines }, (_, i) => {
            const l = analysis.lines[i];
            return (
              <li key={i} className={i === 0 ? "best" : ""}>
                <span className="ev">{l ? formatScore(l.score) : "…"}</span>
                <span className="pv">
                  {l?.pv.map((m, j) => (
                    <span key={j} className={j === 0 ? "first" : ""}>
                      {m.label && <span className="mn">{m.label}</span>}
                      {m.san}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
