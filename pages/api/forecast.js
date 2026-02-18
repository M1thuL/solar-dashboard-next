// pages/api/forecast.js
// Forecast = yesterday's hourly solar profile (from CSV) used as next-day forecast.
// Supports ?refresh=1 to bypass cache and recompute instantly.

import fs from 'fs';
import Papa from 'papaparse';

const CSV_PATH = 'sensor_data_bangalore_2023.csv';

// simple in-memory cache to avoid re-parsing CSV repeatedly
let _csv_cache = null;
let _csv_mtime = 0;

function loadCsvOnce() {
  if (!fs.existsSync(CSV_PATH)) throw new Error('CSV not found');

  const stats = fs.statSync(CSV_PATH);
  const mtime = stats.mtimeMs ?? stats.mtime.getTime();

  // if cached and unchanged, return cache
  if (_csv_cache && _csv_mtime === mtime) return _csv_cache;

  // else re-read CSV
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const parsed = Papa.parse(raw, { header: true, dynamicTyping: true });

  const rows = parsed.data
    .filter(r => r.timestamp)
    .map(r => ({
      timestamp: new Date(r.timestamp),
      power: Number(r.power) || 0,
      irradiance: Number(r.irradiance) || 0
    }));

  _csv_cache = rows;
  _csv_mtime = mtime;
  return _csv_cache;
}

export default function handler(req, res) {
  try {
    const force = req.query.refresh === '1';
    if (force) {
      _csv_cache = null;
      _csv_mtime = 0;
    }

    const rows = loadCsvOnce();
    if (!rows.length) return res.status(400).json({ error: 'CSV empty' });

    // group rows by date
    const byDate = {};
    rows.forEach(r => {
      const key = r.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
      (byDate[key] ||= []).push(r);
    });

    const dates = Object.keys(byDate).sort();
    if (!dates.length) return res.status(400).json({ error: 'No dates found' });

    // choose MOST RECENT FULL day (>=20 rows)
    let chosen = dates.at(-1);
    for (let i = dates.length - 1; i >= 0; i--) {
      if (byDate[dates[i]].length >= 20) {
        chosen = dates[i];
        break;
      }
    }

    const dayRows = byDate[chosen];

    // compute hourly means (0..23)
    const hourly = Array.from({ length: 24 }, () => ({ p: [], irr: [] }));
    dayRows.forEach(r => {
      const hr = r.timestamp.getUTCHours();
      hourly[hr].p.push(r.power);
      hourly[hr].irr.push(r.irradiance);
    });

    const hourlyMean = hourly.map((h, i) => ({
      hour: i,
      power: h.p.length ? h.p.reduce((a,b)=>a+b,0) / h.p.length : 0,
      irradiance: h.irr.length ? h.irr.reduce((a,b)=>a+b,0) / h.irr.length : 0
    }));

    // forecast next day (tomorrow)
    const nextDate = new Date(chosen + "T00:00:00Z");
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const forecast = hourlyMean.map(h => ({
      timestamp: new Date(nextDate.getTime() + h.hour * 3600 * 1000).toISOString(),
      hour: h.hour,
      power: Number(h.power),
      irradiance: Number(h.irradiance)
    }));

    return res.status(200).json({
      source: "yesterday_profile",
      source_date: chosen,
      forecast
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
