'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

type Mode = 'choose' | 'camera' | 'show-qr' | 'success' | 'error';

export default function ScanPage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [message, setMessage] = useState('');
  const [employee, setEmployee] = useState<{ name: string; employeeId: string; qrCode?: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('employee');
    if (stored) setEmployee(JSON.parse(stored));
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setMode('camera');
    setScanning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Load jsQR dynamically
      const jsQR = (await import('jsqr')).default;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !ctx) return;
        const { videoWidth: w, videoHeight: h } = videoRef.current;
        if (!w || !h) return;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data) {
          stopCamera();
          handleQRData(code.data);
        }
      }, 300);
    } catch {
      setMode('error');
      setMessage('Camera access denied. Please allow camera permission.');
    }
  };

  const handleQRData = useCallback(async (qrData: string) => {
    setScanning(true);
    try {
      const token = localStorage.getItem('employee_token');
      const res = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrTokenUsed: qrData }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Attendance marked successfully!');
        setMode('success');
      } else {
        setMessage(data.message || 'Failed to mark attendance.');
        setMode('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setMode('error');
    } finally {
      setScanning(false);
    }
  }, []);

  const reset = () => {
    stopCamera();
    setMode('choose');
    setMessage('');
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">Choose how you want to mark your attendance</p>
      </div>

      {/* Mode: Choose */}
      {mode === 'choose' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera scan */}
          <button onClick={startCamera}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-left transition-all group hover:bg-slate-800/50">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm">Scan QR Code</p>
            <p className="text-slate-400 text-xs mt-1">Use your camera to scan the attendance QR code</p>
          </button>

          {/* Show my QR */}
          <button onClick={() => setMode('show-qr')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-left transition-all group hover:bg-slate-800/50">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 6h.01M3 3h5v5H3V3zm13 0h5v5h-5V3zM3 16h5v5H3v-5z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm">Show My QR</p>
            <p className="text-slate-400 text-xs mt-1">Show your QR code for admin scanner</p>
          </button>
        </div>
      )}

      {/* Mode: Camera */}
      {mode === 'camera' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-white text-sm font-medium">Camera Active — Point at QR code</p>
            </div>
            <button onClick={reset} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg text-xs">
              Cancel
            </button>
          </div>
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                {/* Scan line animation */}
                <div className="absolute left-1 right-1 h-0.5 bg-blue-400/70 animate-bounce" style={{ top: '50%' }} />
              </div>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-slate-500 text-xs">Make sure the QR code is well-lit and fits within the frame</p>
          </div>
        </div>
      )}

      {/* Mode: Show QR */}
      {mode === 'show-qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold">My QR Code</h2>
              <p className="text-slate-400 text-xs mt-0.5">Show this to the admin scanner</p>
            </div>
            <button onClick={reset} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            {employee?.qrCode ? (
              <>
                <div className="bg-white rounded-2xl p-4 shadow-xl">
                  <Image src={employee.qrCode} alt="My QR Code" width={200} height={200} className="rounded-lg" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{employee.name}</p>
                  <code className="text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">{employee.employeeId}</code>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center w-full">
                  <p className="text-blue-300 text-xs">Hold this QR code in front of the admin scanner to mark your attendance</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 6h.01M3 3h5v5H3V3zm13 0h5v5h-5V3zM3 16h5v5H3v-5z" />
                </svg>
                <p className="text-sm">No QR code found. Contact your admin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode: Success */}
      {mode === 'success' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Attendance Marked!</h2>
          <p className="text-slate-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
              Mark Again
            </button>
            <a href="/attendance" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all">
              View History
            </a>
          </div>
        </div>
      )}

      {/* Mode: Error */}
      {mode === 'error' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Failed!</h2>
          <p className="text-slate-400 text-sm mb-6">{message}</p>
          <button onClick={reset} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all">
            Try Again
          </button>
        </div>
      )}

      {scanning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <svg className="animate-spin w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white text-sm">Marking attendance...</p>
          </div>
        </div>
      )}
    </div>
  );
}