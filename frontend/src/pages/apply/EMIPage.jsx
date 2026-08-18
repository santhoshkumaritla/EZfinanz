import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { TENURE_OPTIONS, formatCurrency } from '../../utils/constants';

export default function EMIPage() {
  const { application, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const elig = application?.eligibility || {};
  const emi = application?.emiSelection || {};

  const [loanAmount, setLoanAmount] = useState(emi.loanAmount || elig.maxEligibleAmount || elig.requestedLoanAmount || '');
  const [tenureMonths, setTenureMonths] = useState(emi.tenureMonths || 12);
  const [terms, setTerms] = useState(emi.completed ? emi : null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const creditScore = elig.creditScore;

  const calculateTerms = useCallback(async () => {
    if (!loanAmount || !tenureMonths || !creditScore) return;
    try {
      const { data } = await api.post('/application/calculate-emi', {
        loanAmount: Number(loanAmount),
        tenureMonths: Number(tenureMonths),
        creditScore: Number(creditScore),
      });
      setTerms(data.terms);
    } catch {
      setTerms(null);
    }
  }, [loanAmount, tenureMonths, creditScore]);

  useEffect(() => {
    const timer = setTimeout(calculateTerms, 300);
    return () => clearTimeout(timer);
  }, [calculateTerms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put('/application/emi', { loanAmount: Number(loanAmount), tenureMonths: Number(tenureMonths) });
      await refreshApplication();
      navigate('/apply/bank');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save EMI terms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplyLayout title="EMI Term Selection">
      <StepProgress currentStage="emi_selection" />

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Loan Amount (₹)</label>
          <input
            type="number"
            required
            min="10000"
            max={elig.maxEligibleAmount}
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
          <p className="mt-1 text-sm text-gray-500">Max eligible: {formatCurrency(elig.maxEligibleAmount)}</p>
        </div>

        <div className="form-group">
          <label>Repayment Tenure</label>
          <div className="flex flex-wrap gap-2">
            {TENURE_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                  tenureMonths === t
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setTenureMonths(t)}
              >
                {t} months
              </button>
            ))}
          </div>
        </div>

        {terms && (
          <div className="mt-4 rounded-xl bg-gray-50 p-5">
            <h3 className="mb-4 text-base font-semibold">Loan Terms Summary</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-full rounded-lg bg-white p-3">
                <span className="text-sm text-gray-500">Monthly EMI</span>
                <strong className="block text-lg text-primary">{formatCurrency(terms.emi)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Interest Rate (p.a.)</span>
                <strong className="block">{terms.annualInterestRate}%</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Processing Fee</span>
                <strong className="block">{formatCurrency(terms.processingFee)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">GST on Processing</span>
                <strong className="block">{formatCurrency(terms.gst)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Other Charges</span>
                <strong className="block">{formatCurrency(terms.otherCharges)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Charges</span>
                <strong className="block">{formatCurrency(terms.totalCharges)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Interest</span>
                <strong className="block">{formatCurrency(terms.totalInterest)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Repayment</span>
                <strong className="block">{formatCurrency(terms.totalRepayment)}</strong>
              </div>
              <div className="col-span-full rounded-lg bg-white p-3">
                <span className="text-sm text-gray-500">Net Disbursement</span>
                <strong className="block text-lg text-emerald-600">{formatCurrency(terms.netDisbursement)}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500">Applicable IRR</span>
                <strong className="block">{terms.irr}%</strong>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary btn-block mt-4" disabled={loading || !terms}>
          {loading ? 'Saving...' : 'Confirm & Continue'}
        </button>
      </form>
    </ApplyLayout>
  );
}
