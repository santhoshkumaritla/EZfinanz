import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { formatCurrency, formatDate } from '../../utils/constants';

const statusStyles = {
  warning: 'rounded-xl bg-amber-50 p-6 text-center text-amber-700',
  success: 'rounded-xl bg-emerald-50 p-6 text-center text-emerald-700',
  info: 'rounded-xl bg-primary-light p-6 text-center text-primary-dark',
};

export default function StatusPage() {
  const { application } = useAuth();
  const stage = application?.currentStage;
  const emi = application?.emiSelection || {};
  const disbursement = application?.disbursement || {};

  const getStatusMessage = () => {
    switch (stage) {
      case 'admin_review':
        return {
          type: 'warning',
          title: 'Waiting for Admin Review',
          message: 'Your application and selfie photo have been submitted. An admin will review and approve shortly.',
        };
      case 'approved':
        return {
          type: 'success',
          title: 'Application Approved!',
          message: 'Your selfie has been approved. Loan disbursement is being processed.',
        };
      case 'disbursed':
        return {
          type: 'success',
          title: 'Loan Disbursed!',
          message: `Your loan of ${formatCurrency(disbursement.amount || emi.netDisbursement)} has been disbursed to your bank account.`,
        };
      case 'selfie':
        return {
          type: 'warning',
          title: 'Photo Rejected',
          message: 'Please submit a new selfie photo to continue.',
        };
      default:
        return {
          type: 'info',
          title: 'Application Status',
          message: 'Your application is in progress.',
        };
    }
  };

  const status = getStatusMessage();

  return (
    <ApplyLayout title="Application Status">
      <StepProgress currentStage={stage} />

      <div className={statusStyles[status.type]}>
        <h2 className="text-xl font-bold">{status.title}</h2>
        <p className="mt-2">{status.message}</p>
        {application?.submittedAt && (
          <p className="mt-2 text-sm opacity-80">Submitted: {formatDate(application.submittedAt)}</p>
        )}
      </div>

      {emi.loanAmount && (
        <div className="card card-sm mt-6 shadow-none">
          <h3 className="mb-3 font-semibold">Loan Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>Loan Amount</span><span>{formatCurrency(emi.loanAmount)}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>Tenure</span><span>{emi.tenureMonths} months</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>Monthly EMI</span><span>{formatCurrency(emi.emi)}</span></div>
            <div className="flex justify-between py-2 text-sm"><span>Net Disbursement</span><span>{formatCurrency(emi.netDisbursement)}</span></div>
            {disbursement.disbursedAt && (
              <div className="flex justify-between py-2 text-sm"><span>Disbursed On</span><span>{formatDate(disbursement.disbursedAt)}</span></div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {stage === 'selfie' && (
          <Link to="/apply/selfie" className="btn-primary no-underline">Resubmit Selfie</Link>
        )}
        <Link to="/dashboard" className="btn-secondary no-underline">Back to Dashboard</Link>
      </div>
    </ApplyLayout>
  );
}
