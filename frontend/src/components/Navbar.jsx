import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ admin }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to={admin ? '/admin' : '/dashboard'} className="flex items-center gap-2 text-xl font-bold text-gray-900 no-underline hover:text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base text-white">₹</span>
          EZfinanz
        </Link>
        <div className="flex items-center gap-4">
          {!admin && (
            <>
              <Link to="/dashboard" className="hidden text-sm font-medium text-gray-600 no-underline hover:text-primary sm:inline-flex">
                Dashboard
              </Link>
              <Link to="/loans" className="hidden text-sm font-medium text-gray-600 no-underline hover:text-primary sm:inline-flex">
                My Loans
              </Link>
            </>
          )}
          {admin && (
            <Link to="/admin" className="hidden text-sm font-medium text-gray-600 no-underline hover:text-primary sm:inline-flex">
              Dashboard
            </Link>
          )}
          {!admin && (
            <Link to="/loans" className="hidden text-sm font-medium text-gray-600 no-underline hover:text-primary sm:inline-flex">
              Loan History
            </Link>
          )}
          <span className="hidden items-center gap-2 text-sm text-gray-700 sm:flex">
            {user?.name || user?.email}
            {admin && <span className="badge-primary">Admin</span>}
          </span>
          <button className="btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
