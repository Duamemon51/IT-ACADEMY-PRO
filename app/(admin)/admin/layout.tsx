'use client';
// app/(admin)/admin/layout.tsx
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin');
    if (!stored) { router.push('/admin/signin'); return; }
    setAdmin(JSON.parse(stored));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/me', { method: 'DELETE' });
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    router.push('/admin/signin');
  };

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
    // KEY FIX: overflow-hidden removed from root, modal portal will use document.body
    <div className="min-h-screen bg-[#080810] flex">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
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
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 glass lg:hidden"
          style={{ zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── z-index: 30, BELOW modal portal (9999) */}
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

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar — z-index: 20, BELOW sidebar and modal */}
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-slate-300 text-sm font-medium">{admin.name}</span>
            </div>
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
    </div>
  );
}