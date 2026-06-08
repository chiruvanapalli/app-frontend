import { useState } from 'react';

/**
 * LAZY LOADING PRACTICE PAGE
 * ─────────────────────────────────────────────────────────────────
 * Images are served from https://picsum.photos — a free developer CDN
 * that returns real photos. This gives you actual network requests to
 * observe in DevTools, which is what makes lazy loading meaningful.
 *
 * THE PROBLEM:
 *   All 80 images start downloading the moment this page mounts —
 *   even the ones 10 screens below the fold that the user may never see.
 *   Open DevTools → Network → filter "Img" → reload to see all 80 fire at once.
 *
 * THREE LEVELS OF FIX:
 * ─────────────────────────────────────────────────────────────────
 * Level 1 — Native lazy loading (1 line, works in all modern browsers)
 *   Add  loading="lazy"  to each <img>.
 *   The browser skips images below the fold and loads them as you scroll.
 *
 * Level 2 — Prevent layout shift (CLS — Core Web Vital)
 *   Always set width and height (or aspect-ratio in CSS).
 *   Without this, images pop in and push content down — hurts CLS score.
 *
 * Level 3 — IntersectionObserver (custom hook, full control)
 *   Build a <LazyImage> component that:
 *   - Shows a blurred placeholder until the image enters the viewport
 *   - Swaps to the real image only when visible
 *   - Handles load errors gracefully
 *   - Lets you set a custom threshold (how far before it enters viewport)
 *
 * WHAT TO MEASURE:
 *   Network tab → before fix: 80 image requests on load
 *                  after fix:  ~6 image requests on load, rest fire on scroll
 *   Lighthouse   → before fix: poor LCP and CLS scores
 *                  after fix:  improved LCP, CLS close to 0
 * ─────────────────────────────────────────────────────────────────
 */

const CATEGORIES = ['Nature', 'Architecture', 'Technology', 'People', 'Animals', 'Travel', 'Food', 'Abstract'];

// Deterministic photo list — same seed = same photo every time
const photos = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  // picsum.photos/seed/{seed}/{width}/{height} — seed makes it deterministic
  src: `https://picsum.photos/seed/${i + 10}/600/400`,
  thumb: `https://picsum.photos/seed/${i + 10}/300/200`,
  title: `Photo ${String(i + 1).padStart(2, '0')}`,
  category: CATEGORIES[i % CATEGORIES.length],
  photographer: ['Alice M.', 'Bob K.', 'Carol T.', 'David R.', 'Eve S.'][i % 5],
  width: 600,
  height: 400,
}));

// ─────────────────────────────────────────────────────────────────
// GalleryImage — NOT lazy loaded yet
// ❌ ISSUE: no loading="lazy", no width/height for CLS prevention
// ─────────────────────────────────────────────────────────────────
const GalleryImage = ({ photo, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-xl cursor-pointer bg-slate-100 aspect-[3/2]"
      onClick={() => onClick(photo)}
    >
      {/* ─── Skeleton shown while image is loading ─── */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
          Failed to load
        </div>
      ) : (
        /*
         * ❌ LEVEL 1 FIX HERE: Add  loading="lazy"  to this img.
         *
         * ❌ LEVEL 2 FIX HERE: Add  width={photo.width} height={photo.height}
         *    so the browser reserves space before the image loads (prevents CLS).
         *
         * ❌ LEVEL 3 FIX: Replace this whole component with an IntersectionObserver
         *    hook that swaps src from a tiny blurred placeholder to the full image.
         */
        <img
          src={photo.src}
          alt={photo.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
        />
      )}

      {loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-sm font-medium">{photo.title}</p>
            <p className="text-white/70 text-xs">{photo.photographer}</p>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/40 text-white backdrop-blur-sm">
          {photo.category}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────────
const Lightbox = ({ photo, onClose, onPrev, onNext }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
    <button onClick={e => { e.stopPropagation(); onPrev(); }}
      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
      ‹
    </button>
    <div className="max-w-4xl max-h-screen p-4" onClick={e => e.stopPropagation()}>
      <img
        src={photo.src}
        alt={photo.title}
        className="max-h-[80vh] max-w-full rounded-xl object-contain"
      />
      <div className="mt-3 text-center">
        <p className="text-white font-medium">{photo.title}</p>
        <p className="text-white/60 text-sm">{photo.photographer} · {photo.category}</p>
      </div>
    </div>
    <button onClick={e => { e.stopPropagation(); onNext(); }}
      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
      ›
    </button>
    <button onClick={onClose}
      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-sm">
      ✕
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
const ImageGallery = () => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lightbox, setLightbox] = useState(null);

  // ❌ No useMemo — filtered recalculates on every render
  const filtered = categoryFilter
    ? photos.filter(p => p.category === categoryFilter)
    : photos;

  const lightboxIndex = lightbox ? filtered.findIndex(p => p.id === lightbox.id) : -1;

  const goNext = () => {
    const next = filtered[(lightboxIndex + 1) % filtered.length];
    setLightbox(next);
  };
  const goPrev = () => {
    const prev = filtered[(lightboxIndex - 1 + filtered.length) % filtered.length];
    setLightbox(prev);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Image Gallery</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} photos — images served from{' '}
            <span className="font-medium text-indigo-600">picsum.photos CDN</span>
          </p>
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Lazy loading instruction panel */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🖼️</span>
          <div className="flex-1">
            <p className="text-indigo-800 font-semibold text-sm mb-3">
              This page is your lazy loading practice target
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-bold text-green-700 mb-1">Level 1 — 30 seconds</p>
                <p className="text-xs text-slate-600 mb-1.5">Add one HTML attribute:</p>
                <code className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 block text-indigo-700">
                  loading="lazy"
                </code>
                <p className="text-xs text-slate-400 mt-1.5">Native browser support. No library needed.</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-bold text-amber-700 mb-1">Level 2 — 5 minutes</p>
                <p className="text-xs text-slate-600 mb-1.5">Prevent layout shift (CLS):</p>
                <code className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 block text-indigo-700">
                  width=&#123;600&#125; height=&#123;400&#125;
                </code>
                <p className="text-xs text-slate-400 mt-1.5">Browser reserves space before image loads.</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-bold text-red-700 mb-1">Level 3 — 30 minutes</p>
                <p className="text-xs text-slate-600 mb-1.5">Custom IntersectionObserver hook:</p>
                <code className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 block text-indigo-700">
                  useIntersectionObserver()
                </code>
                <p className="text-xs text-slate-400 mt-1.5">Blur-up effect + full control over threshold.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs font-semibold text-slate-700 mb-2">How to measure before &amp; after each level:</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                <div>📡 <strong>Network tab</strong> → filter "Img" → reload → count requests on load</div>
                <div>📐 <strong>Layout shift</strong> → watch content jump as images load (Level 2 fixes this)</div>
                <div>🔦 <strong>Lighthouse</strong> → check LCP (Largest Contentful Paint) and CLS scores</div>
                <div>⚡ <strong>Performance tab</strong> → record scroll → look for long paint tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      {/*
        ❌ All 80 <img> tags are in the DOM and their src attributes are set immediately.
        The browser starts fetching all 80 images before the user has scrolled at all.

        After Level 1 fix (loading="lazy"):
        Only the ~6 images visible in the viewport will load. The rest load on scroll.
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(photo => (
          <GalleryImage
            key={photo.id}
            photo={photo}
            onClick={setLightbox}
          />
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 py-2">
        {filtered.length} images — open Network tab to see how many loaded on page mount vs on scroll
      </p>

      {lightbox && (
        <Lightbox
          photo={lightbox}
          onClose={() => setLightbox(null)}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </div>
  );
};

export default ImageGallery;
