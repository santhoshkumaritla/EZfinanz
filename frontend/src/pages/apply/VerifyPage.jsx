import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';

export default function VerifyPage() {
  const { user, updateUser, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [devPhoneOtp, setDevPhoneOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  const sendEmailOtp = async () => {
    setError('');
    setLoading('email-send');
    try {
      const { data } = await api.post('/auth/send-email-otp', { email: email || undefined });
      setMessage(data.message || 'OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email OTP');
    } finally {
      setLoading('');
    }
  };

  const verifyEmail = async () => {
    setError('');
    setLoading('email-verify');
    try {
      const { data } = await api.post('/auth/verify-email', { otp: emailOtp });
      updateUser(data.user);
      setMessage('Email verified successfully!');
      await refreshApplication();
    } catch (err) {
      setError(err.response?.data?.message || 'Email verification failed');
    } finally {
      setLoading('');
    }
  };

  const sendPhoneOtp = async () => {
    setError('');
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading('phone-send');
    try {
      const { data } = await api.post('/auth/send-phone-otp', { phone });
      setMessage(data.message || 'OTP sent to your phone');
      if (data.devOtp) {
        setDevPhoneOtp(data.devOtp);
      } else {
        setDevPhoneOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send phone OTP');
    } finally {
      setLoading('');
    }
  };

  const verifyPhone = async () => {
    setError('');
    setLoading('phone-verify');
    try {
      const { data } = await api.post('/auth/verify-phone', { otp: phoneOtp });
      updateUser(data.user);
      setMessage('Phone verified successfully!');
      await refreshApplication();
    } catch (err) {
      setError(err.response?.data?.message || 'Phone verification failed');
    } finally {
      setLoading('');
    }
  };

  const handleContinue = () => {
    if (user?.emailVerified && user?.phoneVerified) {
      navigate('/apply/kyc');
    } else {
      setError('Please verify both email and phone to continue');
    }
  };

  return (
    <ApplyLayout title="Verify Your Account">
      <StepProgress currentStage="verification" />

      {error && <div className="alert-error">{error}</div>}
      {message && <div className="alert-success">{message}</div>}

      <div className="flex flex-col gap-4">
        <div className="card card-sm rounded-lg border border-gray-100 shadow-none">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
            Email Verification
            {user?.emailVerified && <span className="badge-success">Verified</span>}
          </h3>
          <p className="text-sm text-gray-500">{user?.emailVerified ? user.email : 'Verify your email address'}</p>
          {!user?.emailVerified && (
            <>
              {!user?.email && (
                <div className="form-group mt-2 mb-0">
                  <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              )}
              <button type="button" className="btn-secondary btn-sm mt-2" onClick={sendEmailOtp} disabled={loading === 'email-send' || !email}>
                Send OTP
              </button>
              <div className="form-group mt-3 mb-2">
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" placeholder="Enter 6-digit OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={verifyEmail} disabled={loading === 'email-verify'}>
                Verify Email
              </button>
            </>
          )}
        </div>

        <div className="card card-sm rounded-lg border border-gray-100 shadow-none">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
            Phone Verification
            {user?.phoneVerified && <span className="badge-success">Verified</span>}
          </h3>
          {!user?.phoneVerified ? (
            <>
              <div className="form-group">
                <input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit phone number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={sendPhoneOtp} disabled={loading === 'phone-send'}>
                Send OTP
              </button>
              {devPhoneOtp && <p className="mt-2 text-sm">Dev OTP: <strong>{devPhoneOtp}</strong></p>}
              <div className="form-group mt-3 mb-2">
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" placeholder="Enter 6-digit OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={verifyPhone} disabled={loading === 'phone-verify'}>
                Verify Phone
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">{user.phone}</p>
          )}
        </div>
      </div>

      <button type="button" className="btn-primary btn-block mt-6" onClick={handleContinue}>
        Continue to KYC
      </button>
    </ApplyLayout>
  );
}
