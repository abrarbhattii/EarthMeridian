import TrendChart from "./TrendChart";
import { STATUS_TEXT, formatCoord } from "../lib/form";
import "./AnalysisPanel.css";

export default function AnalysisPanel({ result, comparison, loading, error }) {
  return (
    <section className="analysis" aria-live="polite">
      {error && <p className="banner">{error}</p>}
      {loading && <p className="status-line">Please wait for the server response.</p>}
      {!loading && !error && !result && !comparison && (
        <p className="status-line">Choose a location, then use Run analysis.</p>
      )}
      {comparison && (
        <>
          <p className="verdict">{comparison.summary}</p>
          <div className="compare-grid">
            <ResultCard result={comparison.left} />
            <ResultCard result={comparison.right} />
          </div>
        </>
      )}
      {result && <ResultCard result={result} />}
    </section>
  );
}

function ResultCard({ result }) {
  const trend = result.trend;
  const direction = trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1);
  const sourceName = result.from_cache ? "Saved NASA POWER copy" : "Live NASA POWER";
  const sources = (result.sources || []).join(", ");

  return (
    <article className="result-card">
      <header className="result-head">
        <div>
          <h2>
            {result.variable_name} in {result.place}
          </h2>
          <p className="meta">
            {formatCoord(result.latitude, result.longitude)} · {trend.first_year}–{trend.last_year} · {trend.n_years}{" "}
            years
          </p>
        </div>
        <span className={`pill ${trend.status}`}>
          {direction} · {STATUS_TEXT[trend.status]}
        </span>
      </header>
      <p className="verdict">{trend.verdict}</p>
      <dl className="stats">
        <div>
          <dt>Rate of change</dt>
          <dd>{trend.rate_text}</dd>
        </div>
        <div>
          <dt>Over the full period</dt>
          <dd>{trend.change_text}</dd>
        </div>
        <div>
          <dt>95% confidence interval</dt>
          <dd>{trend.ci_text}</dd>
        </div>
        <div>
          <dt>Straight-line p-value</dt>
          <dd>{trend.p_value_text}</dd>
        </div>
        <div>
          <dt>Mann-Kendall p-value</dt>
          <dd>{trend.mann_kendall_p_text}</dd>
        </div>
        <div>
          <dt>Straight-line fit (r²)</dt>
          <dd>{trend.r_squared_text}</dd>
        </div>
      </dl>
      <TrendChart result={result} />
      <p className="note">
        {result.definition} {sourceName}
        {sources ? ` · ${sources}` : ""}.
      </p>
    </article>
  );
}
