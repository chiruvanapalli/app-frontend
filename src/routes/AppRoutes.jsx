import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, setInitialized, selectIsInitialized, selectToken, selectIsAuthenticated } from '../store/slices/authSlice';

// RBAC pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Roles from '../pages/Roles';
import Permissions from '../pages/Permissions';
import Unauthorized from '../pages/Unauthorized';

// Practice pages (all loaded eagerly — perf issue #4: fix with React.lazy)
// ❌ PERF ISSUE: These pages are bundled and loaded even when user never visits them.
// Fix: replace each import with React.lazy(() => import('../pages/Products')) etc.
// Then wrap <Routes> in <Suspense fallback={<Spinner />}>
import Products from '../pages/Products';
import ProductCatalog from '../pages/ProductCatalog';
import ImageGallery from '../pages/ImageGallery';
import Orders from '../pages/Orders';
import Employees from '../pages/Employees';
import Analytics from '../pages/Analytics';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';

import ProtectedRoute from '../auth/ProtectedRoute';
import Sidebar from '../components/Sidebar';

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 p-6 overflow-y-auto">{children}</main>
  </div>
);

const AppInit = ({ children }) => {
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectIsInitialized);
  const token = useSelector(selectToken);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    } else {
      dispatch(setInitialized());
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <BrowserRouter>
    <AppInit>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

        {/* ── RBAC Pages ── */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute permission="users:read"><Layout><Users /></Layout></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute permission="roles:read"><Layout><Roles /></Layout></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute permission="permissions:read"><Layout><Permissions /></Layout></ProtectedRoute>} />

        {/* ── Practice Pages (no permission check — visible to all logged-in users) ── */}
        <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
        <Route path="/product-catalog" element={<ProtectedRoute><Layout><ProductCatalog /></Layout></ProtectedRoute>} />
        <Route path="/image-gallery" element={<ProtectedRoute><Layout><ImageGallery /></Layout></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Layout><Employees /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppInit>
  </BrowserRouter>
);

export default AppRoutes;
