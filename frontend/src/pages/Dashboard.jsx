import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STAGES, formatCurrency, formatDate } from '../utils/constants';
import {
  STAGE_PATHS,
  getApplicationStatusMeta,
} from './userUtils';
import './User.css';

const APPLY_STAGES = STAGES.filter((stage) => !['approved', 'disbursed'].includes(stage.key));

export default function Dashboard() {
  const { user, application, applications, createNewApplication, selectApplication } = useAuth();
  const navigate = useNavigate();

  const stage = application?.currentStage || 'verification';
  const stageInfo = STAGES.find((item) => item.key === stage) || STAGES[0];
  const continuePath = STAGE_PATHS[stage] || '/apply/verify';
  const currentStageIndex = STAGES.findIndex((item) => item.key === stage);
  const progress = Math.min(((Math.max(currentStageIndex, 0) + 1) / APPLY_STAGES.length) * 100, 100);
  const statusMeta = getApplicationStatusMeta(application?.status);
  const hasDisbursedLoan = applications.some((item) => item.status === 'disbursed');

  const handleNewLoan = async () => {
    const newApplication = await createNewApplication();
    navigate(newApplication.currentStage === 'eligibility' ? '/apply/eligibility' : '/apply/kyc');
  };

  const handleSelectApplication = async (item) => {
    const selected = await selectApplication(item._id);
    const nextApplication = selected || item;
    const submitted = ['waiting_admin_review', 'approved', 'disbursed'].includes(nextApplication.status);
    navigate(submitted ? '/apply/status' : (STAGE_PATHS[nextApplication.currentStage] || '/apply/status'));
  };

  return (
    <div className="user-shell">
      <header className="user-page-header">
        <div>
          <p className="user-eyebrow">Customer Portal</p>
          <h1>Welcome, {user?.name || 'Customer'}</h1>
          <p className="user-subtitle">Track your application, continue where you left off, and manage active loans.</p>
        </div>
        <div className="user-header-actions">
          <span className={`${statusMeta.badge} text-xs`}>{statusMeta.label}</span>
          {hasDisbursedLoan && (
            <Link to="/loans" className="btn-secondary btn-sm no-underline">My Loans</Link>
          )}
          <button type="button" className="btn-primary btn-sm" onClick={handleNewLoan}>
            Apply for New Loan
          </button>
        </div>
      </header>

      <section className="user-stats-grid">
        <article className="user-stat-card border-l-indigo-400">
          <span>Current Step</span>
          <strong>{stageInfo.label}</strong>
        </article>
        <article className="user-stat-card border-l-emerald-400">
          <span>Email Verified</span>
          <strong className={user?.emailVerified ? 'text-emerald-600' : 'text-amber-600'}>
            {user?.emailVerified ? 'Yes' : 'Pending'}
          </strong>
        </article>
        <article className="user-stat-card border-l-emerald-400">
          <span>Phone Verified</span>
          <strong className={user?.phoneVerified ? 'text-emerald-600' : 'text-amber-600'}>
            {user?.phoneVerified ? 'Yes' : 'Pending'}
          </strong>
        </article>
        <article className="user-stat-card border-l-blue-400">
          <span>Applications</span>
          <strong>{applications.length}</strong>
        </article>
      </section>

      <div className="user-grid-2">
        <section className="user-panel">
          <h2>Application Progress</h2>
          <p className="text-sm text-gray-500">
            You are on <strong className="text-gray-900">{stageInfo.label}</strong>.
            {application?.submittedAt ? ` Submitted ${formatDate(application.submittedAt)}.` : ''}
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>Completion</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="user-progress-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="user-step-list">
            {APPLY_STAGES.map((item) => {
              const itemIndex = STAGES.findIndex((stageItem) => stageItem.key === item.key);
              const className = [
                'user-step-pill',
                itemIndex < currentStageIndex ? 'done' : '',
                item.key === stage ? 'current' : '',
              ].filter(Boolean).join(' ');

              return (
                <span key={item.key} className={className}>
                  {item.label}
                </span>
              );
            })}
          </div>

          <Link to={continuePath} className="btn-primary mt-4 inline-flex no-underline">
            {stage === 'disbursed' ? 'View Status' : 'Continue Application'}
          </Link>
        </section>

        <section className="user-panel">
          <h2>Current Application Summary</h2>
          <div>
            <div className="user-meta-row">
              <span>Status</span>
              <span>{statusMeta.label}</span>
            </div>
            {application?.eligibility?.completed && (
              <div className="user-meta-row">
                <span>Eligibility</span>
                <span>{application.eligibility.result}</span>
              </div>
            )}
            {application?.emiSelection?.loanAmount && (
              <div className="user-meta-row">
                <span>Loan Amount</span>
                <span>{formatCurrency(application.emiSelection.loanAmount)}</span>
              </div>
            )}
            {application?.emiSelection?.emi && (
              <div className="user-meta-row">
                <span>Monthly EMI</span>
                <span>{formatCurrency(application.emiSelection.emi)}</span>
              </div>
            )}
            {application?.emiSelection?.tenureMonths && (
              <div className="user-meta-row">
                <span>Tenure</span>
                <span>{application.emiSelection.tenureMonths} months</span>
              </div>
            )}
            {application?.emiSelection?.netDisbursement && (
              <div className="user-meta-row">
                <span>Net Disbursement</span>
                <span>{formatCurrency(application.emiSelection.netDisbursement)}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="user-panel mt-4">
        <h2>Application History</h2>
        {applications.length === 0 ? (
          <div className="user-empty-state">
            <strong>No applications yet</strong>
            <span>Start your first loan application to see it here.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {applications.map((item, index) => {
              const itemStatus = getApplicationStatusMeta(item.status);
              return (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => handleSelectApplication(item)}
                  className={`user-history-card ${item._id === application?._id ? 'active' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-gray-900">Loan Application {applications.length - index}</strong>
                      <p className="mt-1 text-xs text-gray-500">Created {formatDate(item.createdAt)}</p>
                    </div>
                    <span className={itemStatus.badge}>{itemStatus.label}</span>
                  </div>
                  {item.emiSelection?.loanAmount && (
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.emiSelection.loanAmount)}
                      {item.emiSelection?.emi ? ` · EMI ${formatCurrency(item.emiSelection.emi)}` : ''}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
