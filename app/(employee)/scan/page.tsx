'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { useTheme } from '../ThemeContext';

type Mode = 'show-qr' | 'success' | 'error';

export default function ScanPage() {
  const { isDark: d } = useTheme();
  const [mode, setMode]         = useState<Mode>('show-qr');
  const [message, setMessage]   = useState('');
  const [downloading, setDown]  = useState(false);
  const [employee, setEmployee] = useState<{ name: string; employeeId: string; qrCode?: string; department?: string } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = localStorage.getItem('employee');
    if (s) setEmployee(JSON.parse(s));
  }, []);

  const reset = () => { setMode('show-qr'); setMessage(''); };

  const downloadQR = async () => {
    if (!qrRef.current) return;
    setDown(true);
    try {
      const url  = await toPng(qrRef.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `${employee?.name || 'employee'}-qr.png`;
      link.href     = url;
      link.click();
    } catch (err) { console.error(err); }
    finally { setDown(false); }
  };

  const tp    = d ? 'text-white'     : 'text-slate-900';
  const ts    = d ? 'text-slate-500' : 'text-slate-500';
  const card  = d
    ? 'bg-[#0c0d14]/95 border-white/[0.1]'
    : 'bg-white border-slate-200/80 shadow-2xl shadow-slate-200/60';
  const secBtn = d
    ? 'border border-white/[0.1] bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]'
    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-sm';

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.4em] text-indigo-400 uppercase mb-1.5">Access QR</p>
        <h1 className={`text-2xl font-black tracking-tight ${tp}`}>Identity Pass</h1>
        <p className={`text-sm mt-1 ${ts}`}>Present this code at the attendance terminal</p>
      </div>

      <div className="max-w-sm mx-auto">

        {/* Show QR */}
        {mode === 'show-qr' && (
          <div className="relative">
            {/* Multi-layer glow */}
            <div className="absolute -inset-[3px] rounded-3xl opacity-40 blur-md"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
            <div className="absolute -inset-[1px] rounded-3xl opacity-60"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />

            <div className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${card}`}>
              {/* Rainbow top bar */}
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7,#ec4899,#f97316)' }} />

              {/* Card header */}
              <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b transition-colors ${d ? 'border-white/[0.07]' : 'border-slate-100'}`}>
                <div>
                  <p className="text-[8px] font-black tracking-[0.6em] text-indigo-400 uppercase">Academy Pro</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${ts}`}>Employee Identity Card</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#0a0b10] flex items-center justify-center"
                  style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 0 16px rgba(99,102,241,0.3)' }}>
                  <span className="text-[11px] font-black text-white italic">IT</span>
                </div>
              </div>

              {employee?.qrCode ? (
                <div className="px-6 py-7 flex flex-col items-center">
                  {/* QR frame with animated border */}
                  <div className="relative p-[2px] rounded-2xl"
                    style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.8),rgba(168,85,247,0.8),rgba(236,72,153,0.6))' }}>
                    <div className="absolute inset-0 rounded-2xl opacity-50 blur-sm"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
                    <div ref={qrRef} className="relative bg-white p-4 rounded-2xl">
                      <Image src={employee.qrCode} alt="QR Code" width={200} height={200} className="rounded-xl" priority />
                    </div>
                    {/* Corner scan brackets */}
                    {[
                      'top-1 left-1 border-t-[2.5px] border-l-[2.5px] rounded-tl-xl',
                      'top-1 right-1 border-t-[2.5px] border-r-[2.5px] rounded-tr-xl',
                      'bottom-1 left-1 border-b-[2.5px] border-l-[2.5px] rounded-bl-xl',
                      'bottom-1 right-1 border-b-[2.5px] border-r-[2.5px] rounded-br-xl',
                    ].map((c, i) => (
                      <div key={i} className={`absolute w-6 h-6 ${c}`}
                        style={{ borderColor: '#818cf8', filter: 'drop-shadow(0 0 4px #818cf8)' }} />
                    ))}
                  </div>

                  {/* Scan status pill */}
                  <div className="flex items-center gap-2 mt-5 px-4 py-2 rounded-full border"
                    style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)', boxShadow: '0 0 20px rgba(52,211,153,0.15)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-[0.2em]">SCAN READY</span>
                  </div>

                  {/* Employee info */}
                  <div className="text-center mt-4 mb-6 w-full">
                    <h2 className={`text-lg font-black tracking-wide uppercase ${tp}`}>{employee.name}</h2>
                    <div className="flex items-center justify-center gap-3 mt-2.5">
                      <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border"
                        style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8', boxShadow: '0 0 12px rgba(99,102,241,0.2)' }}>
                        {employee.employeeId}
                      </span>
                      {employee.department && (
                        <span className={`text-[10px] font-semibold ${ts}`}>{employee.department}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={downloadQR} disabled={downloading}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                      {downloading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      }
                      Save PNG
                    </button>
                    <button onClick={reset} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 ${secBtn}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Refresh
                    </button>
                  </div>

                  <p className={`mt-5 text-[9px] font-mono text-center uppercase tracking-[0.25em] leading-relaxed ${d ? 'text-slate-700' : 'text-slate-300'}`}>
                    Secured · Internal Use Only
                  </p>
                </div>
              ) : (
                <div className={`py-20 flex flex-col items-center gap-4 px-6 ${ts}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${d ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-100 bg-slate-50'}`}>
                    <svg className="w-8 h-8 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold text-sm ${tp}`}>No QR Profile Found</p>
                    <p className={`text-xs mt-1 ${ts}`}>Contact your HR administrator.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {mode === 'success' && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-3xl opacity-50 blur-sm"
              style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }} />
            <div className={`relative rounded-3xl border overflow-hidden ${card}`}>
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#10b981,#34d399,#a7f3d0)' }} />
              <div className="p-10 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/25 bg-emerald-500/10"
                  style={{ boxShadow: '0 0 50px rgba(52,211,153,0.2), 0 0 20px rgba(52,211,153,0.1)' }}>
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className={`text-xl font-black mb-2 ${tp}`}>Check-in Logged!</h2>
                <p className={`text-sm mb-8 ${ts}`}>{message || 'Attendance recorded successfully.'}</p>
                <button onClick={reset} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] ${secBtn}`}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {mode === 'error' && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-3xl opacity-40 blur-sm"
              style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)' }} />
            <div className={`relative rounded-3xl border overflow-hidden ${card}`}>
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f87171,#fca5a5)' }} />
              <div className="p-10 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/25 bg-rose-500/10"
                  style={{ boxShadow: '0 0 50px rgba(248,113,113,0.15), 0 0 20px rgba(248,113,113,0.1)' }}>
                  <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className={`text-xl font-black mb-2 ${tp}`}>Scan Failed</h2>
                <p className={`text-sm mb-8 ${ts}`}>{message || 'Something went wrong. Please try again.'}</p>
                <button onClick={reset}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}