import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const SMTP_HOST = process.env.SMTP_HOST?.trim();
  const SMTP_PORT = process.env.SMTP_PORT?.trim();
  const SMTP_USER = process.env.SMTP_USER?.trim();
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD?.replace(/\s/g, '');
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmailOtp({ recipient, otp }) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('Email service is not configured');
      error.statusCode = 503;
      throw error;
    }

    console.log(`[SIMULATED EMAIL] OTP for ${recipient}: ${otp}`);
    return { simulated: true };
  }

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: 'EZfinanz email verification code',
    text: `Your EZfinanz verification code is ${otp}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>EZfinanz email verification</h2><p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes.</p><p>If you did not request this code, you can ignore this email.</p></div>`,
  });

  return { simulated: false };
}
