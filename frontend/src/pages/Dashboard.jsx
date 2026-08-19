import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STAGES, formatCurrency, formatDate } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const STAGE_PATHS = {
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

export default function Dashboard() {
  const { user, application, applications, createNewApplication, selectApplication } = useAuth();
  const navigate = useNavigate();

  const stage = application?.currentStage || 'verification';
  const stageInfo = STAGES.find((s) => s.key === stage) || STAGES[0];
  const continuePath = STAGE_PATHS[stage] || '/apply/verify';
  const progress = Math.min(((STAGES.findIndex((s) => s.key === stage) + 1) / 8) * 100, 100);

  const statusBadge = () => {
    switch (application?.status) {
      case 'waiting_admin_review': return <span className="badge-warning">Waiting for Review</span>;
      case 'approved': return <span className="badge-success">Approved</span>;
      case 'disbursed': return <span className="badge-success">Disbursed</span>;
      case 'rejected': return <span className="badge-danger">Rejected</span>;
      default: return <span className="badge-primary">In Progress</span>;
    }
  };

  const handleNewLoan = async () => {
    const newApplication = await createNewApplication();
    navigate(newApplication.currentStage === 'eligibility' ? '/apply/eligibility' : '/apply/kyc');
  };

  const handleSelectApplication = async (item) => {
    const selected = await selectApplication(item._id);
    const application = selected || item;
    const submitted = ['waiting_admin_review', 'approved', 'disbursed'].includes(application.status);
    navigate(submitted ? '/apply/status' : (STAGE_PATHS[application.currentStage] || '/apply/status'));
  };

  return (
    <div className="container-app">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Customer'}!</h1>
          <p className="text-gray-500">Manage your personal loan application</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusBadge()}
          <button type="button" className="btn-primary btn-sm" onClick={handleNewLoan}>
            Apply for New Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Application Progress</h2>
          <p className="mb-4 text-gray-500">Current step: <strong className="text-gray-900">{stageInfo.label}</strong></p>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <Link to={continuePath} className="btn-primary mt-4 inline-flex no-underline">
            {stage === 'disbursed' ? 'View Status' : 'Continue Application'}
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Quick Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
              <span>Email Verified</span>
              <span className={user?.emailVerified ? 'font-semibold text-emerald-600' : 'text-gray-500'}>
                {user?.emailVerified ? '✓ Yes' : '✗ Pending'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
              <span>Phone Verified</span>
              <span className={user?.phoneVerified ? 'font-semibold text-emerald-600' : 'text-gray-500'}>
                {user?.phoneVerified ? '✓ Yes' : '✗ Pending'}
              </span>
            </div>
            {application?.eligibility?.completed && (
              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>Eligibility</span>
                <span>{application.eligibility.result}</span>
              </div>
            )}
            {application?.emiSelection?.loanAmount && (
              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>Loan Amount</span>
                <span>{formatCurrency(application.emiSelection.loanAmount)}</span>
              </div>
            )}
            {application?.emiSelection?.emi && (
              <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>Monthly EMI</span>
                <span>{formatCurrency(application.emiSelection.emi)}</span>
              </div>
            )}
            {application?.submittedAt && (
              <div className="flex justify-between py-2 text-sm">
                <span>Submitted</span>
                <span>{formatDate(application.submittedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 text-lg font-semibold">Application History</h2>
        <div className="space-y-3">
          {applications.length === 0 && <p className="text-sm text-gray-500">No applications yet.</p>}
          {applications.map((item, index) => (
            <button
              type="button"
              key={item._id}
              onClick={() => handleSelectApplication(item)}
              className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition hover:border-primary sm:flex-row sm:items-center sm:justify-between ${item._id === application?._id ? 'border-primary bg-primary-light' : 'border-gray-200'}`}
            >
              <span>
                <strong>Loan Application {applications.length - index}</strong>
                <span className="mt-1 block text-xs text-gray-500">Created {formatDate(item.createdAt)}</span>
              </span>
              <span className="text-sm capitalize text-gray-700">{item.status.replaceAll('_', ' ')}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
