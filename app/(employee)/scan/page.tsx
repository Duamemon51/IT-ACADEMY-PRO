'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { useTheme } from '../ThemeContext';

type Mode = 'show-qr' | 'camera-live' | 'selfie-preview' | 'success' | 'error' | 'already-done';
type AlignStatus = 'waiting' | 'detecting' | 'hold' | 'captured';

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

  const [alignStatus, setAlignStatus]   = useState<AlignStatus>('waiting');
  const [holdProgress, setHoldProgress] = useState(0);
  const [scanLine, setScanLine]         = useState(0);

  const qrRef           = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const detectCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const countRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectLoopRef   = useRef<number | null>(null);
  const progressRef     = useRef(0);
  const didCaptureRef   = useRef(false);
  const holdFrames      = useRef(0);
  const scanLineRef     = useRef(0);
  const scanDirRef      = useRef(1);

  useEffect(() => {
    const s = localStorage.getItem('employee');
    if (s) setEmployee(JSON.parse(s));
  }, []);

  useEffect(() => {
    if (mode !== 'camera-live') {
      stopCamera();
      stopDetection();
    }
  }, [mode]);

  useEffect(() => () => {
    stopCamera();
    stopDetection();
    if (countRef.current) clearInterval(countRef.current);
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopDetection = () => {
    if (detectLoopRef.current) cancelAnimationFrame(detectLoopRef.current);
    if (countRef.current) clearInterval(countRef.current);
    detectLoopRef.current = null;
    progressRef.current = 0;
    holdFrames.current = 0;
  };

  const reset = () => {
    stopCamera();
    stopDetection();
    if (countRef.current) clearInterval(countRef.current);
    setMode('show-qr'); setMessage(''); setCaptured(null);
    setCamError(''); setCountdown(null); setAttendanceAction(null);
    setAlignStatus('waiting'); setHoldProgress(0); setScanLine(0);
    progressRef.current = 0; didCaptureRef.current = false; holdFrames.current = 0;
    scanLineRef.current = 0; scanDirRef.current = 1;
  };

  const isFaceInOval = useCallback((): boolean => {
    const video = videoRef.current;
    const dc    = detectCanvasRef.current;
    if (!video || !dc || video.readyState < 2) return false;
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    dc.width = vW; dc.height = vH;
    const ctx = dc.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.save();
    ctx.translate(vW, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, vW, vH);
    ctx.restore();
    const cx = vW * 0.5, cy = vH * 0.46;
    const rx = vW * 0.24, ry = vH * 0.40;
    const step = Math.max(5, Math.floor(Math.min(vW, vH) / 36));
    let skinPx = 0, totalPx = 0;
    for (let py = Math.floor(cy - ry); py <= cy + ry; py += step) {
      for (let px = Math.floor(cx - rx); px <= cx + rx; px += step) {
        const nx = (px - cx) / rx, ny = (py - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        totalPx++;
        const p = ctx.getImageData(px, py, 1, 1).data;
        const r = p[0], g = p[1], b = p[2];
        if (r > 90 && g > 38 && b > 18 && r > g && r > b &&
            Math.abs(r - g) > 13 && r - Math.min(g, b) > 13) skinPx++;
      }
    }
    if (totalPx === 0) return false;
    return (skinPx / totalPx) > 0.26;
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    const W = video.videoWidth || 640, H = video.videoHeight || 480;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(W, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    stopCamera();
    stopDetection();
    setCaptured(dataUrl);
    setMode('selfie-preview');
  }, []);

  const startDetectionLoop = useCallback(() => {
    if (didCaptureRef.current) return;

    const faceIn = isFaceInOval();
    if (faceIn) {
      scanLineRef.current = -1;
      setScanLine(-1);
      setAlignStatus('hold');
      holdFrames.current++;
      const pct = Math.min(100, (holdFrames.current / 38) * 100);
      progressRef.current = pct;
      setHoldProgress(pct);
      if (pct >= 100 && !didCaptureRef.current) {
        didCaptureRef.current = true;
        setAlignStatus('captured');
        setTimeout(() => capturePhoto(), 150);
        return;
      }
    } else {
      scanLineRef.current += scanDirRef.current * 2.2;
      if (scanLineRef.current >= 100 || scanLineRef.current < 0) {
        scanDirRef.current *= -1;
        scanLineRef.current = Math.max(0, Math.min(100, scanLineRef.current));
      }
      setScanLine(scanLineRef.current);
      holdFrames.current = Math.max(0, holdFrames.current - 2);
      const pct = Math.min(100, (holdFrames.current / 38) * 100);
      progressRef.current = pct;
      setHoldProgress(pct);
      setAlignStatus(pct > 4 ? 'detecting' : 'waiting');
    }
    detectLoopRef.current = requestAnimationFrame(startDetectionLoop);
  }, [isFaceInOval, capturePhoto]);

  const startCamera = async () => {
    // Reset everything first
    stopCamera();
    stopDetection();
    setCamError('');
    setCaptured(null);
    setAlignStatus('waiting');
    setHoldProgress(0);
    setCountdown(null);
    progressRef.current = 0;
    didCaptureRef.current = false;
    holdFrames.current = 0;
    scanLineRef.current = 0;
    scanDirRef.current = 1;

    // Set mode before requesting camera
    setMode('camera-live');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Wait for next tick so videoRef is mounted in camera-live mode
      setTimeout(() => {
        const video = videoRef.current;
        if (!video) {
          setCamError('Unable to start camera. Please try again.');
          return;
        }
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play()
            .then(() => {
              setTimeout(() => {
                setAlignStatus('detecting');
                detectLoopRef.current = requestAnimationFrame(startDetectionLoop);
              }, 600);
            })
            .catch(() => {
              setCamError('Unable to start camera. Please try again.');
            });
        };
      }, 100);

    } catch (err: unknown) {
      const e = err as Error;
      setMode('camera-live'); // stay on camera view to show error
      if (e.name === 'NotAllowedError')
        setCamError('Camera access denied. Please allow camera permissions in your browser settings.');
      else if (e.name === 'NotFoundError')
        setCamError('No camera device found on this device.');
      else
        setCamError('Unable to start camera. Please try again.');
    }
  };

  const startCountdown = () => {
    if (didCaptureRef.current) return;
    didCaptureRef.current = true;
    stopDetection();
    setAlignStatus('waiting');
    setHoldProgress(0);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: capturedImage, employeeId: employee.employeeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceAction(data.action ?? 'check-in');
        setMessage(data.message || 'Attendance recorded successfully!');
        setMode('success');
      } else if (res.status === 409) {
        setMessage(data.error || 'Attendance already completed for today.');
        setMode('already-done');
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
      const url = await toPng(qrRef.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `${employee?.name || 'employee'}-qr.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDown(false);
    }
  };

  const isCheckOut   = attendanceAction === 'check-out';
  const circumference = 2 * Math.PI * 80;

  const ovalStroke =
    alignStatus === 'captured' || alignStatus === 'hold' ? '#10b981' :
    alignStatus === 'detecting' ? '#f59e0b' : '#6366f1';
  const ovalGlow =
    alignStatus === 'captured' || alignStatus === 'hold'
      ? 'rgba(16,185,129,0.5)' :
    alignStatus === 'detecting' ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)';
  const statusLabel =
    alignStatus === 'captured'  ? 'Face detected — capturing...' :
    alignStatus === 'hold'      ? 'Hold still...' :
    alignStatus === 'detecting' ? 'Align your face in the oval' :
    'Position your face inside the oval';
  const statusColor =
    alignStatus === 'hold' || alignStatus === 'captured' ? '#10b981' :
    alignStatus === 'detecting' ? '#f59e0b' : '#a5b4fc';

  const tp      = d ? 'text-white'    : 'text-gray-900';
  const ts      = d ? 'text-gray-400' : 'text-gray-500';
  const card    = d
    ? 'bg-[#07091a] border-white/[0.08]'
    : 'bg-white border-gray-200 shadow-[0_8px_40px_rgba(99,102,241,0.10)]';
  const divider = d ? 'border-white/[0.06]' : 'border-gray-100';
  const secBtn  = d
    ? 'border border-white/[0.12] bg-white/[0.05] text-gray-300 hover:bg-white/[0.09]'
    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm';

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={detectCanvasRef} className="hidden" />

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            Identity Pass
          </span>
        </div>
        <h1 className={`text-[32px] font-black tracking-tight leading-tight ${tp}`}>Attendance Portal</h1>
        <p className={`text-sm mt-1.5 ${ts}`}>Scan your QR code or verify with a live selfie</p>
      </div>

      {/* ── Wider max-width container ── */}
      <div className="max-w-xl mx-auto">

        {/* ══════════ QR MODE ══════════ */}
        {mode === 'show-qr' && (
          <div className="relative">
            <div
              className="absolute -inset-[1.5px] rounded-[32px] opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
            />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7,#ec4899,#f43f5e)' }} />

              <div className={`flex items-center justify-between px-6 pt-4 pb-4 border-b ${divider}`}>
                <div>
                  <p className="text-[10px] font-black tracking-[0.5em] uppercase" style={{ color: '#818cf8' }}>Academy Pro</p>
                  <p className={`text-sm font-semibold mt-0.5 ${ts}`}>Employee Identity Card</p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}
                >
                  <span className="text-[15px] font-black text-white italic">AP</span>
                </div>
              </div>

              {employee?.qrCode ? (
                <div className="px-6 py-5 flex flex-col items-center">
                  <div className="relative">
                    <div className="p-[3px] rounded-3xl" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
                      <div ref={qrRef} className="bg-white p-4 rounded-[22px]">
                        <Image
                          src={employee.qrCode}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="rounded-2xl block"
                          priority
                        />
                      </div>
                    </div>
                    {[
                      'top-0.5 left-0.5 border-t-2 border-l-2 rounded-tl-2xl',
                      'top-0.5 right-0.5 border-t-2 border-r-2 rounded-tr-2xl',
                      'bottom-0.5 left-0.5 border-b-2 border-l-2 rounded-bl-2xl',
                      'bottom-0.5 right-0.5 border-b-2 border-r-2 rounded-br-2xl',
                    ].map((c, i) => (
                      <div key={i} className={`absolute w-6 h-6 border-white ${c}`} />
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black tracking-[0.3em] text-emerald-400">READY TO SCAN</span>
                  </div>

                  <div className="text-center mt-3 w-full">
                    <h2 className={`text-[22px] font-black ${tp}`}>{employee.name}</h2>
                    <div className="flex items-center justify-center gap-3 mt-2.5">
                      <span
                        className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}
                      >
                        {employee.employeeId}
                      </span>
                      {employee.department && (
                        <span className={`text-[13px] font-medium ${ts}`}>{employee.department}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    <button
                      onClick={downloadQR}
                      disabled={downloading}
                      className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 24px rgba(79,70,229,0.4)' }}
                    >
                      {downloading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>}
                      Save QR
                    </button>
                    <button
                      onClick={reset}
                      className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 ${secBtn}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Refresh
                    </button>
                  </div>

                  <div className={`w-full mt-4 pt-4 border-t ${divider}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex-1 h-px ${d ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />
                      <span className={`text-[11px] font-semibold uppercase tracking-widest ${ts}`}>or verify with camera</span>
                      <div className={`flex-1 h-px ${d ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />
                    </div>

                    <button
                      onClick={startCamera}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 ${secBtn}`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-sm font-bold leading-tight ${tp}`}>Check In / Out with Selfie</p>
                        <p className={`text-[12px] font-normal mt-0.5 ${ts}`}>Automatic live face verification</p>
                      </div>
                      <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>

                  <p className={`mt-3 text-[9px] font-mono text-center tracking-[0.3em] uppercase ${d ? 'text-gray-800' : 'text-gray-300'}`}>
                    Encrypted · Internal Use Only
                  </p>
                </div>
              ) : (
                <div className="px-6 py-8 flex flex-col items-center gap-4">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <svg className="w-11 h-11 opacity-50" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className={`font-black text-lg ${tp}`}>No QR Code Found</p>
                    <p className={`text-sm mt-2 leading-relaxed ${ts}`}>Contact your HR administrator<br/>or check in using your live selfie below</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 10px 28px rgba(79,70,229,0.4)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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

        {/* ══════════ CAMERA LIVE ══════════ */}
        {mode === 'camera-live' && (
          <div className="relative">
            <div
              className="absolute -inset-[1.5px] rounded-[32px] transition-all duration-500"
              style={{ background: `linear-gradient(135deg,${ovalStroke},#a855f7)`, opacity: 0.5 }}
            />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div
                className="h-1 w-full transition-all duration-500"
                style={{ background: `linear-gradient(90deg,${ovalStroke},#a855f7,#ec4899)` }}
              />

              <div className={`flex items-center justify-between px-6 pt-4 pb-3 border-b ${divider}`}>
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500"
                    style={{
                      background: `linear-gradient(135deg,${alignStatus === 'hold' || alignStatus === 'captured' ? '#059669' : '#4f46e5'},${alignStatus === 'hold' || alignStatus === 'captured' ? '#10b981' : '#7c3aed'})`,
                      boxShadow: `0 4px 16px ${ovalStroke}55`,
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`text-base font-black ${tp}`}>Face Verification</p>
                    <p className="text-[11px] font-semibold transition-colors duration-300" style={{ color: statusColor }}>
                      {statusLabel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className={`text-xs px-4 py-2 rounded-xl font-bold ${secBtn}`}
                >
                  Cancel
                </button>
              </div>

              <div className="px-5 py-5 flex flex-col items-center gap-4">
                {camError ? (
                  <div className="w-full py-6 flex flex-col items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <svg className="w-9 h-9 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`text-base font-bold ${tp}`}>Camera Unavailable</p>
                      <p className={`text-sm mt-1.5 leading-relaxed ${ts}`}>{camError}</p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.4)' }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Camera viewport */}
                    <div
                      className="relative w-full rounded-3xl overflow-hidden"
                      style={{ aspectRatio: '5/3', background: '#000' }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />

                      {/* Vignette */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% 46%,transparent 36%,rgba(0,0,0,0.72) 100%)' }}
                      />

                      {/* Oval SVG overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ paddingBottom: '5%' }}
                      >
                        <svg width="190" height="238" viewBox="0 0 190 238" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="95" cy="119" rx="88" ry="110" fill="none" stroke={ovalStroke} strokeWidth="1" strokeOpacity="0.18" style={{ filter: 'blur(3px)' }} />
                          <ellipse cx="95" cy="119" rx="84" ry="106" fill="none" stroke={ovalStroke} strokeWidth="1.5" strokeOpacity="0.22" />
                          {holdProgress > 0 && (
                            <ellipse
                              cx="95" cy="119" rx="84" ry="106"
                              fill="none"
                              stroke={ovalStroke}
                              strokeWidth="4"
                              strokeDasharray={`${circumference}`}
                              strokeDashoffset={`${circumference * (1 - holdProgress / 100)}`}
                              strokeLinecap="round"
                              style={{
                                transformOrigin: '95px 119px',
                                transform: 'rotate(-90deg)',
                                transition: 'stroke-dashoffset 0.08s linear, stroke 0.4s ease',
                                filter: `drop-shadow(0 0 6px ${ovalStroke})`,
                              }}
                            />
                          )}
                          {scanLine >= 0 && (
                            <>
                              <line x1="16" y1={12 + (scanLine / 100) * 214} x2="174" y2={12 + (scanLine / 100) * 214} stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.55" style={{ filter: 'drop-shadow(0 0 5px #f59e0b)' }} />
                              <circle cx="16"  cy={12 + (scanLine / 100) * 214} r="3" fill="#f59e0b" fillOpacity="0.7" />
                              <circle cx="174" cy={12 + (scanLine / 100) * 214} r="3" fill="#f59e0b" fillOpacity="0.7" />
                            </>
                          )}
                          <path d="M24 62 L24 42 L44 42" stroke={ovalStroke} strokeWidth="3.5" strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 4px ${ovalStroke})` }} />
                          <path d="M166 62 L166 42 L146 42" stroke={ovalStroke} strokeWidth="3.5" strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 4px ${ovalStroke})` }} />
                          <path d="M24 176 L24 196 L44 196" stroke={ovalStroke} strokeWidth="3.5" strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 4px ${ovalStroke})` }} />
                          <path d="M166 176 L166 196 L146 196" stroke={ovalStroke} strokeWidth="3.5" strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 4px ${ovalStroke})` }} />
                          {alignStatus === 'captured' && (
                            <path d="M68 119 L86 137 L122 97" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ filter: 'drop-shadow(0 0 10px #10b981)' }} />
                          )}
                        </svg>
                      </div>

                      {/* Status chip */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                        <div
                          className="flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300"
                          style={{
                            background: 'rgba(0,0,0,0.72)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${ovalStroke}44`,
                            boxShadow: `0 0 16px ${ovalGlow}`,
                          }}
                        >
                          {alignStatus === 'hold' || alignStatus === 'captured'
                            ? <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#10b981' }} />
                            : alignStatus === 'detecting'
                            ? <div className="w-3.5 h-3.5 rounded-full border border-amber-400/40 border-t-amber-400 animate-spin flex-shrink-0" />
                            : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#818cf8' }} />
                          }
                          <span className="text-[11px] font-bold tracking-wide transition-colors duration-300" style={{ color: statusColor }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* LIVE badge */}
                      {countdown === null && (
                        <div
                          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-black text-white tracking-[0.25em]">LIVE</span>
                        </div>
                      )}

                      {/* Progress % */}
                      {holdProgress > 8 && alignStatus !== 'waiting' && (
                        <div
                          className="absolute top-4 right-4 px-3 py-1.5 rounded-full transition-all duration-200"
                          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: `1px solid ${ovalStroke}55` }}
                        >
                          <span className="text-[12px] font-black transition-colors" style={{ color: ovalStroke }}>
                            {Math.round(holdProgress)}%
                          </span>
                        </div>
                      )}

                      {/* Employee badge */}
                      {employee && holdProgress <= 5 && countdown === null && (
                        <div
                          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                          >
                            {employee.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-white">{employee.name}</span>
                        </div>
                      )}

                      {/* Countdown overlay */}
                      {countdown !== null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                          <div
                            className="w-28 h-28 rounded-full border-4 border-indigo-400/30 flex items-center justify-center"
                            style={{ boxShadow: '0 0 48px rgba(99,102,241,0.6)' }}
                          >
                            <span className="text-white font-black" style={{ fontSize: '60px', lineHeight: 1 }}>{countdown}</span>
                          </div>
                          <p className="text-white/70 text-xs font-bold mt-4 tracking-widest uppercase">Get Ready</p>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest transition-colors duration-300" style={{ color: statusColor }}>
                          {alignStatus === 'hold'
                            ? 'Face locked — hold still'
                            : alignStatus === 'detecting' && holdProgress > 4
                            ? 'Keep face inside the oval'
                            : 'Waiting for face...'}
                        </span>
                        {holdProgress > 4 && (
                          <span className="text-[11px] font-mono font-bold transition-colors" style={{ color: ovalStroke }}>
                            {Math.round(holdProgress)}%
                          </span>
                        )}
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-100"
                          style={{
                            width: `${holdProgress}%`,
                            background: `linear-gradient(90deg,${ovalStroke},${
                              ovalStroke === '#10b981' ? '#34d399' :
                              ovalStroke === '#f59e0b' ? '#fbbf24' : '#818cf8'
                            })`,
                            boxShadow: `0 0 12px ${ovalStroke}99`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Manual buttons */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <button
                        onClick={capturePhoto}
                        disabled={countdown !== null}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 20px rgba(79,70,229,0.4)' }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="3"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd"/>
                        </svg>
                        Capture Now
                      </button>
                      <button
                        onClick={startCountdown}
                        disabled={countdown !== null}
                        className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 ${secBtn}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                        </svg>
                        3s Timer
                      </button>
                    </div>

                    {/* Guidelines card */}
                    <div
                      className="w-full rounded-3xl overflow-hidden"
                      style={{
                        background: d ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                        border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        className="px-4 pt-3.5 pb-3.5 flex items-center gap-3"
                        style={{ borderBottom: d ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0' }}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span className={`text-[12px] font-black tracking-widest uppercase ${d ? 'text-slate-200' : 'text-gray-700'}`}>
                          Selfie Guidelines
                        </span>
                        <div
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-black text-emerald-400 tracking-wider">AUTO-DETECT</span>
                        </div>
                      </div>

                      <div className="px-4 py-4 grid grid-cols-2 gap-4">
                        {[
                          {
                            icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
                            title: 'Look straight ahead',
                            desc:  'Face the lens directly',
                            accent: '#818cf8', bg: 'rgba(99,102,241,0.1)', br: 'rgba(99,102,241,0.2)',
                          },
                          {
                            icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
                            title: 'Office background',
                            desc:  'Workplace must be visible',
                            accent: '#34d399', bg: 'rgba(52,211,153,0.1)', br: 'rgba(52,211,153,0.2)',
                          },
                          {
                            icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
                            title: 'Good lighting',
                            desc:  'Sit near a window',
                            accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)', br: 'rgba(251,191,36,0.2)',
                          },
                          {
                            icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
                            title: 'No hats or glasses',
                            desc:  'Full face must be visible',
                            accent: '#f472b6', bg: 'rgba(244,114,182,0.1)', br: 'rgba(244,114,182,0.2)',
                          },
                        ].map(({ icon, title, desc, accent, bg, br }, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: bg, border: `1px solid ${br}` }}
                            >
                              <svg className="w-4 h-4" style={{ color: accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
                              </svg>
                            </div>
                            <div>
                              <p className={`text-[12px] font-bold leading-tight ${d ? 'text-slate-100' : 'text-gray-800'}`}>{title}</p>
                              <p className={`text-[11px] mt-0.5 leading-snug ${ts}`}>{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-4 pb-4">
                        <div
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                          style={{ background: d ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <p className={`text-[11px] font-bold ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Auto-captures once your face fills the oval
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ SELFIE PREVIEW ══════════ */}
        {mode === 'selfie-preview' && capturedImage && (
          <div className="relative">
            <div className="absolute -inset-[1.5px] rounded-[32px] opacity-50" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }} />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />
              <div className={`px-6 pt-4 pb-4 border-b ${divider}`}>
                <p className="text-[10px] font-black tracking-[0.5em] uppercase" style={{ color: '#818cf8' }}>Review Photo</p>
                <p className={`text-sm font-semibold mt-1 ${ts}`}>Confirm your selfie before submitting</p>
              </div>
              <div className="px-6 py-6 flex flex-col items-center gap-5">
                <div className="relative w-full rounded-3xl overflow-hidden" style={{ aspectRatio: '5/3' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
                  <div
                    className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between"
                    style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                      >
                        {employee?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-[13px] font-bold leading-tight">{employee?.name}</p>
                        <p className="text-white/60 text-[10px] font-mono">{employee?.employeeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-[10px] font-mono">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-white/60 text-[10px] font-mono">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{ background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(8px)' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-[10px] font-black text-white">Face Verified</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={submitSelfie}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 24px rgba(79,70,229,0.45)' }}
                  >
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>}
                    {uploading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={startCamera}
                    disabled={uploading}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 ${secBtn}`}
                  >
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

        {/* ══════════ SUCCESS ══════════ */}
        {mode === 'success' && (
          <div className="relative">
            <div
              className="absolute -inset-[1.5px] rounded-[32px]"
              style={{ background: isCheckOut ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#10b981,#34d399)', opacity: 0.55 }}
            />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div
                className="h-1 w-full"
                style={{ background: isCheckOut ? 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)' : 'linear-gradient(90deg,#10b981,#34d399,#6ee7b7)' }}
              />
              <div className="px-8 py-10 flex flex-col items-center text-center gap-2">
                <div className="relative mb-4">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: isCheckOut ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                      border: isCheckOut ? '2px solid rgba(99,102,241,0.35)' : '2px solid rgba(16,185,129,0.35)',
                      boxShadow: isCheckOut ? '0 0 40px rgba(99,102,241,0.28)' : '0 0 40px rgba(16,185,129,0.28)',
                    }}
                  >
                    {isCheckOut
                      ? <svg className="w-11 h-11 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
                        </svg>
                      : <svg className="w-11 h-11 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>}
                  </div>
                </div>
                <h2 className={`text-2xl font-black ${tp}`}>{isCheckOut ? 'Checked Out!' : 'Checked In!'}</h2>
                <p className={`text-sm mt-1 mb-3 leading-relaxed ${ts}`}>{message}</p>
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
                  style={{
                    background: isCheckOut ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                    border: isCheckOut ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isCheckOut ? '#818cf8' : '#34d399' }} />
                  <span className="text-[11px] font-mono font-black tracking-widest" style={{ color: isCheckOut ? '#818cf8' : '#10b981' }}>
                    {isCheckOut ? 'CHECKOUT RECORDED' : 'ATTENDANCE RECORDED'}
                  </span>
                </div>
                <button
                  onClick={reset}
                  className={`w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] ${secBtn}`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ ALREADY DONE ══════════ */}
        {mode === 'already-done' && (
          <div className="relative">
            <div className="absolute -inset-[1.5px] rounded-[32px]" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', opacity: 0.45 }} />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a)' }} />
              <div className="px-8 py-10 flex flex-col items-center text-center gap-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.35)', boxShadow: '0 0 32px rgba(245,158,11,0.2)' }}
                >
                  <svg className="w-10 h-10" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 className={`text-2xl font-black ${tp}`}>Already Done!</h2>
                <p className={`text-sm mt-1 leading-relaxed ${ts}`}>
                  {message || 'Attendance already completed for today.'}
                </p>
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full mt-2 mb-5"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-[11px] font-mono font-black tracking-widest" style={{ color: '#f59e0b' }}>
                    SEE YOU TOMORROW
                  </span>
                </div>
                <button
                  onClick={reset}
                  className={`w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] ${secBtn}`}
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ ERROR ══════════ */}
        {mode === 'error' && (
          <div className="relative">
            <div className="absolute -inset-[1.5px] rounded-[32px]" style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', opacity: 0.45 }} />
            <div className={`relative rounded-[30px] border overflow-hidden ${card}`}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f87171,#fca5a5)' }} />
              <div className="px-8 py-10 flex flex-col items-center text-center gap-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)', boxShadow: '0 0 32px rgba(239,68,68,0.2)' }}
                >
                  <svg className="w-11 h-11 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                </div>
                <h2 className={`text-2xl font-black ${tp}`}>Something Went Wrong</h2>
                <p className={`text-sm mt-1 mb-8 leading-relaxed ${ts}`}>
                  {message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                  onClick={reset}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
                >
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