import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { generateToken, protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateOTP, storeOTP, verifyOTP, getStoredOTP } from '../utils/otpStore.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or phone' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      authProvider: phone && !email ? 'phone' : 'email',
    });

    await Application.create({ user: user._id });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.trim();

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const query = normalizedEmail ? { email: normalizedEmail } : normalizedPhone ? { phone: normalizedPhone } : null;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ezfinanz.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Recovery path for deployments where admin seed/reset was missed.
    if (
      normalizedEmail &&
      adminEmail &&
      adminPassword &&
      normalizedEmail === adminEmail &&
      password === adminPassword
    ) {
      let adminUser = await User.findOne({ email: adminEmail }).select('+password');

      if (!adminUser) {
        adminUser = await User.create({
          name: process.env.ADMIN_NAME?.trim() || 'Admin User',
          email: adminEmail,
          ...(process.env.ADMIN_PHONE?.trim() ? { phone: process.env.ADMIN_PHONE.trim() } : {}),
          password: adminPassword,
          role: 'admin',
          authProvider: 'email',
          emailVerified: true,
          phoneVerified: true,
        });
      } else {
        // Keep admin account aligned with configured deploy credentials.
        const alreadyMatchesPassword = await adminUser.comparePassword(adminPassword);
        const needsUpdate =
          adminUser.role !== 'admin' ||
          adminUser.authProvider !== 'email' ||
          !adminUser.emailVerified ||
          !adminUser.phoneVerified ||
          !alreadyMatchesPassword;

        if (needsUpdate) {
          adminUser.role = 'admin';
          adminUser.authProvider = 'email';
          adminUser.emailVerified = true;
          adminUser.phoneVerified = true;
          if (!alreadyMatchesPassword) adminUser.password = adminPassword;
          await adminUser.save();
        }
      }

      const token = generateToken(adminUser._id, adminUser.role);
      return res.json({ success: true, token, user: sanitizeUser(adminUser) });
    }

    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  })
);

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ success: false, message: 'Google authentication is not configured' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Google credential' });
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar,
        authProvider: 'google',
        emailVerified: true,
      });
      await Application.create({ user: user._id });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      user.emailVerified = true;
      if (name && !user.name) user.name = name;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let application = req.get('X-Application-Id')
      ? await Application.findOne({ user: user._id, _id: req.get('X-Application-Id') })
      : await Application.findOne({ user: user._id }).sort({ createdAt: -1 });
    if (!application && user.role === 'customer') {
      application = await Application.create({ user: user._id });
    }

    const applications = await Application.find({ user: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user: sanitizeUser(user),
      application,
      applications,
    });
  })
);

router.post(
  '/send-email-otp',
  protect,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findById(req.user.id);

    if (email && email !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
      user.email = email.toLowerCase();
      user.emailVerified = false;
      await user.save();
    }

    if (!user?.email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const otp = generateOTP();
    storeOTP(`email:${user._id}`, otp);

    console.log(`[SIMULATED EMAIL] OTP for ${user.email}: ${otp}`);

    const showDevOtp = process.env.SHOW_DEV_OTP === 'true';

    res.json({
      success: true,
      message: 'OTP sent to email',
      ...(showDevOtp && { devOtp: otp }),
    });
  })
);

router.post(
  '/verify-email',
  protect,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const result = verifyOTP(`email:${req.user.id}`, otp);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { emailVerified: true }, { new: true });
    await updateApplicationStage(req.user.id);

    res.json({ success: true, message: 'Email verified', user: sanitizeUser(user) });
  })
);

router.post(
  '/send-phone-otp',
  protect,
  asyncHandler(async (req, res) => {
    const { phone } = req.body;
    const user = await User.findById(req.user.id);

    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, message: 'Phone already registered' });
      user.phone = phone;
      await user.save();
    }

    if (!user.phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const otp = generateOTP();
    storeOTP(`phone:${user._id}`, otp);

    console.log(`[SIMULATED SMS] OTP for ${user.phone}: ${otp}`);

    const showDevOtp = process.env.SHOW_DEV_OTP === 'true';

    res.json({
      success: true,
      message: 'OTP sent to phone',
      ...(showDevOtp && { devOtp: otp }),
    });
  })
);

router.post(
  '/verify-phone',
  protect,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const result = verifyOTP(`phone:${req.user.id}`, otp);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { phoneVerified: true }, { new: true });
    await updateApplicationStage(req.user.id);

    res.json({ success: true, message: 'Phone verified', user: sanitizeUser(user) });
  })
);

router.get(
  '/dev-otp/:type',
  protect,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const otp = getStoredOTP(`${type}:${req.user.id}`);
    res.json({ success: true, otp });
  })
);

async function updateApplicationStage(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const application = await Application.findOne({ user: userId });
  if (!application) return;

  if (user.emailVerified && user.phoneVerified && application.currentStage === 'verification') {
    application.currentStage = 'kyc';
    await application.save();
  }
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    avatar: user.avatar,
  };
}

export default router;
