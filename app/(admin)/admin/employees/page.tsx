'use client';
// app/(admin)/admin/employees/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes overlayIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes panelIn    { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes spin       { to { transform:rotate(360deg) } }
  @keyframes shimmer    { from { background-position:-200% center } to { background-position:200% center } }

  .modal-overlay  { animation: overlayIn 0.2s ease both; }
  .modal-panel    { animation: panelIn 0.26s cubic-bezier(0.22,1,0.36,1) both; }
  .spin           { animation: spin 0.75s linear infinite; }

  .inp {
    width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:10px; padding:10px 14px; color:#f1f5f9; font-size:13px; outline:none;
    transition:border-color 0.15s, box-shadow 0.15s; -webkit-appearance:none; appearance:none; font-family:inherit;
  }
  .inp::placeholder { color:rgba(148,163,184,0.3); }
  .inp:hover  { border-color:rgba(255,255,255,0.13); }
  .inp:focus  { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
  .inp-mono   { font-family:ui-monospace,'Cascadia Code',monospace; font-size:12px; }
  .inp-date   { color-scheme:dark; }
  select.inp option { background:#0e0e1a; }

  .inp-password {
    width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:10px; padding:10px 40px 10px 14px; color:#f1f5f9; font-size:13px; outline:none;
    transition:border-color 0.15s, box-shadow 0.15s; font-family:ui-monospace,'Cascadia Code',monospace;
    -webkit-appearance:none; appearance:none;
  }
  .inp-password::placeholder { color:rgba(148,163,184,0.3); font-family:inherit; }
  .inp-password:hover  { border-color:rgba(255,255,255,0.13); }
  .inp-password:focus  { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }

  .pw-wrap { position:relative; }
  .pw-toggle {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:rgba(100,116,139,0.5);
    display:flex; align-items:center; padding:4px; border-radius:6px; transition:color 0.12s;
  }
  .pw-toggle:hover { color:rgba(148,163,184,0.85); }

  .field-label {
    display:block; font-size:10px; font-weight:700; color:rgba(148,163,184,0.55);
    text-transform:uppercase; letter-spacing:0.07em; margin-bottom:5px;
  }
  .required { color:#f87171; margin-left:2px; }

  .section-divider { display:flex; align-items:center; gap:10px; margin:2px 0; }
  .section-label   { font-size:9px; font-weight:700; color:rgba(148,163,184,0.4); text-transform:uppercase; letter-spacing:0.1em; white-space:nowrap; display:flex; align-items:center; gap:5px; }
  .section-line    { flex:1; height:1px; background:rgba(255,255,255,0.05); }

  .btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600;
    color:#fff; border:none; cursor:pointer; transition:all 0.15s;
    background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);
    box-shadow:0 1px 0 rgba(255,255,255,0.08) inset,0 4px 14px rgba(99,102,241,0.28);
  }
  .btn-primary:hover   { transform:translateY(-1px); box-shadow:0 1px 0 rgba(255,255,255,0.12) inset,0 6px 20px rgba(99,102,241,0.35); background:linear-gradient(135deg,#818cf8 0%,#6366f1 100%); }
  .btn-primary:active  { transform:translateY(0); }
  .btn-primary:disabled{ opacity:0.45; transform:none; cursor:not-allowed; }

  .btn-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:10px 16px; border-radius:10px; font-size:13px; font-weight:500;
    color:rgba(148,163,184,0.8); background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07); cursor:pointer; transition:all 0.15s;
  }
  .btn-ghost:hover { background:rgba(255,255,255,0.07); color:#e2e8f0; border-color:rgba(255,255,255,0.11); }

  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:0.03em; }
  .badge-active   { background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.18); }
  .badge-inactive { background:rgba(239,68,68,0.09); color:#f87171; border:1px solid rgba(239,68,68,0.14); }

  .info-row        { display:flex; align-items:flex-start; gap:8px; font-size:12px; }
  .info-label      { color:rgba(100,116,139,0.75); min-width:86px; flex-shrink:0; padding-top:1px; }
  .info-value      { color:#e2e8f0; font-weight:500; word-break:break-all; }
  .code-badge      { display:inline-flex; align-items:center; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.18); color:#a5b4fc; border-radius:6px; padding:2px 8px; font-family:ui-monospace,monospace; font-size:11px; font-weight:600; }

  .salary-card     { background:rgba(255,255,255,0.03); border-radius:8px; padding:8px 12px; text-align:center; }
  .net-pay-bar     { display:flex; align-items:center; justify-content:space-between; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.14); border-radius:10px; padding:10px 14px; margin-top:4px; }

  .scroll-area     { overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(99,102,241,0.25) transparent; }
  .scroll-area::-webkit-scrollbar       { width:4px; }
  .scroll-area::-webkit-scrollbar-track { background:transparent; }
  .scroll-area::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.25); border-radius:4px; }

  .img-upload-zone {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:90px; border:1.5px dashed rgba(255,255,255,0.09); border-radius:10px;
    background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.15s; overflow:hidden; position:relative;
  }
  .img-upload-zone:hover { border-color:rgba(99,102,241,0.38); background:rgba(99,102,241,0.04); }
  .img-upload-overlay    { position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
  .img-upload-zone:hover .img-upload-overlay { opacity:1; }

  .action-btn      { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; border:none; background:transparent; cursor:pointer; transition:all 0.12s; color:rgba(100,116,139,0.55); }
  .action-btn:hover{ transform:scale(1.1); }
  .action-btn.view:hover { background:rgba(59,130,246,0.1); color:#60a5fa; }
  .action-btn.edit:hover { background:rgba(139,92,246,0.1); color:#a78bfa; }
  .action-btn.del:hover  { background:rgba(239,68,68,0.09); color:#f87171; }

  .emp-row { transition:background 0.12s ease; }
  .emp-row:hover { background:rgba(255,255,255,0.02); }

  .pw-hint { font-size:10px; color:rgba(100,116,139,0.5); margin-top:4px; }

  /* ── MODAL PORTAL ── */
  .modal-portal-overlay {
    position:fixed; inset:0;
    display:flex; align-items:center; justify-content:center;
    padding:16px;
    z-index:9999;
  }
  .modal-portal-backdrop {
    position:absolute; inset:0;
    background:rgba(0,0,0,0.78);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
  }
  .modal-portal-card {
    position:relative; z-index:1;
    width:100%; display:flex; flex-direction:column;
    background:linear-gradient(160deg,#12121e 0%,#0d0d18 100%);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px;
    box-shadow:0 0 0 1px rgba(255,255,255,0.04) inset, 0 40px 100px rgba(0,0,0,0.65), 0 0 80px rgba(99,102,241,0.04);
    overflow:hidden; max-height:90vh;
  }
  .modal-accent-line {
    position:absolute; top:0; left:10%; right:10%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(99,102,241,0.55),transparent);
  }
`;

// ─── PORTAL MODAL BASE ────────────────────────────────────────────────────────
function ModalPortal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${sw}px`;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="modal-portal-overlay modal-overlay">
      <div className="modal-portal-backdrop" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}

// ─── MODAL CARD ───────────────────────────────────────────────────────────────
function ModalCard({ children, maxWidth = 560, accentColor = '#6366f1' }: {
  children: React.ReactNode; maxWidth?: number; accentColor?: string;
}) {
  return (
    <div className="modal-panel modal-portal-card" style={{ maxWidth }}>
      <div className="modal-accent-line" style={{ background: `linear-gradient(90deg,transparent,${accentColor}66,transparent)` }} />
      {children}
    </div>
  );
}

// ─── MODAL HEADER ─────────────────────────────────────────────────────────────
function ModalHeader({ icon, title, subtitle, onClose, iconBg = 'linear-gradient(135deg,#6366f1,#4f46e5)' }: {
  icon: React.ReactNode; title: string; subtitle: string; onClose: () => void; iconBg?: string;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
      <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#f1f5f9' }}>{title}</p>
        <p style={{ margin:0, fontSize:11, color:'rgba(148,163,184,0.5)', marginTop:2 }}>{subtitle}</p>
      </div>
      <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:'none', background:'rgba(255,255,255,0.04)', color:'rgba(148,163,184,0.55)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s', flexShrink:0 }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color='#e2e8f0'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color='rgba(148,163,184,0.55)'; }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
      <div className="section-label"><span style={{ opacity:0.65 }}>{icon}</span>{label}</div>
      <div className="section-line" />
    </div>
  );
}

// ─── PASSWORD INPUT ──────────────────────────────────────────────────────────
function PasswordInput({
  value, onChange, placeholder, label, hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div className="pw-wrap">
        <input
          className="inp-password"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Enter new password'}
          autoComplete="new-password"
        />
        <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
          {show ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="pw-hint">{hint}</p>}
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
          ? <><img src={value} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} /><div className="img-upload-overlay"><span style={{ color:'#fff', fontSize:11, fontWeight:600 }}>Change</span></div></>
          : <><svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.45)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg><span style={{ fontSize:11, color:'rgba(100,116,139,0.4)', marginTop:4 }}>Upload</span></>
        }
        <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ErrorAlert({ msg }: { msg: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, padding:'10px 14px' }}>
      <svg width="14" height="14" fill="#f87171" viewBox="0 0 20 20" style={{ flexShrink:0 }}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span style={{ fontSize:12, color:'#fca5a5' }}>{msg}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
      <path fill="rgba(255,255,255,0.8)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [from, to] = getGradient(name);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${from},${to})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 8px ${from}38`, fontSize:size*0.34, fontWeight:700, color:'#fff' }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (emp: CreatedEmployee) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({
    name:'', cnic:'', email:'', companyEmail:'', phone:'', alternatePhone:'',
    department:'', designation:'', cnicFrontImage:'', cnicBackImage:'',
    bankAccountNo:'', bankAccountTitle:'', joiningDate:'',
    basicPay:'', adjustment:'', deduction:'',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (field === 'cnic') {
      const d = e.target.value.replace(/\D/g, '');
      if (d.length > 13) return;
      let f = d;
      if (d.length > 5)  f = d.slice(0,5) + '-' + d.slice(5);
      if (d.length > 12) f = f.slice(0,13) + '-' + f.slice(13);
      setForm(p => ({ ...p, cnic: f }));
    } else {
      setForm(p => ({ ...p, [field]: e.target.value }));
    }
  };

  const netPay = (Number(form.basicPay)||0) + (Number(form.adjustment)||0) - (Number(form.deduction)||0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res   = await fetch('/api/employees', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          basicPay:   form.basicPay   ? Number(form.basicPay)   : undefined,
          adjustment: form.adjustment ? Number(form.adjustment) : undefined,
          deduction:  form.deduction  ? Number(form.deduction)  : undefined,
          cnicFrontImage: form.cnicFrontImage || undefined,
          cnicBackImage:  form.cnicBackImage  || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess(data.data.employee);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const P = ({ px }: { px: string }) => (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink:0 }}>
      {px === 'person'    && <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
      {px === 'id'        && <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1" />}
      {px === 'work'      && <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
      {px === 'bank'      && <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
      {px === 'money'     && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
    </svg>
  );

  return (
    <ModalPortal onClose={onClose}>
      <ModalCard maxWidth={620} accentColor="#6366f1">
        <ModalHeader
          title="Add New Employee"
          subtitle="Employee ID, password & QR code auto-generated"
          onClose={onClose}
          iconBg="linear-gradient(135deg,#6366f1,#4f46e5)"
          icon={<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
        />
        <form onSubmit={handleSubmit} className="scroll-area" style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18, overflowY:'auto' }}>
          {error && <ErrorAlert msg={error} />}

          <SectionDivider label="Personal Info" icon={<P px="person" />} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Full Name<span className="required">*</span></label><input className="inp" type="text" value={form.name} onChange={set('name')} required placeholder="Muhammad Ali Khan" /></div>
            <div><label className="field-label">CNIC<span className="required">*</span></label><input className="inp inp-mono" type="text" value={form.cnic} onChange={set('cnic')} required placeholder="42201-1234567-1" maxLength={15} /></div>
            <div><label className="field-label">Phone</label><input className="inp" type="tel" value={form.phone} onChange={set('phone')} placeholder="0300-1234567" /></div>
            <div><label className="field-label">Alternate Phone</label><input className="inp" type="tel" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="0321-7654321" /></div>
          </div>

          <SectionDivider label="CNIC Images" icon={<P px="id" />} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ImageUpload label="Front Side" value={form.cnicFrontImage} onChange={v => setForm(p => ({ ...p, cnicFrontImage:v }))} />
            <ImageUpload label="Back Side"  value={form.cnicBackImage}  onChange={v => setForm(p => ({ ...p, cnicBackImage:v }))} />
          </div>

          <SectionDivider label="Employment" icon={<P px="work" />} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Personal Email<span className="required">*</span></label><input className="inp" type="email" value={form.email} onChange={set('email')} required placeholder="ali@gmail.com" /></div>
            <div><label className="field-label">Company Email</label><input className="inp" type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="ali@company.com" /></div>
            <div><label className="field-label">Department</label><select className="inp" value={form.department} onChange={set('department')}><option value="">Select department</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="field-label">Designation</label><input className="inp" type="text" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" /></div>
            <div><label className="field-label">Joining Date</label><input className="inp inp-date" type="date" value={form.joiningDate} onChange={set('joiningDate')} /></div>
          </div>

          <SectionDivider label="Bank Details" icon={<P px="bank" />} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Account Number</label><input className="inp inp-mono" type="text" value={form.bankAccountNo} onChange={set('bankAccountNo')} placeholder="PK36SCBL0000001123456702" /></div>
            <div><label className="field-label">Account Title</label><input className="inp" type="text" value={form.bankAccountTitle} onChange={set('bankAccountTitle')} placeholder="Muhammad Ali Khan" /></div>
          </div>

          <SectionDivider label="Salary" icon={<P px="money" />} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label className="field-label">Basic Pay</label><input className="inp" type="number" value={form.basicPay} onChange={set('basicPay')} placeholder="50,000" min="0" /></div>
            <div><label className="field-label">Adjustment</label><input className="inp" type="number" value={form.adjustment} onChange={set('adjustment')} placeholder="5,000" /></div>
            <div><label className="field-label">Deduction</label><input className="inp" type="number" value={form.deduction} onChange={set('deduction')} placeholder="2,000" min="0" /></div>
          </div>
          {(form.basicPay || form.adjustment || form.deduction) && (
            <div className="net-pay-bar">
              <span style={{ fontSize:12, color:'rgba(100,116,139,0.75)' }}>Net Pay</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#34d399', fontFamily:'monospace' }}>PKR {netPay.toLocaleString()}</span>
            </div>
          )}

          <div style={{ display:'flex', gap:10, paddingTop:2, paddingBottom:4 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:1 }}>
              {loading ? <><Spinner />Creating…</> : <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Add Employee</>}
            </button>
          </div>
        </form>
      </ModalCard>
    </ModalPortal>
  );
}

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
function SuccessModal({ employee, onClose, onAddAnother }: { employee: CreatedEmployee; onClose: () => void; onAddAnother: () => void }) {
  const netPay = (employee.basicPay||0) + (employee.adjustment||0) - (employee.deduction||0);

  const handleDownloadQR = () => {
    const a = document.createElement('a');
    a.href = employee.qrCode; a.download = `${employee.employeeId}-QR.png`; a.click();
  };
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff}.card{border:2px solid #1e40af;border-radius:16px;padding:28px;max-width:380px;margin:0 auto;text-align:center}.row{display:flex;justify-content:space-between;margin:7px 0;font-size:13px}.label{color:#6b7280}.value{font-weight:bold;color:#111827}.creds{background:#eff6ff;border-radius:8px;padding:12px;margin-top:16px}.creds p{margin:4px 0;font-size:12px}</style></head><body><div class="card"><h2 style="color:#1e40af;margin-bottom:16px">AttendanceIQ</h2><img src="${employee.qrCode}" width="190"/><div style="text-align:left;border-top:1px solid #e5e7eb;margin-top:16px;padding-top:14px"><div class="row"><span class="label">Name:</span><span class="value">${employee.name}</span></div><div class="row"><span class="label">ID:</span><span class="value">${employee.employeeId}</span></div><div class="row"><span class="label">CNIC:</span><span class="value">${employee.cnic}</span></div><div class="row"><span class="label">Dept:</span><span class="value">${employee.department||'N/A'}</span></div>${netPay>0?`<div class="row"><span class="label">Net Pay:</span><span class="value">PKR ${netPay.toLocaleString()}</span></div>`:''}<div class="creds"><p><strong>Login Credentials</strong></p><p>Email: ${employee.email}</p><p>Password: ${employee.plainPassword}</p></div></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  return (
    <ModalPortal onClose={onClose}>
      <ModalCard maxWidth={500} accentColor="#10b981">
        <div style={{ padding:'20px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:'rgba(16,185,129,0.13)', border:'1px solid rgba(16,185,129,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#f1f5f9' }}>Employee Created!</p>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(52,211,153,0.65)' }}>{employee.name}&apos;s account & QR code are ready</p>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:'none', background:'rgba(255,255,255,0.04)', color:'rgba(148,163,184,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="scroll-area" style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ background:'#fff', borderRadius:12, padding:9, boxShadow:'0 8px 28px rgba(0,0,0,0.4)', display:'inline-block' }}>
                <Image src={employee.qrCode} alt="QR" width={112} height={112} style={{ borderRadius:7, display:'block' }} />
              </div>
              <p style={{ margin:'5px 0 0', fontSize:10, color:'rgba(100,116,139,0.5)' }}>Scan for attendance</p>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
              <div className="info-row"><span className="info-label">Employee ID</span><span className="code-badge">{employee.employeeId}</span></div>
              <div className="info-row"><span className="info-label">CNIC</span><span className="info-value" style={{ fontFamily:'monospace', fontSize:11 }}>{employee.cnic}</span></div>
              <div className="info-row"><span className="info-label">Email</span><span className="info-value" style={{ fontSize:11 }}>{employee.email}</span></div>
              {employee.companyEmail && <div className="info-row"><span className="info-label">Co. Email</span><span className="info-value" style={{ fontSize:11 }}>{employee.companyEmail}</span></div>}
              <div className="info-row"><span className="info-label">Department</span><span className="info-value">{employee.department||'—'}</span></div>
            </div>
          </div>

          {(employee.basicPay !== undefined && employee.basicPay > 0) && (
            <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.13)', borderRadius:12, padding:'12px 14px' }}>
              <p style={{ margin:'0 0 9px', fontSize:9, fontWeight:700, color:'rgba(52,211,153,0.55)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Salary</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:9 }}>
                {[{ l:'Basic', v:employee.basicPay }, { l:'Adjustment', v:employee.adjustment }, { l:'Deduction', v:employee.deduction }].map(({ l, v }) => (
                  <div className="salary-card" key={l}>
                    <p style={{ margin:'0 0 2px', fontSize:9, color:'rgba(100,116,139,0.55)', textTransform:'uppercase' }}>{l}</p>
                    <p style={{ margin:0, fontSize:12, fontFamily:'monospace', fontWeight:600, color:'#e2e8f0' }}>{(v||0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(16,185,129,0.1)', paddingTop:8 }}>
                <span style={{ fontSize:12, color:'rgba(100,116,139,0.65)' }}>Net Pay</span>
                <span style={{ fontSize:14, fontWeight:700, fontFamily:'monospace', color:'#34d399' }}>PKR {netPay.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.14)', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:7 }}>
            <p style={{ margin:0, fontSize:9, fontWeight:700, color:'rgba(165,180,252,0.6)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Login Credentials</p>
            <div className="info-row"><span className="info-label">Email</span><code style={{ fontSize:11, color:'#93c5fd', fontFamily:'monospace' }}>{employee.email}</code></div>
            <div className="info-row"><span className="info-label">Password</span><code style={{ fontSize:11, color:'#6ee7b7', fontFamily:'monospace', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:5, padding:'2px 7px' }}>{employee.plainPassword}</code></div>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:8, paddingTop:2 }}>
            <button onClick={handlePrint} className="btn-primary" style={{ background:'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow:'0 4px 12px rgba(59,130,246,0.22)' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Card
            </button>
            <button onClick={handleDownloadQR} className="btn-primary" style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 12px rgba(16,185,129,0.22)' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download QR
            </button>
            <button onClick={onAddAnother} className="btn-ghost">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Another
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ marginLeft:'auto' }}>Done</button>
          </div>
        </div>
      </ModalCard>
    </ModalPortal>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewEmployeeModal({ employee, onClose, onEdit }: { employee: Employee; onClose: () => void; onEdit: () => void }) {
  const netPay = (employee.basicPay||0) + (employee.adjustment||0) - (employee.deduction||0);
  const joined = new Date(employee.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' });

  const handleDownloadQR = () => {
    if (!employee.qrCode) return;
    const a = document.createElement('a');
    a.href = employee.qrCode; a.download = `${employee.employeeId}-QR.png`; a.click();
  };
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${employee.name}</title><style>body{font-family:Arial,sans-serif;padding:20px}.card{border:2px solid #1e40af;border-radius:12px;padding:22px;max-width:360px;margin:0 auto;text-align:center}</style></head><body><div class="card"><h2>AttendanceIQ</h2>${employee.qrCode?`<img src="${employee.qrCode}" width="170"/>`:''}<p><b>${employee.name}</b><br/>${employee.employeeId}<br/>${employee.department||''}</p>${employee.plainPassword?`<p>Password: ${employee.plainPassword}</p>`:''}</div><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  return (
    <ModalPortal onClose={onClose}>
      <ModalCard maxWidth={540} accentColor="#3b82f6">
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:12 }}>
          <Avatar name={employee.name} size={42} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{employee.name}</p>
            <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(148,163,184,0.5)' }}>
              {employee.designation||'No designation'}{employee.department ? ` · ${employee.department}` : ''}
            </p>
          </div>
          <span className={`badge ${employee.isActive ? 'badge-active' : 'badge-inactive'}`} style={{ flexShrink:0 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:'none', background:'rgba(255,255,255,0.04)', color:'rgba(148,163,184,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="scroll-area" style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              {employee.qrCode
                ? <><div style={{ background:'#fff', borderRadius:11, padding:8, boxShadow:'0 8px 24px rgba(0,0,0,0.38)' }}><Image src={employee.qrCode} alt="QR" width={104} height={104} style={{ borderRadius:6, display:'block' }} /></div><p style={{ margin:'5px 0 0', fontSize:10, color:'rgba(100,116,139,0.45)' }}>Scan to attend</p></>
                : <div style={{ width:120, height:120, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:11, color:'rgba(100,116,139,0.35)' }}>No QR</span></div>
              }
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
              <div className="info-row"><span className="info-label">Employee ID</span><span className="code-badge">{employee.employeeId}</span></div>
              <div className="info-row"><span className="info-label">CNIC</span><span className="info-value" style={{ fontFamily:'monospace', fontSize:11 }}>{employee.cnic||'—'}</span></div>
              <div className="info-row"><span className="info-label">Email</span><span className="info-value" style={{ fontSize:11 }}>{employee.email}</span></div>
              {employee.companyEmail && <div className="info-row"><span className="info-label">Co. Email</span><span className="info-value" style={{ fontSize:11 }}>{employee.companyEmail}</span></div>}
              <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{employee.phone||'—'}</span></div>
              {employee.alternatePhone && <div className="info-row"><span className="info-label">Alt. Phone</span><span className="info-value">{employee.alternatePhone}</span></div>}
              {employee.joiningDate && <div className="info-row"><span className="info-label">Joining</span><span className="info-value">{new Date(employee.joiningDate).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })}</span></div>}
              <div className="info-row"><span className="info-label">Registered</span><span className="info-value" style={{ color:'rgba(148,163,184,0.45)', fontSize:11 }}>{joined}</span></div>
            </div>
          </div>

          {(employee.cnicFrontImage || employee.cnicBackImage) && (
            <div>
              <p style={{ margin:'0 0 7px', fontSize:9, fontWeight:700, color:'rgba(100,116,139,0.45)', textTransform:'uppercase', letterSpacing:'0.08em' }}>CNIC Images</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[{ l:'Front', src:employee.cnicFrontImage }, { l:'Back', src:employee.cnicBackImage }].map(({ l, src }) => src && (
                  <div key={l}>
                    <p style={{ margin:'0 0 4px', fontSize:10, color:'rgba(100,116,139,0.45)' }}>{l}</p>
                    <img src={src} alt={`CNIC ${l}`} style={{ width:'100%', height:68, objectFit:'cover', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(employee.bankAccountNo || employee.bankAccountTitle) && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'11px 14px', display:'flex', flexDirection:'column', gap:7 }}>
              <p style={{ margin:0, fontSize:9, fontWeight:700, color:'rgba(100,116,139,0.45)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Bank Details</p>
              {employee.bankAccountTitle && <div className="info-row"><span className="info-label">Title</span><span className="info-value">{employee.bankAccountTitle}</span></div>}
              {employee.bankAccountNo && <div className="info-row"><span className="info-label">Account</span><code style={{ fontSize:11, fontFamily:'monospace', color:'#cbd5e1' }}>{employee.bankAccountNo}</code></div>}
            </div>
          )}

          {(employee.basicPay !== undefined && employee.basicPay > 0) && (
            <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.12)', borderRadius:10, padding:'11px 14px' }}>
              <p style={{ margin:'0 0 9px', fontSize:9, fontWeight:700, color:'rgba(52,211,153,0.55)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Salary</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:9 }}>
                {[{ l:'Basic', v:employee.basicPay, c:'#e2e8f0' }, { l:'Adjustment', v:employee.adjustment, c:'#93c5fd' }, { l:'Deduction', v:employee.deduction, c:'#fca5a5' }].map(({ l, v, c }) => (
                  <div className="salary-card" key={l}>
                    <p style={{ margin:'0 0 2px', fontSize:9, color:'rgba(100,116,139,0.5)', textTransform:'uppercase' }}>{l}</p>
                    <p style={{ margin:0, fontSize:12, fontFamily:'monospace', fontWeight:600, color:c }}>{(v||0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(16,185,129,0.1)', paddingTop:8 }}>
                <span style={{ fontSize:12, color:'rgba(100,116,139,0.65)' }}>Net Pay</span>
                <span style={{ fontSize:14, fontWeight:700, fontFamily:'monospace', color:'#34d399' }}>PKR {netPay.toLocaleString()}</span>
              </div>
            </div>
          )}

          {employee.plainPassword && (
            <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.13)', borderRadius:10, padding:'11px 14px', display:'flex', flexDirection:'column', gap:7 }}>
              <p style={{ margin:0, fontSize:9, fontWeight:700, color:'rgba(165,180,252,0.55)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Credentials</p>
              <div className="info-row"><span className="info-label">Email</span><code style={{ fontSize:11, color:'#93c5fd', fontFamily:'monospace' }}>{employee.email}</code></div>
              <div className="info-row"><span className="info-label">Password</span><code style={{ fontSize:11, color:'#6ee7b7', fontFamily:'monospace', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:5, padding:'2px 7px' }}>{employee.plainPassword}</code></div>
            </div>
          )}

          <div style={{ display:'flex', flexWrap:'wrap', gap:8, paddingTop:2 }}>
            <button onClick={handlePrint} className="btn-primary" style={{ background:'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow:'0 4px 12px rgba(59,130,246,0.2)' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            {employee.qrCode && (
              <button onClick={handleDownloadQR} className="btn-primary" style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 12px rgba(16,185,129,0.2)' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download QR
              </button>
            )}
            <button onClick={onEdit} className="btn-ghost">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ marginLeft:'auto' }}>Close</button>
          </div>
        </div>
      </ModalCard>
    </ModalPortal>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditEmployeeModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    name: employee.name,
    email: employee.email,
    companyEmail: employee.companyEmail||'',
    phone: employee.phone||'',
    alternatePhone: employee.alternatePhone||'',
    department: employee.department||'',
    designation: employee.designation||'',
    isActive: employee.isActive,
    bankAccountNo: employee.bankAccountNo||'',
    bankAccountTitle: employee.bankAccountTitle||'',
    joiningDate: employee.joiningDate ? employee.joiningDate.slice(0,10) : '',
    basicPay: employee.basicPay?.toString()||'',
    adjustment: employee.adjustment?.toString()||'',
    deduction: employee.deduction?.toString()||'',
    // Password fields
    newPassword: '',
  });

  const netPay = (Number(form.basicPay)||0) + (Number(form.adjustment)||0) - (Number(form.deduction)||0);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  // Validate password if provided
  const pwProvided = form.newPassword.trim().length > 0;
  const pwTooShort = pwProvided && form.newPassword.trim().length < 6;

  const handleSave = async () => {
    if (pwTooShort) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const payload: Record<string, unknown> = {
        ...form,
        basicPay:   Number(form.basicPay)||0,
        adjustment: Number(form.adjustment)||0,
        deduction:  Number(form.deduction)||0,
      };
      // Only send newPassword if admin actually typed something
      if (!pwProvided) delete payload.newPassword;

      const res  = await fetch(`/api/employees/${employee._id}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onSuccess();
    } catch { setError('Update failed. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <ModalPortal onClose={onClose}>
      <ModalCard maxWidth={580} accentColor="#8b5cf6">
        <ModalHeader
          title="Edit Employee"
          subtitle={`Editing ${employee.employeeId} · ${employee.name}`}
          onClose={onClose}
          iconBg="linear-gradient(135deg,#8b5cf6,#7c3aed)"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
        />
        <div className="scroll-area" style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18, overflowY:'auto' }}>
          {error && <ErrorAlert msg={error} />}

          {/* ── Basic Info ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Full Name</label><input className="inp" type="text" value={form.name} onChange={set('name')} /></div>
            <div><label className="field-label">Status</label>
              <select className="inp" value={form.isActive?'true':'false'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value==='true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div><label className="field-label">Phone</label><input className="inp" type="tel" value={form.phone} onChange={set('phone')} placeholder="0300-1234567" /></div>
            <div><label className="field-label">Alternate Phone</label><input className="inp" type="tel" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="0321-7654321" /></div>
          </div>

          {/* ── Employment ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Personal Email</label><input className="inp" type="email" value={form.email} onChange={set('email')} /></div>
            <div><label className="field-label">Company Email</label><input className="inp" type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="ali@company.com" /></div>
            <div><label className="field-label">Department</label>
              <select className="inp" value={form.department} onChange={set('department')}>
                <option value="">Select</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="field-label">Designation</label><input className="inp" type="text" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" /></div>
            <div><label className="field-label">Joining Date</label><input className="inp inp-date" type="date" value={form.joiningDate} onChange={set('joiningDate')} /></div>
          </div>

          {/* ── Bank ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="field-label">Account Number</label><input className="inp inp-mono" type="text" value={form.bankAccountNo} onChange={set('bankAccountNo')} placeholder="PK36SCBL..." /></div>
            <div><label className="field-label">Account Title</label><input className="inp" type="text" value={form.bankAccountTitle} onChange={set('bankAccountTitle')} /></div>
          </div>

          {/* ── Salary ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label className="field-label">Basic Pay</label><input className="inp" type="number" value={form.basicPay} onChange={set('basicPay')} placeholder="50,000" min="0" /></div>
            <div><label className="field-label">Adjustment</label><input className="inp" type="number" value={form.adjustment} onChange={set('adjustment')} placeholder="5,000" /></div>
            <div><label className="field-label">Deduction</label><input className="inp" type="number" value={form.deduction} onChange={set('deduction')} placeholder="2,000" min="0" /></div>
          </div>
          {(form.basicPay || form.adjustment || form.deduction) && (
            <div className="net-pay-bar">
              <span style={{ fontSize:12, color:'rgba(100,116,139,0.75)' }}>Net Pay</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#34d399', fontFamily:'monospace' }}>PKR {netPay.toLocaleString()}</span>
            </div>
          )}

          {/* ── Password Reset ── */}
          <div style={{
            background:'rgba(99,102,241,0.05)',
            border:`1px solid ${pwProvided ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.1)'}`,
            borderRadius:12, padding:'14px 16px',
            transition:'border-color 0.2s',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#a5b4fc" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#c4b5fd' }}>Reset Password</p>
                <p style={{ margin:0, fontSize:10, color:'rgba(148,163,184,0.45)' }}>
                  {employee.plainPassword
                    ? <>Current: <code style={{ fontFamily:'monospace', color:'rgba(110,231,183,0.7)', fontSize:10 }}>{employee.plainPassword}</code></>
                    : 'Leave blank to keep existing password'
                  }
                </p>
              </div>
            </div>
            <PasswordInput
              value={form.newPassword}
              onChange={v => setForm(p => ({ ...p, newPassword: v }))}
              placeholder="Enter new password (leave blank to keep)"
              hint={
                pwTooShort
                  ? '⚠ Must be at least 6 characters'
                  : pwProvided
                    ? '✓ Password will be updated on save'
                    : 'Minimum 6 characters required'
              }
            />
            {/* strength bar */}
            {pwProvided && (
              <div style={{ marginTop:8, display:'flex', gap:3 }}>
                {[6, 8, 10, 12].map((threshold, i) => (
                  <div key={i} style={{
                    flex:1, height:3, borderRadius:2,
                    background: form.newPassword.length >= threshold
                      ? i < 1 ? '#f87171' : i < 2 ? '#fb923c' : i < 3 ? '#facc15' : '#34d399'
                      : 'rgba(255,255,255,0.07)',
                    transition:'background 0.2s',
                  }} />
                ))}
                <span style={{ fontSize:9, color:'rgba(100,116,139,0.55)', marginLeft:6, whiteSpace:'nowrap' }}>
                  {form.newPassword.length < 6 ? 'Too short' : form.newPassword.length < 8 ? 'Weak' : form.newPassword.length < 10 ? 'Fair' : form.newPassword.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:10, paddingTop:2, paddingBottom:4 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button onClick={handleSave} disabled={saving || pwTooShort} className="btn-primary" style={{ flex:1, background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow:'0 4px 14px rgba(139,92,246,0.28)' }}>
              {saving ? <><Spinner />Saving…</> : <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Save Changes</>}
            </button>
          </div>
        </div>
      </ModalCard>
    </ModalPortal>
  );
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/employees/${employee._id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      onSuccess();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  return (
    <ModalPortal onClose={onClose}>
      <ModalCard maxWidth={400} accentColor="#ef4444">
        <div style={{ padding:'22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#f1f5f9' }}>Delete Employee</p>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(248,113,113,0.55)' }}>This action cannot be undone</p>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:'none', background:'rgba(255,255,255,0.04)', color:'rgba(148,163,184,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:11, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:11, padding:'11px 13px', marginBottom:14 }}>
            <Avatar name={employee.name} size={38} />
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{employee.name}</p>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(100,116,139,0.65)' }}>
                {employee.email} · <span style={{ color:'#818cf8' }}>{employee.employeeId}</span>
              </p>
            </div>
          </div>

          <p style={{ fontSize:12, color:'rgba(148,163,184,0.65)', lineHeight:1.65, marginBottom:18 }}>
            Permanently delete <strong style={{ color:'#e2e8f0' }}>{employee.name}</strong>? All attendance records and QR code access will be removed.
          </p>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-primary" style={{ flex:1, background:'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow:'0 4px 14px rgba(239,68,68,0.22)' }}>
              {deleting ? <><Spinner />Deleting…</> : <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Delete</>}
            </button>
          </div>
        </div>
      </ModalCard>
    </ModalPortal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total:0, page:1, limit:10, totalPages:0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showAdd, setShowAdd]                 = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<CreatedEmployee | null>(null);
  const [viewEmployee, setViewEmployee]       = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee]       = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee]   = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) { setLoading(false); return; }
      const params = new URLSearchParams({ page: page.toString(), limit:'10', ...(search && { search }), ...(filterActive !== '' && { isActive: filterActive }) });
      const res  = await fetch(`/api/employees?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
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

      {showAdd         && <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={emp => { setShowAdd(false); setCreatedEmployee(emp); fetchEmployees(1); }} />}
      {createdEmployee && <SuccessModal employee={createdEmployee} onClose={() => setCreatedEmployee(null)} onAddAnother={() => { setCreatedEmployee(null); setShowAdd(true); }} />}
      {viewEmployee    && <ViewEmployeeModal employee={viewEmployee} onClose={() => setViewEmployee(null)} onEdit={() => { setEditEmployee(viewEmployee); setViewEmployee(null); }} />}
      {editEmployee    && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} onSuccess={() => { setEditEmployee(null); fetchEmployees(pagination.page); }} />}
      {deleteEmployee  && <DeleteModal employee={deleteEmployee} onClose={() => setDeleteEmployee(null)} onSuccess={() => { setDeleteEmployee(null); fetchEmployees(pagination.page); }} />}

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.02em' }}>Employees</h1>
            <p style={{ margin:'4px 0 0', fontSize:12, color:'rgba(100,116,139,0.65)' }}>
              {pagination.total} {pagination.total === 1 ? 'person' : 'people'} registered
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Employee
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.45)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, email, CNIC…" className="inp" style={{ paddingLeft:36 }} />
          </div>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="inp" style={{ minWidth:130, flex:'none' }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'60px 24px', color:'rgba(100,116,139,0.55)' }}>
              <div style={{ position:'relative', width:30, height:30 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.05)' }} />
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#6366f1' }} className="spin" />
              </div>
              <span style={{ fontSize:13 }}>Loading employees…</span>
            </div>
          ) : employees.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', gap:11 }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(100,116,139,0.28)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p style={{ margin:0, fontSize:13, fontWeight:500, color:'rgba(148,163,184,0.6)' }}>No employees found</p>
              {search && <p style={{ margin:0, fontSize:11, color:'rgba(100,116,139,0.45)' }}>Try a different search term</p>}
              {!search && <button onClick={() => setShowAdd(true)} style={{ marginTop:4, fontSize:12, color:'#818cf8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>Add your first employee →</button>}
            </div>
          ) : (
            <>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Employee', 'ID', 'CNIC', 'Department', 'Net Pay', 'Status', ''].map(h => (
                      <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:9, fontWeight:700, color:'rgba(100,116,139,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const netPay = (emp.basicPay||0) + (emp.adjustment||0) - (emp.deduction||0);
                    const isLast = i === employees.length - 1;
                    const [from, to] = getGradient(emp.name);
                    return (
                      <tr key={emp._id} className="emp-row" style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${from},${to})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', boxShadow:`0 2px 8px ${from}35` }}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{emp.name}</p>
                              <p style={{ margin:0, fontSize:10, color:'rgba(100,116,139,0.55)' }}>{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }}><span className="code-badge">{emp.employeeId}</span></td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:11, fontFamily:'monospace', color:'rgba(148,163,184,0.45)' }}>{emp.cnic||'—'}</span></td>
                        <td style={{ padding:'12px 16px' }}>
                          {emp.department
                            ? <span style={{ fontSize:11, color:'rgba(148,163,184,0.65)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'2px 8px' }}>{emp.department}</span>
                            : <span style={{ fontSize:11, color:'rgba(100,116,139,0.35)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          {netPay > 0
                            ? <span style={{ fontSize:12, fontFamily:'monospace', fontWeight:600, color:'#34d399' }}>PKR {netPay.toLocaleString()}</span>
                            : <span style={{ fontSize:12, color:'rgba(100,116,139,0.32)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            <span style={{ width:4, height:4, borderRadius:'50%', background:'currentColor', display:'inline-block', flexShrink:0 }} />
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px 12px 8px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:2 }}>
                            <button className="action-btn view" onClick={() => setViewEmployee(emp)} title="View">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button className="action-btn edit" onClick={() => setEditEmployee(emp)} title="Edit">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="action-btn del" onClick={() => setDeleteEmployee(emp)} title="Delete">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:11, color:'rgba(100,116,139,0.45)' }}>
                    {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => fetchEmployees(pagination.page-1)} disabled={pagination.page===1} className="btn-ghost" style={{ padding:'6px 12px', fontSize:11, opacity: pagination.page===1 ? 0.3 : 1 }}>← Prev</button>
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontSize:12, fontWeight:700 }}>{pagination.page}</span>
                    <button onClick={() => fetchEmployees(pagination.page+1)} disabled={pagination.page===pagination.totalPages} className="btn-ghost" style={{ padding:'6px 12px', fontSize:11, opacity: pagination.page===pagination.totalPages ? 0.3 : 1 }}>Next →</button>
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