export const STAGES = [
  { key: 'verification', label: 'Verify Account', path: '/apply/verify' },
  { key: 'kyc', label: 'KYC Details', path: '/apply/kyc' },
  { key: 'eligibility', label: 'Eligibility', path: '/apply/eligibility' },
  { key: 'emi_selection', label: 'EMI Selection', path: '/apply/emi' },
  { key: 'bank_account', label: 'Bank Account', path: '/apply/bank' },
  { key: 'declaration', label: 'Declaration', path: '/apply/declaration' },
  { key: 'selfie', label: 'Photo Verification', path: '/apply/selfie' },
  { key: 'admin_review', label: 'Admin Review', path: '/apply/status' },
  { key: 'approved', label: 'Approved', path: '/apply/status' },
  { key: 'disbursed', label: 'Disbursed', path: '/apply/status' },
];

export const STAGE_ORDER = STAGES.map((s) => s.key);

export function getStageIndex(stage) {
  return STAGE_ORDER.indexOf(stage);
}

export function formatCurrency(amount) {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DECLARATION_TEXT = `I hereby declare that all information provided in this loan application is true, complete, and accurate to the best of my knowledge. I authorize EZfinanz and its partners to verify my identity, credit history, employment details, and bank account information.

I consent to credit bureau checks, KYC verification, and any other due diligence required for processing this loan application. I understand that providing false information may result in rejection of my application and possible legal action.

I agree to the terms and conditions of the personal loan product, including interest rates, processing fees, repayment schedule, and penalties for late payment as disclosed during the application process.`;

export const TENURE_OPTIONS = [6, 12, 18, 24, 36];

export const SAMPLE_SCENARIOS = [
  { label: 'Excellent (750+ score)', creditScore: 780, income: 80000, debts: 10000, amount: 500000 },
  { label: 'Good (700-749)', creditScore: 720, income: 60000, debts: 15000, amount: 300000 },
  { label: 'Fair (650-699)', creditScore: 670, income: 45000, debts: 20000, amount: 200000 },
  { label: 'Low (<650)', creditScore: 580, income: 30000, debts: 25000, amount: 500000 },
];
