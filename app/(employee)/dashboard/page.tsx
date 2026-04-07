'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  thisMonthPresent: number;
  thisMonthTotal: number;
  attendanceRate: number;
}

interface RecentRecord {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
}

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<{ name: string; employeeId: string; department?: string; designation?: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employee_token');
      const emp = localStorage.getItem('employee');
      if (emp) setEmployee(JSON.parse(emp));
      const res = await fetch('/api/employee/attendance?summary=true&recent=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setRecent(data.data.recent || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const statusColor = (s: string) => {
    if (s === 'present') return 'bg-green-500/10 text-green-400';
    if (s === 'late') return 'bg-yellow-500/10 text-yellow-400';
    if (s === 'absent') return 'bg-red-500/10 text-red-400';
    return 'bg-slate-500/10 text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            {employee?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">{today}</p>
        </div>
        <Link href="/scan"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 6h.01M3 3h5v5H3V3zm13 0h5v5h-5V3zM3 16h5v5H3v-5z" />
          </svg>
          Mark Attendance
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'This Month', value: summary?.thisMonthPresent ?? 0, sub: `of ${summary?.thisMonthTotal ?? 0} days`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Attendance Rate', value: `${summary?.attendanceRate ?? 0}%`, sub: 'Overall', color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Late Days', value: summary?.lateDays ?? 0, sub: 'This month', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Absent Days', value: summary?.absentDays ?? 0, sub: 'This month', color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map(({ label, value, sub, color, bg }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className={`inline-flex items-center justify-center w-10 h-10 ${bg} rounded-xl mb-3`}>
                  <span className={`text-lg font-bold ${color}`}>{typeof value === 'number' ? value : value.replace('%', '')}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-white text-sm font-medium mt-0.5">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly progress bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Monthly Attendance Progress</p>
              <span className="text-blue-400 text-sm font-bold">{summary?.attendanceRate ?? 0}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${summary?.attendanceRate ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-slate-500 text-xs">{summary?.thisMonthPresent ?? 0} present</span>
              <span className="text-slate-500 text-xs">{summary?.thisMonthTotal ?? 0} working days</span>
            </div>
          </div>

          {/* Recent attendance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-white font-semibold">Recent Attendance</h2>
              <Link href="/attendance" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No attendance records yet</p>
                <Link href="/scan" className="mt-3 text-blue-400 text-xs hover:underline">Mark your first attendance →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recent.map((rec) => (
                  <div key={rec._id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {new Date(rec.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {rec.checkIn ? `In: ${rec.checkIn}` : '—'}
                          {rec.checkOut ? ` · Out: ${rec.checkOut}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}