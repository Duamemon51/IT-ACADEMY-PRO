'use client';
import { useState, useEffect, useCallback } from 'react';

interface Profile {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  cnic: string;
  phone?: string;
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
  qrCode?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employee_token');
      const res = await fetch('/api/employee/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProfile(data.data.employee);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem('employee_token');
      const res = await fetch('/api/employee/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setPwError(data.message); return; }
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPw(false);
    } catch {
      setPwError('Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading profile...
      </div>
    );
  }

  if (!profile) return null;

  const fields = [
    { label: 'Employee ID', value: profile.employeeId, code: true },
    { label: 'Full Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'CNIC', value: profile.cnic, mono: true },
    { label: 'Phone', value: profile.phone || '—' },
    { label: 'Department', value: profile.department || '—' },
    { label: 'Designation', value: profile.designation || '—' },
    { label: 'Status', value: profile.isActive ? 'Active' : 'Inactive', status: true },
    { label: 'Joined', value: new Date(profile.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Your account information</p>
      </div>

      {/* Profile card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-6 flex items-center gap-4 border-b border-slate-800">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-2xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{profile.name}</h2>
            <p className="text-slate-400 text-sm">{profile.designation || 'Employee'} {profile.department ? `· ${profile.department}` : ''}</p>
            <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-0 divide-y divide-slate-800">
          {fields.map(({ label, value, code, mono, status }) => (
            <div key={label} className="flex items-center justify-between py-3.5">
              <span className="text-slate-500 text-sm">{label}</span>
              {status ? (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {value}
                </span>
              ) : code ? (
                <code className="text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-md">{value}</code>
              ) : (
                <span className={`text-white text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-white font-semibold text-sm">Security</h3>
            <p className="text-slate-500 text-xs mt-0.5">Manage your password</p>
          </div>
          {!changingPw && (
            <button onClick={() => setChangingPw(true)}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium border border-blue-500/30 hover:border-blue-500/60 px-3 py-1.5 rounded-lg transition-all">
              Change Password
            </button>
          )}
        </div>

        {changingPw && (
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            {pwError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-400 text-sm">{pwError}</p>
              </div>
            )}
            {[
              { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'newPassword', label: 'New Password', placeholder: 'Enter new password' },
              { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Confirm new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
                <input type="password" value={pwForm[key as keyof typeof pwForm]}
                  onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                  placeholder={placeholder} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setChangingPw(false); setPwError(''); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
              <button type="submit" disabled={pwLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                {pwLoading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {pwSuccess && (
          <div className="p-4 bg-green-500/10 border-t border-green-500/20 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 text-sm">{pwSuccess}</p>
          </div>
        )}
      </div>
    </div>
  );
}