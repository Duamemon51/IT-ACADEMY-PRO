'use client';
import { useState, useEffect, useRef } from 'react';

type TicketType = 'leave' | 'late_checkin' | 'overtime' | null;
type LeaveType = 'sick' | 'casual' | 'annual' | 'emergency';
type Status = 'idle' | 'submitting' | 'success';

interface TicketForm {
  type: TicketType;
  leaveType: LeaveType | '';
  fromDate: string;
  toDate: string;
  leaveReason: string;
  lateDate: string;
  actualArrivalTime: string;
  lateReason: string;
  overtimeDate: string;
  overtimeFrom: string;
  overtimeTo: string;
  overtimeReason: string;
  overtimeProject: string;
}

const initialForm: TicketForm = {
  type: null,
  leaveType: '',
  fromDate: '',
  toDate: '',
  leaveReason: '',
  lateDate: '',
  actualArrivalTime: '',
  lateReason: '',
  overtimeDate: '',
  overtimeFrom: '',
  overtimeTo: '',
  overtimeReason: '',
  overtimeProject: '',
};

const TICKET_TYPES = [
  {
    id: 'leave' as TicketType,
    label: 'Leave Request',
    description: 'Apply for planned or emergency leave',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    iconBg: 'bg-blue-500/15',
    iconClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'late_checkin' as TicketType,
    label: 'Late Check-in',
    description: 'Request time correction for missed or late punch',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    iconBg: 'bg-amber-500/15',
    iconClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'overtime' as TicketType,
    label: 'Overtime Claim',
    description: 'Log extra hours worked beyond your schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
];

interface RecentTicket {
  id: string;
  type: string;
  label: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
}

const INITIAL_TICKETS: RecentTicket[] = [
  { id: 'TKT-0041', type: 'leave', label: 'Casual Leave', date: '2025-07-01', status: 'approved' },
  { id: 'TKT-0038', type: 'late_checkin', label: 'Late Check-in Correction', date: '2025-06-28', status: 'pending' },
  { id: 'TKT-0035', type: 'overtime', label: 'Overtime Claim', date: '2025-06-22', status: 'rejected' },
];

const STATUS_CONFIG = {
  approved: { label: 'Approved', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  pending:  { label: 'Pending',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

const TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  leave:        { label: 'Leave Request',  badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  late_checkin: { label: 'Late Check-in',  badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  overtime:     { label: 'Overtime Claim', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

// ─── Field components ─────────────────────────────────────────────────────────

function InputField({ label, id, type = 'text', value, onChange, placeholder, required }: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-800 transition-all"
      />
    </div>
  );
}

function TextAreaField({ label, id, value, onChange, placeholder, required }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-800 transition-all resize-none"
      />
    </div>
  );
}

function SelectField({ label, id, value, onChange, options, required }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled>Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TicketModal({ open, onClose, initialType, onSubmitted }: {
  open: boolean;
  onClose: () => void;
  initialType: TicketType;
  onSubmitted: (ticket: RecentTicket) => void;
}) {
  const [form, setForm] = useState<TicketForm>({ ...initialForm, type: initialType });
  const [status, setStatus] = useState<Status>('idle');
  const [submittedId, setSubmittedId] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...initialForm, type: initialType });
      setStatus('idle');
      setSubmittedId('');
    }
  }, [open, initialType]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const update = (key: keyof TicketForm, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const selectedType = TICKET_TYPES.find((t) => t.id === form.type);

  const handleSubmit = async () => {
  setStatus("submitting");

  try {
    const res = await fetch("/api/employee/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) throw new Error();

    setSubmittedId(data.data._id);
    setStatus("success");

    onSubmitted({
      id: data.data._id,
      type: form.type!,
      label: "Request",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    });
  } catch (err) {
    alert("Error submitting ticket");
    setStatus("idle");
  }
};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-modal-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800 flex-shrink-0">
          {selectedType ? (
            <div className={`p-2 rounded-xl ${selectedType.iconBg} ${selectedType.iconClass}`}>
              {selectedType.icon}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base">
              {status === 'success' ? 'Request Submitted' : selectedType?.label ?? 'New Support Ticket'}
            </h2>
            <p className="text-slate-500 text-xs truncate">
              {status === 'success' ? 'Your ticket is under review' : selectedType?.description ?? 'Select a request type below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {status === 'success' ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-1">Ticket Raised Successfully!</p>
              <p className="text-slate-400 text-sm mb-5">Your manager will review this request within 24 hours.</p>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-6 py-3 inline-flex items-center gap-3">
                <span className="text-slate-500 text-xs">Ticket ID</span>
                <span className="text-white font-mono font-bold">{submittedId}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Type selector — shown only when no type is pre-selected */}
              {!form.type && (
                <div className="space-y-2">
                  {TICKET_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update('type', t.id!)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${t.bgClass}`}
                    >
                      <div className={`p-2 rounded-lg ${t.iconBg} ${t.iconClass} flex-shrink-0`}>{t.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{t.label}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{t.description}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Leave form */}
              {form.type === 'leave' && (
                <>
                  <SelectField
                    label="Leave Type" id="leaveType" value={form.leaveType}
                    onChange={(v) => update('leaveType', v)} required
                    options={[
                      { value: 'sick', label: 'Sick Leave' },
                      { value: 'casual', label: 'Casual Leave' },
                      { value: 'annual', label: 'Annual Leave' },
                      { value: 'emergency', label: 'Emergency Leave' },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="From Date" id="fromDate" type="date" value={form.fromDate} onChange={(v) => update('fromDate', v)} required />
                    <InputField label="To Date" id="toDate" type="date" value={form.toDate} onChange={(v) => update('toDate', v)} required />
                  </div>
                  <TextAreaField
                    label="Reason" id="leaveReason" value={form.leaveReason}
                    onChange={(v) => update('leaveReason', v)} required
                    placeholder="Briefly describe the reason for your leave request..."
                  />
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3.5 flex gap-3">
                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-300/80 leading-relaxed">
                      Leave balance: <span className="text-blue-300 font-semibold">8 days remaining.</span> Requests are reviewed within 24 hours.
                    </p>
                  </div>
                </>
              )}

              {/* Late check-in form */}
              {form.type === 'late_checkin' && (
                <>
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 flex gap-3">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      Use this for missed punch-ins or late arrivals. Your manager will verify and update the record.{' '}
                      <span className="text-amber-300 font-semibold">Misuse may result in disciplinary action.</span>
                    </p>
                  </div>
                  <InputField label="Date" id="lateDate" type="date" value={form.lateDate} onChange={(v) => update('lateDate', v)} required />
                  <InputField label="Actual Arrival Time" id="actualArrivalTime" type="time" value={form.actualArrivalTime} onChange={(v) => update('actualArrivalTime', v)} required />
                  <TextAreaField
                    label="Reason for Late Check-in" id="lateReason" value={form.lateReason}
                    onChange={(v) => update('lateReason', v)} required
                    placeholder="e.g. Traffic jam, missed the bus, family emergency..."
                  />
                </>
              )}

              {/* Overtime form */}
              {form.type === 'overtime' && (
                <>
                  <InputField label="Date" id="overtimeDate" type="date" value={form.overtimeDate} onChange={(v) => update('overtimeDate', v)} required />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="From" id="overtimeFrom" type="time" value={form.overtimeFrom} onChange={(v) => update('overtimeFrom', v)} required />
                    <InputField label="To" id="overtimeTo" type="time" value={form.overtimeTo} onChange={(v) => update('overtimeTo', v)} required />
                  </div>
                  <InputField label="Project / Task Name" id="overtimeProject" value={form.overtimeProject} onChange={(v) => update('overtimeProject', v)} placeholder="Which project were you working on?" />
                  <TextAreaField
                    label="Reason" id="overtimeReason" value={form.overtimeReason}
                    onChange={(v) => update('overtimeReason', v)} required
                    placeholder="Explain why overtime was required and what work was done..."
                  />
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 flex gap-3">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">
                      Overtime claims are subject to manager approval. Compensation is calculated per HR policy.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0 flex gap-3">
          {status === 'success' ? (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-all border border-slate-700">
              Close
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-700">
                Cancel
              </button>
              {form.type && (
                <button
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Request
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-modal-in { animation: modal-in 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportTicketsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TicketType>(null);
const [tickets, setTickets] = useState<RecentTicket[]>([]);

  const openModal = (type: TicketType = null) => {
    setModalType(type);
    setModalOpen(true);
  };
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("/api/employee/tickets", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          const formatted = data.data.map((t: any) => ({
            id: t.ticketId || t._id,
            type: t.type,
            label:
              t.type === "leave"
                ? `${t.leaveType || ""} Leave`
                : t.type === "late_checkin"
                ? "Late Check-in"
                : "Overtime",
            date: t.createdAt?.split("T")[0],
            status: t.status,
          }));

          setTickets(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTickets();
  }, []);
  const handleSubmitted = (ticket: RecentTicket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Raise leave, attendance correction, or overtime requests</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {TICKET_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => openModal(t.id)}
            className={`group flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] ${t.bgClass}`}
          >
            <div className={`p-2.5 rounded-xl ${t.iconBg} ${t.iconClass} flex-shrink-0`}>{t.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{t.label}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{t.description}</p>
            </div>
            <svg className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400">My Tickets</h2>
          <span className="text-xs text-slate-600">{tickets.length} total</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table head */}
          <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-800 bg-slate-800/30">
            <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket ID</div>
            <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</div>
            <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Date</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</div>
          </div>

          {/* Rows */}
          {tickets.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-slate-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-sm">No tickets yet. Click <span className="text-blue-400">New Ticket</span> to get started.</p>
            </div>
          ) : (
            tickets.map((ticket, i) => {
              const meta = TYPE_META[ticket.type];
              const st = STATUS_CONFIG[ticket.status];
              return (
                <div
                  key={ticket.id}
                  className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-slate-800/30 transition-colors cursor-default ${i < tickets.length - 1 ? 'border-b border-slate-800' : ''}`}
                >
                  <div className="col-span-3">
                    <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
                  </div>
                  <div className="col-span-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${meta?.badgeClass}`}>
                      {meta?.label ?? ticket.type}
                    </span>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <span className="text-xs text-slate-500">{ticket.date}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      <TicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}