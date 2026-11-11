import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

/** Colour for right-click square highlights (like chess.com). */
const MARK = "rgba(235, 97, 80, 0.8)";

/**
 * Right-click square highlights: toggle with a right click, cleared by a left
 * click or when `resetKey` (usually the position) changes.
 */
export function useSquareMarks(resetKey: string) {
  const [marks, setMarks] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => setMarks(new Set()), [resetKey]);

  const toggle = useCallback((square: string) => {
    setMarks((m) => {
      const next = new Set(m);
      if (next.has(square)) next.delete(square);
      else next.add(square);
      return next;
    });
  }, []);

  const clear = useCallback(() => setMarks((m) => (m.size ? new Set() : m)), []);

  const styles = useMemo(() => {
    const s: Record<string, CSSProperties> = {};
    for (const sq of marks) s[sq] = { background: MARK };
    return s;
  }, [marks]);

  return { toggle, clear, styles };
}
