// components/TimeSeriesChart.js
"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Robust TimeSeriesChart
 * - Expects rows = [{ timestamp, power, voltage, ... }, ...]
 * - Will skip rows with invalid timestamps
 * - Uses dataset points in {x,y} form (safer than labels)
 */
export default function TimeSeriesChart({ rows = [] }) {
  // normalize and filter rows once
  const { powerPoints, voltagePoints, minX, maxX } = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { powerPoints: [], voltagePoints: [], minX: null, maxX: null };
    }

    const pointsPower = [];
    const pointsVoltage = [];

    for (const r of rows) {
      // support multiple timestamp field names
      const tsRaw = r?.timestamp ?? r?.time ?? r?.datetime ?? r?.ts ?? null;
      if (!tsRaw) continue;

      const dt = new Date(tsRaw);
      if (Number.isNaN(dt.getTime())) continue; // skip invalid date

      const x = dt.getTime(); // numeric timestamp (ms since epoch)

      // fetch power / voltage with common fallbacks
      const powerRaw = r?.power ?? r?.power_w ?? r?.p ?? r?.P ?? 0;
      const voltageRaw = r?.voltage ?? r?.V ?? r?.v ?? 0;

      const yPower = Number(powerRaw) || 0;
      const yVolt = Number(voltageRaw) || 0;

      pointsPower.push({ x, y: yPower });
      pointsVoltage.push({ x, y: yVolt });
    }

    // ensure sorted ascending by x
    pointsPower.sort((a, b) => a.x - b.x);
    pointsVoltage.sort((a, b) => a.x - b.x);

    const allXs = pointsPower.length ? pointsPower.map((p) => p.x) : pointsVoltage.map((p) => p.x);
    const minX = allXs.length ? Math.min(...allXs) : null;
    const maxX = allXs.length ? Math.max(...allXs) : null;

    return { powerPoints: pointsPower, voltagePoints: pointsVoltage, minX, maxX };
  }, [rows]);

  // if no valid points, render an informative placeholder
  if (!powerPoints.length && !voltagePoints.length) {
    return (
      <div className="w-full bg-white rounded-lg p-6 shadow-sm flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-slate-500">No valid time-series data available yet.</div>
      </div>
    );
  }

  const chartData = {
    // don't use labels; use XY dataset objects
    datasets: [
      {
        label: "Power (W)",
        data: powerPoints,
        yAxisID: "y",
        tension: 0.25,
        borderColor: "rgba(126, 34, 206, 0.95)",
        backgroundColor: "rgba(126, 34, 206, 0.12)",
        fill: true,
        pointRadius: 2,
      },
      {
        label: "Voltage (V)",
        data: voltagePoints,
        yAxisID: "y1",
        tension: 0.25,
        borderColor: "rgba(14, 165, 233, 0.95)",
        backgroundColor: "rgba(14,165,233,0.06)",
        fill: false,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    interaction: { mode: "index", intersect: false },
    stacked: false,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: "Irradiance & Power (recent samples)",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y ?? ctx.raw?.y;
            return `${ctx.dataset.label}: ${typeof v === "number" ? v.toFixed(2) : v}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "hour", tooltipFormat: "PPp" },
        ticks: { autoSkip: true, maxTicksLimit: 10 },
        // use computed min/max to avoid huge ranges caused by bad data
        // only set min/max when we have values
        ...(minX != null && maxX != null ? { min: minX, max: maxX } : {}),
      },
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Power (W)" },
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Voltage (V)" },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg p-4 shadow-sm" style={{ height: 360 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
