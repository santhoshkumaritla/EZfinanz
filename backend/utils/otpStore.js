/**
 * In-memory OTP store for simulated email/SMS verification.
 * In production, use Redis or a dedicated service.
 */

const otpStore = new Map();

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(key, otp, expiresInMs = 10 * 60 * 1000) {
  otpStore.set(key, { otp, expiresAt: Date.now() + expiresInMs });
}

export function verifyOTP(key, otp) {
  const record = otpStore.get(key);
  if (!record) return { valid: false, message: 'OTP not found or expired' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: 'OTP expired' };
  }
  if (record.otp !== otp) return { valid: false, message: 'Invalid OTP' };
  otpStore.delete(key);
  return { valid: true };
}

export function getStoredOTP(key) {
  const record = otpStore.get(key);
  if (!record || Date.now() > record.expiresAt) return null;
  return record.otp;
}
