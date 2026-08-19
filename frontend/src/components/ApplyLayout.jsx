import { Link, useLocation } from 'react-router-dom';
import { useApplyGuard } from '../hooks/useApplyGuard';
import '../pages/User.css';

export default function ApplyLayout({ title, children }) {
  const location = useLocation();
  useApplyGuard(location.pathname);

  return (
    <div className="container-app max-w-3xl">
      <div className="mb-4">
        <Link to="/dashboard" className="text-sm text-gray-500 no-underline hover:text-primary">← Dashboard</Link>
        <p className="user-eyebrow mt-3">Loan Application</p>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="card mb-8">
        {children}
      </div>
    </div>
  );
}
