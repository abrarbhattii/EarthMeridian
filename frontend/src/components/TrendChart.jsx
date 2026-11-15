import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useCssVar } from "../hooks/useCssVar";
import "./TrendChart.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendChart({ result }) {
  const seriesColor = useCssVar("--series") || "#b04b5c";
  const trendColor = useCssVar("--trend") || "#141414";
  const textColor = useCssVar("--text") || "#141414";
  const gridColor = useCssVar("--line") || "#eadfe1";
  const labels = result.series.map((point) => point.year);
  const yTitle = `${result.value_label} (${result.unit})`;

  const data = {
    labels,
    datasets: [
      {
        label: result.value_label,
        data: result.series.map((point) => point.value),
        borderColor: seriesColor,
        backgroundColor: seriesColor,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0,
      },
      {
        label: "Trend line",
        data: result.trend.trend_line.map((point) => point.value),
        borderColor: trendColor,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [6, 4],
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor },
      },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${context.parsed.y} ${result.unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true, color: textColor },
        grid: { color: gridColor },
      },
      y: {
        title: { display: true, text: yTitle, color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="chart-wrap">
      <Line data={data} options={options} />
    </div>
  );
}
