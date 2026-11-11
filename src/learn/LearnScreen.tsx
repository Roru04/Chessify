// The Learn tab. Pages are addressed by the URL hash:
//   #learn                    overview
//   #learn-italian            course page
//   #learn-italian-main       lesson (step through a line)
//   #practice-italian-main    practice a line
import type { Color } from "chess.js";
import { LessonPlayer } from "./LessonPlayer";
import { PuzzlePlayer } from "./PuzzlePlayer";
import { TACTIC_THEMES, findTheme, puzzlesFor, type TacticTheme } from "./middlegame/themes";
import { cleanCount } from "./middlegame/puzzleProgress";
import { parseLesson } from "./pgnLesson";
import { PracticePlayer } from "./PracticePlayer";
import { OPENING_COURSES, UPCOMING_OPENINGS, findCourse, lessonForLine, type OpeningCourse } from "./courses";
import { STATUS_LABEL, getProgress, statusOf } from "./progress";
import "./learn.css";

export default function LearnScreen({ route }: { route: string }) {
  const [kind, courseId, lineId] = route.split("-");

  // Middlegame tactics: #tactic-fork, #lesson-fork, #puzzles-fork
  const theme = ["tactic", "lesson", "puzzles"].includes(kind) ? findTheme(courseId ?? "") : undefined;
  if (theme) {
    const crumbs = <Crumbs items={[["Learn", "#learn"], [theme.name, `#tactic-${theme.id}`]]} />;
    if (kind === "lesson") {
      const lesson = parseLesson(theme.lessonPgn);
      const youWhite = lesson.steps[1]?.color === "w";
      return (
        <div className="learn">
          {crumbs}
          <LessonPlayer
            key={`t-${theme.id}`}
            title={theme.name}
            lesson={lesson}
            orientation={youWhite ? "white" : "black"}
            endAction={{ href: `#puzzles-${theme.id}`, label: "Solve puzzles" }}
          />
        </div>
      );
    }
    if (kind === "puzzles") {
      return (
        <div className="learn">
          {crumbs}
          <PuzzlePlayer key={`z-${theme.id}`} theme={theme} puzzles={puzzlesFor(theme)} />
        </div>
      );
    }
    return <ThemePage theme={theme} />;
  }
  const course = courseId ? findCourse(courseId) : undefined;
  const line = course && lineId ? course.lines.find((l) => l.id === lineId) : undefined;

  if (course && line) {
    const lesson = lessonForLine(course, line.id)!;
    return (
      <div className="learn">
        <Crumbs items={[["Learn", "#learn"], [course.name, `#learn-${course.id}`]]} />
        {kind === "practice" ? (
          <PracticePlayer key={`p-${course.id}-${line.id}`} course={course} line={line} lesson={lesson} />
        ) : (
          <LessonPlayer
            key={`l-${course.id}-${line.id}`}
            title={line.name}
            lesson={lesson}
            orientation={course.side === "w" ? "white" : "black"}
            endAction={{ href: `#practice-${course.id}-${line.id}`, label: "Practice this line" }}
          />
        )}
      </div>
    );
  }
  if (course) return <CoursePage course={course} />;
  return <LearnHome />;
}

function Crumbs({ items }: { items: [string, string][] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map(([label, href]) => (
        <a key={href} href={href}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function courseStatus(c: OpeningCourse): { done: number; total: number } {
  const total = c.lines.length;
  const done = c.lines.filter((l) => ["known", "mastered"].includes(statusOf(getProgress(c.id, l.id, c.side)))).length;
  return { done, total };
}

function CourseCard({ c }: { c: OpeningCourse }) {
  const st = courseStatus(c);
  return (
    <a className="card" href={`#learn-${c.id}`}>
      <span className="card-title">{c.name}</span>
      <span className="card-moves">{c.moves}</span>
      <span className="card-tagline">{c.profile.tagline}</span>
      <span className="card-meta">
        Theory: {c.profile.theory} · {c.lines.length} lines · {st.done}/{st.total} known
      </span>
      <span className="meter" aria-hidden="true">
        <span style={{ width: `${(st.done / st.total) * 100}%` }} />
      </span>
    </a>
  );
}

function LearnHome() {
  const sides: { side: "w" | "b"; title: string; note: string }[] = [
    { side: "w", title: "Openings for White", note: "Your first move and how to continue." },
    { side: "b", title: "Openings for Black", note: "How to answer White's first move." },
  ];
  return (
    <div className="learn learn-page">
      <header className="learn-head">
        <h1>Learn</h1>
        <p>Openings with explanations and practice. Each course says which playing style it suits and what it's strong against. Middlegame and endgame lessons follow.</p>
      </header>

      {sides.map(({ side, title, note }) => (
        <section key={side} className="learn-section">
          <h2 className="label">{title}</h2>
          <p className="section-note">{note}</p>
          <div className="cards">
            {OPENING_COURSES.filter((c) => c.side === side).map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
            {UPCOMING_OPENINGS[side].map((name) => (
              <div key={name} className="card soon" aria-disabled="true">
                <span className="card-title">{name}</span>
                <span className="card-meta">Coming soon</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="learn-section">
        <h2 className="label">Middlegame: tactics</h2>
        <p className="section-note">Learn a tactical idea, then solve real puzzles from the Lichess database, easiest first.</p>
        <div className="cards">
          {TACTIC_THEMES.map((t) => {
            const list = puzzlesFor(t);
            const solved = cleanCount(list.map((p) => p.id));
            return (
              <a key={t.id} className="card" href={`#tactic-${t.id}`}>
                <span className="card-title">{t.name}</span>
                <span className="card-tagline">{t.summary.split(". ")[0]}.</span>
                <span className="card-meta">
                  {list.length} puzzles · {solved} solved
                </span>
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${(solved / list.length) * 100}%` }} />
                </span>
              </a>
            );
          })}
        </div>
      </section>
      <section className="learn-section">
        <h2 className="label">Endgame</h2>
        <p className="soon-text">Basic mates, pawn endings and rook endings, each with practice against Stockfish. Coming soon.</p>
      </section>
    </div>
  );
}

function CoursePage({ course }: { course: OpeningCourse }) {
  const sides: Color[] = ["w", "b"];
  return (
    <div className="learn learn-page">
      <Crumbs items={[["Learn", "#learn"]]} />
      <header className="learn-head">
        <h1>{course.name}</h1>
        <p className="card-moves">
          {course.moves} · {course.eco}
        </p>
        <p>{course.summary}</p>
      </header>

      <section className="learn-section profile" aria-label="Is this opening for you?">
        <h2 className="label">Is this opening for you?</h2>
        <div className="profile-facts">
          <span>
            <b>For</b> {course.side === "w" ? "White" : "Black"}
          </span>
          <span>
            <b>Theory</b> {course.profile.theory}
          </span>
          <span>
            <b>Level</b> {course.profile.level}
          </span>
        </div>
        <p className="profile-style">
          <b>Playing style:</b> {course.profile.style}
        </p>
        <div className="profile-cols">
          <div>
            <h3>Strong because</h3>
            <ul className="pros">
              {course.profile.strengths.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Watch out</h3>
            <ul className="cons">
              {course.profile.watchOut.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="learn-section">
        <h2 className="label">Key ideas</h2>
        <ul className="ideas">
          {course.ideas.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      <section className="learn-section">
        <h2 className="label">Lines</h2>
        <ol className="lines-list">
          {course.lines.map((l, idx) => (
            <li key={l.id} className="line-card">
              <div className="line-head">
                <span className="line-no">{idx + 1}</span>
                <div className="line-body">
                  <span className="card-title">{l.name}</span>
                  <span className="card-meta">{l.description}</span>
                  <span className="pills">
                    {sides.map((s) => {
                      const st = statusOf(getProgress(course.id, l.id, s));
                      return (
                        <span key={s} className={`pill s-${st}`}>
                          {s === "w" ? "White" : "Black"}: {STATUS_LABEL[st]}
                        </span>
                      );
                    })}
                  </span>
                </div>
              </div>
              <div className="line-actions">
                <a className="btn ghost" href={`#learn-${course.id}-${l.id}`}>
                  Learn
                </a>
                <a className="btn" href={`#practice-${course.id}-${l.id}`}>
                  Practice
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ThemePage({ theme }: { theme: TacticTheme }) {
  const list = puzzlesFor(theme);
  const solved = cleanCount(list.map((p) => p.id));
  const ratings = list.map((p) => p.rating);
  return (
    <div className="learn learn-page">
      <Crumbs items={[["Learn", "#learn"]]} />
      <header className="learn-head">
        <h1>{theme.name}</h1>
        <p>{theme.summary}</p>
      </header>
      <section className="learn-section">
        <h2 className="label">What to look for</h2>
        <ul className="ideas">
          {theme.lookFor.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>
      <section className="learn-section">
        <ol className="lines-list">
          <li className="line-card">
            <div className="line-head">
              <span className="line-no">1</span>
              <div className="line-body">
                <span className="card-title">Lesson: see the idea</span>
                <span className="card-meta">A real game position explained move by move.</span>
              </div>
            </div>
            <div className="line-actions">
              <a className="btn ghost" href={`#lesson-${theme.id}`}>
                Start lesson
              </a>
            </div>
          </li>
          <li className="line-card">
            <div className="line-head">
              <span className="line-no">2</span>
              <div className="line-body">
                <span className="card-title">Puzzles</span>
                <span className="card-meta">
                  {list.length} puzzles, rated {Math.min(...ratings)}–{Math.max(...ratings)}, easiest first. {solved} solved at the first try.
                </span>
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${(solved / list.length) * 100}%` }} />
                </span>
              </div>
            </div>
            <div className="line-actions">
              <a className="btn" href={`#puzzles-${theme.id}`}>
                {solved > 0 ? "Continue puzzles" : "Start puzzles"}
              </a>
            </div>
          </li>
        </ol>
      </section>
      <p className="hint">Puzzles from the Lichess puzzle database, released into the public domain (CC0).</p>
    </div>
  );
}
