// components/DailyEnergyChart.js
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function computeDailyEnergy(rows) {
  // rows sorted by timestamp ascending
  const perDay = {};
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const t0 = new Date(prev.timestamp).getTime() / 1000;
    const t1 = new Date(cur.timestamp).getTime() / 1000;
    const dt = Math.max(1, t1 - t0); // sec
    const p = Number(prev.power || 0); // watts
    const wh = (p * dt) / 3600.0; // watt-hours
    const day = new Date(prev.timestamp).toISOString().slice(0, 10);
    perDay[day] = (perDay[day] || 0) + wh / 1000.0; // kWh
  }
  const days = Object.keys(perDay).sort();
  return { days, values: days.map((d) => Number(perDay[d].toFixed(4))) };
}

export default function DailyEnergyChart({ rows }) {
  const { days, values } = useMemo(() => computeDailyEnergy(rows), [rows]);

  const data = {
    labels: days,
    datasets: [
      {
        label: "Daily Energy (kWh)",
        data: values,
        backgroundColor: "rgba(6, 182, 160, 0.9)",
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false }, title: { display: true, text: "Daily Energy (kWh)" } },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full bg-white rounded-lg p-4 shadow-sm" style={{ height: 220 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
