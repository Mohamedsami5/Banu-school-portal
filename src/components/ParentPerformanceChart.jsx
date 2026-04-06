import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  LineController,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const EXAM_ORDER = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
const BAR_COLORS = ["#6379ff", "#38e66b", "#ff6f9d", "#f6d365"];
const PASS_MARK = 35;

const passMarkLabelPlugin = {
  id: "passMarkLabel",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales?.y) return;

    const y = scales.y.getPixelForValue(PASS_MARK);
    if (!Number.isFinite(y)) return;

    ctx.save();
    ctx.fillStyle = "#ef4444";
    ctx.font = "600 11px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`Pass ${PASS_MARK}`, chartArea.right - 2, y - 2);
    ctx.restore();
  },
};

export default function ParentPerformanceChart({ marks = [] }) {
  const { labels, values } = useMemo(() => {
    const groups = new Map(EXAM_ORDER.map((e) => [e, []]));

    (Array.isArray(marks) ? marks : []).forEach((m) => {
      const examType = String(m?.examType || "").trim();
      if (!groups.has(examType)) return;
      const value = Number(m?.marks);
      if (!Number.isFinite(value)) return;
      groups.get(examType).push(value);
    });

    const computed = EXAM_ORDER.map((examType) => {
      const arr = groups.get(examType) || [];
      if (arr.length === 0) return 0;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.max(0, Math.min(100, Math.round(avg)));
    });

    return { labels: EXAM_ORDER, values: computed };
  }, [marks]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Marks",
          data: values,
          backgroundColor: BAR_COLORS,
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 26,
        },
        {
          type: "line",
          label: `Pass ${PASS_MARK}`,
          data: labels.map(() => PASS_MARK),
          borderColor: "#ef4444",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    }),
    [labels, values]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Student Performance",
          color: "#0f172a",
          font: { size: 14, weight: "700" },
          padding: { bottom: 8, top: 6 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} / 100`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Exam Type",
            color: "#475569",
            font: { size: 12, weight: "600" },
            padding: { top: 8 },
          },
          grid: {
            color: "rgba(148, 163, 184, 0.25)",
            borderDash: [4, 4],
          },
          ticks: { color: "#475569", font: { size: 12, weight: "600" } },
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Marks",
            color: "#475569",
            font: { size: 12, weight: "600" },
            padding: { bottom: 6 },
          },
          grid: { color: "rgba(148, 163, 184, 0.25)", borderDash: [4, 4] },
          ticks: { stepSize: 25, color: "#64748b", font: { size: 12, weight: "600" } },
        },
      },
    }),
    []
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.canvasWrap}>
        <Bar data={data} options={options} plugins={[passMarkLabelPlugin]} />
      </div>
      <div style={styles.note}>Average marks by exam type (0–100).</div>
    </div>
  );
}

const styles = {
  wrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid #eef2f7",
  },
  canvasWrap: {
    height: 250,
    width: "100%",
  },
  note: {
    marginTop: 10,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
  },
};
