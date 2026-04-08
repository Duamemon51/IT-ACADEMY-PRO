'use client';
// app/(admin)/admin/employees/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  companyEmail?: string;
  cnic: string;
  phone?: string;
  alternatePhone?: string;
  department?: string;
  designation?: string;
  plainPassword?: string;
  qrCode?: string;
  cnicFrontImage?: string;
  cnicBackImage?: string;
  bankAccountNo?: string;
  bankAccountTitle?: string;
  joiningDate?: string;
  basicPay?: number;
  adjustment?: number;
  deduction?: number;
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
  companyEmail?: string;
  cnic: string;
  phone?: string;
  alternatePhone?: string;
  department?: string;
  designation?: string;
  plainPassword: string;
  qrCode: string;
  bankAccountNo?: string;
  bankAccountTitle?: string;
  joiningDate?: string;
  basicPay?: number;
  adjustment?: number;
  deduction?: number;
  isActive: boolean;
}

const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Admin', 'Legal', 'Engineering', 'Design'];

const AVATAR_GRADIENTS = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#6366f1'],
  ['#10b981', '#3b82f6'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#06b6d4', '#3b82f6'],
];

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes overlayIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes panelIn { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
  .modal-overlay { animation: overlayIn 0.18s ease both; }
  .modal-panel { animation: panelIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both; }

  .inp {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 10px 14px;
    color: #f1f5f9;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    -webkit-appearance: none;
    appearance: none;
    font-family: inherit;
  }
  .inp::placeholder { color: rgba(148,163,184,0.35); }
  .inp:hover { border-color: rgba(255,255,255,0.14); }
  .inp:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .inp-mono { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 12px; }
  .inp-date { color-scheme: dark; }

  .field-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(148,163,184,0.7);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }
  .required { color: #f87171; margin-left: 2px; }

  .section-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;
  }
  .section-divider-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(148,163,184,0.45);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.05);
  }

  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
    color: #fff; border: none; cursor: pointer; transition: all 0.15s;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    box-shadow: 0 1px 0 rgba(255,255,255,0.1) inset, 0 4px 16px rgba(99,102,241,0.3);
  }
  .btn-primary:hover { background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%); transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 20px rgba(99,102,241,0.35); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; transform: none; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 500;
    color: rgba(148,163,184,0.85); background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; border-color: rgba(255,255,255,0.12); }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  }
  .badge-active { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
  .badge-inactive { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.15); }

  .info-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; }
  .info-row-label { color: rgba(100,116,139,0.8); min-width: 88px; flex-shrink: 0; padding-top: 1px; }
  .info-row-value { color: #e2e8f0; font-weight: 500; word-break: break-all; }

  .code-badge {
    display: inline-flex; align-items: center;
    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
    color: #a5b4fc; border-radius: 6px; padding: 2px 8px;
    font-family: ui-monospace, monospace; font-size: 11px; font-weight: 600;
  }

  .net-pay-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15);
    border-radius: 10px; padding: 10px 14px; margin-top: 4px;
  }

  .scroll-area {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(99,102,241,0.3) transparent;
  }
  .scroll-area::-webkit-scrollbar { width: 4px; }
  .scroll-area::-webkit-scrollbar-track { background: transparent; }
  .scroll-area::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }

  .img-upload-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 88px; border: 1.5px dashed rgba(255,255,255,0.1); border-radius: 10px;
    background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.15s;
    overflow: hidden; position: relative;
  }
  .img-upload-zone:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.04); }
  .img-upload-zone img { width: 100%; height: 100%; object-fit: cover; }
  .img-upload-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
  }
  .img-upload-zone:hover .img-upload-overlay { opacity: 1; }

  .action-icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 7px; border: none;
    background: transparent; cursor: pointer; transition: all 0.12s; color: rgba(100,116,139,0.6);
  }
  .action-icon-btn:hover { transform: scale(1.1); }
  .action-icon-btn.view:hover { background: rgba(59,130,246,0.12); color: #60a5fa; }
  .action-icon-btn.edit:hover { background: rgba(139,92,246,0.12); color: #a78bfa; }
  .action-icon-btn.del:hover { background: rgba(239,68,68,0.1); color: #f87171; }

  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .salary-mini-card {
    background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 12px; text-align: center;
  }
`;

// ─── MODAL BASE ───────────────────────────────────────────────────────────────
function ModalBase({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h); };
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      {children}
    </div>
  );
}

// ─── MODAL CARD ───────────────────────────────────────────────────────────────
function ModalCard({
  children,
  maxWidth = 560,
  accentColor = '#6366f1',
  scrollable = false,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  accentColor?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      className="modal-panel"
      style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth,
        background: 'linear-gradient(160deg, #13131f 0%, #0e0e18 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 20,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
      }} />
      <div style={{ flex: scrollable ? 1 : undefined, overflow: scrollable ? 'hidden' : undefined, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// ─── MODAL HEADER ─────────────────────────────────────────────────────────────
function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
  iconBg = 'linear-gradient(135deg, #6366f1, #4f46e5)',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
  iconBg?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '20px 24px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        style={{
          width: 30, height: 30, borderRadius: 8, border: 'none',
          background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.6)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.6)'; }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
function SectionDivider({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="section-divider">
      <div className="section-divider-label">
        <span style={{ opacity: 0.7 }}>{icon}</span>
        {label}
      </div>
      <div className="section-divider-line" />
    </div>
  );
}

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────
function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onChange(r.result as string);
    r.readAsDataURL(f);
  };
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="img-upload-zone" onClick={() => ref.current?.click()}>
        {value
          ? <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt={label} />
              <div className="img-upload-overlay">
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Change</span>
              </div>
            </>
          : <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.5)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.5)', marginTop: 4 }}>Upload</span>
            </>
        }
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── ERROR ALERT ──────────────────────────────────────────────────────────────
function ErrorAlert({ msg }: { msg: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <svg width="15" height="15" fill="#f87171" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span style={{ fontSize: 13, color: '#fca5a5' }}>{msg}</span>
    </div>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <path fill="rgba(255,255,255,0.8)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [from, to] = getGradient(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 2px 8px ${from}40`,
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (emp: CreatedEmployee) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', cnic: '', email: '', companyEmail: '',
    phone: '', alternatePhone: '',
    department: '', designation: '',
    cnicFrontImage: '', cnicBackImage: '',
    bankAccountNo: '', bankAccountTitle: '',
    joiningDate: '',
    basicPay: '', adjustment: '', deduction: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (field === 'cnic') {
      const d = e.target.value.replace(/\D/g, '');
      if (d.length > 13) return;
      let f = d;
      if (d.length > 5) f = d.slice(0, 5) + '-' + d.slice(5);
      if (d.length > 12) f = f.slice(0, 13) + '-' + f.slice(13);
      setForm(p => ({ ...p, cnic: f }));
    } else {
      setForm(p => ({ ...p, [field]: e.target.value }));
    }
  };

  const netPay = (Number(form.basicPay) || 0) + (Number(form.adjustment) || 0) - (Number(form.deduction) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          basicPay: form.basicPay ? Number(form.basicPay) : undefined,
          adjustment: form.adjustment ? Number(form.adjustment) : undefined,
          deduction: form.deduction ? Number(form.deduction) : undefined,
          cnicFrontImage: form.cnicFrontImage || undefined,
          cnicBackImage: form.cnicBackImage || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess(data.data.employee);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <ModalBase onClose={onClose}>
      <ModalCard maxWidth={620} accentColor="#6366f1" scrollable>
        <ModalHeader
          title="Add New Employee"
          subtitle="ID, password & QR code auto-generated"
          onClose={onClose}
          iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />

        <form onSubmit={handleSubmit} className="scroll-area" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {error && <ErrorAlert msg={error} />}

          {/* Personal */}
          <SectionDivider label="Personal Info" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Full Name<span className="required">*</span></label>
              <input className="inp" type="text" value={form.name} onChange={set('name')} required placeholder="Muhammad Ali Khan" />
            </div>
            <div>
              <label className="field-label">CNIC<span className="required">*</span></label>
              <input className="inp inp-mono" type="text" value={form.cnic} onChange={set('cnic')} required placeholder="42201-1234567-1" maxLength={15} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="inp" type="tel" value={form.phone} onChange={set('phone')} placeholder="0300-1234567" />
            </div>
            <div>
              <label className="field-label">Alternate Phone</label>
              <input className="inp" type="tel" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="0321-7654321" />
            </div>
          </div>

          {/* CNIC Images */}
          <SectionDivider label="CNIC Images" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ImageUpload label="Front Side" value={form.cnicFrontImage} onChange={v => setForm(p => ({ ...p, cnicFrontImage: v }))} />
            <ImageUpload label="Back Side" value={form.cnicBackImage} onChange={v => setForm(p => ({ ...p, cnicBackImage: v }))} />
          </div>

          {/* Employment */}
          <SectionDivider label="Employment" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Personal Email<span className="required">*</span></label>
              <input className="inp" type="email" value={form.email} onChange={set('email')} required placeholder="ali@gmail.com" />
            </div>
            <div>
              <label className="field-label">Company Email</label>
              <input className="inp" type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="ali@company.com" />
            </div>
            <div>
              <label className="field-label">Department</label>
              <select className="inp" value={form.department} onChange={set('department')}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Designation</label>
              <input className="inp" type="text" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="field-label">Joining Date</label>
              <input className="inp inp-date" type="date" value={form.joiningDate} onChange={set('joiningDate')} />
            </div>
          </div>

          {/* Bank */}
          <SectionDivider label="Bank Details" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Account Number</label>
              <input className="inp inp-mono" type="text" value={form.bankAccountNo} onChange={set('bankAccountNo')} placeholder="PK36SCBL0000001123456702" />
            </div>
            <div>
              <label className="field-label">Account Title</label>
              <input className="inp" type="text" value={form.bankAccountTitle} onChange={set('bankAccountTitle')} placeholder="Muhammad Ali Khan" />
            </div>
          </div>

          {/* Salary */}
          <SectionDivider label="Salary" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Basic Pay</label>
              <input className="inp" type="number" value={form.basicPay} onChange={set('basicPay')} placeholder="50,000" min="0" />
            </div>
            <div>
              <label className="field-label">Adjustment</label>
              <input className="inp" type="number" value={form.adjustment} onChange={set('adjustment')} placeholder="5,000" />
            </div>
            <div>
              <label className="field-label">Deduction</label>
              <input className="inp" type="number" value={form.deduction} onChange={set('deduction')} placeholder="2,000" min="0" />
            </div>
          </div>
          {(form.basicPay || form.adjustment || form.deduction) && (
            <div className="net-pay-bar">
              <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.8)' }}>Net Pay</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                PKR {netPay.toLocaleString()}
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 4 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? <><Spinner /> Creating…</> : <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Employee
              </>}
            </button>
          </div>
        </form>
      </ModalCard>
    </ModalBase>
  );
}

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
function SuccessModal({ employee, onClose, onAddAnother }: { employee: CreatedEmployee; onClose: () => void; onAddAnother: () => void }) {
  const netPay = (employee.basicPay || 0) + (employee.adjustment || 0) - (employee.deduction || 0);

  const handleDownloadQR = () => {
    const a = document.createElement('a');
    a.href = employee.qrCode;
    a.download = `${employee.employeeId}-${employee.name}-QR.png`;
    a.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff}.card{border:2px solid #1e40af;border-radius:16px;padding:30px;max-width:400px;margin:0 auto;text-align:center}.row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.label{color:#6b7280}.value{font-weight:bold;color:#111827}.creds{background:#eff6ff;border-radius:8px;padding:12px;margin-top:16px}.creds p{margin:4px 0;font-size:13px}</style>
    </head><body><div class="card"><h2 style="color:#1e40af">AttendanceIQ</h2><img src="${employee.qrCode}" width="200"/>
    <div style="text-align:left;border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px">
    <div class="row"><span class="label">Name:</span><span class="value">${employee.name}</span></div>
    <div class="row"><span class="label">ID:</span><span class="value">${employee.employeeId}</span></div>
    <div class="row"><span class="label">CNIC:</span><span class="value">${employee.cnic}</span></div>
    <div class="row"><span class="label">Dept:</span><span class="value">${employee.department || 'N/A'}</span></div>
    ${netPay > 0 ? `<div class="row"><span class="label">Net Pay:</span><span class="value">PKR ${netPay.toLocaleString()}</span></div>` : ''}
    <div class="creds"><p><strong>Login Credentials</strong></p><p>Email: ${employee.email}</p><p>Password: ${employee.plainPassword}</p></div>
    </div></div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <ModalBase onClose={onClose}>
      <ModalCard maxWidth={520} accentColor="#10b981">
        {/* Success header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Employee Created!</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(52,211,153,0.7)' }}>{employee.name}&apos;s account & QR code are ready</p>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="scroll-area" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* QR + info */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'inline-block' }}>
                <Image src={employee.qrCode} alt="QR" width={120} height={120} style={{ borderRadius: 8, display: 'block' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 10, color: 'rgba(100,116,139,0.6)' }}>Scan for attendance</p>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-row"><span className="info-row-label">Employee ID</span><span className="code-badge">{employee.employeeId}</span></div>
              <div className="info-row"><span className="info-row-label">CNIC</span><span className="info-row-value" style={{ fontFamily: 'monospace', fontSize: 11 }}>{employee.cnic}</span></div>
              <div className="info-row"><span className="info-row-label">Email</span><span className="info-row-value" style={{ fontSize: 11 }}>{employee.email}</span></div>
              {employee.companyEmail && <div className="info-row"><span className="info-row-label">Co. Email</span><span className="info-row-value" style={{ fontSize: 11 }}>{employee.companyEmail}</span></div>}
              <div className="info-row"><span className="info-row-label">Department</span><span className="info-row-value">{employee.department || '—'}</span></div>
              {employee.joiningDate && <div className="info-row"><span className="info-row-label">Joining</span><span className="info-row-value">{new Date(employee.joiningDate).toLocaleDateString('en-PK')}</span></div>}
            </div>
          </div>

          {/* Salary */}
          {(employee.basicPay !== undefined && employee.basicPay > 0) && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[{ l: 'Basic', v: employee.basicPay }, { l: 'Adjustment', v: employee.adjustment }, { l: 'Deduction', v: employee.deduction }].map(({ l, v }) => (
                  <div className="salary-mini-card" key={l}>
                    <p style={{ margin: '0 0 3px', fontSize: 9, color: 'rgba(100,116,139,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</p>
                    <p style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#e2e8f0' }}>{(v || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.7)' }}>Net Pay</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>PKR {netPay.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Credentials */}
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(165,180,252,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Login Credentials</p>
            <div className="info-row"><span className="info-row-label">Email</span><code style={{ fontSize: 12, color: '#93c5fd', fontFamily: 'monospace' }}>{employee.email}</code></div>
            <div className="info-row"><span className="info-row-label">Password</span><code style={{ fontSize: 12, color: '#6ee7b7', fontFamily: 'monospace', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 5, padding: '2px 7px' }}>{employee.plainPassword}</code></div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
            <button onClick={handlePrint} className="btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Card
            </button>
            <button onClick={handleDownloadQR} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download QR
            </button>
            <button onClick={onAddAnother} className="btn-ghost">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Another
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ marginLeft: 'auto' }}>Done</button>
          </div>
        </div>
      </ModalCard>
    </ModalBase>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewEmployeeModal({ employee, onClose, onEdit }: { employee: Employee; onClose: () => void; onEdit: () => void }) {
  const netPay = (employee.basicPay || 0) + (employee.adjustment || 0) - (employee.deduction || 0);
  const joined = new Date(employee.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleDownloadQR = () => {
    if (!employee.qrCode) return;
    const a = document.createElement('a');
    a.href = employee.qrCode; a.download = `${employee.employeeId}-QR.png`; a.click();
  };
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title><style>body{font-family:Arial,sans-serif;padding:20px}.card{border:2px solid #1e40af;border-radius:12px;padding:24px;max-width:380px;margin:0 auto;text-align:center}</style></head><body><div class="card"><h2>AttendanceIQ</h2>${employee.qrCode ? `<img src="${employee.qrCode}" width="180"/>` : ''}<p><b>${employee.name}</b><br/>${employee.employeeId}<br/>${employee.department || ''}</p>${employee.plainPassword ? `<p>Password: ${employee.plainPassword}</p>` : ''}</div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <ModalBase onClose={onClose}>
      <ModalCard maxWidth={560} accentColor="#3b82f6" scrollable>
        {/* Header with avatar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={employee.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{employee.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.55)' }}>
              {employee.designation || 'No designation'}{employee.department ? ` · ${employee.department}` : ''}
            </p>
          </div>
          <span className={`badge ${employee.isActive ? 'badge-active' : 'badge-inactive'}`} style={{ flexShrink: 0 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="scroll-area" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* QR + info */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {employee.qrCode
                ? <>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                      <Image src={employee.qrCode} alt="QR" width={110} height={110} style={{ borderRadius: 6, display: 'block' }} />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>Scan to attend</p>
                  </>
                : <div style={{ width: 126, height: 126, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.4)', textAlign: 'center', padding: '0 12px' }}>No QR</span>
                  </div>
              }
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div className="info-row"><span className="info-row-label">Employee ID</span><span className="code-badge">{employee.employeeId}</span></div>
              <div className="info-row"><span className="info-row-label">CNIC</span><span className="info-row-value" style={{ fontFamily: 'monospace', fontSize: 11 }}>{employee.cnic || '—'}</span></div>
              <div className="info-row"><span className="info-row-label">Email</span><span className="info-row-value" style={{ fontSize: 11 }}>{employee.email}</span></div>
              {employee.companyEmail && <div className="info-row"><span className="info-row-label">Co. Email</span><span className="info-row-value" style={{ fontSize: 11 }}>{employee.companyEmail}</span></div>}
              <div className="info-row"><span className="info-row-label">Phone</span><span className="info-row-value">{employee.phone || '—'}</span></div>
              {employee.alternatePhone && <div className="info-row"><span className="info-row-label">Alt. Phone</span><span className="info-row-value">{employee.alternatePhone}</span></div>}
              {employee.joiningDate && <div className="info-row"><span className="info-row-label">Joining</span><span className="info-row-value">{new Date(employee.joiningDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
              <div className="info-row"><span className="info-row-label">Registered</span><span className="info-row-value" style={{ color: 'rgba(148,163,184,0.5)', fontSize: 11 }}>{joined}</span></div>
            </div>
          </div>

          {/* CNIC Images */}
          {(employee.cnicFrontImage || employee.cnicBackImage) && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'rgba(100,116,139,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CNIC Images</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ l: 'Front', src: employee.cnicFrontImage }, { l: 'Back', src: employee.cnicBackImage }].map(({ l, src }) => src && (
                  <div key={l}>
                    <p style={{ margin: '0 0 5px', fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>{l}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`CNIC ${l}`} style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank */}
          {(employee.bankAccountNo || employee.bankAccountTitle) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(100,116,139,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Details</p>
              {employee.bankAccountTitle && <div className="info-row"><span className="info-row-label">Title</span><span className="info-row-value">{employee.bankAccountTitle}</span></div>}
              {employee.bankAccountNo && <div className="info-row"><span className="info-row-label">Account</span><code style={{ fontSize: 11, fontFamily: 'monospace', color: '#cbd5e1' }}>{employee.bankAccountNo}</code></div>}
            </div>
          )}

          {/* Salary */}
          {(employee.basicPay !== undefined && employee.basicPay > 0) && (
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.13)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: 'rgba(52,211,153,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { l: 'Basic', v: employee.basicPay, c: '#e2e8f0' },
                  { l: 'Adjustment', v: employee.adjustment, c: '#93c5fd' },
                  { l: 'Deduction', v: employee.deduction, c: '#fca5a5' },
                ].map(({ l, v, c }) => (
                  <div className="salary-mini-card" key={l}>
                    <p style={{ margin: '0 0 3px', fontSize: 9, color: 'rgba(100,116,139,0.5)', textTransform: 'uppercase' }}>{l}</p>
                    <p style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: c }}>{(v || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.7)' }}>Net Pay</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>PKR {netPay.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Credentials */}
          {employee.plainPassword && (
            <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(165,180,252,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Credentials</p>
              <div className="info-row"><span className="info-row-label">Email</span><code style={{ fontSize: 11, color: '#93c5fd', fontFamily: 'monospace' }}>{employee.email}</code></div>
              <div className="info-row"><span className="info-row-label">Password</span><code style={{ fontSize: 11, color: '#6ee7b7', fontFamily: 'monospace', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 5, padding: '2px 7px' }}>{employee.plainPassword}</code></div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
            <button onClick={handlePrint} className="btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            {employee.qrCode && (
              <button onClick={handleDownloadQR} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download QR
              </button>
            )}
            <button onClick={onEdit} className="btn-ghost">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ marginLeft: 'auto' }}>Close</button>
          </div>
        </div>
      </ModalCard>
    </ModalBase>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditEmployeeModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: employee.name, email: employee.email, companyEmail: employee.companyEmail || '',
    phone: employee.phone || '', alternatePhone: employee.alternatePhone || '',
    department: employee.department || '', designation: employee.designation || '',
    isActive: employee.isActive,
    bankAccountNo: employee.bankAccountNo || '', bankAccountTitle: employee.bankAccountTitle || '',
    joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : '',
    basicPay: employee.basicPay?.toString() || '',
    adjustment: employee.adjustment?.toString() || '',
    deduction: employee.deduction?.toString() || '',
  });

  const netPay = (Number(form.basicPay) || 0) + (Number(form.adjustment) || 0) - (Number(form.deduction) || 0);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, basicPay: Number(form.basicPay) || 0, adjustment: Number(form.adjustment) || 0, deduction: Number(form.deduction) || 0 }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess();
    } catch { setError('Update failed. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <ModalBase onClose={onClose}>
      <ModalCard maxWidth={600} accentColor="#8b5cf6" scrollable>
        <ModalHeader
          title="Edit Employee"
          subtitle={`Editing ${employee.employeeId}`}
          onClose={onClose}
          iconBg="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          icon={<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
        />
        <div className="scroll-area" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {error && <ErrorAlert msg={error} />}

          <SectionDivider label="Personal" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Full Name</label>
              <input className="inp" type="text" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="inp" value={form.isActive ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="inp" type="tel" value={form.phone} onChange={set('phone')} placeholder="0300-1234567" />
            </div>
            <div>
              <label className="field-label">Alternate Phone</label>
              <input className="inp" type="tel" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="0321-7654321" />
            </div>
          </div>

          <SectionDivider label="Employment" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Personal Email</label>
              <input className="inp" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="field-label">Company Email</label>
              <input className="inp" type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="ali@company.com" />
            </div>
            <div>
              <label className="field-label">Department</label>
              <select className="inp" value={form.department} onChange={set('department')}>
                <option value="">Select</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Designation</label>
              <input className="inp" type="text" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="field-label">Joining Date</label>
              <input className="inp inp-date" type="date" value={form.joiningDate} onChange={set('joiningDate')} />
            </div>
          </div>

          <SectionDivider label="Bank" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Account Number</label>
              <input className="inp inp-mono" type="text" value={form.bankAccountNo} onChange={set('bankAccountNo')} placeholder="PK36SCBL..." />
            </div>
            <div>
              <label className="field-label">Account Title</label>
              <input className="inp" type="text" value={form.bankAccountTitle} onChange={set('bankAccountTitle')} />
            </div>
          </div>

          <SectionDivider label="Salary" icon={<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Basic Pay</label>
              <input className="inp" type="number" value={form.basicPay} onChange={set('basicPay')} placeholder="50,000" min="0" />
            </div>
            <div>
              <label className="field-label">Adjustment</label>
              <input className="inp" type="number" value={form.adjustment} onChange={set('adjustment')} placeholder="5,000" />
            </div>
            <div>
              <label className="field-label">Deduction</label>
              <input className="inp" type="number" value={form.deduction} onChange={set('deduction')} placeholder="2,000" min="0" />
            </div>
          </div>
          {(form.basicPay || form.adjustment || form.deduction) && (
            <div className="net-pay-bar">
              <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.8)' }}>Net Pay</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>PKR {netPay.toLocaleString()}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 4 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}>
              {saving ? <><Spinner /> Saving…</> : <>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Save Changes
              </>}
            </button>
          </div>
        </div>
      </ModalCard>
    </ModalBase>
  );
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/employees/${employee._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  return (
    <ModalBase onClose={onClose}>
      <ModalCard maxWidth={420} accentColor="#ef4444">
        <div style={{ padding: '24px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Delete Employee</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(248,113,113,0.6)' }}>This action cannot be undone</p>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Employee card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <Avatar name={employee.name} size={40} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{employee.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(100,116,139,0.7)' }}>
                {employee.email} · <span style={{ color: '#818cf8' }}>{employee.employeeId}</span>
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6, marginBottom: 20 }}>
            Permanently delete <strong style={{ color: '#e2e8f0' }}>{employee.name}</strong>? All attendance records and QR code access will be removed.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.25)' }}>
              {deleting ? <><Spinner /> Deleting…</> : <>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </>}
            </button>
          </div>
        </div>
      </ModalCard>
    </ModalBase>
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
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) { setLoading(false); return; }
      const params = new URLSearchParams({ page: page.toString(), limit: '10', ...(search && { search }), ...(filterActive !== '' && { isActive: filterActive }) });
      const res = await fetch(`/api/employees?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setEmployees(data.data.employees); setPagination(data.data.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterActive]);

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={emp => { setShowAdd(false); setCreatedEmployee(emp); fetchEmployees(1); }} />}
      {createdEmployee && <SuccessModal employee={createdEmployee} onClose={() => setCreatedEmployee(null)} onAddAnother={() => { setCreatedEmployee(null); setShowAdd(true); }} />}
      {viewEmployee && <ViewEmployeeModal employee={viewEmployee} onClose={() => setViewEmployee(null)} onEdit={() => { setEditEmployee(viewEmployee); setViewEmployee(null); }} />}
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} onSuccess={() => { setEditEmployee(null); fetchEmployees(pagination.page); }} />}
      {deleteEmployee && <DeleteModal employee={deleteEmployee} onClose={() => setDeleteEmployee(null)} onSuccess={() => { setDeleteEmployee(null); fetchEmployees(pagination.page); }} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Employees</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(100,116,139,0.7)' }}>
              {pagination.total} {pagination.total === 1 ? 'person' : 'people'} registered
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary"
            style={{ fontSize: 13, padding: '10px 18px' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Employee
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.5)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, email, CNIC…"
              className="inp"
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="inp"
            style={{ minWidth: 130, flex: 'none' }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 24px', color: 'rgba(100,116,139,0.6)' }}>
              <div style={{ position: 'relative', width: 32, height: 32 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#6366f1' }} className="spin" />
              </div>
              <span style={{ fontSize: 13 }}>Loading employees…</span>
            </div>
          ) : employees.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.3)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'rgba(148,163,184,0.7)' }}>No employees found</p>
              {search && <p style={{ margin: 0, fontSize: 12, color: 'rgba(100,116,139,0.5)' }}>Try a different search term</p>}
              {!search && (
                <button onClick={() => setShowAdd(true)} style={{ marginTop: 4, fontSize: 13, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Add your first employee →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div style={{ overflowX: 'auto', display: 'none' }} className="desktop-table">
                {/* fallthrough to below */}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Employee', 'ID', 'CNIC', 'Department', 'Net Pay', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(100,116,139,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const netPay = (emp.basicPay || 0) + (emp.adjustment || 0) - (emp.deduction || 0);
                    const isLast = i === employees.length - 1;
                    return (
                      <tr key={emp._id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.12s', cursor: 'default' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={emp.name} size={32} />
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{emp.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'rgba(100,116,139,0.6)' }}>{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span className="code-badge">{emp.employeeId}</span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(148,163,184,0.5)' }}>{emp.cnic || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {emp.department
                            ? <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px' }}>{emp.department}</span>
                            : <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.4)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {netPay > 0
                            ? <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#34d399' }}>PKR {netPay.toLocaleString()}</span>
                            : <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.35)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px 12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                            <button className="action-icon-btn view" onClick={() => setViewEmployee(emp)} title="View">
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button className="action-icon-btn edit" onClick={() => setEditEmployee(emp)} title="Edit">
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="action-icon-btn del" onClick={() => setDeleteEmployee(emp)} title="Delete">
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.5)' }}>
                    {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => fetchEmployees(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 12, opacity: pagination.page === 1 ? 0.35 : 1 }}
                    >← Prev</button>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      {pagination.page}
                    </span>
                    <button
                      onClick={() => fetchEmployees(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 12, opacity: pagination.page === pagination.totalPages ? 0.35 : 1 }}
                    >Next →</button>
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