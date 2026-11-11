// Small inline icons for the tab bar (stroke = currentColor).
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const UndoIcon = () => (
  <svg {...base}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);
export const FlipIcon = () => (
  <svg {...base}>
    <path d="M7 4v16M7 4 3 8M7 4l4 4" />
    <path d="M17 20V4M17 20l-4-4M17 20l4-4" />
  </svg>
);
export const FlagIcon = () => (
  <svg {...base}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);
export const BulbIcon = () => (
  <svg {...base}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  </svg>
);
export const FirstIcon = () => (
  <svg {...base}>
    <path d="M6 5v14M18 6l-7 6 7 6" />
  </svg>
);
export const PrevIcon = () => (
  <svg {...base}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const NextIcon = () => (
  <svg {...base}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const LastIcon = () => (
  <svg {...base}>
    <path d="M18 5v14M6 6l7 6-7 6" />
  </svg>
);
export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ChartIcon = () => (
  <svg {...base}>
    <path d="M4 20V4M4 20h16" />
    <path d="M7 15l4-5 3 3 5-7" />
  </svg>
);
