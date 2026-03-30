const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

  if (!RESEND_KEY || !NOTIFY_EMAIL) {
    // Silently skip if not configured - don't break the site
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch { body = {}; }

  const { count, userAgent, referrer } = body;

  const emailBody = JSON.stringify({
    from: "MfgAI Intelligence <notifications@resend.dev>",
    to: [NOTIFY_EMAIL],
    subject: `MfgAI Intelligence — Visitor #${count}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#0f172a;border-radius:12px;padding:20px 24px;margin-bottom:20px">
          <h2 style="color:#f59e0b;margin:0 0 4px;font-size:20px">⚙️ MfgAI Intelligence</h2>
          <p style="color:#94a3b8;margin:0;font-size:13px">Manufacturing AI Productivity Briefing</p>
        </div>
        <h3 style="color:#0f172a;margin:0 0 16px">New visitor — Total: <span style="color:#2563eb">${count}</span></h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:8px 0;color:#64748b;width:120px">Time</td><td style="color:#0f172a">${new Date().toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Referrer</td><td style="color:#0f172a">${referrer || "Direct"}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Browser</td><td style="color:#0f172a">${(userAgent || "").slice(0, 80)}</td></tr>
        </table>
        <div style="margin-top:20px;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:12px;color:#94a3b8">
          You are receiving this because you set up notifications for MfgAI Intelligence.
        </div>
      </div>
    `,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(emailBody),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) }));
      }
    );
    req.on("error", () => resolve({ statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) }));
    req.write(emailBody);
    req.end();
  });
};
