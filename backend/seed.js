import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Application from './models/Application.js';
import { checkEligibility, getFullLoanTerms } from './utils/loanCalculator.js';

dotenv.config();

const seedAdmin = async () => {
  const adminEmail = 'admin@ezfinanz.com';
  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    await User.create({
      name: 'Admin User',
      email: adminEmail,
      phone: '9999999999',
      password: 'admin123',
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
      authProvider: 'email',
    });
    console.log('Admin user created: admin@ezfinanz.com / admin123');
  } else {
    console.log('Admin user already exists:', adminEmail);
  }
};

const seedSampleCustomers = async () => {
  const samples = [
    {
      name: 'Rahul Sharma',
      email: 'rahul@demo.com',
      phone: '9876543210',
      password: 'demo123',
      stage: 'selfie',
    },
    {
      name: 'Priya Patel',
      email: 'priya@demo.com',
      phone: '9876543211',
      password: 'demo123',
      stage: 'emi_selection',
    },
  ];

  for (const sample of samples) {
    const exists = await User.findOne({ email: sample.email });
    if (exists) {
      console.log(`Sample customer already exists: ${sample.email}`);
      continue;
    }

    const user = await User.create({
      name: sample.name,
      email: sample.email,
      phone: sample.phone,
      password: sample.password,
      emailVerified: true,
      phoneVerified: true,
      authProvider: 'email',
    });

    const eligResult = checkEligibility({
      income: 75000,
      loanAmount: 400000,
      creditScore: 760,
      currentDebts: 12000,
      incomeType: 'monthly',
    });

    const emiTerms = getFullLoanTerms(400000, 24, 760);

    const appData = {
      user: user._id,
      currentStage: sample.stage === 'waiting_admin_review' ? 'admin_review' : 'emi_selection',
      status: sample.stage === 'waiting_admin_review' ? 'waiting_admin_review' : 'in_progress',
      kyc: {
        fullName: sample.name,
        dateOfBirth: new Date('1992-05-15'),
        age: 33,
        gender: 'male',
        address: '42 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        idType: 'PAN',
        idNumber: 'ABCDE1234F',
        completed: true,
      },
      eligibility: {
        incomeType: 'monthly',
        income: 75000,
        requestedLoanAmount: 400000,
        creditScore: 760,
        currentDebts: 12000,
        employerName: 'Tech Corp',
        designation: 'Software Engineer',
        result: eligResult.status,
        score: eligResult.score,
        reasons: eligResult.reasons,
        debtToIncome: eligResult.debtToIncome,
        loanToIncome: eligResult.loanToIncome,
        maxEligibleAmount: eligResult.maxEligibleAmount,
        creditRating: eligResult.creditRating,
        completed: true,
      },
    };

    if (sample.stage === 'waiting_admin_review') {
      appData.emiSelection = { ...emiTerms, completed: true };
      appData.bankAccount = {
        accountHolderName: sample.name,
        accountNumber: '123456789012',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        completed: true,
      };
      appData.declaration = { accepted: true, acceptedAt: new Date(), completed: true };
      appData.submittedAt = new Date();
      // Selfie must be submitted by customer through the app (requires actual photo upload)
      appData.currentStage = 'selfie';
      appData.status = 'in_progress';
    }

    await Application.create(appData);
    console.log(`Sample customer created: ${sample.email} / demo123 (${sample.stage})`);
  }
};

const run = async () => {
  await connectDB();
  await seedAdmin();
  await seedSampleCustomers();
  console.log('\nSeed complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
