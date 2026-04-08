'use client';
// app/(admin)/admin/tickets/page.tsx
import { useState, useEffect } from 'react';

type TicketType = 'leave' | 'late_checkin' | 'overtime';
type TicketStatus = 'pending' | 'approved' | 'rejected';

interface Ticket {
  _id: string;
  ticketId: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    department?: string;
  };
  type: TicketType;
  status: TicketStatus;
  createdAt: string;
  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  leaveReason?: string;
  lateDate?: string;
  actualArrivalTime?: string;
  lateReason?: string;
  overtimeDate?: string;
  overtimeFrom?: string;
  overtimeTo?: string;
  overtimeReason?: string;
  overtimeProject?: string;
}

const TYPE_CONFIG: Record<TicketType, { label: string; badge: string; iconBg: string; iconColor: string; accent: string }> = {
  leave:       { label: 'Leave Request',  badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    iconBg: 'bg-blue-500/15',    iconColor: 'text-blue-400',    accent: 'from-blue-500 to-indigo-500' },
  late_checkin:{ label: 'Late Check-in',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-400',   accent: 'from-amber-500 to-orange-500' },
  overtime:    { label: 'Overtime Claim', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', accent: 'from-emerald-500 to-teal-500' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',    dot: 'bg-amber-400 animate-pulse' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border border-red-500/20',          dot: 'bg-red-400' },
};

const LeaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ZapIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const typeIcon = (type: TicketType) => {
  if (type === 'leave') return <LeaveIcon />;
  if (type === 'late_checkin') return <ClockIcon />;
  return <ZapIcon />;
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ ticket, onClose, onAction, actionLoading }: {
  ticket: Ticket;
  onClose: () => void;
  onAction: (id: string, status: 'approved' | 'rejected') => void;
  actionLoading: string | null;
}) {
  const typeCfg = TYPE_CONFIG[ticket.type];
  const stCfg = STATUS_CONFIG[ticket.status];
  const emp = ticket.employeeId;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [onClose]);

  const Field = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes overlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes panelIn { from { opacity: 0; transform: scale(0.94) translateY(20px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        .overlay-in { animation: overlayIn 0.2s ease both; }
        .panel-in { animation: panelIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .glass-blur { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
      `}</style>
      <div className="overlay-in absolute inset-0 bg-black/75 glass-blur" onClick={onClose} />

      <div className="panel-in relative w-full max-w-lg flex flex-col max-h-[90vh] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #111120 0%, #0d0d1a 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
        {/* Top accent line */}
        <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${typeCfg.iconColor}`} style={{ opacity: 0.5 }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className={`p-2.5 rounded-xl ${typeCfg.iconBg} ${typeCfg.iconColor} flex-shrink-0`}>
            {typeIcon(ticket.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold">{typeCfg.label}</h2>
            <p className="text-slate-600 text-[11px] font-mono mt-0.5">{ticket.ticketId}</p>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${stCfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
            {stCfg.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/8 transition-all ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Employee */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-white text-sm font-bold">{emp?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{emp?.name}</p>
              <p className="text-slate-500 text-xs">{emp?.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-slate-600 text-[10px] uppercase tracking-wider">Emp ID</p>
              <code className="text-blue-400 text-xs font-mono font-semibold">{emp?.employeeId}</code>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Request Details</p>
            <div className="grid grid-cols-2 gap-4 bg-white/2 border border-white/5 rounded-xl p-4">
              {ticket.type === 'leave' && (
                <>
                  <Field label="Leave Type" value={ticket.leaveType ? `${ticket.leaveType.charAt(0).toUpperCase() + ticket.leaveType.slice(1)} Leave` : undefined} />
                  <Field label="From Date" value={ticket.fromDate} />
                  <Field label="To Date" value={ticket.toDate} />
                  <Field label="Submitted" value={ticket.createdAt?.split('T')[0]} />
                </>
              )}
              {ticket.type === 'late_checkin' && (
                <>
                  <Field label="Date" value={ticket.lateDate} />
                  <Field label="Actual Arrival" value={ticket.actualArrivalTime} />
                  <Field label="Submitted" value={ticket.createdAt?.split('T')[0]} />
                </>
              )}
              {ticket.type === 'overtime' && (
                <>
                  <Field label="Date" value={ticket.overtimeDate} />
                  <Field label="From" value={ticket.overtimeFrom} />
                  <Field label="To" value={ticket.overtimeTo} />
                  <Field label="Project" value={ticket.overtimeProject} />
                  <Field label="Submitted" value={ticket.createdAt?.split('T')[0]} />
                </>
              )}
            </div>

            {(ticket.leaveReason || ticket.lateReason || ticket.overtimeReason) && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Reason</p>
                <div className="bg-white/2 border border-white/5 rounded-xl p-3.5" style={{ borderLeft: `2px solid rgba(99,102,241,0.3)` }}>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {ticket.leaveReason || ticket.lateReason || ticket.overtimeReason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {ticket.status === 'pending' ? (
            <>
              <button
                onClick={() => onAction(ticket._id, 'rejected')}
                disabled={actionLoading === ticket._id}
                className="flex-1 py-2.5 rounded-xl bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === ticket._id
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                }
                Reject
              </button>
              <button
                onClick={() => onAction(ticket._id, 'approved')}
                disabled={actionLoading === ticket._id}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {actionLoading === ticket._id
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                }
                Approve
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-slate-300 text-sm font-medium transition-all border border-white/8">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TicketType | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tickets', { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
        setSelectedTicket(prev => prev?._id === id ? { ...prev, status } : prev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    approved: tickets.filter(t => t.status === 'approved').length,
    rejected: tickets.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .anim-in { animation: slideUp 0.35s ease both; }
        .ticket-row { transition: all 0.15s ease; cursor: pointer; }
        .ticket-row:hover { background: rgba(255,255,255,0.03); }
        .ticket-row:active { transform: scale(0.995); }
        .filter-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between anim-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review leave, attendance & overtime requests</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/4 hover:bg-white/7 text-slate-400 hover:text-white text-sm font-medium rounded-xl transition-all border border-white/7 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-in" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Total', value: stats.total, cls: 'text-white', bg: 'bg-white/3', border: 'border-white/7' },
          { label: 'Pending', value: stats.pending, cls: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/15' },
          { label: 'Approved', value: stats.approved, cls: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/15' },
          { label: 'Rejected', value: stats.rejected, cls: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/15' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg} ${s.border}`}>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">{s.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center anim-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`filter-btn px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filterStatus === s ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['all', 'leave', 'late_checkin', 'overtime'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`filter-btn px-3 py-1.5 rounded-lg text-xs font-medium ${filterType === t ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              {t === 'all' ? 'All Types' : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-slate-700 text-xs">{filtered.length} of {tickets.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden anim-in" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.08)', animationDelay: '0.15s' }}>
        {/* Head */}
        <div className="grid grid-cols-12 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
          {[['2', 'Ticket ID'], ['3', 'Employee'], ['3', 'Type'], ['2', 'Date'], ['2', 'Status']].map(([cols, label]) => (
            <div key={label} className={`col-span-${cols} text-[10px] font-bold text-slate-600 uppercase tracking-wider ${label === 'Status' ? 'text-right' : ''} ${label === 'Date' ? 'hidden sm:block' : ''}`}>
              {label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-600">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
            </div>
            <p className="text-sm">Loading tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-600">
            <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            <p className="text-sm text-slate-400">No tickets found</p>
          </div>
        ) : (
          filtered.map((ticket, i) => {
            const typeCfg = TYPE_CONFIG[ticket.type];
            const stCfg = STATUS_CONFIG[ticket.status];
            return (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className="ticket-row grid grid-cols-12 items-center px-5 py-4"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
              >
                <div className="col-span-2">
                  <span className="text-[11px] font-mono text-slate-500">{ticket.ticketId}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                    <span className="text-white text-[11px] font-bold">{ticket.employeeId?.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{ticket.employeeId?.name}</p>
                    <p className="text-[11px] text-slate-600 truncate hidden sm:block font-mono">{ticket.employeeId?.employeeId}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 w-fit ${typeCfg.badge}`}>
                    <span className={typeCfg.iconColor} style={{ display: 'flex', width: 14, height: 14 }}>{typeIcon(ticket.type)}</span>
                    {typeCfg.label}
                  </span>
                </div>
                <div className="col-span-2 hidden sm:block">
                  <span className="text-[11px] text-slate-600">{ticket.createdAt?.split('T')[0]}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${stCfg.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
                    {stCfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedTicket && (
        <DetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}