'use client';
import { useState, useEffect, useCallback } from 'react';

interface AttendanceRecord {
  _id?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'off';
  notes?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AttendancePage() {
  const [records, setRecords]     = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0, page: 1, limit: 15, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ✅ PKT time display
  const formatPKTimeOnly = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('en-PK', {
      timeZone: 'Asia/Karachi',
      hour:     '2-digit',
      minute:   '2-digit',
      second:   '2-digit',
      hour12:   true,
    }).toLowerCase();
  };

  // ✅ Worked hours
  const calculateHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return '—';
    const diff  = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = diff / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  };

  // ✅ Format date string (YYYY-MM-DD) safely without timezone shift
  const formatDate = (dateStr: string, options: Intl.DateTimeFormatOptions) => {
    // Parse as UTC noon to avoid any date shifting in any timezone
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-PK', { timeZone: 'UTC', ...options });
  };

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('employee_token');
      const params = new URLSearchParams({
        page:  page.toString(),
        limit: '15',
        month,
      });

      const res  = await fetch(`/api/employee/attendance?${params}`, {
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
  }, [month]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // Only show up to today (PKT)
  const pkToday = new Date(
    new Date().getTime() + 5 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  const filteredRecords = (records || []).filter(
    (rec) => rec?.date && rec.date <= pkToday
  );

  // =====================
  // STATUS STYLE
  // =====================
  const statusStyle = (s: string) => {
    switch (s) {
      case 'present':  return { dot: 'bg-green-400',  badge: 'bg-green-500/10 text-green-400 border border-green-500/20' };
      case 'late':     return { dot: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
      case 'absent':   return { dot: 'bg-red-400',    badge: 'bg-red-500/10 text-red-400 border border-red-500/20' };
      case 'half-day': return { dot: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
      case 'off':      return { dot: 'bg-slate-500',  badge: 'bg-slate-500/10 text-slate-400 border border-slate-600/30' };
      default:         return { dot: 'bg-slate-500',  badge: 'bg-slate-500/10 text-slate-400 border border-slate-600/30' };
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'half-day') return 'Half Day';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // =====================
  // STATS
  // =====================
  const presentCount  = filteredRecords.filter((r) => r.status === 'present').length;
  const lateCount     = filteredRecords.filter((r) => r.status === 'late').length;
  const absentCount   = filteredRecords.filter((r) => r.status === 'absent').length;
  const halfDayCount  = filteredRecords.filter((r) => r.status === 'half-day').length;
  const offCount      = filteredRecords.filter((r) => r.status === 'off').length;

  const stats = [
    { label: 'Present',  count: presentCount,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
    { label: 'Late',     count: lateCount,      color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Absent',   count: absentCount,    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
    { label: 'Half Day', count: halfDayCount,   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Off',      count: offCount,       color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-600/30' },
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Attendance</h1>
          <p className="text-slate-400 text-sm mt-1">View your attendance history</p>
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {stats.map(({ label, count, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Loading...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">No records found</div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Date', 'Day', 'Check In', 'Check Out', 'Hours', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((rec, idx) => {
                    const s         = statusStyle(rec.status);
                    const isWeekend = rec.status === 'off';

                    return (
                      <tr
                        key={rec._id || `${rec.date}-${idx}`}
                        className={`border-b border-slate-800/60 transition-colors ${
                          isWeekend ? 'opacity-50' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-5 py-4 text-white text-sm">
                          {formatDate(rec.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        <td className="px-5 py-4 text-slate-400 text-sm">
                          {formatDate(rec.date, { weekday: 'short' })}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300 font-mono">
                          {formatPKTimeOnly(rec.checkIn)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300 font-mono">
                          {formatPKTimeOnly(rec.checkOut)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300 font-mono">
                          {calculateHours(rec.checkIn, rec.checkOut)}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {statusLabel(rec.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filteredRecords.map((rec, idx) => {
                const s         = statusStyle(rec.status);
                const isWeekend = rec.status === 'off';

                return (
                  <div
                    key={rec._id || `${rec.date}-${idx}`}
                    className={`p-4 ${isWeekend ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium">
                        {formatDate(rec.date, { weekday: 'short', day: '2-digit', month: 'short' })}
                      </p>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {statusLabel(rec.status)}
                      </span>
                    </div>

                    {!isWeekend && (
                      <div className="flex flex-wrap gap-3 mt-1">
                        <p className="text-slate-400 text-xs">
                          In: <span className="text-slate-300 font-mono">{formatPKTimeOnly(rec.checkIn)}</span>
                        </p>
                        <p className="text-slate-400 text-xs">
                          Out: <span className="text-slate-300 font-mono">{formatPKTimeOnly(rec.checkOut)}</span>
                        </p>
                        <p className="text-slate-400 text-xs">
                          Hours: <span className="text-slate-300 font-mono">{calculateHours(rec.checkIn, rec.checkOut)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-slate-500 text-xs">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
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