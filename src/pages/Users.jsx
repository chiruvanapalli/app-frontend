import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers, createUser, updateUser, deleteUser,
  selectUsers, selectUsersPagination, selectUsersLoading, selectUsersError, clearUsersError,
} from '../store/slices/usersSlice';
import { fetchRoles, selectRolesList } from '../store/slices/rolesSlice';
import usePermission from '../hooks/usePermission';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', roles: [], isActive: true };

const Badge = ({ active }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

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

const Users = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();

  const users = useSelector(selectUsers);
  const pagination = useSelector(selectUsersPagination);
  const isLoading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const allRoles = useSelector(selectRolesList);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback((p = page, s = search) => {
    dispatch(fetchUsers({ page: p, limit: 10, search: s }));
  }, [dispatch, page, search]);

  useEffect(() => {
    load();
    dispatch(fetchRoles());
  }, []);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearUsersError()), 4000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    dispatch(fetchUsers({ page: 1, limit: 10, search: e.target.value }));
  };

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create'); };
  const openEdit = (user) => {
    setForm({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      roles: user.roles.map((r) => r._id),
      isActive: user.isActive,
    });
    setFormError('');
    setModal('edit');
  };

  const handleField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleRole = (roleId) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter((r) => r !== roleId)
        : [...prev.roles, roleId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      let result;
      if (modal === 'create') {
        result = await dispatch(createUser(form));
      } else {
        const { id, password, ...updates } = form;
        result = await dispatch(updateUser({ id, ...updates }));
      }
      if (createUser.fulfilled.match(result) || updateUser.fulfilled.match(result)) {
        setModal(null);
        load();
      } else {
        setFormError(result.payload || 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteUser(deleteConfirm._id));
    if (deleteUser.fulfilled.match(result)) {
      setDeleteConfirm(null);
      load();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total} total users</p>
        </div>
        {hasPermission('users:create') && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            className="w-full sm:w-72 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Roles</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u.firstName} {u.lastName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r._id} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {r.displayName}
                          </span>
                        ))}
                        {u.roles.length === 0 && <span className="text-slate-400 text-xs">No roles</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge active={u.isActive} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('users:update') && (
                          <button onClick={() => openEdit(u)}
                            className="text-slate-400 hover:text-indigo-600 transition" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasPermission('users:delete') && (
                          <button onClick={() => setDeleteConfirm(u)}
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

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => { setPage(p); load(p, search); }}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === pagination.page ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Add User' : 'Edit User'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleField} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleField} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleField} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {modal === 'create' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleField} required minLength={8}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Roles</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allRoles.map((r) => (
                  <label key={r._id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.roles.includes(r._id)}
                      onChange={() => toggleRole(r._id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700">{r.displayName}</span>
                    <span className="text-xs text-slate-400">({r.name})</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleField}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-slate-700">Active account</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition flex items-center gap-1.5">
                {saving && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete User" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 text-sm mb-5">
            Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteConfirm.firstName} {deleteConfirm.lastName}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
