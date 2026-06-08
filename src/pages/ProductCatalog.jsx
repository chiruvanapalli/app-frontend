import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * VIRTUALIZATION PRACTICE PAGE
 * ─────────────────────────────────────────────────────────────────
 * THE ONLY ISSUE HERE: All 500 product cards are rendered into the
 * DOM at once. This page exists specifically for you to fix this
 * using virtualization.
 *
 * HOW TO SEE THE PROBLEM:
 *   1. Open DevTools → Performance tab → record while scrolling
 *   2. Or open DevTools → Elements — count the .product-card nodes (500!)
 *   3. Notice the janky scrolling and slow initial paint
 *
 * HOW TO FIX IT (choose one):
 * ─────────────────────────────────────────────────────────────────
 * Option A — react-window (fixed size, simple)
 *   npm install react-window
 *   Use <FixedSizeList> for a single column, or <FixedSizeGrid> for a grid
 *   Every item MUST have the same height
 *
 * Option B — @tanstack/react-virtual (flexible, modern)
 *   npm install @tanstack/react-virtual
 *   Use useVirtualizer() hook — works with variable heights too
 *   More control, works inside any scroll container
 *
 * CONCEPT:
 *   Without virtualization: 500 cards × ~8 DOM nodes each = 4000+ DOM nodes
 *   With virtualization:    only ~15 visible cards rendered at a time = ~120 DOM nodes
 *   The rest are "virtual" — they only exist when scrolled into view
 * ─────────────────────────────────────────────────────────────────
 */

const CATEGORY_COLORS = {
  Electronics: 'bg-blue-50 text-blue-600',
  Clothing: 'bg-pink-50 text-pink-600',
  Books: 'bg-amber-50 text-amber-600',
  Sports: 'bg-green-50 text-green-600',
  Food: 'bg-orange-50 text-orange-600',
  Tools: 'bg-slate-100 text-slate-600',
  Furniture: 'bg-purple-50 text-purple-600',
  Toys: 'bg-red-50 text-red-600',
};

const STATUS_DOT = {
  active: 'bg-green-400',
  inactive: 'bg-red-400',
  draft: 'bg-slate-300',
};

// ❌ NOT memoized — but that's intentional here.
// The main issue on this page is VIRTUALIZATION, not memo.
// Once you add react-window / react-virtual, you'll also want React.memo
// on this card component so only newly-visible cards render.
const ProductCard = ({ product }) => (
  <div className="product-card bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition">
    {/*
      ❌ NO loading="lazy" — all 500 images fire network requests immediately on mount.
      Open DevTools → Network tab and filter by "Img" to see all 500 requests fire at once.
      Fix: add  loading="lazy"  to this img tag. That's it — one attribute.
    */}
    <img
      src={`https://picsum.photos/seed/${product.id}/300/200`}
      alt={product.name}
      width={300}
      height={200}
      className="w-full h-28 rounded-lg object-cover bg-slate-100"
    />

    <div className="flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[product.status]}`} title={product.status} />
      </div>
      <p className="text-xs text-slate-400 font-mono mt-1">{product.sku}</p>
    </div>

    <div className="flex items-center justify-between">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-600'}`}>
        {product.category}
      </span>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-800">${product.price.toFixed(2)}</p>
        <p className="text-xs text-slate-400">{product.stock} in stock</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <span className="text-yellow-400">★</span> {product.rating}
      </div>
      <span className="text-xs text-slate-400">{product.sold} sold</span>
    </div>
  </div>
);

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch ALL 500 products at once — this is intentional for the virtualization demo
    api.get('/products', { params: { limit: 500, page: 1 } }).then(({ data }) => {
      setProducts(data.products);
      setCategories(data.categories);
      setLoading(false);
    });
  }, []);

  // ❌ No useMemo — filtered list recalculates on every render
  const filtered = categoryFilter
    ? products.filter(p => p.category === categoryFilter)
    : products;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} products — <span className="text-red-500 font-medium">all {filtered.length} cards in the DOM at once</span>
          </p>
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Virtualization instruction panel */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-indigo-800 font-semibold text-sm mb-2">
              This page is your virtualization practice target
            </p>
            <p className="text-indigo-700 text-xs mb-3">
              Right now all <strong>{products.length} product cards</strong> are mounted in the DOM simultaneously.
              Open DevTools → Elements and count the <code>.product-card</code> nodes. Then open Performance and record while scrolling.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 mb-1.5">Option A — react-window</p>
                <code className="text-xs text-slate-600 block">npm install react-window</code>
                <p className="text-xs text-slate-500 mt-1">Use <code>FixedSizeList</code> (single column) or <code>FixedSizeGrid</code> (grid). All items must have equal height/width.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 mb-1.5">Option B — @tanstack/react-virtual</p>
                <code className="text-xs text-slate-600 block">npm install @tanstack/react-virtual</code>
                <p className="text-xs text-slate-500 mt-1">Use <code>useVirtualizer()</code> hook. More flexible — supports variable heights and grid layouts.</p>
              </div>
            </div>
            <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-1">What to measure before &amp; after:</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div>📊 <strong>DOM nodes</strong><br />Before: ~4000<br />After: ~120</div>
                <div>🎨 <strong>Paint time</strong><br />Before: slow first render<br />After: fast, lazy</div>
                <div>📜 <strong>Scroll FPS</strong><br />Before: drops below 60fps<br />After: stays at 60fps</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 h-52 animate-pulse">
              <div className="w-full h-28 bg-slate-100 rounded-lg mb-3" />
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ❌ THE PROBLEM: All cards rendered at once — no virtualization */}
          {/* When you implement react-window, this div becomes the outer container */}
          {/* and the grid below becomes a windowed list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 py-4">
            ↑ All {filtered.length} cards above are real DOM nodes right now.
            After virtualization, only ~15 will exist at any time.
          </p>
        </>
      )}
    </div>
  );
};

export default ProductCatalog;
