import { Routes, Route, Navigate } from 'react-router-dom';
import Layout, { AdminLayout, GuestRoute, CustomerRoute } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyPage from './pages/apply/VerifyPage';
import KYCPage from './pages/apply/KYCPage';
import EligibilityPage from './pages/apply/EligibilityPage';
import EMIPage from './pages/apply/EMIPage';
import BankPage from './pages/apply/BankPage';
import DeclarationPage from './pages/apply/DeclarationPage';
import SelfiePage from './pages/apply/SelfiePage';
import StatusPage from './pages/apply/StatusPage';
import LoanHistory from './pages/LoanHistory';
import LoanDetail from './pages/LoanDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import ApplicationDetail from './pages/admin/ApplicationDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<CustomerRoute><Dashboard /></CustomerRoute>} />
        <Route path="/loans" element={<CustomerRoute><LoanHistory /></CustomerRoute>} />
        <Route path="/loans/:id" element={<CustomerRoute><LoanDetail /></CustomerRoute>} />
        <Route path="/apply/verify" element={<CustomerRoute><VerifyPage /></CustomerRoute>} />
        <Route path="/apply/kyc" element={<CustomerRoute><KYCPage /></CustomerRoute>} />
        <Route path="/apply/eligibility" element={<CustomerRoute><EligibilityPage /></CustomerRoute>} />
        <Route path="/apply/emi" element={<CustomerRoute><EMIPage /></CustomerRoute>} />
        <Route path="/apply/bank" element={<CustomerRoute><BankPage /></CustomerRoute>} />
        <Route path="/apply/declaration" element={<CustomerRoute><DeclarationPage /></CustomerRoute>} />
        <Route path="/apply/selfie" element={<CustomerRoute><SelfiePage /></CustomerRoute>} />
        <Route path="/apply/status" element={<CustomerRoute><StatusPage /></CustomerRoute>} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/applications/:id" element={<ApplicationDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
