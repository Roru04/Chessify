import { useEffect, useState } from "react";

export type ThemeChoice = "auto" | "light" | "dark";

/** Same key as the inline script in index.html, which applies it before the first paint. */
const KEY = "chess-analyzer.theme.v1";
const ORDER: ThemeChoice[] = ["auto", "light", "dark"];
const LABEL: Record<ThemeChoice, string> = { auto: "Auto", light: "Light", dark: "Dark" };

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

const icon = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Cycles Auto (follow the device) → Light → Dark. */
export function ThemeSwitch() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice);

  useEffect(() => {
    apply(choice);
    try {
      if (choice === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch {
      /* storage unavailable: the choice lasts until reload */
    }
  }, [choice]);

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  return (
    <button
      type="button"
      className="theme-switch"
      onClick={() => setChoice(next)}
      aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[next]}`}
      title={`Theme: ${LABEL[choice]} (click for ${LABEL[next]})`}
    >
      {choice === "light" ? (
        <svg {...icon}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : choice === "dark" ? (
        <svg {...icon}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg {...icon}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
      )}
      <span>{LABEL[choice]}</span>
    </button>
  );
}
