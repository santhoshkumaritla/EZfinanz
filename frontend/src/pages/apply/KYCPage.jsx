import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { getCities, getDistricts, INDIAN_STATES } from '../../utils/locations';

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
    district: kyc.district || '',
    state: kyc.state || '',
    pincode: kyc.pincode || '',
    idType: kyc.idType || 'PAN',
    idNumber: kyc.idNumber || '',
  });
  const [idDocument, setIdDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const districts = getDistricts(form.state);
  const cities = getCities(form.state, form.district);

  const updateLocation = (field, value) => {
    if (field === 'state') setForm({ ...form, state: value, district: '', city: '' });
    if (field === 'district') setForm({ ...form, district: value, city: '' });
    if (field === 'city') setForm({ ...form, city: value });
  };

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
            <label>State *</label>
            <select required value={form.state} onChange={(e) => updateLocation('state', e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label>District *</label>
            <select required value={form.district} onChange={(e) => updateLocation('district', e.target.value)} disabled={!form.state}>
              <option value="">Select district</option>
              {districts.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>City *</label>
          <select required value={form.city} onChange={(e) => updateLocation('city', e.target.value)} disabled={!form.district}>
            <option value="">Select city</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Pincode</label>
          <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit pincode" />
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
            <input required minLength={5} value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" />
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
