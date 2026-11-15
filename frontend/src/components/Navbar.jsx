import { MoonIcon, SunIcon } from "./Icons";
import "./Navbar.css";

export default function Navbar({
  catalog,
  activeExample,
  examplesOpen,
  onToggleExamples,
  onExample,
  view,
  onView,
  theme,
  onToggleTheme,
}) {
  const demos = catalog ? catalog.demos : [];

  return (
    <header className="navbar">
      <div className="navbar-row">
        <button type="button" className="brand" onClick={() => onView("map")}>
          EarthMeridian
        </button>
        <nav className="tabs" aria-label="Main">
          <button
            type="button"
            className={view !== "about" && view !== "credits" ? "nav-chip active" : "nav-chip"}
            onClick={() => {
              if (examplesOpen) onToggleExamples();
              onView("map");
            }}
          >
            Home
          </button>
          <button
            type="button"
            className={examplesOpen ? "nav-chip active" : "nav-chip"}
            onClick={onToggleExamples}
          >
            Example tests
          </button>
          <button
            type="button"
            className={view === "about" ? "nav-chip active" : "nav-chip"}
            onClick={() => onView(view === "about" ? "map" : "about")}
          >
            About
          </button>
          <button
            type="button"
            className={view === "credits" ? "nav-chip active" : "nav-chip"}
            onClick={() => onView(view === "credits" ? "map" : "credits")}
          >
            Credits
          </button>
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      {examplesOpen && (
        <div className="examples" aria-label="Example tests">
          {demos.map((demo) => (
            <button
              key={demo.id}
              type="button"
              className={activeExample === demo.id ? "active" : ""}
              onClick={() => onExample(demo)}
            >
              {demo.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
