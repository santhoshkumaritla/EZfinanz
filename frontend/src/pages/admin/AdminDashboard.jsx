import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/constants';
import { formatStageLabel, formatStatusLabel, STATUS_STYLES } from './adminUtils';
import './Admin.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
  { key: 'rejected', label: 'Rejected' },
];

const STAT_CARDS = [
  { key: 'total', label: 'Total Applications', tone: 'border-l-gray-400', valueTone: 'text-gray-900' },
  { key: 'pending', label: 'Pending Review', tone: 'border-l-amber-400', valueTone: 'text-amber-600' },
  { key: 'approved', label: 'Approved', tone: 'border-l-emerald-400', valueTone: 'text-emerald-600' },
  { key: 'disbursed', label: 'Disbursed', tone: 'border-l-blue-400', valueTone: 'text-blue-600' },
];

function matchesFilter(app, filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return app.status === 'waiting_admin_review';
  if (filter === 'approved') return app.status === 'approved';
  if (filter === 'disbursed') return app.status === 'disbursed';
  if (filter === 'rejected') return app.selfieStatus === 'rejected' || app.status === 'rejected';
  return true;
}

function matchesSearch(app, query) {
  if (!query) return true;
  const haystack = [app.applicantName, app.email, app.phone, app.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/admin/applications'),
        api.get('/admin/stats'),
      ]);
      setApplications(appsRes.data.applications);
      setStats(statsRes.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterCounts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((app) => matchesFilter(app, 'pending')).length,
    approved: applications.filter((app) => matchesFilter(app, 'approved')).length,
    disbursed: applications.filter((app) => matchesFilter(app, 'disbursed')).length,
    rejected: applications.filter((app) => matchesFilter(app, 'rejected')).length,
  }), [applications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((app) => matchesFilter(app, filter) && matchesSearch(app, query));
  }, [applications, filter, search]);

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Application Dashboard</h1>
          <p className="admin-subtitle">Review submissions, approve selfies, and disburse approved loans.</p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && <div className="alert-error">{error}</div>}

      <section className="admin-stats-grid">
        {STAT_CARDS.map((card) => (
          <article key={card.key} className={`admin-stat-card ${card.tone}`}>
            <span>{card.label}</span>
            <strong className={card.valueTone}>{stats[card.key] || 0}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-filter-tabs">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={filter === item.key ? 'active' : ''}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                <span className="admin-filter-count">{filterCounts[item.key]}</span>
              </button>
            ))}
          </div>

          <input
            type="search"
            className="admin-search"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Loan</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">
                    <div className="admin-empty-state">
                      <strong>No applications found</strong>
                      <span>Try changing the filter or search term.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="admin-applicant">
                        <strong>{app.applicantName}</strong>
                        <span>{app.email || app.phone || 'No contact info'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-loan-cell">
                        <strong>{formatCurrency(app.loanAmount)}</strong>
                        <span>{app.tenure ? `${app.tenure} months` : 'Tenure pending'}</span>
                        {app.emi ? <span>EMI {formatCurrency(app.emi)}</span> : null}
                      </div>
                    </td>
                    <td>
                      <span className="badge-gray">{formatStageLabel(app.currentStage)}</span>
                    </td>
                    <td>
                      <span className={STATUS_STYLES[app.status] || 'badge-gray'}>
                        {formatStatusLabel(app.status)}
                      </span>
                    </td>
                    <td>{formatDate(app.submittedAt || app.createdAt)}</td>
                    <td>
                      <Link to={`/admin/applications/${app.id}`} className="btn-primary btn-sm no-underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
