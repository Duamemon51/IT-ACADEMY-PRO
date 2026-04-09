'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { useTheme } from '../ThemeContext';

type Mode = 'show-qr' | 'camera-live' | 'selfie-preview' | 'success' | 'error';

export default function ScanPage() {
  const { isDark: d } = useTheme();
  const [mode, setMode]              = useState<Mode>('show-qr');
  const [message, setMessage]        = useState('');
  const [downloading, setDown]       = useState(false);
  const [uploading, setUploading]    = useState(false);
  const [capturedImage, setCaptured] = useState<string | null>(null);
  const [camError, setCamError]      = useState('');
  const [countdown, setCountdown]    = useState<number | null>(null);
  const [attendanceAction, setAttendanceAction] = useState<'check-in' | 'check-out' | null>(null);
  const [employee, setEmployee]      = useState<{
    name: string; employeeId: string; qrCode?: string; department?: string;
  } | null>(null);

  const qrRef      = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const countRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = localStorage.getItem('employee');
    if (s) setEmployee(JSON.parse(s));
  }, []);

  useEffect(() => {
    if (mode !== 'camera-live') stopCamera();
  }, [mode]);

  useEffect(() => () => {
    stopCamera();
    if (countRef.current) clearInterval(countRef.current);
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const reset = () => {
    setMode('show-qr');
    setMessage('');
    setCaptured(null);
    setCamError('');
    setCountdown(null);
    setAttendanceAction(null);
    if (countRef.current) clearInterval(countRef.current);
  };

  const startCamera = async () => {
    setCamError('');
    setCaptured(null);
    setMode('camera-live');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError')
        setCamError('Camera access was denied. Please allow camera permissions in your browser settings.');
      else if (e.name === 'NotFoundError')
        setCamError('No camera device found on this device.');
      else
        setCamError('Unable to start camera. Please try again.');
    }
  };

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const W = video.videoWidth  || 640;
    const H = video.videoHeight || 480;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCaptured(dataUrl);
    stopCamera();
    setMode('selfie-preview');
  }, []);

  const startCountdown = () => {
    setCountdown(3);
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countRef.current!);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitSelfie = async () => {
    if (!capturedImage || !employee) return;
    setUploading(true);
    try {
      const res  = await fetch('/api/employee/attendance/selfie', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64: capturedImage, employeeId: employee.employeeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceAction(data.action ?? 'check-in');
        setMessage(data.message || 'Attendance recorded successfully!');
        setMode('success');
      } else {
        setMessage(data.error || 'Something went wrong.');
        setMode('error');
      }
    } catch {
      setMessage('Unable to reach server. Please try again.');
      setMode('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadQR = async () => {
    if (!qrRef.current) return;
    setDown(true);
    try {
      const url  = await toPng(qrRef.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `${employee?.name || 'employee'}-qr.png`;
      link.href = url; link.click();
    } catch (err) { console.error(err); }
    finally { setDown(false); }
  };

  const isCheckOut = attendanceAction === 'check-out';

  const tp      = d ? 'text-white'       : 'text-slate-900';
  const ts      = d ? 'text-slate-400'   : 'text-slate-500';
  const card    = d ? 'bg-[#0a0b14] border-white/[0.08]' : 'bg-white border-slate-200/60 shadow-2xl shadow-indigo-100/40';
  const divider = d ? 'border-white/[0.06]' : 'border-slate-100';
  const secBtn  = d
    ? 'border border-white/[0.1] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm';
  const pill    = 'px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase';

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* ── Page header ── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <span className={`${pill} bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
            Identity Pass
          </span>
        </div>
        <h1 className={`text-[26px] font-black tracking-tight leading-tight ${tp}`}>
          Attendance Portal
        </h1>
        <p className={`text-sm mt-1.5 ${ts}`}>
          Scan your QR code or verify with a live selfie
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-sm mx-auto">

        {/* ════════════════════ QR MODE ════════════════════ */}
        {mode === 'show-qr' && (
          <div className="relative">
            <div className="absolute -inset-[3px] rounded-[28px] opacity-30 blur-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
            <div className="absolute -inset-[1px] rounded-[28px] opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />

            <div className={`relative rounded-[26px] border overflow-hidden ${card}`}>
              <div className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7,#ec4899,#f43f5e,#f97316)' }} />

              <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${divider}`}>
                <div>
                  <p className="text-[9px] font-black tracking-[0.55em] text-indigo-400 uppercase">
                    Academy Pro
                  </p>
                  <p className={`text-[11px] font-semibold mt-0.5 ${ts}`}>
                    Employee Identity Card
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.5)' }}>
                  <span className="text-[12px] font-black text-white italic tracking-tight">AP</span>
                </div>
              </div>

              {employee?.qrCode ? (
                <div className="px-6 py-7 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-3xl opacity-20"
                      style={{ background: 'radial-gradient(circle,#a855f7,transparent 70%)' }} />
                    <div className="relative p-[2.5px] rounded-2xl"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
                      <div ref={qrRef} className="bg-white p-4 rounded-[14px]">
                        <Image src={employee.qrCode} alt="QR Code" width={196} height={196} className="rounded-xl block" priority />
                      </div>
                      {[
                        'top-0.5 left-0.5 border-t-2 border-l-2 rounded-tl-2xl',
                        'top-0.5 right-0.5 border-t-2 border-r-2 rounded-tr-2xl',
                        'bottom-0.5 left-0.5 border-b-2 border-l-2 rounded-bl-2xl',
                        'bottom-0.5 right-0.5 border-b-2 border-r-2 rounded-br-2xl',
                      ].map((c, i) => (
                        <div key={i} className={`absolute w-5 h-5 border-white ${c}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-[0.25em]">
                      READY TO SCAN
                    </span>
                  </div>

                  <div className="text-center mt-4 w-full">
                    <h2 className={`text-[17px] font-black tracking-wide ${tp}`}>
                      {employee.name}
                    </h2>
                    <div className="flex items-center justify-center gap-2.5 mt-2">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                        {employee.employeeId}
                      </span>
                      {employee.department && (
                        <span className={`text-[11px] font-medium ${ts}`}>
                          {employee.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full mt-5">
                    <button onClick={downloadQR} disabled={downloading}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.4)' }}>
                      {downloading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                      }
                      Save QR
                    </button>
                    <button onClick={reset}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 ${secBtn}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Refresh
                    </button>
                  </div>

                  <div className={`w-full mt-5 pt-5 border-t ${divider}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex-1 h-px ${d ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${ts}`}>or</span>
                      <div className={`flex-1 h-px ${d ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />
                    </div>
                    <button onClick={startCamera}
                      className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${secBtn}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold leading-tight ${tp}`}>Check In / Out with Selfie</p>
                        <p className={`text-[10px] font-normal ${ts}`}>Live camera verification</p>
                      </div>
                    </button>
                  </div>

                  <p className={`mt-4 text-[9px] font-mono text-center tracking-[0.3em] uppercase ${d ? 'text-slate-800' : 'text-slate-300'}`}>
                    Encrypted · Internal Use Only
                  </p>
                </div>
              ) : (
                <div className="px-6 py-10 flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <svg className="w-9 h-9 text-indigo-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`font-black text-base ${tp}`}>No QR Code Found</p>
                    <p className={`text-xs mt-1.5 leading-relaxed ${ts}`}>
                      Contact your HR administrator,<br />or check in using your live selfie
                    </p>
                  </div>
                  <button onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Open Camera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ CAMERA LIVE ════════════════════ */}
        {mode === 'camera-live' && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[28px] opacity-35 blur-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
            <div className={`relative rounded-[26px] border overflow-hidden ${card}`}>
              <div className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />

              <div className={`flex items-center justify-between px-5 pt-5 pb-4 border-b ${divider}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-black ${tp}`}>Live Camera</p>
                    <p className={`text-[10px] ${ts}`}>Position your face in the frame</p>
                  </div>
                </div>
                <button onClick={reset}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold ${secBtn}`}>
                  Cancel
                </button>
              </div>

              <div className="px-5 py-5 flex flex-col items-center gap-4">
                {camError ? (
                  <div className="w-full py-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${tp}`}>Camera Unavailable</p>
                      <p className={`text-xs mt-1 leading-relaxed ${ts}`}>{camError}</p>
                    </div>
                    <button onClick={startCamera}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.4)' }}>
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative w-full rounded-2xl overflow-hidden"
                      style={{ aspectRatio: '4/3', background: d ? '#0a0b14' : '#0f0f13' }}>
                      <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />

                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.55) 100%)' }} />

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          <div className="w-32 h-40 rounded-full border-[1.5px] border-dashed opacity-70"
                            style={{ borderColor: '#818cf8' }} />
                          {['-top-1 -left-1','-top-1 -right-1','-bottom-1 -left-1','-bottom-1 -right-1'].map((p,i)=>(
                            <div key={i} className={`absolute ${p} w-2 h-2 rounded-full bg-indigo-400`}
                              style={{ boxShadow: '0 0 8px #818cf8' }} />
                          ))}
                        </div>
                      </div>

                      {countdown !== null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <div className="w-24 h-24 rounded-full border-4 border-indigo-400/30 flex items-center justify-center"
                            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.6)' }}>
                            <span className="text-white font-black" style={{ fontSize: '52px', lineHeight: 1 }}>
                              {countdown}
                            </span>
                          </div>
                          <p className="text-white/70 text-xs font-semibold mt-3 tracking-widest uppercase">
                            Get Ready
                          </p>
                        </div>
                      )}

                      {countdown === null && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span className="text-[9px] font-mono font-bold text-white tracking-[0.2em]">LIVE</span>
                        </div>
                      )}

                      {employee && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                              {employee.name.charAt(0)}
                            </div>
                            <span className="text-white text-[10px] font-bold">{employee.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button onClick={capturePhoto} disabled={countdown !== null}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.45)' }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="4"/>
                          <path fillRule="evenodd" d="M9.343 3.071A49.144 49.144 0 0112 3c.952 0 1.897.034 2.657.071C16.1 3.157 17.3 3.73 18 4.7l.75 1.05A2.25 2.25 0 0020.75 6.75H21a.75.75 0 010 1.5h-.25A2.25 2.25 0 0020 9.75v7.5A2.25 2.25 0 0117.75 19.5h-11.5A2.25 2.25 0 014 17.25v-7.5A2.25 2.25 0 003.25 8.25H3a.75.75 0 010-1.5h.25A2.25 2.25 0 005.25 5.75L6 4.7C6.7 3.73 7.9 3.157 9.343 3.071z" clipRule="evenodd"/>
                        </svg>
                        Capture Now
                      </button>
                      <button onClick={startCountdown} disabled={countdown !== null}
                        className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 ${secBtn}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                        </svg>
                        3s Timer
                      </button>
                    </div>

                    <p className={`text-[10px] text-center tracking-widest uppercase font-semibold ${ts}`}>
                      Look directly at the camera
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ SELFIE PREVIEW ════════════════════ */}
        {mode === 'selfie-preview' && capturedImage && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[28px] opacity-35 blur-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
            <div className={`relative rounded-[26px] border overflow-hidden ${card}`}>
              <div className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />

              <div className={`px-5 pt-5 pb-4 border-b ${divider}`}>
                <p className="text-[9px] font-black tracking-[0.55em] text-indigo-400 uppercase">
                  Review Photo
                </p>
                <p className={`text-[11px] font-semibold mt-0.5 ${ts}`}>
                  Confirm your selfie before submitting
                </p>
              </div>

              <div className="px-5 py-6 flex flex-col items-center gap-5">
                <div className="relative w-full rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '4/3' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capturedImage} alt="Captured selfie"
                    className="w-full h-full object-cover" />

                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between"
                    style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)', backdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                        {employee?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-[11px] font-bold leading-tight">{employee?.name}</p>
                        <p className="text-white/60 text-[9px] font-mono">{employee?.employeeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-[9px] font-mono">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-white/60 text-[9px] font-mono">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-[9px] font-bold text-white">Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={submitSelfie} disabled={uploading}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.45)' }}>
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    }
                    {uploading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button onClick={startCamera} disabled={uploading}
                    className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 ${secBtn}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                    </svg>
                    Retake
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ SUCCESS ════════════════════ */}
        {mode === 'success' && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[28px] opacity-40 blur-lg"
              style={{ background: isCheckOut
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : 'linear-gradient(135deg,#10b981,#34d399)' }} />
            <div className={`relative rounded-[26px] border overflow-hidden ${card}`}>
              <div className="h-[3px] w-full"
                style={{ background: isCheckOut
                  ? 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)'
                  : 'linear-gradient(90deg,#10b981,#34d399,#6ee7b7)' }} />
              <div className="px-8 py-12 flex flex-col items-center text-center gap-1">

                <div className="relative mb-5">
                  <div className="absolute -inset-3 rounded-full opacity-20"
                    style={{ background: isCheckOut
                      ? 'radial-gradient(circle,#6366f1,transparent)'
                      : 'radial-gradient(circle,#10b981,transparent)' }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: isCheckOut
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))'
                        : 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.1))',
                      border: isCheckOut
                        ? '1.5px solid rgba(99,102,241,0.3)'
                        : '1.5px solid rgba(16,185,129,0.3)',
                    }}>
                    {isCheckOut ? (
                      <svg className="w-9 h-9 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
                      </svg>
                    ) : (
                      <svg className="w-9 h-9 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                  </div>
                </div>

                <h2 className={`text-xl font-black ${tp}`}>
                  {isCheckOut ? 'Checked Out!' : 'Checked In!'}
                </h2>
                <p className={`text-sm mt-1 mb-2 leading-relaxed ${ts}`}>{message}</p>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6"
                  style={{
                    background: isCheckOut ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                    border:     isCheckOut ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(16,185,129,0.2)',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isCheckOut ? '#818cf8' : '#34d399' }} />
                  <span className="text-[10px] font-mono font-bold tracking-widest"
                    style={{ color: isCheckOut ? '#818cf8' : '#10b981' }}>
                    {isCheckOut ? 'CHECKOUT RECORDED' : 'ATTENDANCE RECORDED'}
                  </span>
                </div>

                <button onClick={reset}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] ${secBtn}`}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ ERROR ════════════════════ */}
        {mode === 'error' && (
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[28px] opacity-35 blur-lg"
              style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)' }} />
            <div className={`relative rounded-[26px] border overflow-hidden ${card}`}>
              <div className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg,#ef4444,#f87171,#fca5a5)' }} />
              <div className="px-8 py-12 flex flex-col items-center text-center gap-1">
                <div className="relative mb-5">
                  <div className="absolute -inset-3 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle,#ef4444,transparent)' }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
                    <svg className="w-9 h-9 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                    </svg>
                  </div>
                </div>
                <h2 className={`text-xl font-black ${tp}`}>Something Went Wrong</h2>
                <p className={`text-sm mt-1 mb-6 leading-relaxed ${ts}`}>
                  {message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button onClick={reset}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.4)' }}>
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