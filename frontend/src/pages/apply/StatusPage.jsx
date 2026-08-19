import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { formatCurrency, formatDate } from '../../utils/constants';
import { getApplicationStatusMeta } from '../userUtils';
import '../User.css';

const statusStyles = {
  warning: 'rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800',
  success: 'rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800',
  info: 'rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-800',
};

export default function StatusPage() {
  const { application } = useAuth();
  const stage = application?.currentStage;
  const displayStage = ['waiting_admin_review', 'approved', 'disbursed'].includes(application?.status)
    ? (application.status === 'waiting_admin_review' ? 'admin_review' : application.status)
    : stage;
  const emi = application?.emiSelection || {};
  const disbursement = application?.disbursement || {};
  const statusMeta = getApplicationStatusMeta(application?.status);

  const getStatusMessage = () => {
    switch (displayStage) {
      case 'admin_review':
        return {
          type: 'warning',
          title: 'Waiting for Admin Review',
          message: 'Your application and selfie photo have been submitted. An admin will review and approve shortly.',
        };
      case 'approved':
        return {
          type: 'success',
          title: 'Application Approved',
          message: 'Your selfie has been approved. Loan disbursement will be processed soon.',
        };
      case 'disbursed':
        return {
          type: 'success',
          title: 'Loan Disbursed',
          message: `Your loan of ${formatCurrency(disbursement.amount || emi.netDisbursement)} has been disbursed to your bank account.`,
        };
      case 'selfie':
        return {
          type: 'warning',
          title: 'Photo Rejected',
          message: application?.selfie?.rejectionReason || 'Please submit a new selfie photo to continue.',
        };
      default:
        return {
          type: 'info',
          title: 'Application In Progress',
          message: 'Your application is still being completed. Continue from the dashboard when ready.',
        };
    }
  };

  const status = getStatusMessage();

  return (
    <ApplyLayout title="Application Status">
      <StepProgress currentStage={displayStage} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={statusMeta.badge}>{statusMeta.label}</span>
        {application?.submittedAt && (
          <span className="text-xs text-gray-500">Submitted {formatDate(application.submittedAt)}</span>
        )}
      </div>

      <div className={statusStyles[status.type]}>
        <h2 className="text-xl font-bold">{status.title}</h2>
        <p className="mt-2 text-sm">{status.message}</p>
      </div>

      {emi.loanAmount && (
        <div className="user-panel mt-6 shadow-none">
          <h2>Loan Summary</h2>
          <div>
            <div className="user-meta-row">
              <span>Loan Amount</span>
              <span>{formatCurrency(emi.loanAmount)}</span>
            </div>
            <div className="user-meta-row">
              <span>Tenure</span>
              <span>{emi.tenureMonths} months</span>
            </div>
            <div className="user-meta-row">
              <span>Monthly EMI</span>
              <span>{formatCurrency(emi.emi)}</span>
            </div>
            <div className="user-meta-row">
              <span>Net Disbursement</span>
              <span>{formatCurrency(emi.netDisbursement)}</span>
            </div>
            {disbursement.disbursedAt && (
              <div className="user-meta-row">
                <span>Disbursed On</span>
                <span>{formatDate(disbursement.disbursedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {stage === 'selfie' && (
          <Link to="/apply/selfie" className="btn-primary no-underline">Resubmit Selfie</Link>
        )}
        {application?.status === 'disbursed' && (
          <Link to="/loans" className="btn-primary no-underline">View My Loans</Link>
        )}
        <Link to="/dashboard" className="btn-secondary no-underline">Back to Dashboard</Link>
      </div>
    </ApplyLayout>
  );
}
