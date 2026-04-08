'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../ThemeContext';

interface AttendanceRecord {
  _id?: string; date: string; checkIn?: string; checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'off'; notes?: string;
}
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

const STATUS_DOT: Record<string, string> = {
  present: '#34d399', late: '#fbbf24', absent: '#f87171', 'half-day': '#fb923c', off: '#64748b',
};
const STATUS_GLOW: Record<string, string> = {
  present: 'rgba(52,211,153,0.6)', late: 'rgba(251,191,36,0.6)', absent: 'rgba(248,113,113,0.6)',
  'half-day': 'rgba(251,146,60,0.6)', off: 'rgba(100,116,139,0.4)',
};
const STATUS_BADGE: Record<string, string> = {
  present:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  late:       'bg-amber-500/10   text-amber-400   border-amber-500/25',
  absent:     'bg-rose-500/10    text-rose-400    border-rose-500/25',
  'half-day': 'bg-orange-500/10  text-orange-400  border-orange-500/25',
  off:        'bg-slate-500/10   text-slate-400   border-slate-400/25',
};

function fmtPK(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
}
function calcHrs(ci?: string, co?: string) {
  if (!ci || !co) return '—';
  return `${((new Date(co).getTime() - new Date(ci).getTime()) / 3_600_000).toFixed(2)}h`;
}
function fmtDate(s: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(s + 'T12:00:00Z').toLocaleDateString('en-PK', { timeZone: 'UTC', ...opts });
}

export default function AttendancePage() {
  const { isDark: d } = useTheme();
  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 0 });
  const [loading, setLoading]       = useState(true);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employee_token');
      const params = new URLSearchParams({ page: page.toString(), limit: '15', month });
      const res  = await fetch(`/api/employee/attendance?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setRecords(data.data.records); setPagination(data.data.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchRecords(1); }, [fetchRecords]);

  const pkToday  = new Date(Date.now() + 5 * 3_600_000).toISOString().split('T')[0];
  const filtered = (records || []).filter(r => r?.date && r.date <= pkToday);

  const counts = {
    present: filtered.filter(r => r.status === 'present').length,
    late:    filtered.filter(r => r.status === 'late').length,
    absent:  filtered.filter(r => r.status === 'absent').length,
    half:    filtered.filter(r => r.status === 'half-day').length,
    off:     filtered.filter(r => r.status === 'off').length,
  };
  const workDays = counts.present + counts.late + counts.half;
  const rate = workDays + counts.absent > 0 ? Math.round((workDays / (workDays + counts.absent)) * 100) : 0;

  // Theme tokens
  const card  = d ? 'bg-[#0c0d14]/80 border-white/[0.08]' : 'bg-white/90 border-slate-200/80';
  const tp    = d ? 'text-white'     : 'text-slate-900';
  const ts    = d ? 'text-slate-500' : 'text-slate-500';
  const tt    = d ? 'text-slate-600' : 'text-slate-400';
  const div   = d ? 'border-white/[0.07]' : 'border-slate-100';
  const hover = d ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/70';
  const thBg  = d ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-100';
  const track = d ? 'bg-white/[0.06]' : 'bg-slate-100';
  const inputCls = d
    ? 'bg-[#0c0d14] border-white/[0.1] text-white focus:border-indigo-500/70 focus:bg-white/[0.05]'
    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-400 shadow-sm';

  const statTiles = [
    { label: 'Present',  value: counts.present, color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
    { label: 'Late',     value: counts.late,     color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
    { label: 'Absent',   value: counts.absent,   color: '#f87171', glow: 'rgba(248,113,113,0.5)' },
    { label: 'Half Day', value: counts.half,     color: '#fb923c', glow: 'rgba(251,146,60,0.5)' },
    { label: 'Days Off', value: counts.off,      color: '#64748b', glow: 'rgba(100,116,139,0.4)' },
  ];

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold tracking-[0.4em] text-indigo-400 uppercase mb-1.5">Registry</p>
          <h1 className={`text-2xl font-black tracking-tight ${tp}`}>Attendance Log</h1>
          <p className={`text-sm mt-1 ${ts}`}>Your complete check-in / check-out history</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-[9px] uppercase tracking-widest font-semibold ${tt}`}>Period</span>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className={`border rounded-xl px-4 py-2 text-sm focus:outline-none transition-all ${inputCls}`} />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-5 gap-3">
        {statTiles.map(s => (
          <div key={s.label} className={`relative rounded-2xl border p-4 text-center overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-default ${card}`}
            style={{ boxShadow: d ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)' }}>
            {/* Top dot accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-12 rounded-b-full"
              style={{ background: s.color, boxShadow: `0 0 12px ${s.glow}` }} />
            {/* Background glow blob */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full opacity-[0.08] blur-xl"
              style={{ background: s.color }} />
            <p className={`text-3xl font-black relative z-10 ${tp}`} style={{ textShadow: d ? `0 0 30px ${s.glow}` : 'none' }}>{s.value}</p>
            <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider relative z-10 ${ts}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className={`rounded-2xl border px-6 py-5 transition-all duration-300 ${card}`}
        style={{ boxShadow: d ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${ts}`}>Punctuality Rate</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${d ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
              {workDays} work days
            </span>
          </div>
          <span className={`text-lg font-black ${tp}`} style={{ textShadow: d ? '0 0 20px rgba(129,140,248,0.5)' : 'none', color: '#818cf8' }}>{rate}%</span>
        </div>
        <div className={`h-2.5 w-full rounded-full overflow-hidden ${track}`}>
          <div className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${rate}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', boxShadow: '0 0 14px rgba(99,102,241,0.6)' }}>
            <div className="absolute inset-0 rounded-full opacity-50"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${card}`}
        style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)' }}>

        {/* Desktop thead */}
        <div className={`hidden sm:grid grid-cols-12 px-6 py-3 border-b ${div} ${thBg}`}>
          {[['Date', 'col-span-3'], ['Day', 'col-span-1'], ['Check In', 'col-span-2'], ['Check Out', 'col-span-2'], ['Hours', 'col-span-2'], ['Status', 'col-span-2']].map(([h, c]) => (
            <div key={h} className={`${c} text-[9px] font-bold tracking-[0.25em] ${ts} uppercase`}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <span className={`text-sm ${ts}`}>Fetching records…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 gap-3 ${ts}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${d ? 'bg-white/[0.03] border border-white/[0.07]' : 'bg-slate-50 border border-slate-100'}`}>
              <svg className="w-7 h-7 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-sm font-medium">No records for this period</p>
          </div>
        ) : (
          <>
            {/* Desktop rows */}
            <div className="hidden sm:block">
              {filtered.map((rec, idx) => {
                const badge = STATUS_BADGE[rec.status] ?? STATUS_BADGE.off;
                const dot   = STATUS_DOT[rec.status]   ?? STATUS_DOT.off;
                const glow  = STATUS_GLOW[rec.status]  ?? STATUS_GLOW.off;
                const isOff = rec.status === 'off';
                return (
                  <div key={rec._id || idx}
                    className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all ${idx < filtered.length - 1 ? `border-b ${div}` : ''} ${isOff ? 'opacity-35' : hover}`}>
                    <div className={`col-span-3 text-sm font-semibold ${tp}`}>{fmtDate(rec.date, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className={`col-span-1 text-[10px] font-bold ${ts}`}>{fmtDate(rec.date, { weekday: 'short' })}</div>
                    <div className={`col-span-2 text-[12px] font-mono ${d ? 'text-slate-300' : 'text-slate-600'}`}>{fmtPK(rec.checkIn)}</div>
                    <div className={`col-span-2 text-[12px] font-mono ${d ? 'text-slate-300' : 'text-slate-600'}`}>{fmtPK(rec.checkOut)}</div>
                    <div className={`col-span-2 text-[12px] font-mono ${d ? 'text-slate-500' : 'text-slate-500'}`}>{calcHrs(rec.checkIn, rec.checkOut)}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${glow}` }} />
                        {rec.status === 'half-day' ? 'Half Day' : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y" style={{ borderColor: d ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
              {filtered.map((rec, idx) => {
                const badge = STATUS_BADGE[rec.status] ?? STATUS_BADGE.off;
                const dot   = STATUS_DOT[rec.status]   ?? STATUS_DOT.off;
                const glow  = STATUS_GLOW[rec.status]  ?? STATUS_GLOW.off;
                return (
                  <div key={rec._id || idx} className={`p-4 ${rec.status === 'off' ? 'opacity-35' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${tp}`}>{fmtDate(rec.date, { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 5px ${glow}` }} />
                        {rec.status === 'half-day' ? 'Half Day' : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </div>
                    {rec.status !== 'off' && (
                      <div className="flex gap-4 mt-1.5">
                        <span className={`text-[11px] ${ts}`}>In: <span className={`font-mono ${d ? 'text-slate-300' : 'text-slate-600'}`}>{fmtPK(rec.checkIn)}</span></span>
                        <span className={`text-[11px] ${ts}`}>Out: <span className={`font-mono ${d ? 'text-slate-300' : 'text-slate-600'}`}>{fmtPK(rec.checkOut)}</span></span>
                        <span className={`text-[11px] ${ts}`}>Hrs: <span className={`font-mono ${d ? 'text-slate-300' : 'text-slate-600'}`}>{calcHrs(rec.checkIn, rec.checkOut)}</span></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-[11px] font-mono ${ts}`}>
            Page <span className={tp}>{pagination.page}</span> of <span className={tp}>{pagination.totalPages}</span>
            <span className={`ml-2 ${tt}`}>({pagination.total} records)</span>
          </p>
          <div className="flex gap-2">
            {[
              { label: '← Prev', fn: () => fetchRecords(pagination.page - 1), dis: pagination.page <= 1 },
              { label: 'Next →', fn: () => fetchRecords(pagination.page + 1), dis: pagination.page >= pagination.totalPages },
            ].map(b => (
              <button key={b.label} onClick={b.fn} disabled={b.dis}
                className={`px-4 py-2 text-[11px] font-semibold rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95
                  ${d ? 'border-white/[0.08] bg-[#0c0d14]/80 text-slate-300 hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
      `}</style>
    </div>
  );
}