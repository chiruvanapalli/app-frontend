import { useSelector } from 'react-redux';
import { selectPermissions, selectRoles } from '../store/slices/authSlice';

const usePermission = () => {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);

  const hasPermission = (permission) =>
    roles.includes('super_admin') || permissions.includes(permission);

  const hasRole = (role) => roles.includes(role);

  const hasAnyPermission = (perms) =>
    roles.includes('super_admin') || perms.some((p) => permissions.includes(p));

  const hasAllPermissions = (perms) =>
    roles.includes('super_admin') || perms.every((p) => permissions.includes(p));

  return { hasPermission, hasRole, hasAnyPermission, hasAllPermissions };
};

export default usePermission;
