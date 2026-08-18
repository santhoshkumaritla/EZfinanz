import express from 'express';
import Application from '../models/Application.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

const STAGE_LABELS = {
  verification: 'Verification Pending',
  kyc: 'KYC',
  eligibility: 'Eligibility',
  emi_selection: 'EMI Selection',
  bank_account: 'Bank Account',
  declaration: 'Declaration',
  selfie: 'Selfie Pending',
  admin_review: 'Admin Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
};

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const applications = await Application.find()
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 });

    const list = applications.map((app) => ({
      id: app._id,
      applicantName: app.kyc?.fullName || app.user?.name || 'N/A',
      email: app.user?.email,
      phone: app.user?.phone,
      loanAmount: app.emiSelection?.loanAmount || app.eligibility?.requestedLoanAmount || 0,
      tenure: app.emiSelection?.tenureMonths || null,
      currentStage: app.currentStage,
      stageLabel: STAGE_LABELS[app.currentStage] || app.currentStage,
      status: app.status,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
    }));

    res.json({ success: true, applications: list, total: list.length });
  })
);

router.get(
  '/applications/:id',
  asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id)
      .populate('user', 'name email phone emailVerified phoneVerified authProvider createdAt')
      .populate('selfie.reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, application });
  })
);

router.put(
  '/applications/:id/selfie',
  asyncHandler(async (req, res) => {
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!application.selfie?.photoUrl) {
      return res.status(400).json({ success: false, message: 'No selfie submitted' });
    }

    if (action === 'approve') {
      application.selfie.adminStatus = 'approved';
      application.selfie.rejectionReason = undefined;
      application.currentStage = 'approved';
      application.status = 'approved';
    } else {
      application.selfie.adminStatus = 'rejected';
      application.selfie.rejectionReason = rejectionReason || 'Photo verification failed';
      application.currentStage = 'selfie';
      application.status = 'in_progress';
      application.selfie.completed = false;
    }

    application.selfie.reviewedAt = new Date();
    application.selfie.reviewedBy = req.user.id;
    await application.save();

    res.json({
      success: true,
      message: action === 'approve' ? 'Selfie approved' : 'Selfie rejected',
      application,
    });
  })
);

router.put(
  '/applications/:id/disburse',
  asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Application must be approved first' });
    }

    application.disbursement = {
      status: 'completed',
      disbursedAt: new Date(),
      disbursedBy: req.user.id,
      amount: application.emiSelection?.netDisbursement || application.emiSelection?.loanAmount,
    };
    application.currentStage = 'disbursed';
    application.status = 'disbursed';
    await application.save();

    res.json({ success: true, message: 'Loan disbursed successfully', application });
  })
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: 'waiting_admin_review' });
    const approved = await Application.countDocuments({ status: 'approved' });
    const disbursed = await Application.countDocuments({ status: 'disbursed' });
    const rejected = await Application.countDocuments({ 'selfie.adminStatus': 'rejected' });

    res.json({
      success: true,
      stats: { total, pending, approved, disbursed, rejected },
    });
  })
);

export default router;
