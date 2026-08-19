import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { upload, getUploadUrl } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkEligibility, getFullLoanTerms } from '../utils/loanCalculator.js';

const router = express.Router();

router.use(protect);

const getOrCreateApplication = async (userId) => {
  let app = await Application.findOne({ user: userId });
  if (!app) app = await Application.create({ user: userId });
  return app;
};

const ensureVerified = async (userId) => {
  const user = await User.findById(userId);
  if (!user.emailVerified || !user.phoneVerified) {
    const err = new Error('Email and phone must be verified first');
    err.statusCode = 403;
    throw err;
  }
  return user;
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const application = await getOrCreateApplication(req.user.id);
    res.json({ success: true, application });
  })
);

router.put(
  '/kyc',
  upload.single('idDocument'),
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    const { fullName, dateOfBirth, gender, address, city, district, state, pincode, idType, idNumber } = req.body;

    if (!fullName || !dateOfBirth || !gender || !address || !idType || !idNumber) {
      return res.status(400).json({ success: false, message: 'All required KYC fields must be filled' });
    }

    const dob = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    application.kyc = {
      fullName,
      dateOfBirth: dob,
      age,
      gender,
      address,
      city: city || '',
      district: district || '',
      state: state || '',
      pincode: pincode || '',
      idType,
      idNumber,
      idDocumentUrl: req.file ? getUploadUrl(req.file.filename) : application.kyc?.idDocumentUrl,
      completed: true,
    };
    application.currentStage = 'eligibility';
    await application.save();

    res.json({ success: true, message: 'KYC saved', application });
  })
);

router.put(
  '/eligibility',
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    if (!application.kyc?.completed) {
      return res.status(400).json({ success: false, message: 'Complete KYC first' });
    }

    const {
      incomeType,
      income,
      requestedLoanAmount,
      creditScore,
      currentDebts,
      employerName,
      designation,
    } = req.body;

    if (!income || !requestedLoanAmount || creditScore === undefined || currentDebts === undefined) {
      return res.status(400).json({ success: false, message: 'All financial fields are required' });
    }

    const result = checkEligibility({
      income: Number(income),
      loanAmount: Number(requestedLoanAmount),
      creditScore: Number(creditScore),
      currentDebts: Number(currentDebts),
      incomeType: incomeType || 'monthly',
    });

    application.eligibility = {
      incomeType: incomeType || 'monthly',
      income: Number(income),
      requestedLoanAmount: Number(requestedLoanAmount),
      creditScore: Number(creditScore),
      currentDebts: Number(currentDebts),
      employerName: employerName || '',
      designation: designation || '',
      result: result.status,
      score: result.score,
      reasons: result.reasons,
      debtToIncome: result.debtToIncome,
      loanToIncome: result.loanToIncome,
      maxEligibleAmount: result.maxEligibleAmount,
      creditRating: result.creditRating,
      completed: true,
    };

    if (result.status === 'Not Eligible') {
      application.currentStage = 'eligibility';
    } else {
      application.currentStage = 'emi_selection';
    }

    await application.save();

    res.json({ success: true, message: 'Eligibility checked', application, eligibility: result });
  })
);

router.post(
  '/calculate-emi',
  asyncHandler(async (req, res) => {
    const { loanAmount, tenureMonths, creditScore } = req.body;

    if (!loanAmount || !tenureMonths || !creditScore) {
      return res.status(400).json({ success: false, message: 'Loan amount, tenure, and credit score required' });
    }

    const terms = getFullLoanTerms(Number(loanAmount), Number(tenureMonths), Number(creditScore));
    res.json({ success: true, terms });
  })
);

router.put(
  '/emi',
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    if (!application.eligibility?.completed || application.eligibility.result === 'Not Eligible') {
      return res.status(400).json({ success: false, message: 'Must be eligible to select EMI terms' });
    }

    const { loanAmount, tenureMonths } = req.body;
    const creditScore = application.eligibility.creditScore;
    const maxAmount = application.eligibility.maxEligibleAmount;

    if (Number(loanAmount) > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum eligible loan amount is ₹${maxAmount.toLocaleString('en-IN')}`,
      });
    }

    const terms = getFullLoanTerms(Number(loanAmount), Number(tenureMonths), creditScore);

    application.emiSelection = { ...terms, completed: true };
    application.currentStage = 'bank_account';
    await application.save();

    res.json({ success: true, message: 'EMI terms saved', application, terms });
  })
);

router.put(
  '/bank-account',
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    if (!application.emiSelection?.completed) {
      return res.status(400).json({ success: false, message: 'Complete EMI selection first' });
    }

    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ success: false, message: 'All bank account fields are required' });
    }

    const normalizedIfsc = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    }

    application.bankAccount = {
      accountHolderName,
      accountNumber,
      ifscCode: normalizedIfsc,
      bankName,
      completed: true,
    };
    application.currentStage = 'declaration';
    await application.save();

    res.json({ success: true, message: 'Bank account saved', application });
  })
);

router.put(
  '/declaration',
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    if (!application.bankAccount?.completed) {
      return res.status(400).json({ success: false, message: 'Add bank account first' });
    }

    const { accepted } = req.body;
    if (!accepted) {
      return res.status(400).json({ success: false, message: 'You must accept the declaration' });
    }

    application.declaration = {
      accepted: true,
      acceptedAt: new Date(),
      completed: true,
    };
    application.currentStage = 'selfie';
    await application.save();

    res.json({ success: true, message: 'Declaration accepted', application });
  })
);

router.post(
  '/selfie',
  upload.single('selfie'),
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id);

    if (!application.declaration?.completed) {
      return res.status(400).json({ success: false, message: 'Accept declaration first' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Selfie photo is required' });
    }

    application.selfie = {
      photoUrl: getUploadUrl(req.file.filename),
      submittedAt: new Date(),
      adminStatus: 'pending',
      completed: true,
    };
    application.currentStage = 'admin_review';
    application.status = 'waiting_admin_review';
    application.submittedAt = new Date();
    await application.save();

    res.json({ success: true, message: 'Selfie submitted. Waiting for admin review.', application });
  })
);

export default router;
