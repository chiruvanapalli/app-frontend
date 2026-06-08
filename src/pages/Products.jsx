import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. React.memo     — ProductRow re-renders ALL rows on every keystroke
 * 2. useMemo        — filteredProducts / categories recalc on every render
 * 3. Debounce       — search fires an API call on every character typed
 * 4. useCallback    — handleEdit / handleDelete are new refs every render
 * 5. Virtualization — all rows in the DOM at once (use react-window)
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1: Open DevTools → Console → type in the search box.
 * You will see "ProductRow render: X" for EVERY row on EVERY keystroke.
 */

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-600',
};

// ❌ PERF ISSUE 1: No React.memo — re-renders even when this row's data didn't change
const ProductRow = ({ product, onEdit, onDelete }) => {
  console.log('ProductRow render:', product.id); // Watch the console — fires for every row on every keystroke
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
      <td className="px-4 py-2.5 text-xs font-mono text-slate-400">{product.sku}</td>
      <td className="px-4 py-2.5">
        <p className="text-sm font-medium text-slate-800">{product.name}</p>
        <p className="text-xs text-slate-400">{product.category}</p>
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-700">${product.price.toFixed(2)}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{product.stock}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">⭐ {product.rating}</td>
      <td className="px-4 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[product.status]}`}>
          {product.status}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-3 justify-end">
          {/* ❌ PERF ISSUE 4: Anonymous arrow functions — new reference every render — breaks memo */}
          <button onClick={() => onEdit(product)} className="text-xs text-indigo-600 hover:underline">Edit</button>
          <button onClick={() => onDelete(product.id)} className="text-xs text-red-500 hover:underline">Delete</button>
        </div>
      </td>
    </tr>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // ❌ PERF ISSUE 3: No debounce — fires an API call on every character typed
  const loadProducts = (page = 1, searchVal = search, cat = categoryFilter, sort = sortBy) => {
    setLoading(true);
    api.get('/products', { params: { page, limit: 50, search: searchVal, category: cat, sortBy: sort } })
      .then(({ data }) => {
        setProducts(data.products);
        setCategories(data.categories);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  // ❌ PERF ISSUE 3: Fires on every keystroke with no debounce
  const handleSearch = (e) => {
    setSearch(e.target.value);
    loadProducts(1, e.target.value, categoryFilter, sortBy);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    loadProducts(1, search, e.target.value, sortBy);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    loadProducts(1, search, categoryFilter, e.target.value);
  };

  // ❌ PERF ISSUE 4: No useCallback — new function reference on every render
  const handleEdit = (product) => {
    setEditing(product);
    setEditForm({ name: product.name, price: product.price, stock: product.stock });
  };

  // ❌ PERF ISSUE 4: No useCallback
  const handleDelete = (id) => {
    api.delete(`/products/${id}`).then(() => loadProducts());
  };

  const handleSave = async () => {
    setSaving(true);
    await api.put(`/products/${editing?.id}`, editForm);
    setEditing(null);
    setSaving(false);
    loadProducts();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total} total products</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
          + Add Product
        </button>
      </div>

      {/* Issues panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>React.memo</strong> — <code>ProductRow</code> is not wrapped in memo. Open the console and type to see all rows re-render.</li>
          <li><strong>Debounce</strong> — search fires a real API call on every keystroke. Add 400ms debounce.</li>
          <li><strong>useCallback</strong> — <code>handleEdit</code> &amp; <code>handleDelete</code> are recreated on every render, defeating React.memo.</li>
          <li><strong>Virtualization</strong> — all 50 rows per page are in the DOM. With full data (500), use <code>react-window</code>.</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          {/* ❌ No debounce */}
          <input
            type="text"
            placeholder="Search name or SKU... (no debounce)"
            value={search}
            onChange={handleSearch}
            className="flex-1 min-w-48 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select value={categoryFilter} onChange={handleCategoryChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={handleSortChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="id">Default order</option>
            <option value="name">Name A-Z</option>
            <option value="price">Price low-high</option>
            <option value="stock">Stock high-low</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Product</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Price</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No products found</td></tr>
              ) : (
                /* ❌ PERF ISSUE 5: All rows in DOM — no virtualization */
                products.map(product => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => loadProducts(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === pagination.page ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit: {editing.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price ($)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock</label>
                  <input type="number" value={editForm.stock} onChange={e => setEditForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
