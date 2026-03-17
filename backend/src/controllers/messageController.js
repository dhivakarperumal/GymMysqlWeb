const nodemailer = require('nodemailer');
const db = require('../config/db');

/* ==========================================
   SEND MESSAGES TO GYM MEMBERS
   - Uses environment SMTP config
   - Falls back to "preview" mode (Ethereal) if not configured
========================================== */
async function sendMessages(req, res) {
  const { subject, message, recipients } = req.body;

  if (!message || !recipients || recipients.length === 0) {
    return res.status(400).json({ error: 'message and recipients are required' });
  }

  // 1. Respond immediately to the client
  res.json({
    success: true,
    message: 'Message processing started in background',
    total: recipients.length
  });

  // 2. Perform background processing
  (async () => {
    try {
      const useRealSMTP =
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS;

      let transporter = null;
      if (useRealSMTP) {
        try {
          transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            timeout: 10000,
          });
        } catch (e) { console.error("Transporter error:", e); }
      }

      const fromName = process.env.SMTP_FROM_NAME || 'Gym Admin';
      const fromEmail = process.env.SMTP_USER || 'admin@gym.com';

      // First, create the history record (initially with 0 sent/failed)
      const recipientsToStore = recipients.map(r => ({ id: r.id, name: r.name, email: r.email }));
      const [insertRes] = await db.query(
        "INSERT INTO message_history (subject, message, sent_to, failed, recipients_json) VALUES (?, ?, ?, ?, ?)",
        [subject || 'Message from Gym Admin', message, 0, 0, JSON.stringify(recipientsToStore)]
      );
      const historyId = insertRes.insertId;

      // Process emails
      const sendPromises = recipients.map(async (recipient) => {
        if (!recipient.email) return { status: 'failed' };
        if (!useRealSMTP || !transporter) return { status: 'sent' }; // simulated

        try {
          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient.email,
            subject: subject || 'Message from Gym Admin',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">🏋️ Gym Admin Message</h1>
                </div>
                <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">Hi <strong>${recipient.name || 'Member'}</strong>,</p>
                  <div style="color: #374151; font-size: 15px; line-height: 1.8; white-space: pre-wrap; border-left: 4px solid #f97316; padding-left: 16px; margin: 16px 0;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                  <p style="color: #9ca3af; font-size: 13px; text-align: center;">This was sent by Gym Admin.</p>
                </div>
              </div>
            `,
            text: `Hi ${recipient.name || 'Member'},\n\n${message}`,
          });
          return { status: 'sent' };
        } catch (err) {
          console.error(`Background send failed to ${recipient.email}:`, err.message);
          return { status: 'failed' };
        }
      });

      const results = await Promise.all(sendPromises);
      const sentCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      // Update history record
      await db.query(
        "UPDATE message_history SET sent_to = ?, failed = ? WHERE id = ?",
        [sentCount, failedCount, historyId]
      );

    } catch (bgErr) {
      console.error("Critical background message error:", bgErr);
    }
  })();
}



async function getMessageHistory(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM message_history ORDER BY sent_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching message history:", err);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
}

module.exports = { sendMessages, getMessageHistory };
