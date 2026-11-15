import "./Sidebar.css";

const LEVELS = [
  { id: "country", label: "Country" },
  { id: "province", label: "Province" },
  { id: "district", label: "District" },
  { id: "city", label: "City" },
];

export default function Sidebar({
  catalog,
  form,
  loading,
  areas,
  onChange,
  onMode,
  onSubmit,
}) {
  if (!catalog || !form) return null;
  const needsCountry = areas.level === "province" || areas.level === "district";

  const comparing = form.mode === "compare";

  return (
    <form className="sidebar" onSubmit={onSubmit}>
      <div className="sidebar-scroll">
      <label>
        <span>Analysis type</span>
        <select value={form.mode} onChange={(event) => onMode(event.target.value)}>
          <option value="one">1. Single location</option>
          <option value="compare">2. Comparative analysis</option>
        </select>
      </label>
      <p className="hint">
        {comparing
          ? "Two locations at the same level. Each gets its own map and time series."
          : "One location, its yearly time series, and a test of whether the change is significant."}
      </p>

      <label>
        <span>Area level</span>
        <select value={areas.level} onChange={(event) => areas.chooseLevel(event.target.value)}>
          {LEVELS.map((level) => (
            <option key={level.id} value={level.id}>
              {level.label}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">
        {comparing ? "Click a boundary. Same level for both areas." : "Click a boundary."}
      </p>

      {needsCountry && (
        <label>
          <span>Country</span>
          <select value={areas.countryIso} onChange={(event) => areas.chooseCountry(event.target.value)}>
            {areas.countries
              .filter((country) => country.iso)
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((country) => (
                <option key={country.iso} value={country.iso}>
                  {country.name}
                </option>
              ))}
          </select>
        </label>
      )}

      <label>
        <span>Measurement</span>
        <select value={form.variable} onChange={(event) => onChange({ variable: event.target.value })}>
          {catalog.variables.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <p className="field-label">Years</p>
      <div className="year-row">
        <label>
          <span>Start</span>
          <input
            type="number"
            min={catalog.min_year}
            max={catalog.max_year}
            value={form.start}
            onChange={(event) => onChange({ start: event.target.value })}
          />
        </label>
        <label>
          <span>End</span>
          <input
            type="number"
            min={catalog.min_year}
            max={catalog.max_year}
            value={form.end}
            onChange={(event) => onChange({ end: event.target.value })}
          />
        </label>
      </div>

      {areas.mapError && <p className="hint warn">{areas.mapError}</p>}
      {areas.selected.length > 0 && (
        <p className="picked">{areas.selected.map((item) => item.name).join("  ·  ")}</p>
      )}
      </div>
      <button className="run" type="submit" disabled={loading}>
        {loading ? "Loading data..." : "Run analysis"}
      </button>
    </form>
  );
}
