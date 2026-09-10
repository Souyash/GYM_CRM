const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required parameters: to, subject' });
  }

  try {
    const info = await transporter.sendMail({
      from: '"IronVault Fitness" <subhaarthabusiness@gmail.com>',
      to,
      subject,
      html: html || text,
      text: text || html
    });

    console.log(`[Vercel Relay] Email dispatched to ${to}. MessageId: ${info.messageId}`);
    return res.status(200).json({
      success: true,
      deliveredVia: 'VERCEL_GMAIL_RELAY',
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[Vercel Relay] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
