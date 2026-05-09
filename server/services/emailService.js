const nodemailer = require("nodemailer");

// ─── Create Transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not your login password)
    },
  });
};

// ─── Format currency ───────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

// ─── EMI Reminder Email Template ──────────────────────────────────────────────
const buildReminderEmailHTML = (userName, emis) => {
  const totalDue = emis.reduce((s, e) => s + e.emiAmount, 0);

  const emiRows = emis
    .map((emi) => {
      const dueDate = new Date(emi.nextDueDate).toLocaleDateString("en-IN", {
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
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:42px;height:42px;border-radius:10px;background:rgba(14,165,233,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
                ${emi.category === "Home" ? "🏠" : emi.category === "Car" ? "🚗" : emi.category === "Education" ? "🎓" : emi.category === "Business" ? "💼" : "💳"}
              </div>
              <div>
                <p style="margin:0;font-weight:700;color:#f1f5f9;font-size:15px;">${emi.loanName}</p>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${emi.lenderName} · ${emi.category}</p>
              </div>
            </div>
          </td>
          <td style="padding:16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${dueDate}</td>
          <td style="padding:16px;border-bottom:1px solid #1e293b;">
            <span style="background:rgba(${daysLeft <= 1 ? "239,68,68" : daysLeft <= 3 ? "245,158,11" : "16,185,129"},0.15);color:${urgencyColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${urgencyText}</span>
          </td>
          <td style="padding:16px;border-bottom:1px solid #1e293b;text-align:right;">
            <p style="margin:0;font-weight:800;color:#0ea5e9;font-size:18px;font-family:Georgia,serif;">${fmt(emi.emiAmount)}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">${emi.remainingMonths} months left</p>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EMI Payment Reminder</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);border-radius:14px;padding:12px 24px;">
        <span style="font-size:24px;">💳</span>
        <span style="font-size:20px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">EMI Tracker</span>
      </div>
    </div>

    <!-- Main Card -->
    <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.1);border-radius:20px;overflow:hidden;">

      <!-- Card Header -->
      <div style="background:linear-gradient(135deg,rgba(14,165,233,0.15),rgba(99,102,241,0.1));padding:28px 32px;border-bottom:1px solid rgba(148,163,184,0.08);">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:52px;height:52px;border-radius:14px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;">🔔</div>
          <div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">Payment Reminder</h1>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">Hi ${userName}, you have ${emis.length} EMI${emis.length > 1 ? "s" : ""} due soon!</p>
          </div>
        </div>
      </div>

      <!-- Total Due Banner -->
      <div style="background:rgba(239,68,68,0.08);border-bottom:1px solid rgba(239,68,68,0.12);padding:16px 32px;display:flex;justify-content:space-between;align-items:center;">
        <p style="margin:0;color:#94a3b8;font-size:14px;">Total amount due</p>
        <p style="margin:0;font-size:26px;font-weight:800;color:#ef4444;font-family:Georgia,serif;">${fmt(totalDue)}</p>
      </div>

      <!-- EMI Table -->
      <div style="padding:8px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:rgba(15,23,42,0.5);">
              <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Loan</th>
              <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Due Date</th>
              <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Status</th>
              <th style="padding:12px 16px;text-align:right;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Amount</th>
            </tr>
          </thead>
          <tbody>${emiRows}</tbody>
        </table>
      </div>

      <!-- Tips -->
      <div style="padding:20px 32px;background:rgba(14,165,233,0.05);border-top:1px solid rgba(14,165,233,0.08);">
        <p style="margin:0 0 10px;color:#94a3b8;font-size:13px;font-weight:600;">💡 Quick Tips</p>
        <ul style="margin:0;padding-left:18px;color:#64748b;font-size:13px;line-height:1.8;">
          <li>Set up auto-debit to never miss a payment</li>
          <li>Late payments can affect your credit score</li>
          <li>Log into EMI Tracker to mark payments as done</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="color:#334155;font-size:12px;margin:0;">This is an automated reminder from <strong style="color:#475569;">EMI Tracker</strong></p>
      <p style="color:#1e293b;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} EMI Tracker · All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;
};

// ─── Send EMI Reminder Email ───────────────────────────────────────────────────
const sendEMIReminderEmail = async ({ toEmail, toName, emis }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn("⚠️  Email not configured — skipping email send. Add EMAIL_USER and EMAIL_APP_PASSWORD to .env");
    return;
  }

  const transporter = createTransporter();
  const totalDue = emis.reduce((s, e) => s + e.emiAmount, 0);
  const subject =
    emis.length === 1
      ? `🔔 EMI Reminder: ${emis[0].loanName} — ${fmt(emis[0].emiAmount)} due soon`
      : `🔔 EMI Reminder: ${emis.length} payments totalling ${fmt(totalDue)} due soon`;

  const mailOptions = {
    from: `"EMI Tracker 💳" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: buildReminderEmailHTML(toName, emis),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`   📧 Email sent to ${toEmail} — Message ID: ${info.messageId}`);
  return info;
};

// ─── Send Welcome Email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ toEmail, toName }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return;

  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 16px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🎉</div>
    <h1 style="color:#f1f5f9;font-size:26px;margin:0 0 10px;">Welcome to EMI Tracker!</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 28px;">Hi ${toName}, your account is ready. Start tracking your loans and never miss a payment!</p>
    <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.1);border-radius:16px;padding:24px;margin-bottom:28px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">Here's what you can do:</p>
      ${["💳 Add all your EMIs in one place", "📊 View dashboard summary", "📈 Track repayment progress", "🔔 Get email reminders before due dates"].map(f => `<p style="color:#f1f5f9;font-size:14px;margin:8px 0;">${f}</p>`).join("")}
    </div>
    <p style="color:#334155;font-size:12px;">© ${new Date().getFullYear()} EMI Tracker</p>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"EMI Tracker 💳" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🎉 Welcome to EMI Tracker!",
    html,
  });

  console.log(`📧 Welcome email sent to ${toEmail}`);
};

module.exports = { sendEMIReminderEmail, sendWelcomeEmail };
