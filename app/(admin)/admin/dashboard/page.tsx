'use client';
// app/(admin)/admin/dashboard/page.tsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    let start = 0;
    const duration = 900;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) requestAnimationFrame(ts => step(ts, startTime));
    };
    requestAnimationFrame(ts => step(ts, ts));
  }, [value]);
  return <>{display}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    setAdminName(admin.name || 'Admin');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/employees?limit=5&page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const employees: Employee[] = data.data.employees;
        const total = data.data.pagination.total;
        const active = employees.filter(e => e.isActive).length;
        setStats({ totalEmployees: total, activeEmployees: active, inactiveEmployees: total - active });
        setRecentEmployees(employees.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      sub: 'Registered in system',
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/15',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Active',
      value: stats.activeEmployees,
      sub: 'Currently working',
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/15',
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Inactive',
      value: stats.inactiveEmployees,
      sub: 'Not currently active',
      gradient: 'from-red-500 to-rose-500',
      glow: 'shadow-red-500/20',
      border: 'border-red-500/15',
      bg: 'bg-red-500/5',
      text: 'text-red-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      href: '/admin/employees',
      title: 'Manage Employees',
      sub: 'View, edit & manage all staff',
      gradient: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/15',
      border: 'border-violet-500/15',
      hoverBorder: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 group-hover:bg-violet-500/20',
      iconColor: 'text-violet-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      href: '/admin/attendance',
      title: 'View Attendance',
      sub: 'Track daily check-ins & hours',
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/15',
      border: 'border-emerald-500/15',
      hoverBorder: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/admin/tickets',
      title: 'Review Tickets',
      sub: 'Approve leave & overtime requests',
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/15',
      border: 'border-amber-500/15',
      hoverBorder: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconColor: 'text-amber-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-indigo-500 border-transparent animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .anim-1 { animation: slideUp 0.4s ease both 0.05s }
        .anim-2 { animation: slideUp 0.4s ease both 0.1s }
        .anim-3 { animation: slideUp 0.4s ease both 0.15s }
        .anim-4 { animation: slideUp 0.4s ease both 0.2s }
        .stat-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .stat-card:hover { transform: translateY(-3px); }
        .action-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-card:hover { transform: translateY(-2px); }
        .emp-row { transition: all 0.15s ease; }
        .emp-row:hover { background: rgba(255,255,255,0.03); padding-left: 28px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 anim-1">
        <div>
          <p className="text-slate-600 text-xs mb-1.5">{today}</p>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{adminName}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening in your system today.</p>
        </div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 anim-2">
        {statCards.map((card, i) => (
          <div
            key={card.title}
            className={`stat-card ${card.bg} border ${card.border} rounded-2xl p-5 flex items-center gap-4 shadow-lg ${card.glow}`}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${card.glow}`}>
              <span className="text-white">{card.icon}</span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">{card.title}</p>
              <p className={`text-3xl font-bold ${card.text} mt-0.5 tabular-nums`}>
                <AnimatedNumber value={card.value} />
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="anim-3">
        <p className="text-slate-600 text-[11px] font-bold uppercase tracking-[0.1em] mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`action-card group bg-white/2 border ${action.border} ${action.hoverBorder} rounded-2xl p-4 flex items-center gap-3 shadow-sm ${action.glow}`}
            >
              <div className={`w-10 h-10 rounded-xl ${action.iconBg} ${action.iconColor} flex items-center justify-center flex-shrink-0 transition-all`}>
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold group-hover:text-white transition-colors">{action.title}</p>
                <p className="text-slate-500 text-xs truncate mt-0.5">{action.sub}</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto flex-shrink-0 transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Employees */}
      <div className="anim-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white text-sm">Recent Employees</h2>
          </div>
          <Link href="/admin/employees" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors flex items-center gap-1">
            View all
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-600">
            <div className="w-14 h-14 rounded-2xl bg-white/3 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No employees yet</p>
            <Link href="/admin/employees" className="mt-3 text-blue-400 hover:text-blue-300 text-xs transition-colors">Add your first employee →</Link>
          </div>
        ) : (
          <div>
            {recentEmployees.map((emp, i) => (
              <div
                key={emp._id}
                className="emp-row flex items-center gap-3.5 px-5 py-3.5"
                style={{ borderBottom: i < recentEmployees.length - 1 ? '1px solid rgba(99,102,241,0.05)' : 'none', transition: 'all 0.2s ease' }}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                  <span className="text-white text-xs font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                    <code className="text-blue-400/70 text-[10px]">{emp.employeeId}</code>
                    {emp.department && <><span className="text-slate-700">·</span><span>{emp.department}</span></>}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  <span className={`w-1 h-1 rounded-full ${emp.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}