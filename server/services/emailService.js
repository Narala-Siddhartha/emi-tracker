const sgMail = require("@sendgrid/mail");

// ─── Initialize SendGrid ───────────────────────────────────────────────────────
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ─── Format currency ───────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

// ─── Check config ─────────────────────────────────────────────────────────────
const isConfigured = () => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("⚠️  SENDGRID_API_KEY not set — skipping email.");
    return false;
  }
  if (!process.env.EMAIL_USER) {
    console.warn("⚠️  EMAIL_USER not set — skipping email.");
    return false;
  }
  return true;
};

// ─── EMI Reminder Email Template ──────────────────────────────────────────────
const buildReminderEmailHTML = (userName, emis) => {
  const totalDue = emis.reduce((s, e) => s + e.emiAmount, 0);

  const emiRows = emis.map((emi) => {
    const dueDate  = new Date(emi.nextDueDate).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const daysLeft = Math.ceil(
      (new Date(emi.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const urgencyColor = daysLeft <= 1 ? "#ef4444" : daysLeft <= 3 ? "#f59e0b" : "#10b981";
    const urgencyText  = daysLeft === 0 ? "Due Today!" : daysLeft === 1 ? "Due Tomorrow!" : `Due in ${daysLeft} days`;

    return `
      <tr>
        <td style="padding:16px;border-bottom:1px solid #1e293b;">
          <p style="margin:0;font-weight:700;color:#f1f5f9;font-size:15px;">${emi.loanName}</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${emi.lenderName} · ${emi.category}</p>
        </td>
        <td style="padding:16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${dueDate}</td>
        <td style="padding:16px;border-bottom:1px solid #1e293b;">
          <span style="background:rgba(${daysLeft<=1?"239,68,68":daysLeft<=3?"245,158,11":"16,185,129"},0.15);color:${urgencyColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${urgencyText}</span>
        </td>
        <td style="padding:16px;border-bottom:1px solid #1e293b;text-align:right;">
          <p style="margin:0;font-weight:800;color:#0ea5e9;font-size:18px;">${fmt(emi.emiAmount)}</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">${emi.remainingMonths} months left</p>
        </td>
      </tr>`;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);border-radius:14px;padding:12px 24px;">
        <span style="font-size:20px;font-weight:800;color:#f1f5f9;">💳 EMI Tracker</span>
      </div>
    </div>
    <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.1);border-radius:20px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,rgba(14,165,233,0.15),rgba(99,102,241,0.1));padding:28px 32px;border-bottom:1px solid rgba(148,163,184,0.08);">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;">🔔 Payment Reminder</h1>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">Hi ${userName}, you have ${emis.length} EMI${emis.length>1?"s":""} due soon!</p>
      </div>
      <div style="padding:16px 32px;border-bottom:1px solid rgba(239,68,68,0.12);background:rgba(239,68,68,0.08);">
        <p style="margin:0;color:#94a3b8;font-size:14px;">Total amount due: <strong style="color:#ef4444;font-size:20px;">${fmt(totalDue)}</strong></p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:rgba(15,23,42,0.5);">
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Loan</th>
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Due Date</th>
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Status</th>
            <th style="padding:12px 16px;text-align:right;color:#64748b;font-size:11px;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>${emiRows}</tbody>
      </table>
      <div style="padding:20px 32px;background:rgba(14,165,233,0.05);border-top:1px solid rgba(14,165,233,0.08);">
        <p style="margin:0;color:#64748b;font-size:13px;">💡 Log into EMI Tracker to mark payments as done and track your progress.</p>
      </div>
    </div>
    <p style="text-align:center;color:#334155;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} EMI Tracker · Automated Reminder</p>
  </div>
</body>
</html>`;
};

// ─── Welcome Email Template ────────────────────────────────────────────────────
const buildWelcomeEmailHTML = (toName) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 16px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🎉</div>
    <h1 style="color:#f1f5f9;font-size:26px;margin:0 0 10px;">Welcome to EMI Tracker!</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 28px;">Hi ${toName}, your account is ready. Start tracking your loans and never miss a payment!</p>
    <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.1);border-radius:16px;padding:24px;margin-bottom:28px;text-align:left;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 14px;text-align:center;font-weight:600;">Here's what you can do:</p>
      ${["💳 Add all your EMIs in one place","📊 View dashboard summary","📈 Track repayment progress","🔔 Get email reminders before due dates"]
        .map(f => `<p style="color:#f1f5f9;font-size:14px;margin:8px 0;">${f}</p>`).join("")}
    </div>
    <p style="color:#334155;font-size:12px;">© ${new Date().getFullYear()} EMI Tracker</p>
  </div>
</body>
</html>`;

// ─── Send EMI Reminder Email ───────────────────────────────────────────────────
const sendEMIReminderEmail = async ({ toEmail, toName, emis }) => {
  if (!isConfigured()) return;
  const totalDue = emis.reduce((s, e) => s + e.emiAmount, 0);
  const subject  = emis.length === 1
    ? `🔔 EMI Reminder: ${emis[0].loanName} — ${fmt(emis[0].emiAmount)} due soon`
    : `🔔 EMI Reminder: ${emis.length} payments totalling ${fmt(totalDue)} due soon`;

  await sgMail.send({
    to:      toEmail,
    from:    { email: process.env.EMAIL_USER, name: "EMI Tracker" },
    subject,
    html:    buildReminderEmailHTML(toName, emis),
  });

  console.log(`📧 Reminder email sent to ${toEmail}`);
};

// ─── Send Welcome Email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ toEmail, toName }) => {
  if (!isConfigured()) return;

  await sgMail.send({
    to:      toEmail,
    from:    { email: process.env.EMAIL_USER, name: "EMI Tracker" },
    subject: "🎉 Welcome to EMI Tracker!",
    html:    buildWelcomeEmailHTML(toName),
  });

  console.log(`📧 Welcome email sent to ${toEmail}`);
};

module.exports = { sendEMIReminderEmail, sendWelcomeEmail };