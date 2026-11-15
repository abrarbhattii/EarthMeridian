import { useState } from "react";
import AboutPanel from "./components/AboutPanel";
import AnalysisPanel from "./components/AnalysisPanel";
import CreditsPanel from "./components/CreditsPanel";
import Footer from "./components/Footer";
import MapView from "./components/MapView";
import Navbar from "./components/Navbar";
import SeriesStrip from "./components/SeriesStrip";
import Sidebar from "./components/Sidebar";
import { useAreas } from "./hooks/useAreas";
import { useInvestigation } from "./hooks/useInvestigation";
import { useTheme } from "./hooks/useTheme";
import "./components/Footer.css";
import "./styles/layout.css";

function matchingSummary(result, comparison, names) {
  if (comparison) {
    const places = [comparison.left.place, comparison.right.place];
    if (places.every((place) => names.includes(place))) return comparison.summary;
    return "";
  }
  if (result && names.includes(result.place)) return result.trend.verdict;
  return "";
}

function rowFor(name, result, comparison) {
  if (!name) return null;
  if (comparison) {
    if (comparison.left.place === name) return comparison.left;
    if (comparison.right.place === name) return comparison.right;
    return null;
  }
  if (result && result.place === name) return result;
  return null;
}

function readingsFrom(result, comparison) {
  const rows = comparison ? [comparison.left, comparison.right] : result ? [result] : [];
  const readings = {};
  rows.forEach((row) => {
    const last = row.series[row.series.length - 1];
    readings[row.place] = {
      value: last ? last.value : null,
      unit: row.unit,
      variable: row.variable,
      direction: row.wind_direction,
    };
  });
  return readings;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const study = useInvestigation();
  const areas = useAreas(study.form ? study.form.mode : "one");
  const [view, setView] = useState("map");
  const [examplesOpen, setExamplesOpen] = useState(false);
  const page = view === "about" || view === "credits";
  const readings = readingsFrom(study.result, study.comparison);
  const selectedNames = areas.selected.map((item) => item.name);
  const summary = matchingSummary(study.result, study.comparison, selectedNames);
  const comparing = Boolean(study.form && study.form.mode === "compare");
  const mapShared = {
    theme,
    level: areas.level,
    countries: areas.countries,
    areas: areas.level === "country" ? areas.countries : areas.areas,
    cities: areas.cities,
    onPick: areas.pick,
  };

  function openMap(mode) {
    study.setMode(mode);
    setView("map");
  }

  function onExample(demo) {
    areas.selectDemo(demo);
    study.applyExample(demo);
    setView("map");
  }

  function onSubmit(event) {
    event.preventDefault();
    setView("map");
    study.runPlaces(areas.selected);
  }

  return (
    <div className="shell">
      <Navbar
        catalog={study.catalog}
        activeExample={study.activeExample}
        examplesOpen={examplesOpen}
        onToggleExamples={() => setExamplesOpen((open) => !open)}
        onExample={onExample}
        view={view}
        onView={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {!study.catalog || !study.form ? (
        <p className="boot">{study.error || "Loading EarthMeridian..."}</p>
      ) : (
        <div className={page ? "workspace page-only" : "workspace"}>
          {!page && (
            <Sidebar
              catalog={study.catalog}
              form={study.form}
              loading={study.loading}
              areas={areas}
              onChange={study.updateForm}
              onMode={openMap}
              onSubmit={onSubmit}
            />
          )}
          <main className="stage">
            {view === "about" && <AboutPanel />}
            {view === "credits" && <CreditsPanel />}
            {!page && (
              <>
                <div className="stage-switch">
                  <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
                    Map
                  </button>
                  <button type="button" className={view === "stats" ? "active" : ""} onClick={() => setView("stats")}>
                    Statistics
                  </button>
                </div>
                <div className={view === "stats" ? "stage-body scroll" : "stage-body"}>
                  {view === "stats" ? (
                    <AnalysisPanel
                      result={study.result}
                      comparison={study.comparison}
                      loading={study.loading}
                      error={study.error}
                    />
                  ) : comparing ? (
                    <div className="map-split">
                      {[0, 1].map((index) => {
                        const item = areas.selected[index];
                        const row = rowFor(item && item.name, study.result, study.comparison);
                        return (
                          <div className="map-column" key={index}>
                            <MapView
                              {...mapShared}
                              selected={item ? [item] : []}
                              readings={row ? readingsFrom(row, null) : {}}
                              summary={row ? row.trend.verdict : ""}
                            />
                            <SeriesStrip result={row} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="map-stage">
                      <MapView
                        {...mapShared}
                        selected={areas.selected}
                        readings={readings}
                        summary={summary}
                      />
                      <SeriesStrip
                        result={
                          study.result && selectedNames.includes(study.result.place) ? study.result : null
                        }
                      />
                    </div>
                  )}
                  {view === "map" && study.error && <p className="map-error">{study.error}</p>}
                </div>
              </>
            )}
          </main>
        </div>
      )}
      <Footer />
    </div>
  );
}
