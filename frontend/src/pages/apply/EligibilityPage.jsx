import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { SAMPLE_SCENARIOS, formatCurrency } from '../../utils/constants';

const resultStyles = {
  'Eligible': 'rounded-xl border-2 border-emerald-500 bg-emerald-50 p-5',
  'Partially Eligible': 'rounded-xl border-2 border-amber-500 bg-amber-50 p-5',
  'Not Eligible': 'rounded-xl border-2 border-red-500 bg-red-50 p-5',
};

export default function EligibilityPage() {
  const { application, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const elig = application?.eligibility || {};

  const [form, setForm] = useState({
    incomeType: elig.incomeType || 'monthly',
    income: elig.income || '',
    requestedLoanAmount: elig.requestedLoanAmount || '',
    creditScore: elig.creditScore || '',
    currentDebts: elig.currentDebts || '',
    employerName: elig.employerName || '',
    designation: elig.designation || '',
  });
  const [result, setResult] = useState(
    elig.completed ? { ...elig, status: elig.result } : null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const applyScenario = (scenario) => {
    setForm({
      ...form,
      creditScore: scenario.creditScore,
      income: scenario.income,
      currentDebts: scenario.debts,
      requestedLoanAmount: scenario.amount,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.put('/application/eligibility', form);
      setResult(data.eligibility);
      await refreshApplication();
    } catch (err) {
      setError(err.response?.data?.message || 'Eligibility check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplyLayout title="Loan Eligibility Check">
      <StepProgress currentStage="eligibility" />

      {error && <div className="alert-error">{error}</div>}

      <div className="mb-4">
        <p className="text-sm text-gray-500">Quick test scenarios:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((s) => (
            <button key={s.label} type="button" className="btn-secondary btn-sm" onClick={() => applyScenario(s)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>Income Type</label>
            <select value={form.incomeType} onChange={(e) => setForm({ ...form, incomeType: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label>{form.incomeType === 'monthly' ? 'Monthly' : 'Annual'} Income (₹) *</label>
            <input type="number" required min="0" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group">
            <label>Requested Loan Amount (₹) *</label>
            <input type="number" required min="10000" value={form.requestedLoanAmount} onChange={(e) => setForm({ ...form, requestedLoanAmount: e.target.value })} />
          </div>
          <div className="form-group">
            <label>CIBIL / Credit Score *</label>
            <input type="number" required min="300" max="900" value={form.creditScore} onChange={(e) => setForm({ ...form, creditScore: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Current Debts / Outstanding Balances (₹/month) *</label>
          <input type="number" required min="0" value={form.currentDebts} onChange={(e) => setForm({ ...form, currentDebts: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>Employer Name</label>
            <input value={form.employerName} onChange={(e) => setForm({ ...form, employerName: e.target.value })} />
          </div>
          <div className="form-group mb-0">
            <label>Designation</label>
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn-primary btn-block mt-2" disabled={loading}>
          {loading ? 'Checking...' : 'Check Eligibility'}
        </button>
      </form>

      {result && (
        <div className={`${resultStyles[result.status] || ''} mt-6`}>
          <h3 className="text-lg font-bold">{result.status}</h3>
          <p className="mt-1 text-sm">Credit Rating: <strong>{result.creditRating}</strong> | Score: {result.score}/100</p>
          <p className="text-sm">Debt-to-Income: {result.debtToIncome}% | Loan-to-Income: {result.loanToIncome}%</p>
          {result.maxEligibleAmount > 0 && (
            <p className="text-sm">Max Eligible Amount: <strong>{formatCurrency(result.maxEligibleAmount)}</strong></p>
          )}
          <ul className="mt-3 list-disc pl-5 text-sm">
            {result.reasons?.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          {result.status !== 'Not Eligible' && (
            <button type="button" className="btn-primary mt-4" onClick={() => navigate('/apply/emi')}>
              Continue to EMI Selection
            </button>
          )}
        </div>
      )}
    </ApplyLayout>
  );
}
