// pages/api/ingest.js
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LATEST_FILE = path.join(DATA_DIR, "latest.json");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  const payload = req.body;
  if (!payload) return res.status(400).json({ error: "Missing body" });

  const row = {
    timestamp: payload.timestamp || new Date().toISOString(),
    device_id: payload.device_id || "esp32-01",
    voltage: Number(payload.voltage || 0),
    current: Number(payload.current || 0),
    power: Number(payload.power || 0),
    light_raw: Number(payload.light_raw || payload.lightRaw || 0),
  };

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    fs.writeFileSync(LATEST_FILE, JSON.stringify(row, null, 2));
    // optional: append to log.csv
    const logPath = path.join(DATA_DIR, "telemetry_log.csv");
    const header = !fs.existsSync(logPath);
    const csvLine = `${row.timestamp},${row.device_id},${row.voltage},${row.current},${row.power},${row.light_raw}\n`;
    if (header) {
      fs.appendFileSync(logPath, "timestamp,device_id,voltage,current,power,light_raw\n");
    }
    fs.appendFileSync(logPath, csvLine);
    return res.status(200).json({ ok: true, row });
  } catch (err) {
    console.error("Ingest write error:", err);
    return res.status(500).json({ error: "server error" });
  }
}
