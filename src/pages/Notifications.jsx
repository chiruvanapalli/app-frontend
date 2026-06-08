import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. Memory leak     — setInterval is never cleared on unmount (open DevTools Memory tab)
 * 2. React.memo      — NotificationItem re-renders ALL items when a new one arrives
 * 3. useCallback     — handleMarkRead is a new function ref on every render
 * 4. useDeferredValue — marking read updates block the UI during list re-render
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1 (memory leak):
 *   - Navigate to this page
 *   - Navigate AWAY to another page
 *   - Check the console — you'll still see "Polling notifications..." every 3s
 *     because the interval was never cleared. This is a memory leak.
 *
 * HOW TO SEE #2: Watch the console — NotificationItem logs fire for ALL
 * items every time a new notification arrives.
 */

const TYPE_STYLES = {
  info: { bg: 'bg-blue-50 border-blue-100', icon: 'text-blue-500', dot: 'bg-blue-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-100', icon: 'text-yellow-500', dot: 'bg-yellow-500' },
  success: { bg: 'bg-green-50 border-green-100', icon: 'text-green-500', dot: 'bg-green-500' },
  error: { bg: 'bg-red-50 border-red-100', icon: 'text-red-500', dot: 'bg-red-500' },
};

// ❌ PERF ISSUE 2: Not memoized — re-renders ALL items when any new notification arrives
const NotificationItem = ({ notification, onMarkRead }) => {
  console.log('NotificationItem render:', notification.id); // fires for ALL items on each poll
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition ${style.bg} ${!notification.read ? 'opacity-100' : 'opacity-60'}`}>
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notification.read ? 'bg-slate-300' : style.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{notification.title}</p>
          <span className="text-xs text-slate-400 shrink-0">{new Date(notification.createdAt).toLocaleTimeString()}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
      </div>
      {!notification.read && (
        // ❌ PERF ISSUE 3: Anonymous function — new ref every render
        <button onClick={() => onMarkRead(notification.id)}
          className="text-xs text-slate-400 hover:text-indigo-600 shrink-0 transition">
          Mark read
        </button>
      )}
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadNotifications = () => {
    api.get('/notifications', { params: { limit: 50 } }).then(({ data }) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadNotifications();

    // ❌ PERF ISSUE 1: MEMORY LEAK — interval is never cleared on unmount
    // Fix: return () => clearInterval(interval) from useEffect
    setInterval(() => {
      console.log('Polling notifications... (interval not cleared — memory leak!)');
      api.post('/notifications/simulate').then(() => loadNotifications());
    }, 4000);

    // Correct fix would be:
    // const interval = setInterval(...);
    // return () => clearInterval(interval);
  }, []);

  // ❌ PERF ISSUE 4: No useDeferredValue — marking read triggers immediate re-render of all items
  const handleMarkRead = (id) => {
    api.put(`/notifications/${id}/read`).then(loadNotifications);
  };

  const handleMarkAllRead = () => {
    api.put('/notifications/read-all').then(loadNotifications);
  };

  // ❌ No useMemo — filters the list on every render
  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount} unread · auto-polling every 4s
          </p>
        </div>
        <button onClick={handleMarkAllRead}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Mark all read
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>Memory leak</strong> — <code>setInterval</code> in <code>useEffect</code> is never cleaned up. Navigate away then check the console — polling still fires. Fix: <code>return () =&gt; clearInterval(id)</code>.</li>
          <li><strong>React.memo</strong> — <code>NotificationItem</code> is not memoized. When a new notification arrives, ALL existing items re-render. Check the console.</li>
          <li><strong>useCallback</strong> — <code>handleMarkRead</code> is a new function reference each render, defeating React.memo on the items.</li>
          <li><strong>useDeferredValue</strong> — wrapping <code>filtered</code> in <code>useDeferredValue</code> lets the UI stay responsive while the list updates.</li>
        </ol>
      </div>

      <div className="flex gap-2">
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">No notifications</div>
      ) : (
        <div className="space-y-2">
          {/* ❌ PERF ISSUE 2: All items re-render when new notification arrives */}
          {filtered.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead} // ❌ new ref every render — defeats memo
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
