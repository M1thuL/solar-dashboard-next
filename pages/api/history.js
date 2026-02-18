// pages/api/history.js
import fs from "fs";
import path from "path";
import Papa from "papaparse";

const LOG_PATH = path.join(process.cwd(), "data", "telemetry_log.csv");

export default function handler(req, res) {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return res.status(200).json({ ok: true, data: [] });
    }
    const csv = fs.readFileSync(LOG_PATH, "utf8");
    const parsed = Papa.parse(csv, { header: true, dynamicTyping: true }).data;
    // parsed rows: timestamp,device_id,voltage,current,power,light_raw
    // Optionally return only last N rows via ?limit=500
    const limit = Number(req.query.limit || 1000);
    const out = parsed.slice(Math.max(0, parsed.length - limit));
    return res.status(200).json({ ok: true, data: out });
  } catch (err) {
    console.error("history read err", err);
    return res.status(500).json({ ok: false, error: "read_failed" });
  }
}
