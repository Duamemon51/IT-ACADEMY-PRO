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
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-500',
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('admin');
    if (!stored) {
      router.push('/admin/signin');
      return;
    }
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.2" />
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
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        .sidebar-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar-item:hover { transform: translateX(2px); }
        .active-indicator { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-icon-wrap { transition: all 0.2s ease; }
        .sidebar-item:hover .nav-icon-wrap { transform: scale(1.08); }
        .glass { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 2px; }
        .page-enter { animation: slideInRight 0.3s ease both; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 glass z-20 lg:hidden animate-[fadeIn_0.2s_ease]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-30 flex flex-col flex-shrink-0 transition-transform duration-300 ease-out
          lg:sticky lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a15 100%)', borderRight: '1px solid rgba(99,102,241,0.08)' }}
      >
        {/* Logo */}
        <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0d0d1a]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-tight">AttendanceIQ</p>
              <p className="text-[10px] text-indigo-400/70 font-medium tracking-wider uppercase">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.12em] px-3 pt-3 pb-2">Main Menu</p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href) && item.href !== '/admin/employees/new');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative group ${isActive ? item.activeBg : 'hover:bg-white/4'}`}
                style={isActive ? {} : {}}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b ${item.gradient}`} />
                )}
                <div className={`nav-icon-wrap w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? `bg-gradient-to-br ${item.gradient} shadow-sm` : 'bg-white/5 group-hover:bg-white/8'}`}>
                  <span className={isActive ? 'text-white' : item.color} style={{ display: 'flex' }}>
                    {item.icon}
                  </span>
                </div>
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>{item.label}</span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.gradient}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin card */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/3 mb-2">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-[#0d0d1a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
              <p className="text-slate-500 text-[10px] capitalize">{admin.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400/80 hover:text-red-300 hover:bg-red-500/8 transition-all group"
          >
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar */}
        <header className="glass sticky top-0 z-10 flex-shrink-0 flex items-center gap-4 px-4 lg:px-6 py-3.5" style={{ background: 'rgba(10,10,15,0.85)', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
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
            <span className="text-slate-600">Admin</span>
            <svg className="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {currentNav && (
              <div className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded bg-gradient-to-br ${currentNav.gradient} flex items-center justify-center`} style={{ padding: 2 }}>
                  <span className="text-white" style={{ transform: 'scale(0.75)', display: 'flex' }}>{currentNav.icon}</span>
                </div>
                <span className="text-slate-300 font-medium">{currentNav.label}</span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-green-500/8 border border-green-500/15 text-green-400 text-[11px] px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{admin.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-slate-300 text-sm font-medium">{admin.name}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(99,102,241,0.07)' }}>
          <p className="text-slate-700 text-[11px]">AttendanceIQ</p>
          <p className="text-slate-700 text-[11px]">© {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}