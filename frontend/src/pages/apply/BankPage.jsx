import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { BANK_NAMES } from '../../utils/locations';

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
  const [lookupLoading, setLookupLoading] = useState(false);

  const lookupBank = async (value) => {
    const ifscCode = value.trim().toUpperCase();
    setForm((current) => ({ ...current, ifscCode }));
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) return;

    setLookupLoading(true);
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (!response.ok) throw new Error('Invalid IFSC');
      const bankData = await response.json();
      const bankName = BANK_NAMES.includes(bankData.BANK) ? bankData.BANK : 'Other';
      setForm((current) => ({ ...current, bankName: bankName || current.bankName }));
      setError('');
    } catch {
      setError('Unable to verify this IFSC code. Please check it and enter the bank name.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) {
        setError('Enter a valid 11-character IFSC code, for example SBIN0001234.');
        setLoading(false);
        return;
      }
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
            <input required inputMode="numeric" pattern="[0-9]{8,18}" maxLength={18} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })} placeholder="8 to 18 digit account number" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>IFSC Code *</label>
            <input required maxLength={11} value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} onBlur={(e) => lookupBank(e.target.value)} placeholder="SBIN0001234" />
            {lookupLoading && <p className="mt-1 text-xs text-gray-500">Checking IFSC...</p>}
          </div>
          <div className="form-group mb-0">
            <label>Bank Name *</label>
            <select required value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}>
              <option value="">Select bank</option>
              {BANK_NAMES.map((bankName) => <option key={bankName} value={bankName}>{bankName}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary btn-block mt-2" disabled={loading}>
          {loading ? 'Saving...' : 'Continue to Declaration'}
        </button>
      </form>
    </ApplyLayout>
  );
}
