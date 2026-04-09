'use client';
// app/(admin)/admin/attendance/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'off';
  location?: string;
  employee?: {
    name: string;
    employeeId: string;
    department?: string;
    designation?: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const formatPKTime = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-PK', { timeZone:'Asia/Karachi', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true }).toLowerCase();
};

const formatDate = (s: string) =>
  new Date(s+'T12:00:00Z').toLocaleDateString('en-PK', { timeZone:'UTC', day:'2-digit', month:'short', year:'numeric' });

const formatWeekday = (s: string) =>
  new Date(s+'T12:00:00Z').toLocaleDateString('en-PK', { timeZone:'UTC', weekday:'short' });

const calcHours = (ci?: string, co?: string) => {
  if (!ci || !co) return '—';
  return `${((new Date(co).getTime()-new Date(ci).getTime())/(1000*60*60)).toFixed(2)}h`;
};

const STATUS = {
  present:   { badge:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot:'bg-emerald-400', label:'Present' },
  late:      { badge:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',   dot:'bg-yellow-400',  label:'Late' },
  absent:    { badge:'bg-red-500/10 text-red-400 border-red-500/20',            dot:'bg-red-400',     label:'Absent' },
  'half-day':{ badge:'bg-orange-500/10 text-orange-400 border-orange-500/20',   dot:'bg-orange-400',  label:'Half Day' },
  off:       { badge:'bg-slate-500/10 text-slate-500 border-slate-600/20',      dot:'bg-slate-600',   label:'Off' },
};

function SummaryCards({ records }: { records: AttendanceRecord[] }) {
  const counts = {
    present:    records.filter(r => r.status==='present').length,
    late:       records.filter(r => r.status==='late').length,
    absent:     records.filter(r => r.status==='absent').length,
    'half-day': records.filter(r => r.status==='half-day').length,
    off:        records.filter(r => r.status==='off').length,
  };
  const cards = [
    { label:'Present',  count:counts.present,      color:'text-emerald-400', bg:'bg-emerald-500/8',  border:'border-emerald-500/14' },
    { label:'Late',     count:counts.late,          color:'text-yellow-400',  bg:'bg-yellow-500/8',   border:'border-yellow-500/14' },
    { label:'Absent',   count:counts.absent,        color:'text-red-400',     bg:'bg-red-500/8',      border:'border-red-500/14' },
    { label:'Half Day', count:counts['half-day'],   color:'text-orange-400',  bg:'bg-orange-500/8',   border:'border-orange-500/14' },
    { label:'Off',      count:counts.off,           color:'text-slate-400',   bg:'bg-white/3',        border:'border-white/6' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
      {cards.map(({ label, count, color, bg, border }) => (
        <div key={label} className={`${bg} border ${border} rounded-2xl p-3.5 text-center`}>
          <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
          <p className="text-slate-600 text-[10px] mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total:0, page:1, limit:20, totalPages:0 });
  const [loading, setLoading]       = useState(true);

  const pkToday = new Date(new Date().getTime() + 5*60*60*1000).toISOString().split('T')[0];
  const [viewMode, setViewMode]         = useState<'date'|'month'>('date');
  const [dateFilter, setDateFilter]     = useState(pkToday);
  const [monthFilter, setMonthFilter]   = useState(() => pkToday.slice(0,7));
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('admin_token');
      const params = new URLSearchParams({ page: page.toString(), limit:'20' });
      if (viewMode==='date')  params.set('date', dateFilter);
      if (viewMode==='month') params.set('month', monthFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/admin/attendance?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setRecords(data.data.records); setPagination(data.data.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [viewMode, dateFilter, monthFilter, statusFilter]);

  useEffect(() => { fetchRecords(1); }, [fetchRecords]);

  const filtered = records.filter(rec => {
    if (!search) return true;
    const q = search.toLowerCase();
    return rec.employee?.name?.toLowerCase().includes(q) || rec.employee?.employeeId?.toLowerCase().includes(q) || rec.employee?.department?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        .anim-in { animation:slideUp 0.3s ease both; }
        .table-row { transition:background 0.12s ease; }
        .table-row:hover { background:rgba(255,255,255,0.025); }
        .mode-btn { transition:all 0.18s cubic-bezier(0.4,0,0.2,1); }
        .date-input::-webkit-calendar-picker-indicator { filter:invert(0.5); }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total} record{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setViewMode('date')} className={`mode-btn px-4 py-1.5 rounded-lg text-sm font-medium ${viewMode==='date'?'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md':'text-slate-400 hover:text-white'}`}>Day</button>
          <button onClick={() => setViewMode('month')} className={`mode-btn px-4 py-1.5 rounded-lg text-sm font-medium ${viewMode==='month'?'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md':'text-slate-400 hover:text-white'}`}>Month</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 anim-in" style={{ animationDelay:'0.05s' }}>
        {viewMode === 'date'
          ? <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="date-input bg-white/3 border border-white/7 hover:border-white/12 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/40 text-sm transition-all" />
          : <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="date-input bg-white/3 border border-white/7 hover:border-white/12 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/40 text-sm transition-all" />
        }
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/3 border border-white/7 hover:border-white/12 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/40 text-sm appearance-none transition-all">
          <option value="" className="bg-slate-900">All Status</option>
          <option value="present" className="bg-slate-900">Present</option>
          <option value="late" className="bg-slate-900">Late</option>
          <option value="absent" className="bg-slate-900">Absent</option>
          <option value="half-day" className="bg-slate-900">Half Day</option>
          <option value="off" className="bg-slate-900">Off</option>
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, department..."
            className="w-full bg-white/3 border border-white/7 hover:border-white/12 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 text-sm transition-all" />
        </div>
      </div>

      {/* Summary */}
      {!loading && <div className="anim-in" style={{ animationDelay:'0.1s' }}><SummaryCards records={filtered} /></div>}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden anim-in" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(99,102,241,0.08)', animationDelay:'0.15s' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
            </div>
            <span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-sm text-slate-400">No records found</p>
            <p className="text-xs mt-1 opacity-60">Try a different date or filter</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.015)' }}>
                    {['Employee','Date','Check In','Check Out','Hours','Status',''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, idx) => {
                    const s = STATUS[rec.status] || STATUS.off;
                    return (
                      <tr key={rec._id||idx} className={`table-row ${rec.status==='off'?'opacity-40':''}`}
                        style={{ borderBottom: idx < filtered.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/18">
                              <span className="text-white text-[11px] font-bold">{rec.employee?.name?.charAt(0).toUpperCase()??'?'}</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{rec.employee?.name??'—'}</p>
                              <p className="text-slate-600 text-[10px]">
                                <code className="text-blue-400/65">{rec.employee?.employeeId}</code>
                                {rec.employee?.department && <span> · {rec.employee.department}</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-white text-sm">{formatDate(rec.date)}</p>
                          <p className="text-slate-600 text-[10px]">{formatWeekday(rec.date)}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-sm text-slate-400">{formatPKTime(rec.checkIn)}</td>
                        <td className="px-5 py-3.5 font-mono text-sm text-slate-400">{formatPKTime(rec.checkOut)}</td>
                        <td className="px-5 py-3.5 font-mono text-sm text-slate-400">{calcHours(rec.checkIn, rec.checkOut)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-full font-semibold border ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => router.push(`/admin/attendance/${rec.employeeId}`)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/8 transition-all" title="View History">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              {filtered.map((rec, idx) => {
                const s = STATUS[rec.status] || STATUS.off;
                return (
                  <div key={rec._id||idx} className={`p-4 ${rec.status==='off'?'opacity-40':''}`}
                    style={{ borderBottom: idx < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[11px] font-bold">{rec.employee?.name?.charAt(0).toUpperCase()??'?'}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{rec.employee?.name??'—'}</p>
                          <p className="text-slate-600 text-[10px]"><code className="text-blue-400/65">{rec.employee?.employeeId}</code></p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-semibold border ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mb-2">{formatDate(rec.date)} · {formatWeekday(rec.date)}</p>
                    {rec.status !== 'off' && (
                      <div className="flex flex-wrap gap-3 text-xs mb-3">
                        <span className="text-slate-600">In: <span className="text-slate-400 font-mono">{formatPKTime(rec.checkIn)}</span></span>
                        <span className="text-slate-600">Out: <span className="text-slate-400 font-mono">{formatPKTime(rec.checkOut)}</span></span>
                        <span className="text-slate-600">Hours: <span className="text-slate-400 font-mono">{calcHours(rec.checkIn,rec.checkOut)}</span></span>
                      </div>
                    )}
                    <button onClick={() => router.push(`/admin/attendance/${rec.employeeId}`)}
                      className="w-full text-center py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-all"
                      style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.15)', color:'#a78bfa' }}>
                      View History
                    </button>
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
          <p className="text-slate-600 text-xs">{((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1.5">
            <button onClick={() => fetchRecords(pagination.page-1)} disabled={pagination.page<=1}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 disabled:opacity-30 hover:opacity-80 transition-colors"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>Prev</button>
            <span className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium">{pagination.page}</span>
            <button onClick={() => fetchRecords(pagination.page+1)} disabled={pagination.page>=pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 disabled:opacity-30 hover:opacity-80 transition-colors"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}