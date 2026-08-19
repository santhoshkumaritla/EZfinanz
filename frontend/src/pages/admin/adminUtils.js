export const STAGE_LABELS = {
  verification: 'Verification',
  kyc: 'KYC',
  eligibility: 'Eligibility',
  emi_selection: 'EMI Selection',
  bank_account: 'Bank Account',
  declaration: 'Declaration',
  selfie: 'Selfie',
  admin_review: 'Admin Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
};

export const ADMIN_STAGES = [
  'verification',
  'kyc',
  'eligibility',
  'emi_selection',
  'bank_account',
  'declaration',
  'selfie',
  'admin_review',
  'approved',
  'disbursed',
];

export const STATUS_STYLES = {
  in_progress: 'badge-gray',
  waiting_admin_review: 'badge-warning',
  approved: 'badge-success',
  disbursed: 'badge-success',
  rejected: 'badge-danger',
};

export const STATUS_LABELS = {
  in_progress: 'In Progress',
  waiting_admin_review: 'Pending Review',
  approved: 'Approved',
  disbursed: 'Disbursed',
  rejected: 'Rejected',
};

export const ELIGIBILITY_STYLES = {
  Eligible: 'bg-emerald-100 text-emerald-700',
  'Partially Eligible': 'bg-amber-100 text-amber-700',
  'Not Eligible': 'bg-red-100 text-red-600',
};

export function getStageIndex(stage) {
  return ADMIN_STAGES.indexOf(stage);
}

export function formatStageLabel(stage) {
  return STAGE_LABELS[stage] || stage?.replace(/_/g, ' ') || 'Unknown';
}

export function formatStatusLabel(status) {
  return STATUS_LABELS[status] || status?.replace(/_/g, ' ') || 'Unknown';
}
