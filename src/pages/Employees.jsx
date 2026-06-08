import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. React.memo      — EmployeeRow re-renders all 200 rows when parent state changes
 * 2. Virtualization  — all 200 rows are in the DOM at once (use react-window)
 * 3. useMemo         — departments list and salary stats recalculate every render
 * 4. useCallback     — handleEdit / handleDeptFilter are new refs each render
 * 5. createSelector  — if this came from Redux, salaryStats would need createSelector
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1: Watch the console — EmployeeRow logs fire for ALL rows
 * every time you click anything on the page.
 */

// ❌ PERF ISSUE 1: No React.memo — re-renders all 200 rows on every state change
const EmployeeRow = ({ employee, onEdit }) => {
  console.log('EmployeeRow render:', employee.id); // fires for all 200 rows on every click
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 shrink-0">
            {employee.initials}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{employee.firstName} {employee.lastName}</p>
            <p className="text-xs text-slate-400">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{employee.department}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{employee.role}</td>
      <td className="px-4 py-2.5 text-sm text-slate-700 font-medium">${employee.salary.toLocaleString()}</td>
      <td className="px-4 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {employee.status}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-slate-400">
        {new Date(employee.joinDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-2.5 text-right">
        {/* ❌ PERF ISSUE 4: Anonymous function in map — new ref every render */}
        <button onClick={() => onEdit(employee)} className="text-xs text-indigo-600 hover:underline">
          Edit
        </button>
      </td>
    </tr>
  );
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadEmployees = (page = 1, s = search, dept = deptFilter) => {
    setLoading(true);
    // ❌ requests all 200 employees at once — no server-side pagination enabled
    api.get('/employees', { params: { page, limit: 200, search: s, department: dept } })
      .then(({ data }) => {
        setEmployees(data.employees);
        setDepartments(data.departments);
        setPagination(data.pagination);
        setLoading(false);
      });
  };

  useEffect(() => { loadEmployees(); }, []);

  // ❌ PERF ISSUE 3: No useMemo — recalculates on every render
  const salaryStats = {
    avg: employees.length > 0
      ? Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length)
      : 0,
    max: employees.length > 0 ? Math.max(...employees.map(e => e.salary)) : 0,
    min: employees.length > 0 ? Math.min(...employees.map(e => e.salary)) : 0,
  };

  // ❌ PERF ISSUE 3: No useMemo — runs on every render
  const activeCount = employees.filter(e => e.status === 'active').length;

  // ❌ PERF ISSUE 4: No useCallback
  const handleEdit = (emp) => {
    setEditing(emp);
    setEditForm({ department: emp.department, role: emp.role, salary: emp.salary });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    loadEmployees(1, e.target.value, deptFilter);
  };

  // ❌ PERF ISSUE 4: No useCallback
  const handleDeptFilter = (e) => {
    setDeptFilter(e.target.value);
    loadEmployees(1, search, e.target.value);
  };

  const handleSave = () => {
    api.put(`/employees/${editing.id}`, editForm).then(() => {
      setEditing(null);
      loadEmployees();
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
        <p className="text-slate-500 text-sm mt-0.5">{pagination.total} employees</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>React.memo</strong> — <code>EmployeeRow</code> is not memoized. All 200 rows re-render when you click Edit or type in the search box. Check the console.</li>
          <li><strong>Virtualization</strong> — all 200 <code>&lt;tr&gt;</code> elements exist in the DOM simultaneously. Install <code>react-window</code> and use <code>FixedSizeList</code>.</li>
          <li><strong>useMemo</strong> — <code>salaryStats</code> (reduce + Math.max + Math.min) and <code>activeCount</code> run on every render.</li>
          <li><strong>useCallback</strong> — <code>handleEdit</code> and <code>handleDeptFilter</code> are recreated on every render, defeating React.memo on the rows.</li>
        </ol>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: pagination.total },
          { label: 'Active', value: activeCount },  // ❌ recalculates every render
          { label: 'Avg Salary', value: `$${salaryStats.avg.toLocaleString()}` }, // ❌ recalculates
          { label: 'Salary Range', value: `$${salaryStats.min.toLocaleString()} – $${salaryStats.max.toLocaleString()}` }, // ❌ recalculates
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-lg font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <input type="text" placeholder="Search employees..." value={search} onChange={handleSearch}
            className="flex-1 min-w-48 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={deptFilter} onChange={handleDeptFilter}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* ❌ PERF ISSUE 2: ALL rows rendered in DOM — no virtualization */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Department</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Salary</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No employees found</td></tr>
              ) : (
                employees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    onEdit={handleEdit} // ❌ this defeats memo without useCallback
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          {employees.length} rows — all rendered in DOM simultaneously (no virtualization)
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Edit: {editing.firstName} {editing.lastName}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <input value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <input value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Salary</label>
                <input type="number" value={editForm.salary} onChange={e => setEditForm(p => ({ ...p, salary: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
