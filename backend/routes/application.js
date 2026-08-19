import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { upload, getUploadUrl } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkEligibility, getFullLoanTerms } from '../utils/loanCalculator.js';

const router = express.Router();

router.use(protect);

const getOrCreateApplication = async (userId, applicationId) => {
  let app = applicationId
    ? await Application.findOne({ _id: applicationId, user: userId })
    : await Application.findOne({ user: userId }).sort({ createdAt: -1 });
  if (!app) app = await Application.create({ user: userId });
  return app;
};

router.use((req, _res, next) => {
  req.applicationId = req.get('X-Application-Id');
  next();
});

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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);
    res.json({ success: true, application });
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, applications });
  })
);

router.post(
  '/new',
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const previous = await Application.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!previous?.kyc?.completed) {
      return res.status(400).json({ success: false, message: 'Complete your first application KYC before applying again' });
    }

    const application = await Application.create({
      user: req.user.id,
      currentStage: 'eligibility',
      status: 'in_progress',
      kyc: { ...previous.kyc.toObject(), _id: undefined },
    });

    res.status(201).json({ success: true, application });
  })
);

router.put(
  '/kyc',
  upload.single('idDocument'),
  asyncHandler(async (req, res) => {
    await ensureVerified(req.user.id);
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

    const { fullName, dateOfBirth, gender, address, city, district, state, pincode, idType, idNumber } = req.body;

    if (!fullName || !dateOfBirth || !gender || !address || !city || !district || !state || !pincode || !idType || !idNumber) {
      return res.status(400).json({ success: false, message: 'All required KYC fields must be filled' });
    }

    const dob = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (Number.isNaN(dob.getTime()) || age < 18 || age > 100) {
      return res.status(400).json({ success: false, message: 'Enter a valid date of birth for an adult applicant' });
    }
    if (!/^\d{6}$/.test(String(pincode))) {
      return res.status(400).json({ success: false, message: 'Pincode must contain exactly 6 digits' });
    }

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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

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

    const numericIncome = Number(income);
    const numericLoanAmount = Number(requestedLoanAmount);
    const numericCreditScore = Number(creditScore);
    const numericCurrentDebts = Number(currentDebts);
    if (!['monthly', 'annual'].includes(incomeType || 'monthly') ||
      !Number.isFinite(numericIncome) || numericIncome <= 0 ||
      !Number.isFinite(numericLoanAmount) || numericLoanAmount < 10000 ||
      !Number.isInteger(numericCreditScore) || numericCreditScore < 300 || numericCreditScore > 900 ||
      !Number.isFinite(numericCurrentDebts) || numericCurrentDebts < 0) {
      return res.status(400).json({ success: false, message: 'Enter valid income, loan amount, credit score, and debt values' });
    }

    const result = checkEligibility({
      income: numericIncome,
      loanAmount: numericLoanAmount,
      creditScore: numericCreditScore,
      currentDebts: numericCurrentDebts,
      incomeType: incomeType || 'monthly',
    });

    application.eligibility = {
      incomeType: incomeType || 'monthly',
      income: numericIncome,
      requestedLoanAmount: numericLoanAmount,
      creditScore: numericCreditScore,
      currentDebts: numericCurrentDebts,
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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

    if (!application.eligibility?.completed || application.eligibility.result === 'Not Eligible') {
      return res.status(400).json({ success: false, message: 'Must be eligible to select EMI terms' });
    }

    const { loanAmount, tenureMonths } = req.body;
    const creditScore = application.eligibility.creditScore;
    const maxAmount = application.eligibility.maxEligibleAmount;

    if (!Number.isFinite(Number(loanAmount)) || Number(loanAmount) < 10000 ||
      !Number.isInteger(Number(tenureMonths)) || Number(tenureMonths) < 6 || Number(tenureMonths) > 60) {
      return res.status(400).json({ success: false, message: 'Enter a valid loan amount and repayment tenure' });
    }

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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

    if (!application.emiSelection?.completed) {
      return res.status(400).json({ success: false, message: 'Complete EMI selection first' });
    }

    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ success: false, message: 'All bank account fields are required' });
    }

    if (!/^\d{8,18}$/.test(String(accountNumber).trim())) {
      return res.status(400).json({ success: false, message: 'Account number must contain 8 to 18 digits' });
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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

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
    const application = await getOrCreateApplication(req.user.id, req.applicationId);

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
