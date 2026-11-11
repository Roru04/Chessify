import { Suspense, lazy, useEffect, useState } from "react";
import App from "./App";
import { ThemeSwitch } from "./components/ThemeSwitch";

// The Learn tab is loaded only when it is opened, so playing stays fast.
const LearnScreen = lazy(() => import("./learn/LearnScreen"));

const readRoute = () => (typeof location === "undefined" ? "" : location.hash.replace(/^#/, ""));
const LEARN_PAGES = ["learn", "practice", "tactic", "lesson", "puzzles"];
const isLearn = (r: string) => LEARN_PAGES.some((p) => r === p || r.startsWith(`${p}-`));

/** Top-level tabs: Play (the game, kept mounted so it isn't lost) and Learn. */
export default function Root() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const learn = isLearn(route);

  return (
    <div className="root">
      <header className="topnav">
        <span className="brand">Chessify</span>
        <ThemeSwitch />
        <nav className="navswitch" aria-label="Sections">
          <a href="#play" className={learn ? "" : "on"} aria-current={learn ? undefined : "page"}>
            Play
          </a>
          <a href="#learn" className={learn ? "on" : ""} aria-current={learn ? "page" : undefined}>
            Learn
          </a>
        </nav>
      </header>
      <div className="screen" hidden={learn}>
        <App active={!learn} />
      </div>
      {learn && (
        <div className="screen screen-learn">
          <Suspense fallback={<p className="loading">Loading lessons…</p>}>
            <LearnScreen route={route} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
