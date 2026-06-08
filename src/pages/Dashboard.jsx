import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, selectPermissions, selectRoles } from '../store/slices/authSlice';
import { fetchUsers, selectUsersPagination } from '../store/slices/usersSlice';
import { fetchRoles, selectRolesList } from '../store/slices/rolesSlice';
import { fetchPermissions, selectPermissionsList } from '../store/slices/permissionsSlice';
import usePermission from '../hooks/usePermission';

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  const pagination = useSelector(selectUsersPagination);
  const rolesList = useSelector(selectRolesList);
  const permissionsList = useSelector(selectPermissionsList);
  const { hasPermission } = usePermission();

  useEffect(() => {
    if (hasPermission('users:read')) dispatch(fetchUsers());
    if (hasPermission('roles:read')) dispatch(fetchRoles());
    if (hasPermission('permissions:read')) dispatch(fetchPermissions());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, <span className="font-medium text-slate-700">{user?.firstName} {user?.lastName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hasPermission('users:read') && (
          <StatCard
            label="Total Users"
            value={pagination.total}
            color="bg-indigo-50"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        )}
        {hasPermission('roles:read') && (
          <StatCard
            label="Total Roles"
            value={rolesList.length}
            color="bg-emerald-50"
            icon={
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        )}
        {hasPermission('permissions:read') && (
          <StatCard
            label="Total Permissions"
            value={permissionsList.length}
            color="bg-amber-50"
            icon={
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
          />
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Your Account</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-slate-700 font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Assigned Roles</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {roles.map((r) => (
                <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Permissions ({permissions.length})</p>
            <div className="flex flex-wrap gap-1 mt-1 max-w-lg">
              {permissions.slice(0, 10).map((p) => (
                <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                  {p}
                </span>
              ))}
              {permissions.length > 10 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                  +{permissions.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
