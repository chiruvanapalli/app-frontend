import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPermissions, createPermission, deletePermission,
  selectPermissionsList, selectPermissionsLoading, selectPermissionsError, clearPermissionsError,
} from '../store/slices/permissionsSlice';
import usePermission from '../hooks/usePermission';

const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'];
const EMPTY_FORM = { resource: '', action: 'read', description: '' };

const ActionBadge = ({ action }) => {
  const colors = {
    read: 'bg-blue-50 text-blue-700',
    create: 'bg-green-50 text-green-700',
    update: 'bg-amber-50 text-amber-700',
    delete: 'bg-red-50 text-red-700',
    manage: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[action] || 'bg-slate-100 text-slate-600'}`}>
      {action}
    </span>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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

const Permissions = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();

  const permissions = useSelector(selectPermissionsList);
  const isLoading = useSelector(selectPermissionsLoading);
  const error = useSelector(selectPermissionsError);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterResource, setFilterResource] = useState('');

  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearPermissionsError()), 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const resources = [...new Set(permissions.map((p) => p.resource))].sort();
  const filtered = filterResource
    ? permissions.filter((p) => p.resource === filterResource)
    : permissions;

  const handleField = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const result = await dispatch(createPermission(form));
      if (createPermission.fulfilled.match(result)) {
        setModal(false);
        setForm(EMPTY_FORM);
      } else {
        setFormError(result.payload || 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deletePermission(deleteConfirm._id));
    if (deletePermission.fulfilled.match(result)) setDeleteConfirm(null);
    else setDeleteConfirm(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Permissions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{permissions.length} permissions defined</p>
        </div>
        {hasPermission('permissions:create') && (
          <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModal(true); }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Permission
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400">{filtered.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Permission</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Resource</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Description</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No permissions found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded">{p.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.resource}</td>
                    <td className="px-4 py-3"><ActionBadge action={p.action} /></td>
                    <td className="px-4 py-3 text-slate-500">{p.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        {hasPermission('permissions:delete') && (
                          <button onClick={() => setDeleteConfirm(p)}
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
      </div>

      {modal && (
        <Modal title="Add Permission" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Resource <span className="text-slate-400 font-normal">(lowercase)</span>
              </label>
              <input name="resource" value={form.resource} onChange={handleField} required
                placeholder="e.g. reports"
                pattern="[a-z0-9_]+"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Action</label>
              <select name="action" value={form.action} onChange={handleField}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input name="description" value={form.description} onChange={handleField}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {form.resource && (
              <p className="text-xs text-slate-400">
                Will create: <span className="font-mono text-slate-600">{form.resource}:{form.action}</span>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition flex items-center gap-1.5">
                {saving && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                Create Permission
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Permission" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 text-sm mb-2">
            Delete permission <span className="font-mono font-semibold text-slate-800">{deleteConfirm.name}</span>?
          </p>
          <p className="text-amber-600 text-xs mb-5">This will also remove it from all roles that have it assigned.</p>
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

export default Permissions;
