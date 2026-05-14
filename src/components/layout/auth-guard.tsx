import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '@/lib/token-storage';

export function AuthGuard() {
  const location = useLocation();
  const refresh = tokenStorage.getRefresh();

  if (!refresh) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
