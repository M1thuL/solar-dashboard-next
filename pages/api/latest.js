// pages/api/latest.js
import fs from "fs";
import path from "path";

const LATEST_FILE = path.join(process.cwd(), "data", "latest.json");

export default function handler(req, res) {
  if (!fs.existsSync(LATEST_FILE)) {
    return res.status(200).json({ ok: false, message: "no data yet" });
  }
  try {
    const raw = fs.readFileSync(LATEST_FILE, "utf8");
    const json = JSON.parse(raw);
    return res.status(200).json({ ok: true, latest: json });
  } catch (err) {
    return res.status(500).json({ error: "read error" });
  }
}
