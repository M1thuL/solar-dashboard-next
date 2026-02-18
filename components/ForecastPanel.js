// components/ForecastPanel.js
"use client";

import React, { useMemo } from "react";

/**
 * ForecastPanel
 * - rows: array of records { timestamp | time | datetime, power, ... }
 * - Shows 24 hourly columns (each column = avg power for that hour from provided rows).
 */
export default function ForecastPanel({ rows = [] }) {
  // normalize and compute hourly averages
  const hourly = useMemo(() => {
    // 24 buckets for hours 0..23
    const buckets = Array.from({ length: 24 }, () => []);

    if (!Array.isArray(rows)) return Array.from({ length: 24 }, (_, i) => ({ hour: i, avg: 0 }));

    for (const r of rows) {
      // try multiple possible timestamp fields
      const ts = r?.timestamp ?? r?.time ?? r?.datetime ?? r?.ts ?? null;
      if (!ts) continue;

      const dt = new Date(ts);
      if (Number.isNaN(dt.getTime())) continue; // invalid date -> skip

      const hour = dt.getHours();
      if (hour < 0 || hour > 23 || !Number.isFinite(hour)) continue;

      const pRaw = r?.power ?? r?.power_w ?? r?.p ?? r?.powerW ?? r?.P ?? 0;
      const p = Number(pRaw) || 0;
      buckets[hour].push(p);
    }

    // Compute averages per hour
    const results = buckets.map((b, i) => {
      if (!b || b.length === 0) return { hour: i, avg: 0, samples: 0 };
      const sum = b.reduce((a, c) => a + c, 0);
      return { hour: i, avg: sum / b.length, samples: b.length };
    });

    return results;
  }, [rows]);

  // find max average to scale bars (avoid division by zero)
  const maxAvg = Math.max(...hourly.map((h) => h.avg), 0.0001);

  return (
    <div className="w-full bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">24h Forecast (based on yesterday)</div>
        <div className="text-xs text-slate-400">Each column = 1 hour</div>
      </div>

      {/* horizontal scrolling container in case screen is narrow */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "end", height: 140, padding: "8px 4px" }}>
          {hourly.map((h) => {
            // height percent relative to maxAvg
            const pct = maxAvg > 0 ? Math.round((h.avg / maxAvg) * 100) : 0;
            const barHeight = `${Math.max(4, pct)}%`; // at least small visible bar
            return (
              <div
                key={h.hour}
                title={`${String(h.hour).padStart(2, "0")}:00 — ${h.avg.toFixed(1)} W (${h.samples} samples)`}
                style={{ width: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: "100%",
                    height: barHeight,
                    background: "linear-gradient(180deg, #7c3aed, #06b6d4)",
                    borderRadius: 4,
                    alignSelf: "stretch",
                    transition: "height 300ms ease",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                />
                <div style={{ fontSize: 11, color: "#475569" }}>{h.hour}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Displaying hourly averages computed from the provided historical samples. Provide yesterday's data (24+ hours) for best results.
      </div>
    </div>
  );
}
