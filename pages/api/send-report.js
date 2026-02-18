import nodemailer from "nodemailer";
import fs from 'fs';
import path from 'path';

const ALERT_FROM = process.env.ALERT_FROM || process.env.SMTP_USER;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  const info = await transporter.sendMail({
    from: ALERT_FROM,
    to,
    subject,
    html,
  });
  return info;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "only POST" });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: "missing email" });

  try {
    // Fetch latest data
    const LATEST_FILE = path.join(process.cwd(), 'data', 'latest.json');
    let latest = null;
    if (fs.existsSync(LATEST_FILE)) {
      const raw = fs.readFileSync(LATEST_FILE, 'utf8');
      latest = JSON.parse(raw);
    }

    // Fetch recent history (last 500 rows)
    const HISTORY_FILE = path.join(process.cwd(), 'data', 'telemetry_log.csv');
    let rows = [];
    if (fs.existsSync(HISTORY_FILE)) {
      const csv = fs.readFileSync(HISTORY_FILE, 'utf8');
      // Simple CSV parse (assuming headers: timestamp,device_id,voltage,current,power,light_raw)
      const lines = csv.split('\n').slice(1); // skip header
      rows = lines.filter(line => line.trim()).map(line => {
        const [timestamp, device_id, voltage, current, power, light_raw] = line.split(',');
        return { timestamp, device_id, voltage: parseFloat(voltage), current: parseFloat(current), power: parseFloat(power), light_raw: parseFloat(light_raw) };
      }).slice(-500); // last 500
    }

    // Compute summarized stats
    let summary = { count: rows.length, voltage: {}, current: {}, power: {}, light: {} };
    if (rows.length > 0) {
      const voltages = rows.map(r => r.voltage).filter(v => !isNaN(v));
      const currents = rows.map(r => r.current).filter(v => !isNaN(v));
      const powers = rows.map(r => r.power).filter(v => !isNaN(v));
      const lights = rows.map(r => r.light_raw).filter(v => !isNaN(v));

      summary.voltage = {
        avg: voltages.length ? (voltages.reduce((a,b)=>a+b,0)/voltages.length).toFixed(2) : 'N/A',
        min: voltages.length ? Math.min(...voltages).toFixed(2) : 'N/A',
        max: voltages.length ? Math.max(...voltages).toFixed(2) : 'N/A'
      };
      summary.current = {
        avg: currents.length ? (currents.reduce((a,b)=>a+b,0)/currents.length).toFixed(2) : 'N/A',
        min: currents.length ? Math.min(...currents).toFixed(2) : 'N/A',
        max: currents.length ? Math.max(...currents).toFixed(2) : 'N/A'
      };
      summary.power = {
        avg: powers.length ? (powers.reduce((a,b)=>a+b,0)/powers.length).toFixed(2) : 'N/A',
        min: powers.length ? Math.min(...powers).toFixed(2) : 'N/A',
        max: powers.length ? Math.max(...powers).toFixed(2) : 'N/A'
      };
      summary.light = {
        avg: lights.length ? (lights.reduce((a,b)=>a+b,0)/lights.length).toFixed(0) : 'N/A'
      };
    }

    // Generate HTML report
    const subject = `Solar Dashboard Summary Report - ${new Date().toLocaleDateString()}`;
    const html = `
      <h2>Solar Dashboard Summary Report</h2>
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>

      <h3>Current Live Data</h3>
      ${latest ? `
        <ul>
          <li><strong>Voltage:</strong> ${latest.voltage} V</li>
          <li><strong>Current:</strong> ${latest.current} A</li>
          <li><strong>Power:</strong> ${latest.power} W</li>
          <li><strong>Light (Raw):</strong> ${latest.light_raw}</li>
          <li><strong>Timestamp:</strong> ${new Date(latest.timestamp).toLocaleString()}</li>
        </ul>
      ` : '<p>No live data available.</p>'}

      <h3>Recent Data Summary (Last ${summary.count} readings)</h3>
      <table border="1" style="border-collapse: collapse;">
        <tr><th>Metric</th><th>Average</th><th>Min</th><th>Max</th></tr>
        <tr><td>Voltage (V)</td><td>${summary.voltage.avg}</td><td>${summary.voltage.min}</td><td>${summary.voltage.max}</td></tr>
        <tr><td>Current (A)</td><td>${summary.current.avg}</td><td>${summary.current.min}</td><td>${summary.current.max}</td></tr>
        <tr><td>Power (W)</td><td>${summary.power.avg}</td><td>${summary.power.min}</td><td>${summary.power.max}</td></tr>
        <tr><td>Light (Raw)</td><td>${summary.light.avg}</td><td>N/A</td><td>N/A</td></tr>
      </table>

      <p>This report was generated from the Solar Dashboard.</p>
    `;

    await sendEmail(email, subject, html);
    return res.status(200).json({ ok: true, sent: true });
  } catch (err) {
    console.error("send-report err", err);
    return res.status(500).json({ ok: false, error: "send_failed", details: err?.message || err });
  }
}
