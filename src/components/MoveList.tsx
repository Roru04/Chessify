import { useEffect, useRef } from "react";
import type { Move } from "chess.js";
import { CLASS_INFO, type MoveClass } from "../review/classify";

interface Props {
  history: Move[];
  /** Number of moves shown on the board (default: all). The last of them is highlighted. */
  currentPly?: number;
  /** Review classifications per move (index into history). */
  marks?: (MoveClass | undefined)[];
  /** Makes moves clickable (review mode); receives the ply after that move. */
  onSelect?: (ply: number) => void;
}

const MARKED: MoveClass[] = ["brilliant", "great", "inaccuracy", "mistake", "miss", "blunder"];

export function MoveList({ history, currentPly, marks, onSelect }: Props) {
  const ref = useRef<HTMLOListElement>(null);
  const cur = (currentPly ?? history.length) - 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(".cur");
    if (active && onSelect) {
      // Scroll only inside the list (if it has its own scroll area), never the page:
      // scrollIntoView would also scroll the page down to the list on every step.
      const box = el.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      let top = el.scrollTop;
      let left = el.scrollLeft;
      if (r.top < box.top) top -= box.top - r.top;
      else if (r.bottom > box.bottom) top += r.bottom - box.bottom;
      if (r.left < box.left) left -= box.left - r.left;
      else if (r.right > box.right) left += r.right - box.right;
      if (top !== el.scrollTop || left !== el.scrollLeft) el.scrollTo({ top, left, behavior: "smooth" });
    } else el.scrollTo({ left: el.scrollWidth, top: el.scrollHeight, behavior: "smooth" });
  }, [history.length, cur, onSelect]);

  const rows: { n: number; white?: number; black?: number }[] = [];
  history.forEach((m, i) => {
    const num = Number(m.before.split(" ")[5]);
    if (m.color === "w" || rows.length === 0 || rows[rows.length - 1].n !== num) rows.push({ n: num });
    rows[rows.length - 1][m.color === "w" ? "white" : "black"] = i;
  });

  if (rows.length === 0)
    return (
      <ol className="moves empty" ref={ref}>
        <li>No moves yet</li>
      </ol>
    );

  const cell = (i: number | undefined) => {
    if (i === undefined) return <span>…</span>;
    const mark = marks?.[i];
    const content = (
      <>
        {history[i].san}
        {mark && MARKED.includes(mark) && <span className={`mark c-${mark}`}>{CLASS_INFO[mark].symbol}</span>}
      </>
    );
    const cls = i === cur ? "cur" : "";
    return onSelect ? (
      <button type="button" className={`mv ${cls}`} onClick={() => onSelect(i + 1)}>
        {content}
      </button>
    ) : (
      <span className={cls}>{content}</span>
    );
  };

  return (
    <ol className={`moves ${onSelect ? "selectable" : ""}`} ref={ref} aria-label="Moves">
      {rows.map((r) => (
        <li key={r.n}>
          <span className="n">{r.n}.</span>
          {cell(r.white)}
          {r.black !== undefined && cell(r.black)}
        </li>
      ))}
    </ol>
  );
}
