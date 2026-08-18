import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STAGE_ORDER } from '../utils/constants';

const STAGE_PATHS = {
  verification: '/apply/verify',
  kyc: '/apply/kyc',
  eligibility: '/apply/eligibility',
  emi_selection: '/apply/emi',
  bank_account: '/apply/bank',
  declaration: '/apply/declaration',
  selfie: '/apply/selfie',
  admin_review: '/apply/status',
  approved: '/apply/status',
  rejected: '/apply/status',
  disbursed: '/apply/status',
};

const PAGE_STAGE = {
  '/apply/verify': 'verification',
  '/apply/kyc': 'kyc',
  '/apply/eligibility': 'eligibility',
  '/apply/emi': 'emi_selection',
  '/apply/bank': 'bank_account',
  '/apply/declaration': 'declaration',
  '/apply/selfie': 'selfie',
  '/apply/status': 'admin_review',
};

/**
 * Redirects customers to the correct step if they try to skip ahead.
 * Allows revisiting completed steps and the status page when submitted.
 */
export function useApplyGuard(pathname) {
  const { user, application, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || user.role === 'admin') return;

    const currentStage = application?.currentStage || 'verification';
    const targetStage = PAGE_STAGE[pathname];
    if (!targetStage) return;

    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    const targetIdx = STAGE_ORDER.indexOf(targetStage);

    if (targetIdx === -1 || currentIdx === -1) return;

    // Allow status page when at or past admin review
    if (pathname === '/apply/status' && currentIdx >= STAGE_ORDER.indexOf('admin_review')) return;

    // Allow selfie resubmit after rejection
    if (pathname === '/apply/selfie' && currentStage === 'selfie') return;

    // Block jumping ahead
    if (targetIdx > currentIdx) {
      navigate(STAGE_PATHS[currentStage] || '/apply/verify', { replace: true });
    }
  }, [loading, user, application, pathname, navigate]);
}
