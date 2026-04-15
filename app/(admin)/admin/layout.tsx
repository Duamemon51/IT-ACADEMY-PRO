'use client';
// app/(admin)/admin/layout.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Notification {
  id: string;
  type: 'checkin' | 'ticket' | 'absent' | 'report';
  text: string;
  time: string;
  timestamp: string;
  unread: boolean;
  meta?: Record<string, unknown>;
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-500',
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
  },
  {
    href: '/admin/employees',
    label: 'Employees',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-500',
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/10',
  },
  {
    href: '/admin/attendance',
    label: 'Attendance',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-500',
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
  },
  {
    href: '/admin/tickets',
    label: 'Tickets',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-500',
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
  },
  {
    href: '/admin/scan',
    label: 'Scan QR',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 6h.01M3 3h5v5H3V3zm13 0h5v5h-5V3zM3 16h5v5H3v-5z" />
      </svg>
    ),
    gradient: 'from-rose-500 to-pink-500',
    color: 'text-rose-400',
    activeBg: 'bg-rose-500/10',
  },
];

// ─── Notification helpers ─────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'checkin') return (
    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  if (type === 'ticket') return (
    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
  if (type === 'absent') return (
    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  return (
    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const notifStyles: Record<Notification['type'], { bg: string; color: string }> = {
  checkin: { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  ticket:  { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  absent:  { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
  report:  { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
};

// ─── Main layout ──────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // re-fetch notifications every 60 s

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [admin,              setAdmin]              = useState<Admin | null>(null);
  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [dropdownOpen,       setDropdownOpen]       = useState(false);
  const [profileModalOpen,   setProfileModalOpen]   = useState(false);
  const [notificationsOpen,  setNotificationsOpen]  = useState(false);

  // ── Notification state ──
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [notifLoading,   setNotifLoading]   = useState(false);
  const [notifError,     setNotifError]     = useState(false);
  // Track which IDs the user has locally dismissed (marked read)
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('admin');
    if (!stored) { router.push('/admin/signin'); return; }
    setAdmin(JSON.parse(stored));
  }, [router]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setNotifLoading(true);
    setNotifError(false);
    try {
      const res = await fetch('/api/admin/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
      }
    } catch {
      setNotifError(true);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (!admin) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [admin, fetchNotifications]);

  // ── Mark read (local + server stub) ──────────────────────────────────────
  const markAllRead = async () => {
    const ids = notifications.map(n => n.id);
    setReadIds(prev => new Set([...prev, ...ids]));

    const token = localStorage.getItem('admin_token');
    if (token) {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      }).catch(() => {/* silent */});
    }
  };

  const markOneRead = async (id: string) => {
    setReadIds(prev => new Set([...prev, id]));

    const token = localStorage.getItem('admin_token');
    if (token) {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [id] }),
      }).catch(() => {/* silent */});
    }
  };

  // Merge server unread flag with local read state
  const displayedNotifications = notifications.map(n => ({
    ...n,
    unread: n.unread && !readIds.has(n.id),
  }));
  const unreadCount = displayedNotifications.filter(n => n.unread).length;

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/admin/me', { method: 'DELETE' });
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    router.push('/admin/signin');
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (!admin) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.15" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round" className="animate-spin origin-center" style={{ animationDuration: '1.2s' }} />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">AttendanceIQ</p>
            <p className="text-slate-500 text-xs mt-0.5">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = navItems.find(item =>
    pathname === item.href ||
    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .sidebar-item { transition: all 0.18s cubic-bezier(0.4,0,0.2,1); }
        .sidebar-item:hover { transform: translateX(3px); }
        .nav-icon-box { transition: all 0.18s ease; }
        .sidebar-item:hover .nav-icon-box { transform: scale(1.06); }
        .glass { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 3px; }
        .page-enter { animation: fadeIn 0.25s ease both; }
        .sidebar-glow { box-shadow: 1px 0 0 rgba(99,102,241,0.08), inset -1px 0 0 rgba(255,255,255,0.02); }
        .dropdown-enter { animation: slideInDown 0.18s cubic-bezier(0.4,0,0.2,1) both; }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.4,0,0.2,1) both; }
        .notif-item-hover:hover { background: rgba(255,255,255,0.03); }
        .notif-spinner { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 glass lg:hidden"
          style={{ zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[230px] flex flex-col flex-shrink-0 transition-transform duration-300 ease-out sidebar-glow
          lg:sticky lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          zIndex: 30,
          background: 'linear-gradient(180deg, #0c0c1d 0%, #090912 100%)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0c0c1d] shadow-sm shadow-emerald-500/40" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px] tracking-tight">AttendanceIQ</p>
              <p className="text-[9px] text-indigo-400/60 font-semibold tracking-[0.12em] uppercase mt-0.5">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.15em] px-3 pt-2 pb-2.5">Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium relative group ${isActive ? item.activeBg : 'hover:bg-white/[0.035]'}`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b ${item.gradient} shadow-sm`} />
                )}
                <div className={`nav-icon-box w-[28px] h-[28px] rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? `bg-gradient-to-br ${item.gradient} shadow-md`
                    : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
                }`}>
                  <span className={isActive ? 'text-white' : item.color} style={{ display: 'flex' }}>
                    {item.icon}
                  </span>
                </div>
                <span className={isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'}>
                  {item.label}
                </span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.gradient}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin card + logout */}
        <div className="p-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white text-xs font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="absolute -bottom-px -right-px w-2 h-2 bg-emerald-400 rounded-full border border-[#0c0c1d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
              <p className="text-slate-500 text-[10px] capitalize">{admin.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400/70 hover:text-red-300 hover:bg-red-500/8 transition-all group"
          >
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar */}
        <header
          className="glass sticky top-0 flex-shrink-0 flex items-center gap-4 px-5 lg:px-6 py-3.5"
          style={{
            background: 'rgba(8,8,16,0.9)',
            borderBottom: '1px solid rgba(99,102,241,0.07)',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-slate-600 font-medium">Admin</span>
            <svg className="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {currentNav && (
              <div className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${currentNav.gradient} flex items-center justify-center`} style={{ padding: 2 }}>
                  <span className="text-white" style={{ transform: 'scale(0.7)', display: 'flex' }}>{currentNav.icon}</span>
                </div>
                <span className="text-slate-300 font-semibold">{currentNav.label}</span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            {/* Live badge */}
            <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>

            {/* ─── NOTIFICATION BELL ──────────────────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotificationsOpen(prev => !prev);
                  setDropdownOpen(false);
                  // Refresh when opening
                  if (!notificationsOpen) fetchNotifications();
                }}
                className="relative flex items-center justify-center w-[34px] h-[34px] rounded-[10px] transition-all hover:bg-white/[0.07]"
                style={{
                  background: notificationsOpen ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: notificationsOpen ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.1)',
                }}
              >
                {notifLoading ? (
                  /* Spinner while loading */
                  <svg className="w-[16px] h-[16px] text-indigo-400 notif-spinner" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-[16px] h-[16px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )}
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[3px] flex items-center justify-center rounded-full text-white font-bold"
                    style={{ fontSize: '9px', background: '#6366f1', border: '2px solid #080810' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div
                  className="dropdown-enter absolute right-0 top-[calc(100%+8px)] w-[300px] rounded-[14px] overflow-hidden"
                  style={{
                    background: '#0f0f1f',
                    border: '1px solid rgba(99,102,241,0.18)',
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Refresh button */}
                      <button
                        onClick={fetchNotifications}
                        title="Refresh"
                        className="flex items-center justify-center w-5 h-5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <svg className={`w-3.5 h-3.5 ${notifLoading ? 'notif-spinner' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] font-semibold transition-colors"
                          style={{ color: '#6366f1' }}
                          onMouseOver={e => (e.currentTarget.style.color = '#818cf8')}
                          onMouseOut={e => (e.currentTarget.style.color = '#6366f1')}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: '264px' }}>
                    {/* Error state */}
                    {notifError && (
                      <div className="py-6 flex flex-col items-center gap-2">
                        <svg className="w-7 h-7 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-slate-600 text-xs">Failed to load notifications</p>
                        <button
                          onClick={fetchNotifications}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {/* Loading skeleton */}
                    {notifLoading && !notifError && displayedNotifications.length === 0 && (
                      <div className="p-3 space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-start gap-2.5 px-0.5 py-1 animate-pulse">
                            <div className="w-[30px] h-[30px] rounded-[8px] flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }} />
                            <div className="flex-1 space-y-1.5 pt-1">
                              <div className="h-2.5 rounded-full w-4/5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                              <div className="h-2 rounded-full w-1/3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state */}
                    {!notifLoading && !notifError && displayedNotifications.length === 0 && (
                      <div className="py-8 flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-slate-600 text-xs">No notifications today</p>
                      </div>
                    )}

                    {/* Notification list */}
                    {!notifError && displayedNotifications.map((notif) => {
                      const style = notifStyles[notif.type];
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markOneRead(notif.id)}
                          className="notif-item-hover flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors"
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: notif.unread ? 'rgba(99,102,241,0.04)' : 'transparent',
                          }}
                        >
                          {/* Icon */}
                          <div
                            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: style.bg, color: style.color }}
                          >
                            <NotificationIcon type={notif.type} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 text-[11.5px] leading-snug">{notif.text}</p>
                            <p className="text-slate-600 text-[10px] mt-0.5">{notif.time}</p>
                          </div>

                          {/* Unread dot */}
                          {notif.unread && (
                            <span className="w-[6px] h-[6px] rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="p-2" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full py-2 rounded-[10px] text-[11px] font-semibold transition-all"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.18)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* ─── END NOTIFICATION BELL ──────────────────────────────────── */}

            {/* ─── PROFILE DROPDOWN ───────────────────────────────────────── */}
            <div className="hidden sm:flex items-center relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/[0.06]"
                style={{ border: dropdownOpen ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-slate-300 text-sm font-medium">{admin.name}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="dropdown-enter absolute right-0 top-[calc(100%+8px)] w-52 rounded-xl overflow-hidden"
                  style={{
                    background: '#0f0f1f',
                    border: '1px solid rgba(99,102,241,0.18)',
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
                  }}
                >
                  <div className="px-3.5 py-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
                        <p className="text-indigo-400/70 text-[10px] capitalize">{admin.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setDropdownOpen(false); setProfileModalOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-all text-left"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>

                    <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', margin: '4px 0' }} />

                    <button
                      onClick={() => { setDropdownOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400/80 text-xs font-medium hover:bg-red-500/8 hover:text-red-300 transition-all text-left"
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* ─── END PROFILE DROPDOWN ───────────────────────────────────── */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(99,102,241,0.06)' }}>
          <p className="text-slate-700 text-[11px] font-medium">AttendanceIQ</p>
          <p className="text-slate-700 text-[11px]">© {new Date().getFullYear()}</p>
        </footer>
      </div>

      {/* ─── PROFILE MODAL ──────────────────────────────────────────────────── */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center glass"
          style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="modal-enter w-80 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0f0f20 0%, #0a0a16 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="relative text-center px-6 pt-8 pb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 100%)',
                borderBottom: '1px solid rgba(99,102,241,0.1)',
              }}
            >
              <button
                onClick={() => setProfileModalOpen(false)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative inline-flex mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <span className="text-white text-2xl font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f0f20] shadow-sm shadow-emerald-500/50" />
              </div>

              <h3 className="text-white font-bold text-base tracking-tight">{admin.name}</h3>
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <span className="text-indigo-300 text-[11px] font-semibold capitalize">{admin.role}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-2">
              {[
                {
                  label: 'Email', value: admin.email,
                  icon: (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
                },
                {
                  label: 'Role', value: admin.role, pill: true,
                  icon: (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>),
                },
                {
                  label: 'Admin ID', value: `#${admin.id?.slice(0, 8).toUpperCase()}`, mono: true,
                  icon: (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>),
                },
                {
                  label: 'Status', value: 'Active', status: true,
                  icon: (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-slate-600">{row.icon}</span>
                    <span className="text-xs">{row.label}</span>
                  </div>
                  {row.pill ? (
                    <span className="text-indigo-300 text-[11px] font-semibold capitalize px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.15)' }}>
                      {row.value}
                    </span>
                  ) : row.status ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {row.value}
                    </span>
                  ) : (
                    <span className={`text-slate-300 text-xs font-medium ${row.mono ? 'font-mono text-[11px] text-slate-400' : ''}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}

              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}