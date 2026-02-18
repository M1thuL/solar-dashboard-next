// pages/api/send-alert-smtp.js
import nodemailer from "nodemailer";

const ALERT_TO = process.env.ALERT_TO;
const ALERT_FROM = process.env.ALERT_FROM || process.env.SMTP_USER;
const COOLDOWN_MIN = Number(process.env.ALERT_COOLDOWN_MINUTES || 30);

// simple in-memory cooldown store (per type/device)
const lastSent = {};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465, // true for 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(subject, html) {
  const info = await transporter.sendMail({
    from: ALERT_FROM,
    to: ALERT_TO,
    subject,
    html,
  });
  return info;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "only POST" });

  const { type = "voltage_threshold", voltage, threshold, message = "", device_id } = req.body || {};
  if (typeof voltage === "undefined") return res.status(400).json({ ok: false, error: "missing voltage" });

  // cooldown key per type+device
  const key = `${type}${device_id ? ":" + device_id : ""}`;
  const now = Date.now();
  if (lastSent[key] && now - lastSent[key] < COOLDOWN_MIN * 60 * 1000) {
    return res.json({ ok: true, note: "cooldown active" });
  }

  try {
    const subject = `Solar Alert: ${type} — ${voltage} V`;
    const html = `
      <h3>Solar System Alert</h3>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Device:</strong> ${device_id ?? "unknown"}</p>
      <p><strong>Voltage:</strong> ${voltage} V</p>
      <p><strong>Threshold:</strong> ${threshold ?? "N/A"}</p>
      <p>${message}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `;

    const info = await sendEmail(subject, html);
    lastSent[key] = now;

    return res.status(200).json({ ok: true, sent: true, info: { messageId: info.messageId } });
  } catch (err) {
    console.error("smtp send err", err);
    return res.status(500).json({ ok: false, error: "send_failed", details: err?.message || err });
  }
}
