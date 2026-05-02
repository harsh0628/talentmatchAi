import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RoleGuard({ allowedRoles = [] }) {
  const { authUser } = useAuth();

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(authUser.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

export default RoleGuard;
