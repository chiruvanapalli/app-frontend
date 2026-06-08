import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. Waterfall fetch  — loads orders THEN fetches customer details one by one (N+1 problem)
 * 2. useCallback      — handleStatusChange is recreated on every render
 * 3. useMemo          — totalRevenue and ordersByStatus recalculate on every render
 * 4. useTransition    — status filter blocks the UI while updating
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1: Open DevTools → Network tab.
 * You'll see 1 request for orders, then 20 separate requests for customer details.
 * Fix: add an ?include=customer param and join server-side, OR batch-fetch.
 */

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // ❌ PERF ISSUE 1: Waterfall fetch — fetches orders, THEN fetches each customer separately
  // Fix: add ?include=customer to the GET /orders request and join server-side
  const loadOrders = (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    api.get('/orders', { params: { page: p, limit: 20, search: s, status: st } })
      .then(({ data }) => {
        setOrders(data.orders);
        setPagination(data.pagination);
        setSummary(data.summary);
        setLoading(false);

        // ❌ N+1 WATERFALL: fire one extra request per order for customer details
        // Open Network tab to see 20+ sequential API calls after the first one
        data.orders.forEach(order => {
          api.get(`/orders/${order.id}/customer`).then(({ data: cd }) => {
            setCustomerDetails(prev => ({ ...prev, [order.id]: cd.customer }));
          });
        });
      });
  };

  useEffect(() => { loadOrders(); }, []);

  // ❌ PERF ISSUE 3: No useMemo — recalculates on every render
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // ❌ PERF ISSUE 2: No useCallback — new function reference every render
  const handleStatusChange = (id, newStatus) => {
    api.put(`/orders/${id}/status`, { status: newStatus })
      .then(() => loadOrders());
  };

  // ❌ PERF ISSUE 4: No useTransition — this blocks the UI while filtering
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
    loadOrders(1, search, e.target.value);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    loadOrders(1, e.target.value, statusFilter);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <p className="text-slate-500 text-sm mt-0.5">{pagination.total} total orders</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>Waterfall / N+1</strong> — orders load first, then <em>one API call per order</em> fetches customer details. Open Network tab to see it.</li>
          <li><strong>useMemo</strong> — <code>totalRevenue</code> and <code>avgOrderValue</code> reduce the full array on every render, not just when orders changes.</li>
          <li><strong>useCallback</strong> — <code>handleStatusChange</code> is a new function on every render.</li>
          <li><strong>useTransition</strong> — status filter change blocks the main thread. Wrap the state update in <code>startTransition</code>.</li>
        </ol>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `$${summary.totalRevenue.toFixed(2)}` },
            { label: 'Total Orders', value: summary.byStatus ? Object.values(summary.byStatus).reduce((a, b) => a + b, 0) : 0 },
            { label: 'Avg Order (visible)', value: `$${avgOrderValue.toFixed(2)}` },  // ❌ recalculates every render
            { label: 'Delivered', value: summary.byStatus?.delivered ?? 0 },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-lg font-bold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <input type="text" placeholder="Search customer or order #..." value={search} onChange={handleSearch}
            className="flex-1 min-w-48 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {/* ❌ PERF ISSUE 4: No useTransition on this filter */}
          <select value={statusFilter} onChange={handleStatusFilter}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All statuses</option>
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Customer Detail</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Total</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Items</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Date</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs">Change Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No orders found</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{order.orderNumber}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-slate-800">{order.customer}</p>
                      <p className="text-xs text-slate-400">{order.email}</p>
                    </td>
                    {/* Shows waterfall loading — each customer detail arrives separately */}
                    <td className="px-4 py-2.5">
                      {customerDetails[order.id] ? (
                        <div>
                          <p className="text-xs text-slate-600">{customerDetails[order.id].address}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            customerDetails[order.id].tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                            customerDetails[order.id].tier === 'silver' ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                          }`}>{customerDetails[order.id].tier}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">loading...</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{order.items}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {/* ❌ PERF ISSUE 2: Anonymous function in map — new ref every render */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => { setPage(p); loadOrders(p); }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === page ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
