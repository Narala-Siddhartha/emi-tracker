const cron = require("node-cron");
const EMI  = require("../models/EMI");
const { sendEMIReminderEmail } = require("../services/emailService");

/**
 * EMI Reminder Cron Job
 * Runs every day at 8:00 AM
 * Finds EMIs due in next 3 days and sends email reminders
 */
const startReminderJob = () => {
  // "0 8 * * *" = every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("\n⏰ [Reminder Job] Running daily EMI reminder check...");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const in3Days = new Date();
      in3Days.setDate(today.getDate() + 3);
      in3Days.setHours(23, 59, 59, 999);

      // Find all active EMIs due in next 3 days, with user details
      const dueSoonEMIs = await EMI.find({
        status: "Active",
        nextDueDate: { $gte: today, $lte: in3Days },
      }).populate("userId", "name email");

      if (!dueSoonEMIs.length) {
        console.log("✅ [Reminder Job] No EMIs due in next 3 days.\n");
        return;
      }

      console.log(`🔔 [Reminder Job] Found ${dueSoonEMIs.length} EMI(s) due soon.`);

      // Group EMIs by user so each user gets ONE combined email
      const byUser = dueSoonEMIs.reduce((acc, emi) => {
        const userId = emi.userId?._id?.toString();
        if (!userId) return acc;
        if (!acc[userId]) {
          acc[userId] = {
            name:  emi.userId.name,
            email: emi.userId.email,
            emis:  [],
          };
        }
        acc[userId].emis.push(emi);
        return acc;
      }, {});

      // Send one email per user
      for (const { name, email, emis } of Object.values(byUser)) {
        try {
          console.log(`   → Sending reminder to ${name} (${email}) — ${emis.length} EMI(s)`);
          await sendEMIReminderEmail({ toEmail: email, toName: name, emis });
        } catch (err) {
          console.error(`   ❌ Failed to send email to ${email}:`, err.message);
        }
      }

      console.log("✅ [Reminder Job] All reminders sent.\n");
    } catch (error) {
      console.error("❌ [Reminder Job] Error:", error.message);
    }
  });

  console.log("✅ EMI Reminder Cron Job scheduled (daily at 8:00 AM)");
};

module.exports = { startReminderJob };
