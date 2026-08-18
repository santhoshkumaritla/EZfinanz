import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/constants';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/admin/applications'),
      api.get('/admin/stats'),
    ]).then(([appsRes, statsRes]) => {
      setApplications(appsRes.data.applications);
      setStats(statsRes.data.stats);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter((app) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return app.status === 'waiting_admin_review';
    if (filter === 'approved') return app.status === 'approved';
    if (filter === 'disbursed') return app.status === 'disbursed';
    return true;
  });

  const statusBadge = (app) => {
    const map = {
      in_progress: 'badge-gray',
      waiting_admin_review: 'badge-warning',
      approved: 'badge-success',
      disbursed: 'badge-success',
      rejected: 'badge-danger',
    };
    return <span className={map[app.status] || 'badge-gray'}>{app.stageLabel}</span>;
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-lg text-gray-500">Loading applications...</div>;

  return (
    <div className="container-app">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Review and manage loan applications</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card card-sm flex flex-col gap-1 shadow-card">
          <span className="text-sm text-gray-500">Total</span>
          <strong className="text-3xl">{stats.total || 0}</strong>
        </div>
        <div className="card card-sm flex flex-col gap-1 shadow-card">
          <span className="text-sm text-gray-500">Pending Review</span>
          <strong className="text-3xl text-amber-600">{stats.pending || 0}</strong>
        </div>
        <div className="card card-sm flex flex-col gap-1 shadow-card">
          <span className="text-sm text-gray-500">Approved</span>
          <strong className="text-3xl text-emerald-600">{stats.approved || 0}</strong>
        </div>
        <div className="card card-sm flex flex-col gap-1 shadow-card">
          <span className="text-sm text-gray-500">Disbursed</span>
          <strong className="text-3xl text-emerald-600">{stats.disbursed || 0}</strong>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'disbursed'].map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Applicant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Loan Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tenure</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No applications found</td></tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <strong>{app.applicantName}</strong>
                      <br /><span className="text-xs text-gray-500">{app.email || app.phone}</span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(app.loanAmount)}</td>
                    <td className="px-4 py-3">{app.tenure ? `${app.tenure} mo` : '-'}</td>
                    <td className="px-4 py-3">{statusBadge(app)}</td>
                    <td className="px-4 py-3">{formatDate(app.submittedAt || app.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/applications/${app.id}`} className="btn-primary btn-sm no-underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
