import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/constants';
import { getLoanStatusMeta, getRepaymentProgress } from './userUtils';
import './User.css';

export default function LoanDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLoan = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/application/loans/${id}`);
      setLoan(data.loan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoan();
  }, [id]);

  const handlePay = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid payment amount greater than 0');
      return;
    }

    setPaying(true);
    try {
      const { data } = await api.post(`/application/loans/${id}/pay`, {
        amount,
        mode: 'simulated',
        reference: 'Customer repayment',
      });
      setMessage(data.message || 'Payment recorded');
      setPaymentAmount('');
      await loadLoan();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handlePayNextDue = () => {
    const nextDue = loan?.repayment?.nextDueAmount || 0;
    if (nextDue > 0) {
      setPaymentAmount(String(nextDue));
    }
  };

  if (loading) {
    return <div className="user-loading">Loading loan details...</div>;
  }

  if (!loan) {
    return (
      <div className="user-shell">
        <div className="alert-error">Loan not found.</div>
        <Link to="/loans" className="btn-secondary btn-sm mt-4 inline-flex no-underline">Back to My Loans</Link>
      </div>
    );
  }

  const summary = loan.repayment || {};
  const emi = loan.emiSelection || {};
  const loanStatus = getLoanStatusMeta({
    outstandingAmount: summary.outstandingAmount || 0,
    overdueAmount: summary.overdueAmount || 0,
  });
  const progress = getRepaymentProgress(emi.totalRepayment, summary.totalPaid);
  const isClosed = Number(summary.outstandingAmount || 0) <= 0 || progress >= 100;

  return (
    <div className="user-shell">
      <header className="user-page-header">
        <div>
          <Link to="/loans" className="text-sm text-gray-500 no-underline hover:text-primary">← My Loans</Link>
          <p className="user-eyebrow mt-2">Loan Details</p>
          <h1>Repayment Overview</h1>
          <p className="user-subtitle">
            Disbursed on {formatDate(loan.disbursement?.disbursedAt || loan.createdAt)}
          </p>
        </div>
        <div className="user-header-actions">
          <span className={`user-loan-active-badge ${isClosed ? 'closed' : loanStatus.label === 'Overdue' ? 'overdue' : 'active'}`}>
            {!isClosed && <span className="pulse-dot" />}
            {loanStatus.label}
          </span>
          <button type="button" className="btn-secondary btn-sm" onClick={loadLoan}>
            Refresh Dues
          </button>
        </div>
      </header>

      {error && <div className="alert-error">{error}</div>}
      {message && <div className="alert-success">{message}</div>}

      {isClosed && (
        <div className="user-loan-closed-banner">
          <div className="closed-icon">✓</div>
          <div className="closed-text">
            <strong>Loan Fully Paid</strong>
            <span>Congratulations! All dues have been cleared. This loan is now closed.</span>
          </div>
        </div>
      )}

      <section className="user-summary-strip">
        <div className="user-summary-item">
          <span>Principal</span>
          <strong>{formatCurrency(emi.loanAmount)}</strong>
        </div>
        <div className="user-summary-item">
          <span>Monthly EMI</span>
          <strong>{formatCurrency(emi.emi)}</strong>
        </div>
        <div className="user-summary-item">
          <span>Total Paid</span>
          <strong className="text-emerald-600">{formatCurrency(summary.totalPaid)}</strong>
        </div>
        <div className="user-summary-item">
          <span>Outstanding</span>
          <strong className="text-amber-600">{formatCurrency(summary.outstandingAmount)}</strong>
        </div>
      </section>

      <section className="user-panel mb-4">
        <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>Repayment progress</span>
          <span>{progress}% complete</span>
        </div>
        <div className="user-progress-bar mt-2">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <div className="user-detail-grid">
        <section className="user-panel">
          <h2>Repayment Schedule</h2>
          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Inst.</th>
                  <th>Due Date</th>
                  <th>EMI</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(summary.schedule || []).map((row) => {
                  const remaining = Math.max((row.emi || 0) - (row.paidAmount || 0), 0);
                  const statusClass = row.status === 'paid'
                    ? 'text-emerald-600'
                    : row.status === 'overdue'
                      ? 'text-red-600'
                      : row.status === 'partial'
                        ? 'text-blue-600'
                        : 'text-amber-600';

                  return (
                    <tr key={row.installmentNo}>
                      <td>#{row.installmentNo}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td>{formatCurrency(row.emi)}</td>
                      <td>{formatCurrency(row.paidAmount || 0)}</td>
                      <td>{formatCurrency(remaining)}</td>
                      <td className={`font-medium capitalize ${statusClass}`}>{row.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="user-detail-sidebar">
          <section className="user-panel">
            <h2>Pay Dues</h2>
            <div className="user-meta-row">
              <span>Next due date</span>
              <span>{summary.nextDueDate ? formatDate(summary.nextDueDate) : '-'}</span>
            </div>
            <div className="user-meta-row">
              <span>Next due amount</span>
              <span>{formatCurrency(summary.nextDueAmount || 0)}</span>
            </div>
            <div className="user-meta-row">
              <span>Overdue amount</span>
              <span className="text-red-600">{formatCurrency(summary.overdueAmount || 0)}</span>
            </div>

            {!isClosed && Number(summary.nextDueAmount || 0) > 0 && (
              <button type="button" className="btn-secondary btn-sm btn-block mt-3" onClick={handlePayNextDue}>
                Use Next Due Amount
              </button>
            )}

            <form onSubmit={handlePay} className="mt-4">
              <div className="form-group">
                <label>Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Enter amount"
                  required
                  disabled={isClosed}
                />
              </div>
              <button type="submit" className="btn-primary btn-block" disabled={paying || isClosed}>
                {paying ? 'Recording...' : isClosed ? 'Loan Closed' : 'Pay Now (Simulated)'}
              </button>
            </form>
          </section>

          <section className="user-panel">
            <h2>Loan Terms</h2>
            <div className="user-meta-row">
              <span>Tenure</span>
              <span>{emi.tenureMonths} months</span>
            </div>
            <div className="user-meta-row">
              <span>Interest rate</span>
              <span>{emi.annualInterestRate}% p.a.</span>
            </div>
            <div className="user-meta-row">
              <span>Total repayment</span>
              <span>{formatCurrency(emi.totalRepayment)}</span>
            </div>
            <div className="user-meta-row">
              <span>Net disbursed</span>
              <span>{formatCurrency(loan.disbursement?.amount || emi.netDisbursement)}</span>
            </div>
          </section>

          <section className="user-panel">
            <h2>Payment History</h2>
            <div className="space-y-2">
              {(summary.paymentHistory || []).slice().reverse().map((payment) => (
                <div key={payment.transactionId} className="user-payment-item">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                    <span className="ml-2 text-xs capitalize text-emerald-600">{payment.status}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(payment.paidAt)} · {payment.transactionId}
                  </p>
                </div>
              ))}
              {(summary.paymentHistory || []).length === 0 && (
                <p className="text-sm text-gray-500">No payments recorded yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
