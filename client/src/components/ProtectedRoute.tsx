import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppDispatch';

interface Props {
  children: React.ReactNode;
  requireSiteAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireSiteAdmin }: Props) {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireSiteAdmin && !user?.isSiteAdmin) return <Navigate to="/my-events" replace />;
  return <>{children}</>;
}
