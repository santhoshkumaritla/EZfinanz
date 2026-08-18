import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/constants';

const eligibilityStyles = {
  Eligible: 'bg-emerald-100 text-emerald-700',
  'Partially Eligible': 'bg-amber-100 text-amber-700',
  'Not Eligible': 'bg-red-100 text-red-600',
};

const stageBadge = (stage, status) => {
  if (status === 'disbursed') return 'badge-success';
  if (status === 'waiting_admin_review') return 'badge-warning';
  if (status === 'approved') return 'badge-success';
  return 'badge-primary';
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');

  const fetchApplication = async () => {
    const { data } = await api.get(`/admin/applications/${id}`);
    setApplication(data.application);
  };

  useEffect(() => {
    fetchApplication().finally(() => setLoading(false));
  }, [id]);

  const handleSelfieAction = async (action) => {
    setActionLoading(action);
    setMessage('');
    try {
      await api.put(`/admin/applications/${id}/selfie`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });
      setMessage(action === 'approve' ? 'Selfie approved successfully' : 'Selfie rejected');
      await fetchApplication();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleDisburse = async () => {
    setActionLoading('disburse');
    setMessage('');
    try {
      await api.put(`/admin/applications/${id}/disburse`);
      setMessage('Loan disbursed successfully');
      await fetchApplication();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Disbursement failed');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-lg text-gray-500">Loading application...</div>;
  }
  if (!application) {
    return (
      <div className="container-app">
        <p className="text-gray-500">Application not found</p>
      </div>
    );
  }

  const user = application.user || {};
  const kyc = application.kyc || {};
  const elig = application.eligibility || {};
  const emi = application.emiSelection || {};
  const bank = application.bankAccount || {};
  const selfie = application.selfie || {};

  return (
    <div className="container-app max-w-4xl">
      <Link to="/admin" className="text-sm text-gray-500 no-underline hover:text-primary">
        ← Back to Dashboard
      </Link>

      <div className="mb-6 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="flex-1 text-2xl font-bold text-gray-900">
          {kyc.fullName || user.name || 'Application Details'}
        </h1>
        <span className={stageBadge(application.currentStage, application.status)}>
          {application.currentStage.replace(/_/g, ' ')}
        </span>
      </div>

      {message && <div className="alert-success">{message}</div>}

      <div className="flex flex-col gap-4">
        <section className="card card-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-700">Verification Status</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs text-gray-500">Email</span>
              <strong className="block text-sm">
                {user.email || 'N/A'} {user.emailVerified ? '✓' : '✗'}
              </strong>
            </div>
            <div>
              <span className="text-xs text-gray-500">Phone</span>
              <strong className="block text-sm">
                {user.phone || 'N/A'} {user.phoneVerified ? '✓' : '✗'}
              </strong>
            </div>
            <div>
              <span className="text-xs text-gray-500">Auth Provider</span>
              <strong className="block text-sm">{user.authProvider}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-500">Registered</span>
              <strong className="block text-sm">{formatDate(user.createdAt)}</strong>
            </div>
          </div>
        </section>

        {kyc.completed && (
          <section className="card card-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-700">KYC Details</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500">Full Name</span><strong className="block text-sm">{kyc.fullName}</strong></div>
              <div><span className="text-xs text-gray-500">DOB / Age</span><strong className="block text-sm">{formatDate(kyc.dateOfBirth)} ({kyc.age} yrs)</strong></div>
              <div><span className="text-xs text-gray-500">Gender</span><strong className="block text-sm capitalize">{kyc.gender}</strong></div>
              <div><span className="text-xs text-gray-500">Address</span><strong className="block text-sm">{kyc.address}, {kyc.city} {kyc.state} {kyc.pincode}</strong></div>
              <div><span className="text-xs text-gray-500">ID</span><strong className="block text-sm">{kyc.idType}: {kyc.idNumber}</strong></div>
            </div>
            {kyc.idDocumentUrl && (
              <a href={kyc.idDocumentUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm mt-3 inline-flex no-underline">
                View ID Document
              </a>
            )}
          </section>
        )}

        {elig.completed && (
          <section className="card card-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-700">Eligibility Result</h2>
            <span className={`badge ${eligibilityStyles[elig.result] || 'badge-gray'}`}>{elig.result}</span>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500">Income</span><strong className="block text-sm">{formatCurrency(elig.income)} ({elig.incomeType})</strong></div>
              <div><span className="text-xs text-gray-500">Requested Amount</span><strong className="block text-sm">{formatCurrency(elig.requestedLoanAmount)}</strong></div>
              <div><span className="text-xs text-gray-500">Credit Score</span><strong className="block text-sm">{elig.creditScore} ({elig.creditRating})</strong></div>
              <div><span className="text-xs text-gray-500">Current Debts</span><strong className="block text-sm">{formatCurrency(elig.currentDebts)}/mo</strong></div>
              <div><span className="text-xs text-gray-500">Debt-to-Income</span><strong className="block text-sm">{elig.debtToIncome}%</strong></div>
              <div><span className="text-xs text-gray-500">Max Eligible</span><strong className="block text-sm">{formatCurrency(elig.maxEligibleAmount)}</strong></div>
              <div><span className="text-xs text-gray-500">Employer</span><strong className="block text-sm">{elig.employerName || 'N/A'}</strong></div>
              <div><span className="text-xs text-gray-500">Designation</span><strong className="block text-sm">{elig.designation || 'N/A'}</strong></div>
            </div>
            {elig.reasons?.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">
                {elig.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </section>
        )}

        {emi.completed && (
          <section className="card card-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-700">EMI Terms</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500">Loan Amount</span><strong className="block text-sm">{formatCurrency(emi.loanAmount)}</strong></div>
              <div><span className="text-xs text-gray-500">Tenure</span><strong className="block text-sm">{emi.tenureMonths} months</strong></div>
              <div><span className="text-xs text-gray-500">Interest Rate</span><strong className="block text-sm">{emi.annualInterestRate}% p.a.</strong></div>
              <div><span className="text-xs text-gray-500">Monthly EMI</span><strong className="block text-sm">{formatCurrency(emi.emi)}</strong></div>
              <div><span className="text-xs text-gray-500">Total Interest</span><strong className="block text-sm">{formatCurrency(emi.totalInterest)}</strong></div>
              <div><span className="text-xs text-gray-500">Total Repayment</span><strong className="block text-sm">{formatCurrency(emi.totalRepayment)}</strong></div>
              <div><span className="text-xs text-gray-500">Processing Fee</span><strong className="block text-sm">{formatCurrency(emi.processingFee)}</strong></div>
              <div><span className="text-xs text-gray-500">GST</span><strong className="block text-sm">{formatCurrency(emi.gst)}</strong></div>
              <div><span className="text-xs text-gray-500">Total Charges</span><strong className="block text-sm">{formatCurrency(emi.totalCharges)}</strong></div>
              <div><span className="text-xs text-gray-500">Net Disbursement</span><strong className="block text-sm text-emerald-600">{formatCurrency(emi.netDisbursement)}</strong></div>
              <div><span className="text-xs text-gray-500">IRR</span><strong className="block text-sm">{emi.irr}%</strong></div>
            </div>
          </section>
        )}

        {bank.completed && (
          <section className="card card-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-700">Bank Account</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500">Account Holder</span><strong className="block text-sm">{bank.accountHolderName}</strong></div>
              <div><span className="text-xs text-gray-500">Account Number</span><strong className="block text-sm">{bank.accountNumber}</strong></div>
              <div><span className="text-xs text-gray-500">IFSC</span><strong className="block text-sm">{bank.ifscCode}</strong></div>
              <div><span className="text-xs text-gray-500">Bank</span><strong className="block text-sm">{bank.bankName}</strong></div>
            </div>
          </section>
        )}

        {application.declaration?.completed && (
          <section className="card card-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-700">Declaration</h2>
            <p className="text-sm text-emerald-600">✓ Accepted on {formatDate(application.declaration.acceptedAt)}</p>
          </section>
        )}

        {selfie.photoUrl && (
          <section className="card card-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-700">Selfie / Photo Verification</h2>
            <img src={selfie.photoUrl} alt="Applicant selfie" className="max-w-xs rounded-xl border-2 border-gray-200" />
            <p className="mt-2 text-sm">
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
            {selfie.rejectionReason && <p className="text-sm text-red-600">Rejection reason: {selfie.rejectionReason}</p>}

            {selfie.adminStatus === 'pending' && application.status === 'waiting_admin_review' && (
              <div className="mt-4 flex flex-col gap-3">
                <button type="button" className="btn-success" onClick={() => handleSelfieAction('approve')} disabled={!!actionLoading}>
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve Photo'}
                </button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Rejection reason (optional)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button type="button" className="btn-danger" onClick={() => handleSelfieAction('reject')} disabled={!!actionLoading}>
                    {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Photo'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {application.status === 'approved' && (
          <section className="card card-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-700">Disbursement</h2>
            <p className="text-sm text-gray-600">
              Application approved. Ready for disbursement of {formatCurrency(emi.netDisbursement)}.
            </p>
            <button type="button" className="btn-primary mt-3" onClick={handleDisburse} disabled={!!actionLoading}>
              {actionLoading === 'disburse' ? 'Processing...' : 'Confirm Disbursement'}
            </button>
          </section>
        )}

        {application.status === 'disbursed' && (
          <section className="card card-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-700">Disbursement Complete</h2>
            <p className="text-sm text-emerald-600">
              {formatCurrency(application.disbursement?.amount)} disbursed on {formatDate(application.disbursement?.disbursedAt)}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
