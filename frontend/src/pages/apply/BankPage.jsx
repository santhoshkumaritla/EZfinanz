import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';

export default function BankPage() {
  const { application, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const bank = application?.bankAccount || {};

  const [form, setForm] = useState({
    accountHolderName: bank.accountHolderName || application?.kyc?.fullName || '',
    accountNumber: bank.accountNumber || '',
    ifscCode: bank.ifscCode || '',
    bankName: bank.bankName || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put('/application/bank-account', form);
      await refreshApplication();
      navigate('/apply/declaration');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplyLayout title="Add Bank Account">
      <StepProgress currentStage="bank_account" />

      {error && <div className="alert-error">{error}</div>}

      <div className="alert-info mb-4">
        Loan amount will be disbursed to this bank account after approval.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Account Holder Name *</label>
          <input required value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Account Number *</label>
          <input required value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="1234567890" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>IFSC Code *</label>
            <input required value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" />
          </div>
          <div className="form-group mb-0">
            <label>Bank Name *</label>
            <input required value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="State Bank of India" />
          </div>
        </div>
        <button type="submit" className="btn-primary btn-block mt-2" disabled={loading}>
          {loading ? 'Saving...' : 'Continue to Declaration'}
        </button>
      </form>
    </ApplyLayout>
  );
}
