import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectPermissions,
  selectRoles,
} from '../store/slices/authSlice';

const ProtectedRoute = ({ children, permission, role }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const isSuperAdmin = roles.includes('super_admin');

  if (permission && !isSuperAdmin && !permissions.includes(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (role && !isSuperAdmin && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
