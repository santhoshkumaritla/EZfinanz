import mongoose from 'mongoose';

const STAGES = [
  'verification',
  'kyc',
  'eligibility',
  'emi_selection',
  'bank_account',
  'declaration',
  'selfie',
  'admin_review',
  'approved',
  'rejected',
  'disbursed',
];

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentStage: { type: String, enum: STAGES, default: 'verification' },
    status: {
      type: String,
      enum: ['in_progress', 'waiting_admin_review', 'approved', 'rejected', 'disbursed'],
      default: 'in_progress',
    },

    kyc: {
      fullName: String,
      dateOfBirth: Date,
      age: Number,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      address: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      idType: { type: String, enum: ['PAN', 'Aadhaar', 'Passport', 'Driving License'] },
      idNumber: String,
      idDocumentUrl: String,
      completed: { type: Boolean, default: false },
    },

    eligibility: {
      incomeType: { type: String, enum: ['monthly', 'annual'] },
      income: Number,
      requestedLoanAmount: Number,
      creditScore: Number,
      currentDebts: Number,
      employerName: String,
      designation: String,
      result: { type: String, enum: ['Eligible', 'Partially Eligible', 'Not Eligible'] },
      score: Number,
      reasons: [String],
      debtToIncome: Number,
      loanToIncome: Number,
      maxEligibleAmount: Number,
      creditRating: String,
      completed: { type: Boolean, default: false },
    },

    emiSelection: {
      loanAmount: Number,
      tenureMonths: Number,
      annualInterestRate: Number,
      processingFee: Number,
      gst: Number,
      otherCharges: Number,
      totalCharges: Number,
      netDisbursement: Number,
      emi: Number,
      totalInterest: Number,
      totalRepayment: Number,
      irr: Number,
      completed: { type: Boolean, default: false },
    },

    bankAccount: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      completed: { type: Boolean, default: false },
    },

    declaration: {
      accepted: { type: Boolean, default: false },
      acceptedAt: Date,
      completed: { type: Boolean, default: false },
    },

    selfie: {
      photoUrl: String,
      submittedAt: Date,
      adminStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      rejectionReason: String,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      completed: { type: Boolean, default: false },
    },

    disbursement: {
      status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
      disbursedAt: Date,
      disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: Number,
    },

    submittedAt: Date,
  },
  { timestamps: true }
);

export { STAGES };
export default mongoose.model('Application', applicationSchema);
