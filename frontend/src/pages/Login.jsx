import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email');
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = mode === 'email'
        ? { email: form.email, password: form.password }
        : { phone: form.phone, password: form.password };
      const data = await login(payload);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError('');
    if (!credentialResponse?.credential) {
      setError('Google did not return a login credential. Check the OAuth authorized origin.');
      return;
    }
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50 px-4 py-8">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">EZfinanz</h1>
          <p className="mt-1 text-gray-500">Sign in to your account</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="tab-group mb-6">
          <button type="button" className={`tab-btn ${mode === 'email' ? 'active' : ''}`} onClick={() => setMode('email')}>Email</button>
          <button type="button" className={`tab-btn ${mode === 'phone' ? 'active' : ''}`} onClick={() => setMode('phone')}>Phone</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'email' ? (
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
          ) : (
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
            </div>
          )}
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center text-sm text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="px-4">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Google login failed')}
            useOneTap={false}
          />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Demo Admin: admin@ezfinanz.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
