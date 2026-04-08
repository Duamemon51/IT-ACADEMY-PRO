'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeProvider, useTheme } from './ThemeContext';

interface Employee {
  _id: string; employeeId: string; name: string;
  email: string; department?: string; designation?: string;
}

const NAV_ITEMS = [
  {
    href: '/dashboard', label: 'Terminal', color: '#818cf8',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 17.5h7M17.5 14v7" /></svg>),
  },
  {
    href: '/scan', label: 'Access QR', color: '#34d399',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h5v5H3zM16 3h5v5h-5zM3 16h5v5H3z" /><path d="M16 16h2v2h-2zM20 16h1v1h-1zM16 20h1v1h-1zM19 19h2v2h-2z" /><path d="M8 8h1v1H8zM15 8h1v1h-1zM8 15h1v1H8z" /></svg>),
  },
  {
    href: '/attendance', label: 'Registry', color: '#f472b6',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>),
  },
  {
    href: '/tickets', label: 'Relay', color: '#fb923c',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>),
  },
];

function LayoutInner({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isDark: d, toggle: toggleTheme } = useTheme();

  const [employee, setEmployee]       = useState<Employee | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime]               = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('employee');
    if (!stored) { router.push('/signin'); return; }
    setEmployee(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!employee) return null;

  const initials   = employee.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const activeItem = NAV_ITEMS.find(i => i.href === pathname);
  const pageLabel  = activeItem?.label ?? pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? 'Overview';

  return (
    <div style={{ fontFamily: "'Geist','DM Sans',system-ui,sans-serif" }}
      className={`min-h-screen overflow-hidden selection:bg-indigo-400/30 transition-colors duration-500 ${d ? 'bg-[#05060a] text-slate-200' : 'bg-[#eef0f8] text-slate-800'}`}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Primary orbs */}
        <div className={`absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[160px] transition-colors duration-700 ${d ? 'bg-indigo-600/[0.09]' : 'bg-indigo-400/25'}`}
          style={{ animation: 'drift1 22s ease-in-out infinite alternate' }} />
        <div className={`absolute -bottom-[20%] -right-[10%] w-[65%] h-[65%] rounded-full blur-[160px] transition-colors duration-700 ${d ? 'bg-violet-700/[0.08]' : 'bg-violet-300/30'}`}
          style={{ animation: 'drift2 28s ease-in-out infinite alternate' }} />
        <div className={`absolute top-[40%] left-[35%] w-[45%] h-[45%] rounded-full blur-[200px] transition-colors duration-700 ${d ? 'bg-fuchsia-700/[0.05]' : 'bg-fuchsia-200/25'}`}
          style={{ animation: 'drift1 20s ease-in-out infinite alternate-reverse' }} />
        {/* Noise grain overlay */}
        {d && (
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
        )}
        {/* Subtle grid */}
        {d && <div className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(99,102,241,0.3) 40px,rgba(99,102,241,0.3) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(99,102,241,0.3) 40px,rgba(99,102,241,0.3) 41px)' }} />}
      </div>

      <div className="relative z-10 flex h-screen gap-0 lg:gap-3 p-0 lg:p-3">

        {/* ══ SIDEBAR ══ */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col lg:relative lg:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${d ? 'bg-[#0a0b10]/95 border-r border-white/[0.07]' : 'bg-white/95 border-r border-slate-200/90'}
          backdrop-blur-2xl lg:rounded-2xl lg:border`}>

          {/* Rainbow top bar */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] rounded-t-2xl overflow-hidden">
            <div className="h-full w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#f97316)' }} />
          </div>

          <div className="flex flex-col h-full pt-7 pb-5 px-4">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-8 px-1">
              <div className="relative w-9 h-9 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#0f1018]"
                  style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 0 24px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] font-black text-white italic tracking-tight">IT</span>
                </div>
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${d ? 'border-[#0a0b10]' : 'border-white'}`}
                  style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }} />
              </div>
              <div>
                <p className={`text-[12px] font-black tracking-tight ${d ? 'text-white' : 'text-slate-900'}`}>ACADEMY PRO</p>
                <p className="text-[8px] tracking-[0.4em] font-semibold text-indigo-400 uppercase mt-0.5">Employee Portal</p>
              </div>
            </div>

            {/* Clock */}
            <div className={`flex items-center justify-between mb-5 px-3 py-2 rounded-xl text-[10px] font-mono transition-colors
              ${d ? 'bg-white/[0.04] border border-white/[0.07]' : 'bg-slate-100 border border-slate-200/80'}`}>
              <span className={d ? 'text-slate-600' : 'text-slate-400'}>SYS·TIME</span>
              <span className={`font-bold tabular-nums ${d ? 'text-indigo-300' : 'text-indigo-600'}`}>{time}</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200 group overflow-hidden
                      ${active
                        ? (d ? 'text-white' : 'text-indigo-700')
                        : (d ? 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80')}`}>
                    {active && (
                      <span className="absolute inset-0 rounded-xl"
                        style={{ background: d ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)` : `linear-gradient(135deg, ${item.color}15, ${item.color}06)`, border: `1px solid ${item.color}22` }} />
                    )}
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: item.color, boxShadow: `0 0 12px ${item.color}` }} />}
                    <span className="w-[17px] h-[17px] flex-shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-110"
                      style={{ color: active ? item.color : 'currentColor' }}>{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 relative z-10"
                      style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />}
                  </Link>
                );
              })}
            </nav>

            {/* Divider */}
            <div className={`my-4 h-px ${d ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

            {/* Profile */}
            <div className={`rounded-xl p-3.5 border transition-colors ${d ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-semibold truncate ${d ? 'text-white' : 'text-slate-900'}`}>{employee.name}</p>
                  <p className="text-[9px] font-mono text-indigo-400">{employee.employeeId}</p>
                </div>
                <span className="flex-shrink-0 text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>●</span>
              </div>
              <button onClick={() => { localStorage.clear(); router.push('/signin'); }}
                className={`w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95
                  ${d ? 'bg-rose-500/[0.09] text-rose-400 border border-rose-500/20 hover:bg-rose-500/18' : 'bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100'}`}>
                ⏏ Eject Session
              </button>
            </div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors duration-500
          ${d ? 'bg-[#080910]/75 border border-white/[0.07]' : 'bg-white/85 border border-white/80'}
          backdrop-blur-xl lg:rounded-2xl`}>

          {/* Header */}
          <header className={`flex-shrink-0 flex items-center justify-between px-5 lg:px-8 h-[58px] border-b transition-colors
            ${d ? 'border-white/[0.07] bg-[#06070c]/50' : 'border-slate-100/90 bg-white/50'}`}>
            <div className="flex items-center gap-3.5">
              <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-1.5 rounded-xl ${d ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="flex items-center gap-2">
                {activeItem && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: activeItem.color, boxShadow: `0 0 10px ${activeItem.color}, 0 0 4px ${activeItem.color}` }} />
                )}
                <div>
                  <p className={`text-[8px] font-bold uppercase tracking-[0.35em] ${d ? 'text-slate-600' : 'text-slate-400'}`}>Active Module</p>
                  <p className={`text-[14px] font-black tracking-tight leading-tight capitalize ${d ? 'text-white' : 'text-slate-900'}`}>{pageLabel}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <button className={`relative p-1.5 rounded-xl transition-all hover:scale-105 ${d ? 'hover:bg-white/[0.07] text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400"
                  style={{ boxShadow: '0 0 6px rgba(248,113,113,0.8)' }} />
              </button>

              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all border hover:scale-105
                  ${d ? 'bg-white/[0.05] border-white/[0.09] text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                {d ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 010 1.415l-.707.707a1 1 0 11-1.414-1.415l.707-.707a1 1 0 011.414 0zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-2.22 4.22a1 1 0 01-1.415 0l-.707-.707a1 1 0 111.415-1.414l.707.707a1 1 0 010 1.414zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.22-1.78a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.415l-.707.707a1 1 0 01-1.414 0zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm2.22-4.22a1 1 0 011.414 0l.707.707A1 1 0 114.928 7.9l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                )}
                {d ? 'Light' : 'Dark'}
              </button>

              {/* Avatar chip */}
              <div className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border transition-colors
                ${d ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>{initials}</div>
                <span className={`text-[10px] font-semibold hidden sm:block ${d ? 'text-slate-300' : 'text-slate-600'}`}>{employee.name.split(' ')[0]}</span>
              </div>
            </div>
          </header>

          {/* Colored accent line under header */}
          <div className="h-[1px] flex-shrink-0"
            style={{ background: activeItem ? `linear-gradient(90deg,${activeItem.color}60 0%,${activeItem.color}20 40%,transparent 70%)` : 'transparent' }} />

          {/* Page content — WIDER max-w */}
          <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-7"
            style={{ scrollbarWidth: 'thin', scrollbarColor: d ? 'rgba(99,102,241,0.2) transparent' : 'rgba(99,102,241,0.15) transparent' }}>
            <div className="max-w-[1400px] mx-auto">{children}</div>
          </div>

          {/* Footer */}
          <footer className={`flex-shrink-0 flex items-center justify-between px-5 lg:px-8 h-9 border-t transition-colors
            ${d ? 'border-white/[0.05] bg-[#06070c]/40' : 'border-slate-100 bg-white/40'}`}>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full" style={{ background: '#6366f1', boxShadow: '0 0 5px #6366f1' }} />
              <span className={`text-[8px] font-mono font-semibold tracking-[0.4em] uppercase ${d ? 'text-slate-700' : 'text-slate-400'}`}>IT Academy Pro</span>
            </div>
            <span className={`text-[8px] font-mono tracking-widest ${d ? 'text-slate-700' : 'text-slate-400'}`}>{employee.department ?? 'All Systems Nominal'}</span>
          </footer>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-40 lg:hidden bg-black/75 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;0,9..40,800;0,9..40,900;1,9..40,800&display=swap');
        @keyframes drift1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-70px) scale(1.1)} 100%{transform:translate(-40px,35px) scale(0.94)} }
        @keyframes drift2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,50px) scale(1.12)} 100%{transform:translate(35px,-25px) scale(0.91)} }
      `}</style>
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><LayoutInner>{children}</LayoutInner></ThemeProvider>;
}