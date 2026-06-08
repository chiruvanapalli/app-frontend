import { useState } from 'react';

/**
 * TECHNIQUES TO PRACTICE ON THIS PAGE
 * ─────────────────────────────────────────────────────────────────
 * 1. useReducer      — 9 separate useState calls, each triggers its own re-render
 * 2. React.memo      — SettingField re-renders ALL fields when any single one changes
 * 3. useCallback     — onChange handlers are new functions on every render
 * 4. Code splitting  — this whole page loads even when the user is on /dashboard
 *                      (fix in AppRoutes.jsx with React.lazy)
 * ─────────────────────────────────────────────────────────────────
 * HOW TO SEE #1: Type in any field and watch the console.
 * ALL SettingField components log "render" even though only one field changed.
 *
 * HOW TO SEE #4: Open DevTools → Network → check that Settings.jsx is loaded
 * even when you never visit /settings. Fix: React.lazy in AppRoutes.
 */

// ❌ PERF ISSUE 2: Not memoized — re-renders when ANY field in the parent changes
const SettingField = ({ label, description, children }) => {
  console.log('SettingField render:', label); // fires for all 9 fields on every keystroke
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-5 border-b border-slate-100 last:border-0">
      <div className="sm:w-64 shrink-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

const Settings = () => {
  // ❌ PERF ISSUE 1: 9 separate useState calls — each triggers its own render cycle
  // Fix: replace all with a single useReducer({ companyName, email, ... })
  const [companyName, setCompanyName] = useState('RBAC Corp');
  const [supportEmail, setSupportEmail] = useState('support@rbac.dev');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Simulated save
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Application configuration</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">Performance issues to fix on this page:</p>
        <ol className="text-amber-700 text-xs space-y-1 list-decimal list-inside">
          <li><strong>useReducer</strong> — there are 9 separate <code>useState</code> calls. Each field change triggers its own re-render cycle. Combine into one <code>useReducer</code> or <code>useState(&#123; ...allFields &#125;)</code>.</li>
          <li><strong>React.memo</strong> — <code>SettingField</code> is not memoized. When you type in one field, ALL 9 field wrappers re-render. Check the console.</li>
          <li><strong>useCallback</strong> — every <code>onChange</code> handler is an anonymous function created fresh each render, defeating React.memo.</li>
          <li><strong>Code splitting</strong> — this page is included in the main bundle even if the user never visits it. Fix: use <code>React.lazy</code> in <code>AppRoutes.jsx</code>.</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">General</h2>
        </div>
        <div className="px-6">
          {/* ❌ PERF ISSUE 2: SettingField not memoized — all re-render on every keystroke */}
          <SettingField label="Company Name" description="Displayed in the app header and emails">
            {/* ❌ PERF ISSUE 3: Anonymous onChange — new function reference every render */}
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </SettingField>

          <SettingField label="Support Email" description="Where users send help requests">
            <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </SettingField>

          <SettingField label="Timezone" description="Used for timestamps and scheduled tasks">
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Language" description="Interface language">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {[['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German']].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </SettingField>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Security</h2>
        </div>
        <div className="px-6">
          <SettingField label="Session Timeout" description="Minutes of inactivity before logout">
            <div className="flex items-center gap-2">
              <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                min="5" max="480"
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          </SettingField>

          <SettingField label="Max Login Attempts" description="Lock account after N failed attempts">
            <input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(e.target.value)}
              min="1" max="20"
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </SettingField>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Features</h2>
        </div>
        <div className="px-6">
          <SettingField label="Email Notifications" description="Send emails on important events">
            <button onClick={() => setEmailNotifications(v => !v)}
              className={`relative w-10 h-6 rounded-full transition ${emailNotifications ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${emailNotifications ? 'left-5' : 'left-1'}`} />
            </button>
          </SettingField>

          <SettingField label="Audit Logging" description="Log all user actions to the audit trail">
            <button onClick={() => setAuditLogging(v => !v)}
              className={`relative w-10 h-6 rounded-full transition ${auditLogging ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${auditLogging ? 'left-5' : 'left-1'}`} />
            </button>
          </SettingField>

          <SettingField label="Maintenance Mode" description="Disable login for non-admin users">
            <button onClick={() => setMaintenanceMode(v => !v)}
              className={`relative w-10 h-6 rounded-full transition ${maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${maintenanceMode ? 'left-5' : 'left-1'}`} />
            </button>
            {maintenanceMode && (
              <p className="text-xs text-red-500 mt-1">Warning: non-admins will be locked out</p>
            )}
          </SettingField>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition ${saved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
