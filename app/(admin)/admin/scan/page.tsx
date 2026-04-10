'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

type Mode = 'scanner' | 'success' | 'error' | 'closed';

interface AttendanceResult {
  action?: string;
  message: string;
  detail?: string;
  employeeName?: string;
  employeeId?: string;
  distance?: number;
  required?: number;
}

function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10_000, maximumAge: 0,
    });
  });
}

export default function AdminScanPage() {
  const [mode, setMode]         = useState<Mode>('scanner');
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState<AttendanceResult | null>(null);
  const [scanFlash, setScanFlash] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef  = useRef(false);

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    startedRef.current = false;
  };

  const closeCamera = () => { stopCamera(); setMode('closed'); setResult(null); };

  const reset = () => {
    stopCamera(); setMode('scanner'); setResult(null);
    setTimeout(() => startCamera(), 150);
  };

  const handleQRData = useCallback(async (qrData: string) => {
    let actualQrToken = qrData;
    try { const p = JSON.parse(qrData); if (p.qrToken) actualQrToken = p.qrToken; } catch {}
    stopCamera();
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 400);
    setScanning(true);

    try {
      let latitude: number, longitude: number;
      try {
        const pos = await getLocation();
        latitude = pos.coords.latitude; longitude = pos.coords.longitude;
      } catch (geoErr: any) {
        setResult({ message: geoErr?.code === 1 ? 'Location access denied.' : 'Could not get location.' });
        setMode('error'); setScanning(false); return;
      }

      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/employee/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrToken: actualQrToken, latitude, longitude, deviceInfo: navigator.userAgent }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          action: data.action ?? '',
          message: data.message || 'Attendance marked successfully!',
          detail: data.distance != null ? `${data.distance} m from office` : '',
          employeeName: data.employeeName ?? '',
          employeeId: data.employeeId ?? '',
          distance: data.distance,
        });
        setMode('success');
      } else {
        setResult({
          message: data.message || 'Failed to mark attendance.',
          detail: data.distance != null ? `${data.distance} m away (max ${data.required} m allowed)` : '',
        });
        setMode('error');
      }
    } catch {
      setResult({ message: 'Network error. Please try again.' });
      setMode('error');
    } finally {
      setScanning(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      const jsQR = (await import('jsqr')).default;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !ctx) return;
        const { videoWidth: w, videoHeight: h } = videoRef.current;
        if (!w || !h) return;
        canvas.width = w; canvas.height = h;
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data) handleQRData(code.data);
      }, 300);
    } catch {
      setResult({ message: 'Camera access denied. Please allow camera permission.' });
      setMode('error');
    }
  }, [handleQRData]);

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    (videoRef as any).current = node;
    if (node && mode === 'scanner') startCamera();
  }, [mode, startCamera]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .scan-page * { box-sizing: border-box; }
        .scan-page { font-family: 'Syne', sans-serif; min-height: 100vh; background: #050608; position: relative; overflow: hidden; }

        /* Animated bg blobs */
        .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.12; pointer-events: none; }
        .bg-blob-1 { width: 500px; height: 500px; background: #7c3aed; top: -200px; left: -150px; animation: blobMove1 12s ease-in-out infinite; }
        .bg-blob-2 { width: 400px; height: 400px; background: #0ea5e9; bottom: -150px; right: -100px; animation: blobMove2 15s ease-in-out infinite; }
        .bg-blob-3 { width: 300px; height: 300px; background: #10b981; top: 50%; left: 50%; transform: translate(-50%,-50%); animation: blobMove3 10s ease-in-out infinite; }
        @keyframes blobMove1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,30px) scale(1.1)} }
        @keyframes blobMove2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,-40px) scale(1.08)} }
        @keyframes blobMove3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }

        /* Grid texture */
        .bg-grid { position: fixed; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);
          background-size: 40px 40px; }

        .inner { max-width: 420px; margin: 0 auto; padding: 2rem 1.25rem; position: relative; z-index: 1; }

        /* Header */
        .hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; }
        .hdr-left h1 { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.1; }
        .hdr-left p { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
        .live-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px;
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25);
          font-size: 11px; font-weight: 600; color: #10b981; letter-spacing: 1.5px; text-transform: uppercase; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 8px #10b981; animation: livePulse 1.4s ease-in-out infinite; }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        /* Scanner card */
        .scanner-card { border-radius: 28px; overflow: hidden; position: relative;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px); }

        .scanner-topbar { display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .topbar-left { display: flex; align-items: center; gap: 10px; }
        .rec-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
          box-shadow: 0 0 10px rgba(239,68,68,0.8); animation: recPulse 1s ease-in-out infinite; }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 6px rgba(239,68,68,0.8)} 50%{box-shadow:0 0 18px rgba(239,68,68,1)} }
        .topbar-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.5px; text-transform: uppercase; }

        .close-cam-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.18);
          color: rgba(239,68,68,0.7); font-size: 11px; font-weight: 600; cursor: pointer;
          letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.2s; font-family: 'Syne', sans-serif; }
        .close-cam-btn:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.4); color: #ef4444;
          box-shadow: 0 0 16px rgba(239,68,68,0.15); }

        /* Viewport */
        .viewport { position: relative; aspect-ratio: 1; background: #000; overflow: hidden; }
        .viewport video { width: 100%; height: 100%; object-fit: cover; }

        /* Flash overlay */
        .flash-overlay { position: absolute; inset: 0; background: #fff; pointer-events: none;
          opacity: 0; transition: opacity 0.1s; }
        .flash-overlay.active { opacity: 0.6; }

        /* Dark vignette */
        .vignette { position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%); }

        /* Corner frame */
        .frame-wrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .frame { position: relative; width: 220px; height: 220px; }
        .corner { position: absolute; width: 36px; height: 36px; }
        .corner-tl { top:0; left:0; border-top: 3px solid #a78bfa; border-left: 3px solid #a78bfa; border-radius: 10px 0 0 0; }
        .corner-tr { top:0; right:0; border-top: 3px solid #a78bfa; border-right: 3px solid #a78bfa; border-radius: 0 10px 0 0; }
        .corner-bl { bottom:0; left:0; border-bottom: 3px solid #a78bfa; border-left: 3px solid #a78bfa; border-radius: 0 0 0 10px; }
        .corner-br { bottom:0; right:0; border-bottom: 3px solid #a78bfa; border-right: 3px solid #a78bfa; border-radius: 0 0 10px 0; }

        /* Outer pulse rings */
        .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(167,139,250,0.2); pointer-events: none; }
        .ring-1 { inset: -20px; animation: ringPulse 2.5s ease-out infinite; }
        .ring-2 { inset: -40px; animation: ringPulse 2.5s ease-out infinite 0.5s; }
        .ring-3 { inset: -60px; animation: ringPulse 2.5s ease-out infinite 1s; }
        @keyframes ringPulse { 0%{opacity:0.6;transform:scale(0.95)} 100%{opacity:0;transform:scale(1.05)} }

        /* Scan laser */
        .laser { position: absolute; left: 4px; right: 4px; height: 2px;
          background: linear-gradient(90deg, transparent, #a78bfa, #c4b5fd, #a78bfa, transparent);
          box-shadow: 0 0 12px rgba(167,139,250,0.9), 0 0 30px rgba(167,139,250,0.4);
          animation: laserScan 2s ease-in-out infinite; }
        @keyframes laserScan { 0%{top:8px;opacity:0} 10%{opacity:1} 50%{top:calc(100% - 8px)} 90%{opacity:1} 100%{top:8px;opacity:0} }

        /* Target dots */
        .target-dot { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #a78bfa;
          box-shadow: 0 0 8px #a78bfa; }
        .td-tl { top: 10px; left: 10px; }
        .td-tr { top: 10px; right: 10px; }
        .td-bl { bottom: 10px; left: 10px; }
        .td-br { bottom: 10px; right: 10px; }

        /* Center crosshair */
        .crosshair { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .ch-h { width: 20px; height: 1px; background: rgba(167,139,250,0.5); }
        .ch-v { width: 1px; height: 20px; background: rgba(167,139,250,0.5); }
        .ch-inner { position: relative; }

        /* Bottom info bar */
        .info-bar { padding: 14px 20px; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.04); }
        .info-bar-icon { width: 16px; height: 16px; opacity: 0.3; }
        .info-bar p { font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.3px; font-family: 'DM Mono', monospace; }

        /* Scan count badge */
        .scan-badge { display: flex; align-items: center; gap: 6px; font-size: 11px;
          color: rgba(167,139,250,0.5); font-family: 'DM Mono', monospace; }
        .scan-badge-dot { width: 4px; height: 4px; background: rgba(167,139,250,0.5); border-radius: 50%; }

        /* ── Closed state ── */
        .closed-card { border-radius: 28px; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); padding: 3rem 2rem; text-align: center; }
        .closed-icon { width: 72px; height: 72px; border-radius: 20px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .closed-icon svg { width: 32px; height: 32px; color: rgba(255,255,255,0.2); stroke: rgba(255,255,255,0.2); }
        .closed-card h2 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .closed-card p { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 2rem; line-height: 1.6; }

        /* ── Buttons ── */
        .btn-primary { width: 100%; padding: 15px; border-radius: 16px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
          font-family: 'Syne', sans-serif; text-transform: uppercase;
          box-shadow: 0 8px 32px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.2s; position: relative; overflow: hidden; }
        .btn-primary::before { content:''; position:absolute; inset:0;
          background: linear-gradient(135deg,rgba(255,255,255,0.1),transparent);
          opacity:0; transition:opacity 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15); }
        .btn-primary:hover::before { opacity:1; }
        .btn-primary:active { transform: scale(0.98); }

        .btn-secondary { flex: 1; padding: 15px; border-radius: 16px; cursor: pointer;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif;
          transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }

        /* ── Success card ── */
        .result-card { border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); }
        .success-top { height: 3px; background: linear-gradient(90deg, #059669, #10b981, #34d399, #10b981, #059669);
          background-size: 200% 100%; animation: shimmerBar 2s linear infinite; }
        @keyframes shimmerBar { 0%{background-position:0%} 100%{background-position:200%} }

        .result-body { padding: 2.5rem 2rem; text-align: center; }

        .success-icon-wrap { position: relative; width: 88px; height: 88px; margin: 0 auto 1.5rem; }
        .success-ring-1 { position:absolute; inset:-8px; border-radius:50%; border:1px solid rgba(16,185,129,0.15); animation:succRing 2s ease-out infinite; }
        .success-ring-2 { position:absolute; inset:-18px; border-radius:50%; border:1px solid rgba(16,185,129,0.08); animation:succRing 2s ease-out infinite 0.4s; }
        @keyframes succRing { 0%{opacity:0.8;transform:scale(0.9)} 100%{opacity:0;transform:scale(1.1)} }
        .success-icon { width:88px; height:88px; border-radius:50%;
          background: radial-gradient(circle at 30% 30%, rgba(52,211,153,0.2), rgba(16,185,129,0.08));
          border: 1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; }
        .success-icon svg { width:38px; height:38px; stroke:#10b981; }

        .action-tag { display:inline-flex; align-items:center; gap:6px; margin-bottom:1rem; padding:5px 14px;
          border-radius:99px; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
          font-family:'DM Mono',monospace; }
        .tag-checkin { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); color:#10b981; }
        .tag-checkout { background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.2); color:#0ea5e9; }

        .result-card h2 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: -0.3px; }
        .result-card .msg { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.6; }

        .emp-block { margin-top: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 1rem 1.25rem; text-align: left; display: flex; align-items: center; gap: 14px; }
        .emp-avatar { width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.15));
          border: 1px solid rgba(167,139,250,0.2); display:flex; align-items:center; justify-content:center;
          font-size: 16px; font-weight: 800; color: #a78bfa; }
        .emp-name { font-size: 15px; font-weight: 700; color: #fff; }
        .emp-id { font-size: 11px; color: rgba(167,139,250,0.6); font-family: 'DM Mono', monospace; margin-top: 2px; }
        .emp-dist { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 6px; display:flex; align-items:center; gap:4px; font-family:'DM Mono',monospace; }

        .btn-wrap { margin-top: 1.5rem; }

        /* ── Error card ── */
        .error-top { height: 3px; background: linear-gradient(90deg, #dc2626, #ef4444, #f87171, #ef4444, #dc2626);
          background-size: 200% 100%; animation: shimmerBar 2s linear infinite; }
        .error-icon { width:88px; height:88px; border-radius:50%;
          background: radial-gradient(circle at 30% 30%, rgba(248,113,113,0.15), rgba(239,68,68,0.06));
          border: 1px solid rgba(239,68,68,0.25); display:flex; align-items:center; justify-content:center;
          margin: 0 auto 1.5rem; }
        .error-icon svg { width:38px; height:38px; stroke:#ef4444; }
        .error-detail { margin-top: 1rem; padding: 12px 16px; border-radius: 12px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); }
        .error-detail p { font-size: 12px; color: rgba(239,68,68,0.7); font-family: 'DM Mono', monospace; }
        .btn-row { display: flex; gap: 10px; margin-top: 1.5rem; }

        /* ── Scanning overlay ── */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(12px);
          z-index: 100; display: flex; align-items: center; justify-content: center; }
        .overlay-card { background: rgba(10,10,15,0.95); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 2rem 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .spin-wrap { position:relative; width:52px; height:52px; }
        .spin-track { position:absolute; inset:0; border-radius:50%; border:2px solid rgba(255,255,255,0.06); }
        .spin-arc { position:absolute; inset:0; border-radius:50%;
          border:2px solid transparent; border-top-color:#a78bfa;
          animation:spin 0.9s linear infinite; box-shadow: 0 0 16px rgba(167,139,250,0.5); }
        .spin-arc-2 { position:absolute; inset:6px; border-radius:50%;
          border:2px solid transparent; border-top-color:rgba(167,139,250,0.3);
          animation:spin 1.4s linear infinite reverse; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .overlay-label { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -0.2px; }
        .overlay-sub { font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'DM Mono', monospace; letter-spacing: 0.5px; }
      `}</style>

      <div className="scan-page">
        {/* Bg atmosphere */}
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="bg-grid" />

        <div className="inner">
          {/* Header */}
          <div className="hdr">
            <div className="hdr-left">
              <h1>QR Scanner</h1>
              <p>Attendance System</p>
            </div>
            {mode === 'scanner' && (
              <div className="live-pill">
                <div className="live-dot" />
                Live
              </div>
            )}
          </div>

          {/* ── Scanner ── */}
          {mode === 'scanner' && (
            <div className="scanner-card">
              <div className="scanner-topbar">
                <div className="topbar-left">
                  <div className="rec-dot" />
                  <span className="topbar-label">Camera Active</span>
                </div>
                <button className="close-cam-btn" onClick={closeCamera}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Stop
                </button>
              </div>

              <div className="viewport">
                <video ref={videoCallbackRef} playsInline muted />

                {/* Flash on scan */}
                <div className={`flash-overlay ${scanFlash ? 'active' : ''}`} />

                {/* Vignette */}
                <div className="vignette" />

                {/* Scanner frame */}
                <div className="frame-wrap">
                  <div className="frame">
                    {/* Pulse rings behind */}
                    <div className="ring ring-1" />
                    <div className="ring ring-2" />
                    <div className="ring ring-3" />

                    {/* Corners */}
                    <div className="corner corner-tl" />
                    <div className="corner corner-tr" />
                    <div className="corner corner-bl" />
                    <div className="corner corner-br" />

                    {/* Laser */}
                    <div className="laser" />

                    {/* Corner dots */}
                    <div className="target-dot td-tl" />
                    <div className="target-dot td-tr" />
                    <div className="target-dot td-bl" />
                    <div className="target-dot td-br" />

                    {/* Crosshair */}
                    <div className="crosshair">
                      <div className="ch-inner" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
                        <div className="ch-v" style={{ height: 10 }} />
                        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                          <div className="ch-h" />
                          <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(167,139,250,0.4)', margin:'0 2px' }} />
                          <div className="ch-h" />
                        </div>
                        <div className="ch-v" style={{ height: 10 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-bar">
                <svg className="info-bar-icon" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75z" />
                </svg>
                <p>Hold QR steady inside frame • Good lighting required</p>
              </div>
            </div>
          )}

          {/* ── Closed ── */}
          {mode === 'closed' && (
            <div className="closed-card">
              <div className="closed-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2>Camera Off</h2>
              <p>Scanner has been paused.<br />Tap below to resume scanning.</p>
              <button className="btn-primary" onClick={reset}>Start Scanning</button>
            </div>
          )}

          {/* ── Success ── */}
          {mode === 'success' && result && (
            <div className="result-card">
              <div className="success-top" />
              <div className="result-body">
                <div className="success-icon-wrap">
                  <div className="success-ring-1" />
                  <div className="success-ring-2" />
                  <div className="success-icon">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {result.action && (
                  <div className={`action-tag ${result.action === 'check-in' ? 'tag-checkin' : 'tag-checkout'}`}>
                    {result.action === 'check-in' ? '↑ Checked In' : '↓ Checked Out'}
                  </div>
                )}

                <h2>Attendance Marked!</h2>
                <p className="msg">{result.message}</p>

                {(result.employeeName || result.employeeId) && (
                  <div className="emp-block">
                    <div className="emp-avatar">{result.employeeName?.charAt(0) ?? '?'}</div>
                    <div style={{ flex: 1 }}>
                      {result.employeeName && <div className="emp-name">{result.employeeName}</div>}
                      {result.employeeId && <div className="emp-id">{result.employeeId}</div>}
                      {result.detail && (
                        <div className="emp-dist">
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {result.detail}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="btn-wrap">
                  <button className="btn-primary" onClick={reset}>Scan Next Employee</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {mode === 'error' && result && (
            <div className="result-card">
              <div className="error-top" />
              <div className="result-body">
                <div className="error-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2>Scan Failed</h2>
                <p className="msg">{result.message}</p>
                {result.detail && (
                  <div className="error-detail">
                    <p>{result.detail}</p>
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn-secondary" onClick={closeCamera}>Cancel</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={reset}>Try Again</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Scanning Overlay ── */}
        {scanning && (
          <div className="overlay">
            <div className="overlay-card">
              <div className="spin-wrap">
                <div className="spin-track" />
                <div className="spin-arc" />
                <div className="spin-arc-2" />
              </div>
              <div className="overlay-label">Processing…</div>
              <div className="overlay-sub">Marking attendance</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}