'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeSignin() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('FORM DATA:', form); // 🔍 Debug

      const res = await fetch('/api/employee/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Server error');
      }

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false); // ✅ FIXED
        return;
      }

      // ✅ Save token & employee
      localStorage.setItem('employee_token', data.data.token);
      localStorage.setItem(
        'employee',
        JSON.stringify(data.data.employee)
      );

      // ✅ Redirect
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">AttendanceIQ</h1>
          <p className="text-slate-400 text-sm mt-1">Employee Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-white font-bold text-lg mb-4">
            Welcome back
          </h2>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}