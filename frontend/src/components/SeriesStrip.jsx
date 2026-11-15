import TrendChart from "./TrendChart";
import "./SeriesStrip.css";

export default function SeriesStrip({ result }) {
  return (
    <section className={result ? "series-strip open" : "series-strip"}>
      <h3>{result ? `${result.variable_name} in ${result.place}` : "Time series"}</h3>
      {result && <TrendChart result={result} />}
    </section>
  );
}
