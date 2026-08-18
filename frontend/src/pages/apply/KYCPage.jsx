import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';

export default function KYCPage() {
  const { application, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const kyc = application?.kyc || {};

  const [form, setForm] = useState({
    fullName: kyc.fullName || '',
    dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().split('T')[0] : '',
    gender: kyc.gender || '',
    address: kyc.address || '',
    city: kyc.city || '',
    state: kyc.state || '',
    pincode: kyc.pincode || '',
    idType: kyc.idType || 'PAN',
    idNumber: kyc.idNumber || '',
  });
  const [idDocument, setIdDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      if (idDocument) data.append('idDocument', idDocument);

      await api.put('/application/kyc', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshApplication();
      navigate('/apply/eligibility');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplyLayout title="KYC Details">
      <StepProgress currentStage="kyc" />

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>Date of Birth *</label>
            <input type="date" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="form-group mb-0">
            <label>Gender *</label>
            <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Current Address *</label>
          <textarea required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="form-group mb-0">
            <label>State</label>
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Pincode</label>
          <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-group mb-0">
            <label>ID Type *</label>
            <select required value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
              <option value="PAN">PAN</option>
              <option value="Aadhaar">Aadhaar</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label>ID Number *</label>
            <input required value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. ABCDE1234F" />
          </div>
        </div>
        <div className="form-group">
          <label>Upload ID Document (Optional)</label>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setIdDocument(e.target.files[0])} className="text-sm" />
        </div>
        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Saving...' : 'Continue to Eligibility Check'}
        </button>
      </form>
    </ApplyLayout>
  );
}
