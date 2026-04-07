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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const formatPKTime = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toLowerCase();
};

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-PK', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatWeekday = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-PK', {
    timeZone: 'UTC',
    weekday: 'short',
  });

const calcHours = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return '—';
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const h = diff / (1000 * 60 * 60);
  return `${h.toFixed(2)}h`;
};

const statusStyle = (s: string) => {
  switch (s) {
    case 'present':  return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'late':     return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'absent':   return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'half-day': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'off':      return 'bg-slate-500/10 text-slate-400 border-slate-600/30';
    default:         return 'bg-slate-500/10 text-slate-400 border-slate-600/30';
  }
};

const statusDot = (s: string) => {
  switch (s) {
    case 'present':  return 'bg-green-400';
    case 'late':     return 'bg-yellow-400';
    case 'absent':   return 'bg-red-400';
    case 'half-day': return 'bg-orange-400';
    default:         return 'bg-slate-500';
  }
};

const statusLabel = (s: string) =>
  s === 'half-day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1);

// ─── SUMMARY CARDS ────────────────────────────────────────────────────────────
function SummaryCards({ records }: { records: AttendanceRecord[] }) {
  const counts = {
    present: records.filter(r => r.status === 'present').length,
    late:    records.filter(r => r.status === 'late').length,
    absent:  records.filter(r => r.status === 'absent').length,
    halfDay: records.filter(r => r.status === 'half-day').length,
    off:     records.filter(r => r.status === 'off').length,
  };

  const cards = [
    { label: 'Present',  count: counts.present,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
    { label: 'Late',     count: counts.late,      color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Absent',   count: counts.absent,    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
    { label: 'Half Day', count: counts.halfDay,   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Off',      count: counts.off,       color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-600/30' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {cards.map(({ label, count, color, bg, border }) => (
        <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-bold ${color}`}>{count}</p>
          <p className="text-slate-400 text-xs mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminAttendancePage() {
  const router = useRouter();

  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading]       = useState(true);

  const pkToday = new Date(new Date().getTime() + 5 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const [viewMode, setViewMode]         = useState<'date' | 'month'>('date');
  const [dateFilter, setDateFilter]     = useState(pkToday);
  const [monthFilter, setMonthFilter]   = useState(() => pkToday.slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('admin_token');
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });

      if (viewMode === 'date')  params.set('date',   dateFilter);
      if (viewMode === 'month') params.set('month',  monthFilter);
      if (statusFilter)         params.set('status', statusFilter);

      const res  = await fetch(`/api/admin/attendance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setRecords(data.data.records);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, dateFilter, monthFilter, statusFilter]);

  useEffect(() => { fetchRecords(1); }, [fetchRecords]);

  const filtered = records.filter(rec => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rec.employee?.name?.toLowerCase().includes(q) ||
      rec.employee?.employeeId?.toLowerCase().includes(q) ||
      rec.employee?.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pagination.total} record{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode('date')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'date' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        {viewMode === 'date' ? (
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        ) : (
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )}

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="half-day">Half Day</option>
          <option value="off">Off</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or department..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {!loading && <SummaryCards records={filtered} />}

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3 text-sm">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium text-slate-400">No records found</p>
            <p className="text-xs mt-1 text-slate-600">Try changing the date or filters</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, idx) => (
                    <tr
                      key={rec._id || idx}
                      className={`border-b border-slate-800/60 transition-colors ${
                        rec.status === 'off' ? 'opacity-40' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {rec.employee?.name?.charAt(0).toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium leading-tight">
                              {rec.employee?.name ?? '—'}
                            </p>
                            <p className="text-slate-500 text-xs">
                              <code className="text-blue-400/70">{rec.employee?.employeeId}</code>
                              {rec.employee?.department && <span> · {rec.employee.department}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{formatDate(rec.date)}</p>
                        <p className="text-slate-500 text-xs">{formatWeekday(rec.date)}</p>
                      </td>

                      {/* Check In */}
                      <td className="px-5 py-4 font-mono text-sm text-slate-300">
                        {formatPKTime(rec.checkIn)}
                      </td>

                      {/* Check Out */}
                      <td className="px-5 py-4 font-mono text-sm text-slate-300">
                        {formatPKTime(rec.checkOut)}
                      </td>

                      {/* Hours */}
                      <td className="px-5 py-4 font-mono text-sm text-slate-300">
                        {calcHours(rec.checkIn, rec.checkOut)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium border ${statusStyle(rec.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(rec.status)}`} />
                          {statusLabel(rec.status)}
                        </span>
                      </td>

                      {/* ✅ FIXED: rec.employeeId use ho raha hai */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/admin/attendance/${rec.employeeId}`)}
                          className="text-slate-400 hover:text-purple-400 transition-colors p-1.5 hover:bg-purple-500/10 rounded-lg"
                          title="Attendance History"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-slate-800">
              {filtered.map((rec, idx) => (
                <div
                  key={rec._id || idx}
                  className={`p-4 ${rec.status === 'off' ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {rec.employee?.name?.charAt(0).toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{rec.employee?.name ?? '—'}</p>
                        <p className="text-slate-500 text-xs">
                          <code className="text-blue-400/70">{rec.employee?.employeeId}</code>
                          {rec.employee?.department && <span> · {rec.employee.department}</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium border ${statusStyle(rec.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(rec.status)}`} />
                      {statusLabel(rec.status)}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mb-1">
                    {formatDate(rec.date)} · {formatWeekday(rec.date)}
                  </p>

                  {rec.status !== 'off' && (
                    <div className="flex flex-wrap gap-3 text-xs mb-3">
                      <span className="text-slate-500">In: <span className="text-slate-300 font-mono">{formatPKTime(rec.checkIn)}</span></span>
                      <span className="text-slate-500">Out: <span className="text-slate-300 font-mono">{formatPKTime(rec.checkOut)}</span></span>
                      <span className="text-slate-500">Hours: <span className="text-slate-300 font-mono">{calcHours(rec.checkIn, rec.checkOut)}</span></span>
                      {rec.location && <span className="text-slate-500">📍 {rec.location}</span>}
                    </div>
                  )}

                  {/* ✅ FIXED: rec.employeeId use ho raha hai */}
                  <button
                    onClick={() => router.push(`/admin/attendance/${rec.employeeId}`)}
                    className="w-full text-center bg-purple-600/20 text-purple-400 py-2 rounded-lg text-sm hover:bg-purple-600/30 transition-colors"
                  >
                    History
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-slate-500 text-xs">
            {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white">
              {pagination.page}
            </span>
            <button
              onClick={() => fetchRecords(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}