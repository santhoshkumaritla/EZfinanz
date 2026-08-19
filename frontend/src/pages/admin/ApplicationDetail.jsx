import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/constants';
import {
  ADMIN_STAGES,
  ELIGIBILITY_STYLES,
  STATUS_STYLES,
  formatStageLabel,
  formatStatusLabel,
  getStageIndex,
} from './adminUtils';
import './Admin.css';

function DetailField({ label, value }) {
  return (
    <div className="admin-field">
      <span>{label}</span>
      <strong>{value ?? 'N/A'}</strong>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="admin-section-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ProgressTracker({ currentStage, status }) {
  const currentIndex = getStageIndex(status === 'disbursed' ? 'disbursed' : currentStage);

  return (
    <div className="admin-progress">
      {ADMIN_STAGES.map((stage, index) => {
        const isDone = index < currentIndex || (status === 'disbursed' && stage !== 'disbursed');
        const isCurrent = index === currentIndex;
        const className = [
          'admin-progress-step',
          isDone ? 'done' : '',
          isCurrent ? 'current' : '',
        ].filter(Boolean).join(' ');

        return (
          <span key={stage} className={className}>
            {formatStageLabel(stage)}
          </span>
        );
      })}
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchApplication = async () => {
    const { data } = await api.get(`/admin/applications/${id}`);
    setApplication(data.application);
  };

  useEffect(() => {
    fetchApplication()
      .catch((err) => setError(err.response?.data?.message || 'Failed to load application'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelfieAction = async (action) => {
    setActionLoading(action);
    setMessage('');
    setError('');
    try {
      await api.put(`/admin/applications/${id}/selfie`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });
      setMessage(action === 'approve' ? 'Selfie approved. Application is now approved.' : 'Selfie rejected. Applicant can resubmit.');
      await fetchApplication();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleDisburse = async () => {
    const amount = application?.emiSelection?.netDisbursement || application?.emiSelection?.loanAmount || 0;
    const confirmed = window.confirm(`Disburse ${formatCurrency(amount)} to the applicant's bank account?`);
    if (!confirmed) return;

    setActionLoading('disburse');
    setMessage('');
    setError('');
    try {
      await api.put(`/admin/applications/${id}/disburse`);
      setMessage('Loan disbursed successfully. Repayment schedule has been created.');
      await fetchApplication();
    } catch (err) {
      setError(err.response?.data?.message || 'Disbursement failed');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading application...</div>;
  }

  if (!application) {
    return (
      <div className="admin-detail-shell">
        <div className="alert-error">{error || 'Application not found'}</div>
        <Link to="/admin" className="btn-secondary btn-sm mt-4 inline-flex no-underline">Back to Dashboard</Link>
      </div>
    );
  }

  const user = application.user || {};
  const kyc = application.kyc || {};
  const elig = application.eligibility || {};
  const emi = application.emiSelection || {};
  const bank = application.bankAccount || {};
  const selfie = application.selfie || {};
  const repayment = application.repayment || {};
  const canReviewSelfie = selfie.adminStatus === 'pending' && application.status === 'waiting_admin_review';
  const canDisburse = application.status === 'approved';

  return (
    <div className="admin-detail-shell">
      <Link to="/admin" className="text-sm text-gray-500 no-underline hover:text-primary">
        ← Back to Dashboard
      </Link>

      <header className="admin-page-header mt-3">
        <div>
          <p className="admin-eyebrow">Application Review</p>
          <h1>{kyc.fullName || user.name || 'Application Details'}</h1>
          <p className="admin-subtitle">
            Submitted {formatDate(application.submittedAt || application.createdAt)}
          </p>
        </div>
        <span className={STATUS_STYLES[application.status] || 'badge-gray'}>
          {formatStatusLabel(application.status)}
        </span>
      </header>

      {error && <div className="alert-error">{error}</div>}
      {message && <div className="alert-success">{message}</div>}

      <section className="admin-summary-card mb-4">
        <div className="admin-summary-item">
          <span>Loan Amount</span>
          <strong>{formatCurrency(emi.loanAmount || elig.requestedLoanAmount)}</strong>
        </div>
        <div className="admin-summary-item">
          <span>Monthly EMI</span>
          <strong>{formatCurrency(emi.emi)}</strong>
        </div>
        <div className="admin-summary-item">
          <span>Net Disbursement</span>
          <strong>{formatCurrency(emi.netDisbursement)}</strong>
        </div>
        <div className="admin-summary-item">
          <span>Current Stage</span>
          <strong>{formatStageLabel(application.currentStage)}</strong>
        </div>
      </section>

      <SectionCard title="Application Progress">
        <ProgressTracker currentStage={application.currentStage} status={application.status} />
      </SectionCard>

      <div className="admin-detail-grid mt-4">
        <div className="admin-detail-main">
          <SectionCard title="Verification Status">
            <div className="admin-detail-grid-inner">
              <DetailField label="Email" value={`${user.email || 'N/A'} ${user.emailVerified ? '✓' : '✗'}`} />
              <DetailField label="Phone" value={`${user.phone || 'N/A'} ${user.phoneVerified ? '✓' : '✗'}`} />
              <DetailField label="Auth Provider" value={user.authProvider} />
              <DetailField label="Registered" value={formatDate(user.createdAt)} />
            </div>
          </SectionCard>

          {kyc.completed && (
            <SectionCard title="KYC Details">
              <div className="admin-detail-grid-inner">
                <DetailField label="Full Name" value={kyc.fullName} />
                <DetailField label="DOB / Age" value={`${formatDate(kyc.dateOfBirth)} (${kyc.age} yrs)`} />
                <DetailField label="Gender" value={kyc.gender} />
                <DetailField label="Address" value={`${kyc.address}, ${kyc.city} ${kyc.state} ${kyc.pincode}`} />
                <DetailField label="ID Document" value={`${kyc.idType}: ${kyc.idNumber}`} />
              </div>
              {kyc.idDocumentUrl && (
                <a href={kyc.idDocumentUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm mt-3 inline-flex no-underline">
                  View ID Document
                </a>
              )}
            </SectionCard>
          )}

          {elig.completed && (
            <SectionCard title="Eligibility Result">
              <span className={`badge ${ELIGIBILITY_STYLES[elig.result] || 'badge-gray'}`}>{elig.result}</span>
              <div className="admin-detail-grid-inner mt-3">
                <DetailField label="Income" value={`${formatCurrency(elig.income)} (${elig.incomeType})`} />
                <DetailField label="Requested Amount" value={formatCurrency(elig.requestedLoanAmount)} />
                <DetailField label="Credit Score" value={`${elig.creditScore} (${elig.creditRating})`} />
                <DetailField label="Current Debts" value={`${formatCurrency(elig.currentDebts)}/mo`} />
                <DetailField label="Debt-to-Income" value={`${elig.debtToIncome}%`} />
                <DetailField label="Max Eligible" value={formatCurrency(elig.maxEligibleAmount)} />
                <DetailField label="Employer" value={elig.employerName || 'N/A'} />
                <DetailField label="Designation" value={elig.designation || 'N/A'} />
              </div>
              {elig.reasons?.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">
                  {elig.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                </ul>
              )}
            </SectionCard>
          )}

          {emi.completed && (
            <SectionCard title="EMI Terms">
              <div className="admin-detail-grid-inner">
                <DetailField label="Loan Amount" value={formatCurrency(emi.loanAmount)} />
                <DetailField label="Tenure" value={`${emi.tenureMonths} months`} />
                <DetailField label="Interest Rate" value={`${emi.annualInterestRate}% p.a.`} />
                <DetailField label="Monthly EMI" value={formatCurrency(emi.emi)} />
                <DetailField label="Total Interest" value={formatCurrency(emi.totalInterest)} />
                <DetailField label="Total Repayment" value={formatCurrency(emi.totalRepayment)} />
                <DetailField label="Processing Fee" value={formatCurrency(emi.processingFee)} />
                <DetailField label="GST" value={formatCurrency(emi.gst)} />
                <DetailField label="Total Charges" value={formatCurrency(emi.totalCharges)} />
                <DetailField label="Net Disbursement" value={formatCurrency(emi.netDisbursement)} />
                <DetailField label="IRR" value={`${emi.irr}%`} />
              </div>
            </SectionCard>
          )}

          {bank.completed && (
            <SectionCard title="Bank Account">
              <div className="admin-detail-grid-inner">
                <DetailField label="Account Holder" value={bank.accountHolderName} />
                <DetailField label="Account Number" value={bank.accountNumber} />
                <DetailField label="IFSC" value={bank.ifscCode} />
                <DetailField label="Bank" value={bank.bankName} />
              </div>
            </SectionCard>
          )}

          {application.declaration?.completed && (
            <SectionCard title="Declaration">
              <p className="text-sm text-emerald-600">
                Accepted on {formatDate(application.declaration.acceptedAt)}
              </p>
            </SectionCard>
          )}

          {selfie.photoUrl && (
            <SectionCard title="Selfie / Photo Verification">
              <div className="admin-selfie-wrap">
                <img src={selfie.photoUrl} alt="Applicant selfie" className="admin-selfie" />
                <div>
                  <p className="mb-2 text-sm">
                    Status:{' '}
                    <span className={
                      selfie.adminStatus === 'approved' ? 'badge-success'
                        : selfie.adminStatus === 'rejected' ? 'badge-danger'
                          : 'badge-warning'
                    }>
                      {selfie.adminStatus}
                    </span>
                  </p>
                  {selfie.submittedAt && <p className="text-sm text-gray-500">Submitted: {formatDate(selfie.submittedAt)}</p>}
                  {selfie.rejectionReason && <p className="mt-2 text-sm text-red-600">Reason: {selfie.rejectionReason}</p>}
                  {selfie.reviewedAt && <p className="mt-2 text-sm text-gray-500">Reviewed: {formatDate(selfie.reviewedAt)}</p>}
                </div>
              </div>
            </SectionCard>
          )}

          {application.status === 'disbursed' && (
            <SectionCard title="Repayment Overview">
              {(() => {
                const totalRepayment = Number(application.emiSelection?.totalRepayment || 0);
                const totalPaid = Number(repayment.totalPaid || 0);
                const isClosed =
                  Number(repayment.outstandingAmount || 0) <= 0 ||
                  (totalRepayment > 0 && Math.round((totalPaid / totalRepayment) * 100) >= 100);
                const isOverdue = Number(repayment.overdueAmount || 0) > 0;
                const loanLabel = isClosed ? 'Loan Closed' : isOverdue ? 'Overdue' : 'Active';
                const loanBadge = isClosed ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning';
                return (
                  <>
                    <div className="mb-3">
                      <span className={loanBadge}>{loanLabel}</span>
                    </div>
                    <div className="admin-detail-grid-inner">
                      <DetailField label="Disbursed Amount" value={formatCurrency(application.disbursement?.amount)} />
                      <DetailField label="Disbursed On" value={formatDate(application.disbursement?.disbursedAt)} />
                      <DetailField label="Total Paid" value={formatCurrency(repayment.totalPaid)} />
                      <DetailField label="Outstanding" value={formatCurrency(repayment.outstandingAmount)} />
                      <DetailField label="Overdue" value={formatCurrency(repayment.overdueAmount)} />
                      {!isClosed && (
                        <DetailField label="Next Due" value={`${formatCurrency(repayment.nextDueAmount || 0)} on ${formatDate(repayment.nextDueDate)}`} />
                      )}
                    </div>
                  </>
                );
              })()}
            </SectionCard>
          )}
        </div>

        <aside className="admin-detail-sidebar">
          <section className="admin-action-card">
            <h2>Quick Summary</h2>
            <div className="admin-meta-list">
              <div><span>Applicant</span><span>{kyc.fullName || user.name || 'N/A'}</span></div>
              <div><span>Contact</span><span>{user.email || user.phone || 'N/A'}</span></div>
              <div><span>Eligibility</span><span>{elig.result || 'Pending'}</span></div>
              <div><span>Selfie</span><span>{selfie.adminStatus || 'Not submitted'}</span></div>
              <div><span>Status</span><span>{formatStatusLabel(application.status)}</span></div>
            </div>
          </section>

          {canReviewSelfie && (
            <section className="admin-action-card">
              <h2>Review Selfie</h2>
              <p>Approve the photo to move this application to approved status, or reject it so the applicant can resubmit.</p>
              <div className="admin-action-stack">
                <button type="button" className="btn-success" onClick={() => handleSelfieAction('approve')} disabled={!!actionLoading}>
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve Photo'}
                </button>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rejection reason (optional)"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
                <button type="button" className="btn-danger" onClick={() => handleSelfieAction('reject')} disabled={!!actionLoading}>
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Photo'}
                </button>
              </div>
            </section>
          )}

          {canDisburse && (
            <section className="admin-action-card">
              <h2>Disburse Loan</h2>
              <p>
                Confirm disbursement of <strong>{formatCurrency(emi.netDisbursement)}</strong> to{' '}
                <strong>{bank.accountHolderName}</strong> ({bank.bankName}).
              </p>
              <button type="button" className="btn-primary btn-block" onClick={handleDisburse} disabled={!!actionLoading}>
                {actionLoading === 'disburse' ? 'Processing...' : 'Confirm Disbursement'}
              </button>
            </section>
          )}

          {application.status === 'disbursed' && (
            <section className="admin-action-card">
              <h2>Loan Status</h2>
              {(() => {
                const _totalRepayment = Number(application.emiSelection?.totalRepayment || 0);
                const _totalPaid = Number(repayment.totalPaid || 0);
                const _isClosed =
                  Number(repayment.outstandingAmount || 0) <= 0 ||
                  (_totalRepayment > 0 && Math.round((_totalPaid / _totalRepayment) * 100) >= 100);
                return _isClosed;
              })() ? (
                <div>
                  <span className="badge-success">Fully Paid</span>
                  <p className="mt-2 text-sm text-emerald-600">
                    All dues cleared. {formatCurrency(repayment.totalPaid)} total collected.
                  </p>
                </div>
              ) : Number(repayment.overdueAmount || 0) > 0 ? (
                <div>
                  <span className="badge-danger">Overdue</span>
                  <p className="mt-2 text-sm text-red-600">
                    {formatCurrency(repayment.overdueAmount)} overdue. Outstanding: {formatCurrency(repayment.outstandingAmount)}.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="badge-warning">Active</span>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatCurrency(application.disbursement?.amount)} disbursed on {formatDate(application.disbursement?.disbursedAt)}.
                    Outstanding: {formatCurrency(repayment.outstandingAmount)}.
                  </p>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
