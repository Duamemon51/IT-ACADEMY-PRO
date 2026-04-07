'use client';
// app/(admin)/admin/employees/page.tsx
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  cnic: string;
  phone?: string;
  department?: string;
  designation?: string;
  plainPassword?: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreatedEmployee {
  employeeId: string;
  name: string;
  email: string;
  cnic: string;
  phone?: string;
  department?: string;
  designation?: string;
  plainPassword: string;
  qrCode: string;
  isActive: boolean;
}

const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Admin', 'Legal', 'Engineering', 'Design'];

// ─── ADD MODAL ───────────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (emp: CreatedEmployee) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', cnic: '', email: '', phone: '', department: '', designation: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cnic') {
      const digits = value.replace(/\D/g, '');
      let formatted = digits;
      if (digits.length > 5) formatted = digits.slice(0, 5) + '-' + digits.slice(5);
      if (digits.length > 12) formatted = formatted.slice(0, 13) + '-' + formatted.slice(13);
      if (digits.length <= 13) { setForm({ ...form, cnic: formatted }); return; }
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess(data.data.employee);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Add New Employee</h2>
            <p className="text-slate-400 text-sm mt-0.5">Fill in details to create an employee account</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-300 text-xs">Employee ID, password and QR code will be auto-generated.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Muhammad Ali Khan"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">CNIC <span className="text-red-400">*</span></label>
              <input type="text" name="cnic" value={form.cnic} onChange={handleChange} required placeholder="42201-1234567-1" maxLength={15}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-300 mb-1.5">Email <span className="text-red-400">*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="employee@company.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="0300-1234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Department</label>
              <select name="department" value={form.department} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none">
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-300 mb-1.5">Designation</label>
              <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Software Engineer"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Creating...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Employee</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
function SuccessModal({ employee, onClose, onAddAnother }: { employee: CreatedEmployee; onClose: () => void; onAddAnother: () => void }) {
  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = employee.qrCode;
    link.download = `${employee.employeeId}-${employee.name}-QR.png`;
    link.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff}.card{border:2px solid #1e40af;border-radius:16px;padding:30px;max-width:400px;margin:0 auto;text-align:center}.logo{font-size:18px;font-weight:bold;color:#1e40af;margin-bottom:20px}.qr img{width:220px;height:220px;margin:20px 0}.info{text-align:left;border-top:1px solid #e5e7eb;margin-top:20px;padding-top:20px}.row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.label{color:#6b7280}.value{font-weight:bold;color:#111827}.creds{background:#eff6ff;border-radius:8px;padding:12px;margin-top:16px}.creds p{margin:4px 0;font-size:13px}</style>
    </head><body><div class="card"><div class="logo">🏢 Attendance System</div><div class="qr"><img src="${employee.qrCode}" /></div>
    <div class="info">
    <div class="row"><span class="label">Name:</span><span class="value">${employee.name}</span></div>
    <div class="row"><span class="label">Employee ID:</span><span class="value">${employee.employeeId}</span></div>
    <div class="row"><span class="label">CNIC:</span><span class="value">${employee.cnic}</span></div>
    <div class="row"><span class="label">Department:</span><span class="value">${employee.department || 'N/A'}</span></div>
    <div class="creds"><p><strong>Login Credentials</strong></p><p>Email: ${employee.email}</p><p>Password: ${employee.plainPassword}</p></div>
    </div></div><script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-slate-800 p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold">Employee Added Successfully!</p>
            <p className="text-slate-400 text-sm">{employee.name}&apos;s account and QR code are ready.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <Image src={employee.qrCode} alt="QR Code" width={130} height={130} className="rounded-lg" />
              </div>
              <p className="text-slate-500 text-xs">Scan to mark attendance</p>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Employee ID', value: employee.employeeId, code: true },
                { label: 'CNIC', value: employee.cnic, mono: true },
                { label: 'Email', value: employee.email },
                { label: 'Department', value: employee.department || '—' },
                { label: 'Designation', value: employee.designation || '—' },
              ].map(({ label, value, code, mono }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-500 text-xs w-24 flex-shrink-0 mt-0.5">{label}</span>
                  {code
                    ? <code className="text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-md">{value}</code>
                    : <span className={`text-white text-xs font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
                  }
                </div>
              ))}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-3 space-y-1.5">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Login Credentials</p>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-500 text-xs w-16">Email:</span>
                  <code className="text-blue-300 text-xs font-mono">{employee.email}</code>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-500 text-xs w-16">Password:</span>
                  <code className="text-green-300 text-xs font-mono bg-green-500/10 px-2 py-0.5 rounded">{employee.plainPassword}</code>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Card
            </button>
            <button onClick={handleDownloadQR} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download QR
            </button>
            <button onClick={onAddAnother} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Another
            </button>
            <button onClick={onClose} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all ml-auto">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewEmployeeModal({ employee, onClose, onEdit }: { employee: Employee; onClose: () => void; onEdit: () => void }) {
  const handleDownloadQR = () => {
    if (!employee.qrCode) return;
    const link = document.createElement('a');
    link.href = employee.qrCode;
    link.download = `${employee.employeeId}-${employee.name}-QR.png`;
    link.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff}.card{border:2px solid #1e40af;border-radius:16px;padding:30px;max-width:400px;margin:0 auto;text-align:center}.logo{font-size:18px;font-weight:bold;color:#1e40af;margin-bottom:20px}.qr img{width:220px;height:220px;margin:20px 0}.info{text-align:left;border-top:1px solid #e5e7eb;margin-top:20px;padding-top:20px}.row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.label{color:#6b7280}.value{font-weight:bold;color:#111827}.status-active{display:inline-block;background:#dcfce7;color:#166534;padding:2px 10px;border-radius:20px;font-size:12px}.status-inactive{display:inline-block;background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:20px;font-size:12px}</style>
    </head><body><div class="card"><div class="logo">🏢 Attendance System</div>
    ${employee.qrCode ? `<div class="qr"><img src="${employee.qrCode}" /></div>` : ''}
    <div class="info">
    <div class="row"><span class="label">Name:</span><span class="value">${employee.name}</span></div>
    <div class="row"><span class="label">Employee ID:</span><span class="value">${employee.employeeId}</span></div>
    <div class="row"><span class="label">CNIC:</span><span class="value">${employee.cnic}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">${employee.email}</span></div>
    <div class="row"><span class="label">Phone:</span><span class="value">${employee.phone || 'N/A'}</span></div>
    <div class="row"><span class="label">Department:</span><span class="value">${employee.department || 'N/A'}</span></div>
    <div class="row"><span class="label">Designation:</span><span class="value">${employee.designation || 'N/A'}</span></div>
    <div class="row"><span class="label">Status:</span><span class="${employee.isActive ? 'status-active' : 'status-inactive'}">${employee.isActive ? 'Active' : 'Inactive'}</span></div>
    ${employee.plainPassword ? `<div class="row"><span class="label">Password:</span><span class="value">${employee.plainPassword}</span></div>` : ''}
    </div></div><script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  const joinedDate = new Date(employee.createdAt).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-bold">{employee.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{employee.name}</h2>
              <p className="text-slate-400 text-xs">{employee.designation || 'No designation'} {employee.department ? `· ${employee.department}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* QR Code + Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* QR */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {employee.qrCode ? (
                <>
                  <div className="bg-white rounded-xl p-3 shadow-lg">
                    <Image src={employee.qrCode} alt="QR Code" width={130} height={130} className="rounded-lg" />
                  </div>
                  <p className="text-slate-500 text-xs">Scan to mark attendance</p>
                </>
              ) : (
                <div className="w-[154px] h-[154px] bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                  <p className="text-slate-500 text-xs text-center px-3">No QR code available</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2.5">
              {/* Employee ID */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Employee ID</span>
                <code className="text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-md">{employee.employeeId}</code>
              </div>
              {/* CNIC */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">CNIC</span>
                <span className="text-white text-xs font-mono font-medium">{employee.cnic || '—'}</span>
              </div>
              {/* Email */}
              <div className="flex gap-2 items-start">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0 mt-0.5">Email</span>
                <span className="text-white text-xs font-medium break-all">{employee.email}</span>
              </div>
              {/* Phone */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Phone</span>
                <span className="text-white text-xs font-medium">{employee.phone || '—'}</span>
              </div>
              {/* Department */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Department</span>
                <span className="text-white text-xs font-medium">{employee.department || '—'}</span>
              </div>
              {/* Designation */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Designation</span>
                <span className="text-white text-xs font-medium">{employee.designation || '—'}</span>
              </div>
              {/* Status */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {employee.isActive ? '● Active' : '● Inactive'}
                </span>
              </div>
              {/* Joined */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-24 flex-shrink-0">Joined</span>
                <span className="text-white text-xs font-medium">{joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Credentials box — only show if plainPassword exists */}
          {employee.plainPassword && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-1.5">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Login Credentials</p>
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-16">Email:</span>
                <code className="text-blue-300 text-xs font-mono">{employee.email}</code>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 text-xs w-16">Password:</span>
                <code className="text-green-300 text-xs font-mono bg-green-500/10 px-2 py-0.5 rounded">{employee.plainPassword}</code>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Card
            </button>
            {employee.qrCode && (
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditEmployeeModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone || '',
    department: employee.department || '',
    designation: employee.designation || '',
    isActive: employee.isActive,
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess();
    } catch {
      setError('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{employee.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-white font-bold">Edit Employee</h2>
              <p className="text-slate-400 text-xs">{employee.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none">
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Designation</label>
              <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-slate-300 mb-1.5">Status</label>
              <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/employees/${employee._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Delete Employee</h2>
              <p className="text-slate-400 text-sm">This action cannot be undone.</p>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 mb-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{employee.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{employee.name}</p>
              <p className="text-slate-400 text-xs">{employee.email} · <code className="text-blue-400">{employee.employeeId}</code></p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Are you sure you want to permanently delete <span className="text-white font-medium">{employee.name}</span>? All their data and QR code access will be removed.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
              {deleting ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Deleting...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<CreatedEmployee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);   // ← NEW
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(filterActive !== '' && { isActive: filterActive }),
      });
      const res = await fetch(`/api/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data.employees);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timeout);
  }, [fetchEmployees]);

  return (
    <>
      {/* Modals */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSuccess={(emp) => { setShowAdd(false); setCreatedEmployee(emp); fetchEmployees(1); }}
        />
      )}
      {createdEmployee && (
        <SuccessModal
          employee={createdEmployee}
          onClose={() => setCreatedEmployee(null)}
          onAddAnother={() => { setCreatedEmployee(null); setShowAdd(true); }}
        />
      )}
      {/* VIEW MODAL */}
      {viewEmployee && (
        <ViewEmployeeModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          onEdit={() => { setEditEmployee(viewEmployee); setViewEmployee(null); }}
        />
      )}
      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSuccess={() => { setEditEmployee(null); fetchEmployees(pagination.page); }}
        />
      )}
      {deleteEmployee && (
        <DeleteModal
          employee={deleteEmployee}
          onClose={() => setDeleteEmployee(null)}
          onSuccess={() => { setDeleteEmployee(null); fetchEmployees(pagination.page); }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Employees</h1>
            <p className="text-slate-400 text-sm mt-1">Total {pagination.total} employees registered</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email or CNIC..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="font-medium">No employees found</p>
              {search && <p className="text-sm mt-1 opacity-70">Try a different search term</p>}
              {!search && (
                <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add First Employee
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-6 py-3">Employee</th>
                      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-4 py-3">ID</th>
                      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-4 py-3">CNIC</th>
                      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-4 py-3">Department</th>
                      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-4 py-3">Status</th>
                      <th className="text-right text-xs text-slate-500 font-medium uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{emp.name}</p>
                              <p className="text-slate-500 text-xs">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-md">{emp.employeeId}</code>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-300 text-sm font-mono">{emp.cnic || '—'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-400 text-sm">{emp.department || '—'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {emp.isActive ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* VIEW button ← NEW */}
                            <button
                              onClick={() => setViewEmployee(emp)}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-1.5 hover:bg-indigo-500/10 rounded-lg"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditEmployee(emp)}
                              className="text-slate-400 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded-lg"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteEmployee(emp)}
                              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-800">
                {employees.map((emp) => (
                  <div key={emp._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{emp.name}</p>
                          <code className="text-blue-400 text-xs">{emp.employeeId}</code>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">CNIC: </span><span className="text-slate-300 font-mono text-xs">{emp.cnic || '—'}</span></div>
                      <div><span className="text-slate-500">Dept: </span><span className="text-slate-300">{emp.department || '—'}</span></div>
                    </div>
                    {/* Mobile: 3 buttons ← UPDATED */}
                    <div className="flex gap-2">
                      <button onClick={() => setViewEmployee(emp)} className="flex-1 text-center bg-indigo-600/20 text-indigo-400 py-2 rounded-lg text-sm hover:bg-indigo-600/30 transition-colors">
                        View
                      </button>
                      <button onClick={() => setEditEmployee(emp)} className="flex-1 text-center bg-blue-600/20 text-blue-400 py-2 rounded-lg text-sm hover:bg-blue-600/30 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => setDeleteEmployee(emp)} className="flex-1 bg-red-600/20 text-red-400 py-2 rounded-lg text-sm hover:bg-red-600/30 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                  <p className="text-slate-500 text-sm">
                    {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchEmployees(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                      {pagination.page}
                    </span>
                    <button
                      onClick={() => fetchEmployees(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}