import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';
import { DECLARATION_TEXT } from '../../utils/constants';

export default function DeclarationPage() {
  const { refreshApplication } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accepted) {
      setError('You must accept the declaration to continue');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.put('/application/declaration', { accepted: true });
      await refreshApplication();
      navigate('/apply/selfie');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save declaration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplyLayout title="Declaration">
      <StepProgress currentStage="declaration" />

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{DECLARATION_TEXT}</pre>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded" />
          I have read and agree to the above declaration. I confirm all information provided is true and accurate.
        </label>

        <button type="submit" className="btn-primary btn-block mt-4" disabled={loading || !accepted}>
          {loading ? 'Confirming...' : 'Accept & Continue to Photo Verification'}
        </button>
      </form>
    </ApplyLayout>
  );
}
