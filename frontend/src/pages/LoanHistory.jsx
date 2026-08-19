import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/constants';
import { getLoanStatusMeta, getRepaymentProgress } from './userUtils';
import './User.css';

export default function LoanHistory() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLoans = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const { data } = await api.get('/application/loans/history');
      setLoans(data.loans || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load loan history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const summary = useMemo(() => {
    const isClosed = (loan) => {
      const outstanding = Number(loan.outstandingAmount || 0);
      const totalRepayment = Number(loan.totalRepayment || 0);
      const totalPaid = Number(loan.totalPaid || 0);
      return (
        outstanding <= 0 ||
        (totalRepayment > 0 && Math.round((totalPaid / totalRepayment) * 100) >= 100)
      );
    };

    return {
      total: loans.length,
      active: loans.filter((loan) => !isClosed(loan)).length,
      outstanding: loans.reduce((sum, loan) => sum + (isClosed(loan) ? 0 : (loan.outstandingAmount || 0)), 0),
      paid: loans.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0),
    };
  }, [loans]);

  if (loading) {
    return <div className="user-loading">Loading loan history...</div>;
  }

  return (
    <div className="user-shell">
      <header className="user-page-header">
        <div>
          <p className="user-eyebrow">Repayments</p>
          <h1>My Loans</h1>
          <p className="user-subtitle">Track due amounts, payments, and loan closure status in one place.</p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => loadLoans(true)}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && <div className="alert-error">{error}</div>}

      <section className="user-stats-grid">
        <article className="user-stat-card border-l-gray-400">
          <span>Total Loans</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="user-stat-card border-l-amber-400">
          <span>Active Loans</span>
          <strong className="text-amber-600">{summary.active}</strong>
        </article>
        <article className="user-stat-card border-l-emerald-400">
          <span>Total Paid</span>
          <strong className="text-emerald-600">{formatCurrency(summary.paid)}</strong>
        </article>
        <article className="user-stat-card border-l-red-400">
          <span>Total Outstanding</span>
          <strong className="text-amber-600">{formatCurrency(summary.outstanding)}</strong>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {loans.length === 0 ? (
          <div className="user-empty-state">
            <strong>No disbursed loans yet</strong>
            <span>Once your loan is disbursed, repayment details will appear here.</span>
            <Link to="/dashboard" className="btn-primary btn-sm mt-4 inline-flex no-underline">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          loans.map((loan, index) => {
            const loanStatus = getLoanStatusMeta(loan);
            const progress = getRepaymentProgress(loan.totalRepayment, loan.totalPaid);

            return (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="user-loan-card">
                <div className="user-loan-top">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Loan #{loans.length - index}</h2>
                    <p className="text-xs text-gray-500">
                      Disbursed {formatDate(loan.disbursedAt || loan.createdAt)}
                    </p>
                  </div>
                  <span className={`user-loan-active-badge ${loanStatus.label === 'Closed' ? 'closed' : loanStatus.label === 'Overdue' ? 'overdue' : 'active'}`}>
                    {loanStatus.label !== 'Closed' && <span className="pulse-dot" />}
                    {loanStatus.label}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Repayment progress</span>
                    <span>{progress}% paid</span>
                  </div>
                  <div className="user-progress-bar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="user-loan-metrics">
                  <div>
                    <span>Principal</span>
                    <strong>{formatCurrency(loan.principal)}</strong>
                  </div>
                  <div>
                    <span>EMI</span>
                    <strong>{formatCurrency(loan.emi)}</strong>
                  </div>
                  <div>
                    <span>Paid</span>
                    <strong className="text-emerald-600">{formatCurrency(loan.totalPaid)}</strong>
                  </div>
                  <div>
                    <span>Outstanding</span>
                    <strong className="text-amber-600">{formatCurrency(loan.outstandingAmount)}</strong>
                  </div>
                  <div>
                    <span>Next Due</span>
                    <strong>{loan.nextDueDate ? formatDate(loan.nextDueDate) : '-'}</strong>
                  </div>
                  <div>
                    <span>Next Amount</span>
                    <strong>{formatCurrency(loan.nextDueAmount)}</strong>
                  </div>
                  <div>
                    <span>Overdue</span>
                    <strong className="text-red-600">{formatCurrency(loan.overdueAmount)}</strong>
                  </div>
                  <div>
                    <span>Tenure</span>
                    <strong>{loan.tenureMonths} months</strong>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
