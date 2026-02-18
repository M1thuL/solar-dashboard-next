// pages/api/export.js
import fs from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "data", "telemetry_log.csv");

export default function handler(req, res) {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return res.status(200).json({ ok: false, message: "No telemetry data yet" });
    }

    const csv = fs.readFileSync(LOG_PATH, "utf8");
    
    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="telemetry_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("export error:", err);
    return res.status(500).json({ error: "export_failed" });
  }
}
