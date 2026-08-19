export const APPLICATION_STATUS = {
  in_progress: { label: 'In Progress', badge: 'badge-primary' },
  waiting_admin_review: { label: 'Pending Review', badge: 'badge-warning' },
  approved: { label: 'Approved', badge: 'badge-success' },
  disbursed: { label: 'Disbursed', badge: 'badge-success' },
  rejected: { label: 'Rejected', badge: 'badge-danger' },
};

export const STAGE_PATHS = {
  verification: '/apply/verify',
  kyc: '/apply/kyc',
  eligibility: '/apply/eligibility',
  emi_selection: '/apply/emi',
  bank_account: '/apply/bank',
  declaration: '/apply/declaration',
  selfie: '/apply/selfie',
  admin_review: '/apply/status',
  approved: '/apply/status',
  rejected: '/apply/selfie',
  disbursed: '/apply/status',
};

export function getApplicationStatusMeta(status) {
  return APPLICATION_STATUS[status] || APPLICATION_STATUS.in_progress;
}

export function getLoanStatusMeta(loan) {
  const outstanding = Number(loan.outstandingAmount || 0);
  const totalRepayment = Number(loan.totalRepayment || 0);
  const totalPaid = Number(loan.totalPaid || 0);

  // Treat as closed if outstanding is 0, or if paid amount covers total repayment
  // (handles floating point rounding where outstanding might be a tiny residual)
  const isClosed =
    outstanding <= 0 ||
    (totalRepayment > 0 && Math.round((totalPaid / totalRepayment) * 100) >= 100);

  if (isClosed) {
    return { label: 'Closed', badge: 'badge-success' };
  }
  if (loan.overdueAmount > 0) {
    return { label: 'Overdue', badge: 'badge-danger' };
  }
  return { label: 'Active', badge: 'badge-warning' };
}

export function getRepaymentProgress(totalRepayment, totalPaid) {
  if (!totalRepayment || totalRepayment <= 0) return 0;
  return Math.min(Math.round((totalPaid / totalRepayment) * 100), 100);
}
