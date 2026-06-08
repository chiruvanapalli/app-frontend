import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. useMemo         — ALL chart data is recomputed on every render (tab switch, hover, etc.)
 * 2. useReducer      — 4 separate useState calls each trigger individual re-renders
 * 3. createSelector  — if this data came from Redux, derived stats would need createSelector
 * 4. React.memo      — StatCard and BarChart are not memoized
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1: Add console.log inside the expensive computations below.
 * Switch tabs or hover over cards — you'll see them recompute each time.
 */

// ❌ PERF ISSUE 4: StatCard not memoized — re-renders every time Analytics re-renders
const StatCard = ({ label, value, sub, color }) => {
  console.log('StatCard render:', label); // see how often this fires
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <p className={`text-2xl font-bold ${color || 'text-slate-800'}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

// ❌ PERF ISSUE 4: BarChart not memoized
const BarChart = ({ data, title }) => {
  console.log('BarChart render:', title); // fires on every tab switch
  const max = Math.max(...Object.values(data));
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="space-y-2.5">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-24 shrink-0 truncate">{key}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: max > 0 ? `${(val / max) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 w-8 text-right">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ❌ PERF ISSUE 2: 3 separate useState — each causes its own re-render cycle
  // Fix: combine into useReducer({ tab, dateRange, view })
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [highlightedCard, setHighlightedCard] = useState(null);

  useEffect(() => {
    api.get('/analytics/stats').then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  // ❌ PERF ISSUE 1: No useMemo — ALL of these recalculate on EVERY render
  // (every tab switch, every hover, every unrelated state change)
  const totalRevenue = stats ? stats.summary.totalRevenue : 0;
  const formattedRevenue = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const topCategory = stats
    ? Object.entries(stats.charts.productsByCategory).sort((a, b) => b[1] - a[1])[0]
    : null;

  const deliveredPct = stats
    ? ((stats.charts.ordersByStatus.delivered || 0) / stats.summary.totalOrders * 100).toFixed(1)
    : 0;

  const avgSalaryFormatted = stats
    ? `$${Math.round(stats.summary.avgSalary).toLocaleString()}`
    : '-';

  // ❌ PERF ISSUE 1: This entire sort runs on every render
  const sortedCategories = stats
    ? Object.entries(stats.charts.productsByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">System overview across all data</p>
        </div>
        {/* ❌ PERF ISSUE 2: Each of these sets its own state → separate render */}
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>useMemo</strong> — <code>formattedRevenue</code>, <code>topCategory</code>, <code>deliveredPct</code>, <code>sortedCategories</code> all recalculate on every render. Check the console when switching tabs.</li>
          <li><strong>useReducer</strong> — <code>activeTab</code>, <code>dateRange</code>, <code>highlightedCard</code> are 3 separate <code>useState</code> calls, each triggering its own re-render cycle. One <code>useReducer</code> would batch them.</li>
          <li><strong>React.memo</strong> — <code>StatCard</code> and <code>BarChart</code> re-render on every state change (hover, tab switch). Check the console.</li>
          <li><strong>createSelector</strong> — if this data lived in Redux, you'd need <code>createSelector</code> to avoid recomputing derived stats on every dispatch.</li>
        </ol>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['overview', 'products', 'orders', 'employees'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)} // ❌ triggers re-render → all useMemos recompute
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ❌ PERF ISSUE 4: These re-render even when their props haven't changed */}
            <StatCard label="Total Revenue" value={formattedRevenue} color="text-indigo-600" />
            <StatCard label="Total Orders" value={stats.summary.totalOrders} sub={`${deliveredPct}% delivered`} />
            <StatCard label="Products" value={stats.summary.totalProducts} sub={topCategory ? `Top: ${topCategory[0]}` : ''} />
            <StatCard label="Employees" value={stats.summary.totalEmployees} sub={`${stats.summary.activeEmployees} active`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChart data={stats.charts.ordersByStatus} title="Orders by Status" />
            <BarChart data={stats.charts.employeesByDept} title="Employees by Department" />
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          <BarChart data={stats.charts.productsByCategory} title="Products by Category" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Top Selling Products</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Product</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Units Sold</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Price</th>
              </tr></thead>
              <tbody>
                {stats.tables.topProducts.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{p.name}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-indigo-600">{p.sold}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-slate-600">${p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Avg Order Value" value={`$${stats.summary.avgOrderValue.toFixed(2)}`} />
            <StatCard label="Delivered Rate" value={`${deliveredPct}%`} color="text-green-600" />
          </div>
          <BarChart data={stats.charts.revenueByStatus} title="Revenue by Order Status ($)" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Recent Orders</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Order</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Customer</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              </tr></thead>
              <tbody>
                {stats.tables.recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{o.orderNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{o.customer}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-700">${o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Employees" value={stats.summary.totalEmployees} />
            <StatCard label="Avg Salary" value={avgSalaryFormatted} color="text-emerald-600" />
          </div>
          <BarChart data={stats.charts.employeesByDept} title="Headcount by Department" />
        </div>
      )}
    </div>
  );
};

export default Analytics;
