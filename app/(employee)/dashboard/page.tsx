'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '../ThemeContext';

interface AttendanceSummary {
  totalDays: number; presentDays: number; absentDays: number; lateDays: number;
  thisMonthPresent: number; thisMonthTotal: number; attendanceRate: number;
}
interface RecentRecord {
  _id: string; date: string; checkIn?: string; checkOut?: string; status: string;
}

const STATUS_MAP: Record<string, { color: string; bg: string; border: string; dot: string; glow: string }> = {
  present:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: 'rgba(52,211,153,0.5)' },
  late:       { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   dot: 'bg-amber-400',   glow: 'rgba(251,191,36,0.5)' },
  absent:     { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    dot: 'bg-rose-400',    glow: 'rgba(244,63,94,0.5)' },
  'half-day': { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  dot: 'bg-orange-400',  glow: 'rgba(251,146,60,0.5)' },
  off:        { color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-400/25',   dot: 'bg-slate-400',   glow: 'rgba(100,116,139,0.4)' },
};

function formatPKTime(ds?: string) {
  if (!ds) return '—';
  return new Date(ds).toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
}

export default function EmployeeDashboard() {
  const { isDark: d } = useTheme();
  const [summary, setSummary]   = useState<AttendanceSummary | null>(null);
  const [recent, setRecent]     = useState<RecentRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [employee, setEmployee] = useState<{ name: string; employeeId: string; department?: string; designation?: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employee_token');
      const emp   = localStorage.getItem('employee');
      if (emp) setEmployee(JSON.parse(emp));
      const res  = await fetch('/api/employee/attendance?summary=true&recent=5', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setSummary(data.data.summary); setRecent(data.data.recent || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetIcon = hour < 12 ? '🌤' : hour < 17 ? '☀️' : '🌙';
  const today     = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const rate  = summary?.attendanceRate ?? 0;
  const circ  = 2 * Math.PI * 38;
  const dash  = (rate / 100) * circ;

  // Theme tokens
  const card  = d ? 'bg-[#0c0d14]/80 border-white/[0.08]'  : 'bg-white/90 border-slate-200/80';
  const cardHover = d ? 'hover:border-white/[0.14] hover:bg-[#0e0f18]/90' : 'hover:border-slate-300 hover:shadow-md';
  const tp    = d ? 'text-white'      : 'text-slate-900';
  const ts    = d ? 'text-slate-500'  : 'text-slate-500';
  const tt    = d ? 'text-slate-600'  : 'text-slate-400';
  const div   = d ? 'border-white/[0.06]' : 'border-slate-100';
  const hover = d ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/80';
  const track = d ? 'bg-white/[0.06]' : 'bg-slate-100';

  const statCards = [
    { label: 'This Month',  value: summary?.thisMonthPresent ?? 0, sub: `of ${summary?.thisMonthTotal ?? 0} days`, accent: '#818cf8', glow: 'rgba(129,140,248,0.35)',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { label: 'Late Days',   value: summary?.lateDays ?? 0,         sub: 'This month',  accent: '#fbbf24', glow: 'rgba(251,191,36,0.35)',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Absent Days', value: summary?.absentDays ?? 0,       sub: 'This month',  accent: '#f87171', glow: 'rgba(248,113,113,0.35)',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-7 transition-all duration-500
        ${d ? 'border-indigo-500/20 bg-gradient-to-br from-indigo-900/30 via-violet-900/20 to-[#0c0d14]/80' : 'border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-white/80'}`}
        style={{ boxShadow: d ? '0 0 60px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 4px 30px rgba(99,102,241,0.08)' }}>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `radial-gradient(circle, ${d ? '#818cf8' : '#6366f1'} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
        {/* Glow blob */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #818cf8, #a855f7, transparent)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{greetIcon}</span>
              <p className={`text-[10px] font-bold tracking-[0.4em] uppercase ${d ? 'text-indigo-400' : 'text-indigo-500'}`}>{today}</p>
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${tp}`}>
              {greeting},{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg,#818cf8,#c084fc,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {employee?.name?.split(' ')[0] ?? '—'}
              </span>
            </h1>
            {employee?.designation && (
              <p className={`text-sm mt-2 flex items-center gap-2 ${ts}`}>
                <span className="w-1 h-1 rounded-full bg-indigo-400 inline-block" />
                {employee.designation}
                <span className={`${d ? 'text-slate-700' : 'text-slate-300'}`}>·</span>
                {employee.department}
              </p>
            )}
          </div>
          <Link href="/scan"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 30px rgba(79,70,229,0.45), 0 2px 8px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 6h.01M3 3h5v5H3V3zm13 0h5v5h-5V3zM3 16h5v5H3v-5z" /></svg>
            Mark Attendance
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-28 gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <span className={`text-sm font-medium ${ts}`}>Loading data…</span>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Attendance rate donut */}
            <div className={`relative overflow-hidden rounded-2xl border p-5 flex items-center gap-5 transition-all duration-300 ${card} ${cardHover}`}
              style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)' }} />
              <div className="relative w-[90px] h-[90px] flex-shrink-0">
                <svg viewBox="0 0 92 92" className="absolute inset-0 -rotate-90">
                  <circle cx="46" cy="46" r="38" fill="none" stroke={d ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.1)'} strokeWidth="7" />
                  <circle cx="46" cy="46" r="38" fill="none" stroke="url(#rg)" strokeWidth="7"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[15px] font-black ${tp}`}>{rate}%</span>
                </div>
              </div>
              <div>
                <p className={`text-[9px] font-bold tracking-[0.35em] uppercase ${ts}`}>Attendance</p>
                <p className={`text-[28px] font-black leading-none mt-1 ${tp}`}>{rate}<span className={`text-sm font-normal ${ts}`}>%</span></p>
                <p className={`text-[10px] mt-1 ${ts}`}>Overall rate</p>
              </div>
            </div>

            {/* Stat cards */}
            {statCards.map(s => (
              <div key={s.label} className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${card} ${cardHover}`}
                style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg,${s.accent},transparent)` }} />
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07]"
                  style={{ background: `radial-gradient(circle, ${s.accent}, transparent)` }} />
                <div className="flex items-start justify-between mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: `${s.accent}18`, color: s.accent, boxShadow: `0 0 16px ${s.glow}` }}>
                    {s.icon}
                  </div>
                  <span className={`text-[9px] font-bold font-mono tracking-widest ${tt}`}>MTD</span>
                </div>
                <p className={`text-[32px] font-black leading-none ${tp}`}>{s.value}</p>
                <p className={`text-[11px] font-semibold mt-1.5 ${ts}`}>{s.label}</p>
                <p className={`text-[10px] mt-0.5 ${tt}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className={`rounded-2xl border p-5 transition-all duration-300 ${card}`}
            style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${ts}`}>Monthly Progress</p>
                <p className={`text-sm font-bold mt-0.5 ${tp}`}>{summary?.thisMonthPresent ?? 0} <span className={`font-normal text-xs ${ts}`}>of</span> {summary?.thisMonthTotal ?? 0} <span className={`font-normal text-xs ${ts}`}>days attended</span></p>
              </div>
              <span className="text-2xl font-black" style={{ color: '#818cf8', textShadow: '0 0 20px rgba(129,140,248,0.5)' }}>{rate}%</span>
            </div>
            <div className={`relative w-full h-3 rounded-full overflow-hidden ${track}`}>
              <div className="h-full rounded-full transition-all duration-1200 relative"
                style={{ width: `${rate}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)', boxShadow: '0 0 16px rgba(99,102,241,0.6)' }}>
                <div className="absolute inset-0 rounded-full animate-pulse opacity-60"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', animation: 'shimmer 2s infinite' }} />
              </div>
            </div>
            <div className="flex justify-between mt-2.5">
              {[0, 25, 50, 75, 100].map(m => (
                <span key={m} className={`text-[9px] font-mono ${tt}`}>{m}%</span>
              ))}
            </div>
          </div>

          {/* Recent attendance */}
          <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${card}`}
            style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${div}`}>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"
                  style={{ boxShadow: '0 0 8px #818cf8, 0 0 3px #818cf8' }} />
                <h2 className={`text-sm font-bold ${tp}`}>Recent Attendance</h2>
              </div>
              <Link href="/attendance" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group">
                View all
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 gap-3 ${ts}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${d ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'}`}>
                  <svg className="w-7 h-7 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <p className="text-sm font-medium">No records yet</p>
                <Link href="/scan" className="text-indigo-400 text-xs hover:underline transition-colors">Mark your first attendance →</Link>
              </div>
            ) : (
              <div>
                {recent.map((rec, i) => {
                  const st = STATUS_MAP[rec.status] ?? STATUS_MAP.off;
                  const dateLabel = new Date(rec.date + 'T12:00:00Z').toLocaleDateString('en-PK', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <div key={rec._id} className={`flex items-center gap-4 px-6 py-3.5 transition-all ${hover} ${i < recent.length - 1 ? `border-b ${div}` : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border
                        ${d ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-100 bg-slate-50'}`}>
                        <span className={`text-[9px] font-black ${ts}`}>
                          {new Date(rec.date + 'T12:00:00Z').toLocaleDateString('en', { timeZone: 'UTC', weekday: 'short' }).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${tp}`}>{dateLabel}</p>
                        <p className={`text-[11px] font-mono ${ts}`}>
                          {formatPKTime(rec.checkIn)} {rec.checkOut ? `→ ${formatPKTime(rec.checkOut)}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color} ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                          style={{ boxShadow: `0 0 5px ${st.glow}` }} />
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}</style>
    </div>
  );
}