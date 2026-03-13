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

  // Build transporter from .env, or use Ethereal (test) as fallback
  let transporter;
  const useRealSMTP =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (useRealSMTP) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Test mode: use Ethereal (messages are captured, not delivered)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Gym Admin';
  const fromEmail = process.env.SMTP_USER || 'admin@gym.com';

  const results = [];

  for (const recipient of recipients) {
    if (!recipient.email) {
      results.push({ name: recipient.name, status: 'failed', reason: 'No email' });
      continue;
    }

    try {
      const info = await transporter.sendMail({
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
              <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                This message was sent by the Gym Admin.<br>
                Please contact us if you have any questions.
              </p>
            </div>
          </div>
        `,
        text: `Hi ${recipient.name || 'Member'},\n\n${message}`,
      });

      results.push({
        name: recipient.name,
        email: recipient.email,
        status: 'sent',
        messageId: info.messageId,
        preview: nodemailer.getTestMessageUrl(info) || null,
      });
    } catch (err) {
      results.push({
        name: recipient.name,
        email: recipient.email,
        status: 'failed',
        reason: err.message,
      });
    }
  }

  const sentCount = results.filter((r) => r.status === 'sent').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  try {
    const recipientsToStore = recipients.map(r => ({ id: r.id, name: r.name, email: r.email }));
    await db.query(
      "INSERT INTO message_history (subject, message, sent_to, failed, recipients_json) VALUES (?, ?, ?, ?, ?)",
      [
        subject || 'Message from Gym Admin',
        message,
        sentCount,
        failedCount,
        JSON.stringify(recipientsToStore)
      ]
    );
  } catch (dbErr) {
    console.error("Failed to store message history", dbErr);
  }

  res.json({
    success: true,
    total: recipients.length,
    sent: sentCount,
    failed: failedCount,
    results,
    note: useRealSMTP ? 'Emails sent via configured SMTP' : 'Running in test mode (Ethereal). Configure SMTP_HOST/SMTP_USER/SMTP_PASS in .env to send real emails.',
  });
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
