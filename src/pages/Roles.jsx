import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRoles, createRole, updateRole, deleteRole,
  selectRolesList, selectRolesLoading, selectRolesError, clearRolesError,
} from '../store/slices/rolesSlice';
import { fetchPermissions, selectPermissionsList } from '../store/slices/permissionsSlice';
import usePermission from '../hooks/usePermission';

const EMPTY_FORM = { name: '', displayName: '', description: '', permissions: [] };

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const Roles = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();

  const roles = useSelector(selectRolesList);
  const isLoading = useSelector(selectRolesLoading);
  const error = useSelector(selectRolesError);
  const allPermissions = useSelector(selectPermissionsList);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(fetchRoles());
    if (hasPermission('permissions:read')) dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearRolesError()), 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create'); };
  const openEdit = (role) => {
    setForm({
      id: role._id,
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions.map((p) => p._id),
    });
    setFormError('');
    setModal('edit');
  };

  const handleField = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const togglePermission = (permId) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      let result;
      if (modal === 'create') {
        result = await dispatch(createRole(form));
      } else {
        const { id, name, ...updates } = form;
        result = await dispatch(updateRole({ id, ...updates }));
      }
      if (createRole.fulfilled.match(result) || updateRole.fulfilled.match(result)) {
        setModal(null);
      } else {
        setFormError(result.payload || 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteRole(deleteConfirm._id));
    if (deleteRole.fulfilled.match(result)) setDeleteConfirm(null);
    else setDeleteConfirm(null);
  };

  const groupedPerms = allPermissions.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
          <p className="text-slate-500 text-sm mt-0.5">{roles.length} roles configured</p>
        </div>
        {hasPermission('roles:create') && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Role
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Permissions</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Users</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No roles found</td></tr>
            ) : (
              roles.map((r) => (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.displayName}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.name}</p>
                    {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.permissions.slice(0, 5).map((p) => (
                        <span key={p._id} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-mono">
                          {p.name}
                        </span>
                      ))}
                      {r.permissions.length > 5 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500">
                          +{r.permissions.length - 5}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.userCount ?? 0}</td>
                  <td className="px-4 py-3">
                    {r.isSystem ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">System</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Custom</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('roles:update') && (
                        <button onClick={() => openEdit(r)}
                          className="text-slate-400 hover:text-indigo-600 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {hasPermission('roles:delete') && !r.isSystem && (
                        <button onClick={() => setDeleteConfirm(r)}
                          className="text-slate-400 hover:text-red-600 transition" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Create Role' : 'Edit Role'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}
            {modal === 'create' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Name <span className="text-slate-400 font-normal">(lowercase, underscores only)</span>
                </label>
                <input name="name" value={form.name} onChange={handleField} required
                  placeholder="e.g. content_editor"
                  pattern="[a-z0-9_]+"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Display Name</label>
              <input name="displayName" value={form.displayName} onChange={handleField} required
                placeholder="e.g. Content Editor"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input name="description" value={form.description} onChange={handleField}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Permissions <span className="text-slate-400 font-normal">({form.permissions.length} selected)</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-3 max-h-52 overflow-y-auto space-y-3">
                {Object.entries(groupedPerms).map(([resource, perms]) => (
                  <div key={resource}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{resource}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {perms.map((p) => (
                        <label key={p._id} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={form.permissions.includes(p._id)}
                            onChange={() => togglePermission(p._id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-xs text-slate-700 font-mono">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedPerms).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No permissions available</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition flex items-center gap-1.5">
                {saving && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {modal === 'create' ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Role" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 text-sm mb-5">
            Are you sure you want to delete the role <span className="font-semibold text-slate-800">{deleteConfirm.displayName}</span>? Users with this role will lose its permissions.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Cancel</button>
            <button onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Roles;
