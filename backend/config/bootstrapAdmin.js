import User from '../models/User.js';
import mongoose from 'mongoose';

export async function bootstrapAdminUser() {
  const enabled = process.env.AUTO_SEED_ADMIN === 'true';
  if (!enabled) return;

  if (mongoose.connection.readyState !== 1) {
    console.warn('Skipping admin bootstrap because MongoDB is not connected.');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPhone = process.env.ADMIN_PHONE?.trim() || '9999999999';
  const adminName = process.env.ADMIN_NAME?.trim() || 'Admin User';
  const forcePasswordReset = process.env.FORCE_ADMIN_PASSWORD_RESET === 'true';

  if (!adminEmail || !adminPassword) {
    console.warn('AUTO_SEED_ADMIN is enabled but ADMIN_EMAIL or ADMIN_PASSWORD is missing.');
    return;
  }

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    let changed = false;

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.emailVerified = true;
      existing.phoneVerified = true;
      changed = true;
    }

    if (forcePasswordReset) {
      existing.password = adminPassword;
      changed = true;
    }

    if (changed) {
      await existing.save();
      console.log(`Updated existing admin user: ${adminEmail}`);
    }

    return;
  }

  await User.create({
    name: adminName,
    email: adminEmail,
    phone: adminPhone,
    password: adminPassword,
    role: 'admin',
    emailVerified: true,
    phoneVerified: true,
    authProvider: 'email',
  });

  console.log(`Bootstrapped admin user: ${adminEmail}`);
}
