'use client';
// app/(admin)/admin/attendance/[employeeId]/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'off';
  location?: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  isActive: boolean;
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
  const h = (new Date(co).getTime()-new Date(ci).getTime())/(1000*60*60);
  return `${h.toFixed(2)}h`;
};

const statusStyle = (s: string) => {
  switch (s) {
    case 'present':  return { badge:'bg-green-500/10 text-green-400 border-green-500/20',     dot:'bg-green-400' };
    case 'late':     return { badge:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',  dot:'bg-yellow-400' };
    case 'absent':   return { badge:'bg-red-500/10 text-red-400 border-red-500/20',           dot:'bg-red-400' };
    case 'half-day': return { badge:'bg-orange-500/10 text-orange-400 border-orange-500/20',  dot:'bg-orange-400' };
    case 'off':      return { badge:'bg-slate-500/10 text-slate-400 border-slate-600/30',     dot:'bg-slate-500' };
    default:         return { badge:'bg-slate-500/10 text-slate-400 border-slate-600/30',     dot:'bg-slate-500' };
  }
};

const statusLabel = (s: string) => s === 'half-day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1);

function StatCard({ label, count, color, bg, border }: { label: string; count: number; color: string; bg: string; border: string }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminEmployeeHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const empId  = params?.employeeId as string;

  const [employee, setEmployee]     = useState<Employee | null>(null);
  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total:0, page:1, limit:20, totalPages:0 });
  const [loading, setLoading]       = useState(true);
  const [empLoading, setEmpLoading] = useState(true);

  const pkNow   = new Date(new Date().getTime() + 5*60*60*1000);
  const pkToday = pkNow.toISOString().split('T')[0];

  const [month, setMonth]             = useState(pkToday.slice(0,7));
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchEmployee = async () => {
      setEmpLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const res   = await fetch(`/api/admin/employees/${empId}`, { headers:{ Authorization:`Bearer ${token}` } });
        const data  = await res.json();
        if (data.success) setEmployee(data.data.employee);
      } catch (err) { console.error(err); }
      finally { setEmpLoading(false); }
    };
    if (empId) fetchEmployee();
  }, [empId]);

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('admin_token');
      const qp     = new URLSearchParams({ employeeId:empId, month, page:page.toString(), limit:'20', ...(statusFilter && { status:statusFilter }) });
      const res    = await fetch(`/api/admin/attendance/history?${qp}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data   = await res.json();
      if (data.success) { setRecords(data.data.records); setPagination(data.data.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [empId, month, statusFilter]);

  useEffect(() => { fetchRecords(1); }, [fetchRecords]);

  const selectedMonthIsCurrentMonth = month === pkToday.slice(0,7);
  const visibleRecords = selectedMonthIsCurrentMonth ? records.filter(r => r.date <= pkToday) : records;

  const stats = {
    present: visibleRecords.filter(r => r.status==='present').length,
    late:    visibleRecords.filter(r => r.status==='late').length,
    absent:  visibleRecords.filter(r => r.status==='absent').length,
    halfDay: visibleRecords.filter(r => r.status==='half-day').length,
    off:     visibleRecords.filter(r => r.status==='off').length,
  };

  const totalHours = visibleRecords.reduce((acc, r) => {
    if (!r.checkIn || !r.checkOut) return acc;
    return acc + (new Date(r.checkOut).getTime()-new Date(r.checkIn).getTime())/(1000*60*60);
  }, 0);

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .fade-in { animation:fadeIn 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl text-slate-400 hover:text-white transition-all" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {empLoading ? (
            <div className="h-12 w-48 rounded-xl animate-pulse" style={{ background:'rgba(255,255,255,0.05)' }} />
          ) : employee ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <span className="text-white text-base font-bold">{employee.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{employee.name}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${employee.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {employee.isActive ? '● Active' : '● Inactive'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  <code className="text-blue-400/75">{employee.employeeId}</code>
                  {employee.department  && <span> · {employee.department}</span>}
                  {employee.designation && <span> · {employee.designation}</span>}
                </p>
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-white">Employee Attendance</h1>
          )}
        </div>

        {!loading && (
          <div className="px-4 py-2 text-center rounded-xl" style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.18)' }}>
            <p className="text-blue-400 text-xl font-bold tabular-nums">{totalHours.toFixed(1)}h</p>
            <p className="text-slate-400 text-xs">Total this month</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="bg-white/3 border border-white/7 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/3 border border-white/7 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm appearance-none">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="half-day">Half Day</option>
          <option value="off">Off</option>
        </select>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <StatCard label="Present"  count={stats.present}  color="text-green-400"  bg="bg-green-500/8"  border="border-green-500/18" />
          <StatCard label="Late"     count={stats.late}     color="text-yellow-400" bg="bg-yellow-500/8" border="border-yellow-500/18" />
          <StatCard label="Absent"   count={stats.absent}   color="text-red-400"    bg="bg-red-500/8"    border="border-red-500/18" />
          <StatCard label="Half Day" count={stats.halfDay}  color="text-orange-400" bg="bg-orange-500/8" border="border-orange-500/18" />
          <StatCard label="Off"      count={stats.off}      color="text-slate-400"  bg="bg-white/3"      border="border-white/6" />
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(99,102,241,0.08)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3 text-sm">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
            </div>
            Loading...
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium text-slate-400">No records for this month</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.015)' }}>
                    {['Date','Day','Check In','Check Out','Hours Worked','Status','Location'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((rec, idx) => {
                    const s = statusStyle(rec.status);
                    return (
                      <tr key={rec._id||idx} className={`transition-colors ${rec.status==='off'?'opacity-40':'hover:bg-white/[0.02]'}`}
                        style={{ borderBottom: idx < visibleRecords.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <td className="px-5 py-4 text-white text-sm">{formatDate(rec.date)}</td>
                        <td className="px-5 py-4 text-slate-400 text-sm">{formatWeekday(rec.date)}</td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-300">{formatPKTime(rec.checkIn)}</td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-300">{formatPKTime(rec.checkOut)}</td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-300">{calcHours(rec.checkIn, rec.checkOut)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-full font-semibold border ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{statusLabel(rec.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs max-w-[120px] truncate">{rec.location||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
                    <td colSpan={4} className="px-5 py-3 text-slate-400 text-xs font-medium">
                      {visibleRecords.length} days · {stats.present+stats.late} attended · {stats.absent} absent
                    </td>
                    <td className="px-5 py-3 font-mono text-blue-400 text-sm font-bold">{totalHours.toFixed(2)}h</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {visibleRecords.map((rec, idx) => {
                const s = statusStyle(rec.status);
                return (
                  <div key={rec._id||idx} className={`p-4 ${rec.status==='off'?'opacity-40':''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-white text-sm font-medium">{formatDate(rec.date)}</p>
                        <p className="text-slate-500 text-xs">{formatWeekday(rec.date)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-semibold border ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{statusLabel(rec.status)}
                      </span>
                    </div>
                    {rec.status !== 'off' && (
                      <div className="flex flex-wrap gap-3 text-xs mt-1">
                        <span className="text-slate-500">In: <span className="text-slate-300 font-mono">{formatPKTime(rec.checkIn)}</span></span>
                        <span className="text-slate-500">Out: <span className="text-slate-300 font-mono">{formatPKTime(rec.checkOut)}</span></span>
                        <span className="text-slate-500">Hours: <span className="text-slate-300 font-mono">{calcHours(rec.checkIn,rec.checkOut)}</span></span>
                        {rec.location && <span className="text-slate-500">📍 {rec.location}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="p-4 flex items-center justify-between" style={{ background:'rgba(255,255,255,0.02)' }}>
                <p className="text-slate-400 text-xs">{stats.present+stats.late} attended · {stats.absent} absent</p>
                <p className="text-blue-400 font-mono font-bold text-sm">{totalHours.toFixed(2)}h total</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-slate-500 text-xs">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchRecords(pagination.page-1)} disabled={pagination.page<=1}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 disabled:opacity-40 hover:opacity-80 transition-colors"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)' }}>Previous</button>
            <span className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium">{pagination.page}</span>
            <button onClick={() => fetchRecords(pagination.page+1)} disabled={pagination.page>=pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 disabled:opacity-40 hover:opacity-80 transition-colors"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)' }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}