'use client';
// app/(admin)/admin/dashboard/page.tsx
import { useState, useEffect } from 'react';
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
        const active = employees.filter((e) => e.isActive).length;
        setStats({
          totalEmployees: total,
          activeEmployees: active,
          inactiveEmployees: total - active,
        });
        setRecentEmployees(employees.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      description: 'Registered in system',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bg: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/20',
      valueColor: 'text-blue-400',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      description: 'Currently working',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    {
      title: 'Inactive Employees',
      value: stats.inactiveEmployees,
      description: 'Currently inactive',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      bg: 'bg-red-500/10',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      border: 'border-red-500/20',
      valueColor: 'text-red-400',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-slate-700"></div>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin absolute inset-0"></div>
          </div>
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-blue-400">{adminName}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s an overview of your attendance system.</p>
        </div>
        <Link
          href="/admin/employees/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`${card.bg} border ${card.border} rounded-2xl p-6 flex items-center gap-5 hover:scale-[1.02] transition-transform`}
          >
            <div className={`${card.iconBg} ${card.iconColor} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-slate-400 text-sm">{card.title}</p>
              <p className={`text-3xl font-bold ${card.valueColor} mt-0.5`}>{card.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Employees */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-white">Recently Added Employees</h2>
          </div>
          <Link href="/admin/employees" className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1">
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium text-slate-400">No employees yet</p>
            <p className="text-sm mt-1 text-slate-600">Get started by adding your first employee</p>
            <Link
              href="/admin/employees/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Employee
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentEmployees.map((emp) => (
              <div key={emp._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{emp.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">
                    <code className="text-blue-400/70">{emp.employeeId}</code>
                    {emp.department && <span> · {emp.department}</span>}
                    {emp.designation && <span> · {emp.designation}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {emp.isActive ? '● Active' : '● Inactive'}
                  </span>
                  <Link
                    href={`/admin/employees/${emp._id}`}
                    className="text-slate-600 hover:text-blue-400 transition-colors group-hover:text-slate-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/employees/new"
            className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-slate-800/50"
          >
            <div className="w-12 h-12 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">Add New Employee</p>
              <p className="text-slate-500 text-sm mt-0.5">Create account with QR code</p>
            </div>
            <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/admin/employees"
            className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-slate-800/50"
          >
            <div className="w-12 h-12 bg-purple-500/10 group-hover:bg-purple-500/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-purple-400 transition-colors">View All Employees</p>
              <p className="text-slate-500 text-sm mt-0.5">Manage your employee list</p>
            </div>
            <svg className="w-4 h-4 text-slate-600 group-hover:text-purple-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

    </div>
  );
}