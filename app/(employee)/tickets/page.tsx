'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

type TicketType = 'leave' | 'late_checkin' | 'overtime' | null;
type LeaveType  = 'sick' | 'casual' | 'annual' | 'emergency';
type FormStatus = 'idle' | 'submitting' | 'success';

interface TicketForm {
  type: TicketType; leaveType: LeaveType | '';
  fromDate: string; toDate: string; leaveReason: string;
  lateDate: string; actualArrivalTime: string; lateReason: string;
  overtimeDate: string; overtimeFrom: string; overtimeTo: string;
  overtimeReason: string; overtimeProject: string;
}
const BLANK: TicketForm = {
  type: null, leaveType: '', fromDate: '', toDate: '', leaveReason: '',
  lateDate: '', actualArrivalTime: '', lateReason: '',
  overtimeDate: '', overtimeFrom: '', overtimeTo: '', overtimeReason: '', overtimeProject: '',
};
interface RecentTicket { id: string; type: string; label: string; date: string; status: 'approved' | 'pending' | 'rejected'; }

const TICKET_TYPES = [
  {
    id: 'leave' as TicketType, label: 'Leave Request', desc: 'Apply for planned or emergency leave',
    accent: '#818cf8', accentBg: 'rgba(129,140,248,0.08)', accentBorder: 'rgba(129,140,248,0.2)',
    glow: 'rgba(129,140,248,0.4)',
    icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  },
  {
    id: 'late_checkin' as TicketType, label: 'Late Check-in', desc: 'Request time correction for missed punch',
    accent: '#fbbf24', accentBg: 'rgba(251,191,36,0.08)', accentBorder: 'rgba(251,191,36,0.2)',
    glow: 'rgba(251,191,36,0.4)',
    icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  },
  {
    id: 'overtime' as TicketType, label: 'Overtime Claim', desc: 'Log extra hours worked beyond your schedule',
    accent: '#34d399', accentBg: 'rgba(52,211,153,0.08)', accentBorder: 'rgba(52,211,153,0.2)',
    glow: 'rgba(52,211,153,0.4)',
    icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
  },
];

const TYPE_META: Record<string, { label: string; accent: string; bg: string; border: string }> = {
  leave:        { label: 'Leave Request',  accent: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  late_checkin: { label: 'Late Check-in',  accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  overtime:     { label: 'Overtime Claim', accent: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
};
const STATUS_CFG = {
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  glow: 'rgba(52,211,153,0.5)' },
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',  glow: 'rgba(251,191,36,0.5)' },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(248,113,113,0.12)',border: 'rgba(248,113,113,0.3)', glow: 'rgba(248,113,113,0.5)' },
};

function Field({ label, id, type = 'text', value, onChange, placeholder, required, isDark }: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; isDark: boolean;
}) {
  const cls = isDark
    ? 'bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-700 focus:border-indigo-500/60 focus:bg-white/[0.06]'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 shadow-sm';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block text-[9px] font-bold tracking-[0.25em] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${cls}`} />
    </div>
  );
}
function Textarea({ label, id, value, onChange, placeholder, required, isDark }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; isDark: boolean;
}) {
  const cls = isDark
    ? 'bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-700 focus:border-indigo-500/60 focus:bg-white/[0.06]'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 shadow-sm';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block text-[9px] font-bold tracking-[0.25em] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none ${cls}`} />
    </div>
  );
}
function Select({ label, id, value, onChange, options, required, isDark }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean; isDark: boolean;
}) {
  const cls = isDark
    ? 'bg-white/[0.04] border-white/[0.1] text-white focus:border-indigo-500/60'
    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-400 shadow-sm';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block text-[9px] font-bold tracking-[0.25em] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all appearance-none cursor-pointer ${cls}`}>
        <option value="" disabled className="bg-[#0c0d14]">Select…</option>
        {options.map(o => <option key={o.value} value={o.value} className="bg-[#0c0d14]">{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function TicketModal({ open, onClose, initialType, onSubmitted }: {
  open: boolean; onClose: () => void; initialType: TicketType; onSubmitted: (t: RecentTicket) => void;
}) {
  const { isDark: d } = useTheme();
  const [form, setForm]     = useState<TicketForm>({ ...BLANK, type: initialType });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [tid, setTid]       = useState('');

  useEffect(() => { if (open) { setForm({ ...BLANK, type: initialType }); setStatus('idle'); setTid(''); } }, [open, initialType]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  if (!open) return null;

  const up = (k: keyof TicketForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const typeMeta = TICKET_TYPES.find(t => t.id === form.type);

  const submit = async () => {
    setStatus('submitting');
    try {
      const res  = await fetch('/api/employee/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('employee_token')}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setTid(data.data._id);
      setStatus('success');
      onSubmitted({ id: data.data._id, type: form.type!, label: typeMeta?.label ?? '', date: new Date().toISOString().split('T')[0], status: 'pending' });
    } catch { alert('Submission failed'); setStatus('idle'); }
  };

  const modalBg   = d ? 'bg-[#0c0d14]/98 border-white/[0.1]' : 'bg-white border-slate-200 shadow-2xl';
  const hdrBord   = d ? 'border-white/[0.07]' : 'border-slate-100';
  const tp        = d ? 'text-white'    : 'text-slate-900';
  const ts        = d ? 'text-slate-500' : 'text-slate-500';
  const closeBtn  = d ? 'text-slate-600 hover:text-white hover:bg-white/[0.07]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';
  const cancelBtn = d ? 'border-white/[0.09] bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={onClose} />
      <div className={`relative w-full max-w-lg border rounded-2xl flex flex-col max-h-[90vh] ${modalBg}`}
        style={{ animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both', boxShadow: d ? '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' : '0 30px 80px rgba(0,0,0,0.2)' }}>

        {/* Top gradient bar */}
       <div className="h-[2px] w-[95%] mx-auto rounded-t-2xl flex-shrink-0"
          style={{ background: typeMeta ? `linear-gradient(90deg,${typeMeta.accent},${typeMeta.accent}40,transparent)` : 'linear-gradient(90deg,#6366f1,#a855f7,transparent)' }} />

        {/* Header */}
        <div className={`flex items-center gap-3.5 px-6 py-4 border-b flex-shrink-0 ${hdrBord}`}>
          {typeMeta
            ? <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: typeMeta.accentBg, color: typeMeta.accent, border: `1px solid ${typeMeta.accentBorder}`, boxShadow: `0 0 20px ${typeMeta.glow}` }}>{typeMeta.icon}</div>
            : <div className={`p-2.5 rounded-xl flex-shrink-0 border ${d ? 'bg-white/[0.05] border-white/[0.09] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
          }
          <div className="flex-1 min-w-0">
            <h2 className={`text-sm font-black ${tp}`}>{status === 'success' ? 'Request Submitted' : typeMeta?.label ?? 'New Ticket'}</h2>
            <p className={`text-[11px] truncate ${ts}`}>{status === 'success' ? 'Under review by your manager' : typeMeta?.desc ?? 'Choose a ticket type'}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg flex-shrink-0 transition-all ${closeBtn}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {status === 'success' ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-18 h-18 rounded-full flex items-center justify-center mb-5 border border-emerald-500/25 bg-emerald-500/10"
                style={{ boxShadow: '0 0 40px rgba(52,211,153,0.2)', width: 72, height: 72 }}>
                <svg className="w-9 h-9 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className={`text-lg font-black mb-1.5 ${tp}`}>Ticket Raised!</p>
              <p className={`text-sm mb-7 ${ts}`}>Your manager will review within 24 hours.</p>
              <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${d ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-100 bg-slate-50'}`}>
                <span className={`text-[9px] uppercase tracking-widest font-bold ${ts}`}>Ticket ID</span>
                <span className={`font-mono font-bold text-sm ${tp}`}>{tid}</span>
              </div>
            </div>
          ) : (
            <>
              {!form.type && (
                <div className="space-y-2.5">
                  {TICKET_TYPES.map(t => (
                    <button key={t.id!} onClick={() => up('type', t.id!)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] group"
                      style={{ background: t.accentBg, borderColor: t.accentBorder }}>
                      <div className="p-2.5 rounded-xl flex-shrink-0 transition-all group-hover:scale-110"
                        style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, boxShadow: `0 0 16px ${t.glow}` }}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${d ? 'text-white' : 'text-slate-900'}`}>{t.label}</p>
                        <p className={`text-[11px] mt-0.5 ${d ? 'text-slate-500' : 'text-slate-500'}`}>{t.desc}</p>
                      </div>
                      <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: d ? '#334155' : '#cbd5e1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
              {form.type === 'leave' && (
                <>
                  <Select label="Leave Type" id="lt" value={form.leaveType} onChange={v => up('leaveType', v)} required isDark={d}
                    options={[{ value: 'sick', label: 'Sick Leave' }, { value: 'casual', label: 'Casual Leave' }, { value: 'annual', label: 'Annual Leave' }, { value: 'emergency', label: 'Emergency Leave' }]} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From Date" id="fd" type="date" value={form.fromDate} onChange={v => up('fromDate', v)} required isDark={d} />
                    <Field label="To Date"   id="td" type="date" value={form.toDate}   onChange={v => up('toDate', v)}   required isDark={d} />
                  </div>
                  <Textarea label="Reason" id="lr" value={form.leaveReason} onChange={v => up('leaveReason', v)} required isDark={d} placeholder="Briefly describe your reason…" />
                  <div className="flex gap-3 p-3.5 rounded-xl border" style={{ background: 'rgba(129,140,248,0.06)', borderColor: 'rgba(129,140,248,0.18)' }}>
                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-indigo-300/80 leading-relaxed">Leave balance: <span className="text-indigo-400 font-semibold">8 days remaining.</span> Reviewed within 24h.</p>
                  </div>
                </>
              )}
              {form.type === 'late_checkin' && (
                <>
                  <div className="flex gap-3 p-3.5 rounded-xl border" style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.18)' }}>
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">For missed punch-ins or late arrivals. <span className="text-amber-400 font-semibold">Misuse may result in disciplinary action.</span></p>
                  </div>
                  <Field label="Date" id="ld" type="date" value={form.lateDate} onChange={v => up('lateDate', v)} required isDark={d} />
                  <Field label="Actual Arrival Time" id="at" type="time" value={form.actualArrivalTime} onChange={v => up('actualArrivalTime', v)} required isDark={d} />
                  <Textarea label="Reason" id="lrr" value={form.lateReason} onChange={v => up('lateReason', v)} required isDark={d} placeholder="e.g. Traffic, missed bus, family emergency…" />
                </>
              )}
              {form.type === 'overtime' && (
                <>
                  <Field label="Date" id="od" type="date" value={form.overtimeDate} onChange={v => up('overtimeDate', v)} required isDark={d} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From" id="of" type="time" value={form.overtimeFrom} onChange={v => up('overtimeFrom', v)} required isDark={d} />
                    <Field label="To"   id="ot" type="time" value={form.overtimeTo}   onChange={v => up('overtimeTo', v)}   required isDark={d} />
                  </div>
                  <Field label="Project / Task" id="op" value={form.overtimeProject} onChange={v => up('overtimeProject', v)} isDark={d} placeholder="Which project were you working on?" />
                  <Textarea label="Reason" id="or" value={form.overtimeReason} onChange={v => up('overtimeReason', v)} required isDark={d} placeholder="Explain why overtime was required…" />
                  <div className="flex gap-3 p-3.5 rounded-xl border" style={{ background: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.18)' }}>
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-emerald-300/80 leading-relaxed">Subject to manager approval. Compensation per HR policy.</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex-shrink-0 flex gap-2.5 ${d ? 'border-white/[0.07]' : 'border-slate-100'}`}>
          {status === 'success' ? (
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${cancelBtn}`}>Close</button>
          ) : (
            <>
              <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${cancelBtn}`}>Cancel</button>
              {form.type && (
                <button onClick={submit} disabled={status === 'submitting'}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                  {status === 'submitting'
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Submit Request</>
                  }
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SupportTicketsPage() {
  const { isDark: d } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TicketType>(null);
  const [tickets, setTickets]     = useState<RecentTicket[]>([]);

  const open = (type: TicketType = null) => { setModalType(type); setModalOpen(true); };

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/employee/tickets', { headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` } });
        const data = await res.json();
        if (data.success) setTickets(data.data.map((t: any) => ({
          id: t.ticketId || t._id, type: t.type,
          label: t.type === 'leave' ? `${t.leaveType || ''} Leave` : t.type === 'late_checkin' ? 'Late Check-in' : 'Overtime',
          date: t.createdAt?.split('T')[0], status: t.status,
        })));
      } catch (err) { console.error(err); }
    })();
  }, []);

  const tp    = d ? 'text-white'     : 'text-slate-900';
  const ts    = d ? 'text-slate-500' : 'text-slate-500';
  const tt    = d ? 'text-slate-600' : 'text-slate-400';
  const card  = d ? 'bg-[#0c0d14]/80 border-white/[0.08]' : 'bg-white/90 border-slate-200/80';
  const thBg  = d ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-100';
  const div   = d ? 'border-white/[0.07]' : 'border-slate-100';
  const hover = d ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/70';

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold tracking-[0.4em] text-indigo-400 uppercase mb-1.5">Relay</p>
          <h1 className={`text-2xl font-black tracking-tight ${tp}`}>Support Tickets</h1>
          <p className={`text-sm mt-1 ${ts}`}>Leave, corrections & overtime requests</p>
        </div>
        <button onClick={() => open(null)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Ticket
        </button>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TICKET_TYPES.map(t => (
          <button key={t.id!} onClick={() => open(t.id)}
            className="group relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            style={{ background: t.accentBg, borderColor: t.accentBorder, boxShadow: d ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.05)' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg,${t.accent},${t.accent}40,transparent)` }} />
            {/* BG glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.1] blur-xl transition-opacity group-hover:opacity-[0.18]"
              style={{ background: t.accent }} />
            <div className="p-2.5 rounded-xl flex-shrink-0 transition-all group-hover:scale-110"
              style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.accentBorder}`, boxShadow: `0 0 20px ${t.glow}` }}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <p className={`text-sm font-bold ${tp}`}>{t.label}</p>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${ts}`}>{t.desc}</p>
            </div>
            <svg className="w-4 h-4 flex-shrink-0 transition-all group-hover:translate-x-0.5 relative z-10"
              style={{ color: d ? '#334155' : '#cbd5e1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"
              style={{ boxShadow: '0 0 8px #818cf8, 0 0 3px #818cf8' }} />
            <h2 className={`text-sm font-bold ${tp}`}>My Tickets</h2>
          </div>
          <span className={`text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full ${d ? 'bg-white/[0.04] border border-white/[0.08] text-slate-500' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
            {tickets.length} total
          </span>
        </div>

        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${card}`}
          style={{ boxShadow: d ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Table header */}
          <div className={`hidden sm:grid grid-cols-12 px-6 py-3 border-b ${thBg}`}>
            {[['Ticket ID', 'col-span-3'], ['Type', 'col-span-4'], ['Date', 'col-span-3'], ['Status', 'col-span-2 text-right']].map(([h, c]) => (
              <div key={h} className={`${c} text-[9px] font-bold tracking-[0.25em] ${ts} uppercase`}>{h}</div>
            ))}
          </div>

          {tickets.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 gap-3 ${ts}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${d ? 'bg-white/[0.03] border border-white/[0.07]' : 'bg-slate-50 border border-slate-100'}`}>
                <svg className="w-7 h-7 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <p className="text-sm font-medium">No tickets yet</p>
              <button onClick={() => open(null)} className="text-indigo-400 text-xs hover:underline transition-colors">Create your first ticket →</button>
            </div>
          ) : (
            tickets.map((tk, i) => {
              const meta = TYPE_META[tk.type];
              const st   = STATUS_CFG[tk.status];
              return (
                <div key={tk.id} className={`grid grid-cols-12 items-center px-6 py-4 transition-all ${hover} ${i < tickets.length - 1 ? `border-b ${div}` : ''}`}>
                  <div className="col-span-3">
                    <span className={`text-[11px] font-mono ${ts}`}>{tk.id}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                      style={{ background: meta?.bg, borderColor: meta?.border, color: meta?.accent }}>
                      {meta?.label ?? tk.type}
                    </span>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <span className={`text-[11px] font-mono ${tt}`}>{tk.date}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5"
                      style={{ background: st.bg, borderColor: st.border, color: st.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color, boxShadow: `0 0 6px ${st.glow}` }} />
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <TicketModal open={modalOpen} onClose={() => setModalOpen(false)} initialType={modalType} onSubmitted={t => setTickets(p => [t, ...p])} />
    </div>
  );
}