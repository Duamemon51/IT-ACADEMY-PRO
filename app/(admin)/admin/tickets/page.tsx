'use client';
import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // Leave fields
  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  leaveReason?: string;
  // Late check-in fields
  lateDate?: string;
  actualArrivalTime?: string;
  lateReason?: string;
  // Overtime fields
  overtimeDate?: string;
  overtimeFrom?: string;
  overtimeTo?: string;
  overtimeReason?: string;
  overtimeProject?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TicketType, { label: string; badgeClass: string; iconClass: string; iconBg: string }> = {
  leave: {
    label: 'Leave Request',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconClass: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  late_checkin: {
    label: 'Late Check-in',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconClass: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  overtime: {
    label: 'Overtime Claim',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; cls: string; dotClass: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',    dotClass: 'bg-amber-400' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dotClass: 'bg-emerald-400' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border border-red-500/20',          dotClass: 'bg-red-400' },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const LeaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const typeIcon = (type: TicketType) => {
  if (type === 'leave') return <LeaveIcon />;
  if (type === 'late_checkin') return <ClockIcon />;
  return <ZapIcon />;
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  ticket,
  onClose,
  onAction,
  actionLoading,
}: {
  ticket: Ticket;
  onClose: () => void;
  onAction: (id: string, status: 'approved' | 'rejected') => void;
  actionLoading: string | null;
}) {
  const typeCfg = TYPE_CONFIG[ticket.type];
  const stCfg = STATUS_CONFIG[ticket.status];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const Field = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
    ) : null;

  const emp = ticket.employeeId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-modal-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800 flex-shrink-0">
          <div className={`p-2 rounded-xl ${typeCfg.iconBg} ${typeCfg.iconClass}`}>
            {typeIcon(ticket.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base">{typeCfg.label}</h2>
            <p className="text-slate-500 text-xs font-mono">{ticket.ticketId}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${stCfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dotClass}`} />
            {stCfg.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Employee Info */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-white text-sm font-bold">{emp?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{emp?.name}</p>
              <p className="text-slate-400 text-xs">{emp?.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500">Employee ID</p>
              <p className="text-slate-300 text-xs font-mono font-semibold">{emp?.employeeId}</p>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Details</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Leave */}
              {ticket.type === 'leave' && (
                <>
                  <Field label="Leave Type" value={ticket.leaveType ? `${ticket.leaveType.charAt(0).toUpperCase() + ticket.leaveType.slice(1)} Leave` : undefined} />
                  <Field label="From Date" value={ticket.fromDate} />
                  <Field label="To Date" value={ticket.toDate} />
                  <Field label="Submitted" value={ticket.createdAt?.split('T')[0]} />
                </>
              )}

              {/* Late check-in */}
              {ticket.type === 'late_checkin' && (
                <>
                  <Field label="Date" value={ticket.lateDate} />
                  <Field label="Actual Arrival" value={ticket.actualArrivalTime} />
                  <Field label="Submitted" value={ticket.createdAt?.split('T')[0]} />
                </>
              )}

              {/* Overtime */}
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

            {/* Reason */}
            {(ticket.leaveReason || ticket.lateReason || ticket.overtimeReason) && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</p>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {ticket.leaveReason || ticket.lateReason || ticket.overtimeReason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0 flex gap-3">
          {ticket.status === 'pending' ? (
            <>
              <button
                onClick={() => onAction(ticket._id, 'rejected')}
                disabled={actionLoading === ticket._id}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === ticket._id ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Reject
              </button>
              <button
                onClick={() => onAction(ticket._id, 'approved')}
                disabled={actionLoading === ticket._id}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === ticket._id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Approve
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-all border border-slate-700">
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modal-in 0.18s ease-out forwards; }
      `}</style>
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
      const res = await fetch('/api/admin/tickets', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === id ? { ...t, status } : t))
        );
        setSelectedTicket((prev) => prev?._id === id ? { ...prev, status } : prev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  // Stats
  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    approved: tickets.filter((t) => t.status === 'approved').length,
    rejected: tickets.filter((t) => t.status === 'rejected').length,
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage leave, attendance, and overtime requests</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all border border-slate-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, cls: 'text-white', bg: 'bg-slate-800/50 border-slate-700/50' },
          { label: 'Pending', value: stats.pending, cls: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Approved', value: stats.approved, cls: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Rejected', value: stats.rejected, cls: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status filter */}
        <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterStatus === s
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['all', 'leave', 'late_checkin', 'overtime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t === 'all' ? 'All Types' : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center text-slate-600 text-xs">
          {filtered.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-800 bg-slate-800/30">
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket ID</div>
          <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</div>
          <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Date</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-600">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">Loading tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-sm">No tickets found</p>
          </div>
        ) : (
          filtered.map((ticket, i) => {
            const typeCfg = TYPE_CONFIG[ticket.type];
            const stCfg = STATUS_CONFIG[ticket.status];
            return (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                  i < filtered.length - 1 ? 'border-b border-slate-800' : ''
                }`}
              >
                <div className="col-span-2">
                  <span className="text-xs font-mono text-slate-400">{ticket.ticketId}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {ticket.employeeId?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{ticket.employeeId?.name}</p>
                    <p className="text-xs text-slate-500 truncate hidden sm:block">{ticket.employeeId?.employeeId}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 w-fit ${typeCfg.badgeClass}`}>
                    <span className={typeCfg.iconClass}>{typeIcon(ticket.type)}</span>
                    {typeCfg.label}
                  </span>
                </div>
                <div className="col-span-2 hidden sm:block">
                  <span className="text-xs text-slate-500">{ticket.createdAt?.split('T')[0]}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${stCfg.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dotClass}`} />
                    {stCfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
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