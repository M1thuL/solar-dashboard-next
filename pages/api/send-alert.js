// pages/api/send-alert.js
import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const ALERT_TO = process.env.ALERT_TO;
const ALERT_FROM = process.env.ALERT_FROM || ALERT_TO;
const COOLDOWN_MIN = Number(process.env.ALERT_COOLDOWN_MINUTES || 30);

// simple in-memory cooldown map (process-lifetime). For production use Redis or DB.
const lastSent = {};

/** Rate-limited send helper */
async function sendEmail(subject, html) {
  const msg = {
    to: ALERT_TO,
    from: ALERT_FROM,
    subject,
    html,
  };
  return sendgrid.send(msg);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "only POST" });

  const { type = "alert", voltage, threshold, message = "" } = req.body || {};
  if (typeof voltage === "undefined") return res.status(400).json({ ok: false, error: "missing voltage" });

  const key = type || "default_alert";
  const now = Date.now();
  if (lastSent[key] && now - lastSent[key] < COOLDOWN_MIN * 60 * 1000) {
    return res.json({ ok: true, note: "cooldown active" });
  }

  try {
    const subject = `Solar Alert: ${type} — ${voltage} V`;
    const html = `
      <h2>Solar system alert</h2>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Voltage:</strong> ${voltage} V</p>
      <p><strong>Threshold:</strong> ${threshold ?? "N/A"}</p>
      <p>${message}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `;
    await sendEmail(subject, html);
    lastSent[key] = now;
    return res.json({ ok: true, sent: true });
  } catch (err) {
    console.error("send-alert err", err?.message || err);
    return res.status(500).json({ ok: false, error: "send_failed", details: err?.message ?? err });
  }
}
