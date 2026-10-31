import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { User } from '../types';

interface SecurityWatermarkOverlayProps {
  user?: User;
  isBlurred: boolean;
  isBlackedOut: boolean;
  warningMessage?: string | null;
  enabled?: boolean;
}

export const SecurityWatermarkOverlay: React.FC<SecurityWatermarkOverlayProps> = ({
  user,
  isBlurred,
  isBlackedOut,
  warningMessage,
  enabled = true,
}) => {
  // Floating position for anti-crop forensic tracker
  const [floatingPos, setFloatingPos] = useState({ top: '25%', left: '30%' });
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        `${now.toLocaleDateString('ar-EG')} ${now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Drifting tracker position every 4.5 seconds
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const top = `${Math.floor(15 + Math.random() * 70)}%`;
      const left = `${Math.floor(10 + Math.random() * 75)}%`;
      setFloatingPos({ top, left });
    }, 4500);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const studentName = user?.name || 'طالب منصة PetroGeo';
  const studentIdentifier = user?.phone || user?.email || (user?.id ? `ID: ${user.id}` : 'STUDENT-LICENSE-2026');

  return (
    <>
      {/* 1. Tiled Forensic Watermark Grid (Layered across content, transparent & unclickable) */}
      <div
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none opacity-[0.065] dark:opacity-[0.085] flex flex-wrap content-start gap-16 p-8 justify-around"
        aria-hidden="true"
        style={{
          transform: 'rotate(-18deg) scale(1.15)',
          transformOrigin: 'center center',
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="text-xs md:text-sm font-black font-mono tracking-wider text-slate-900 dark:text-amber-300/80 whitespace-nowrap"
          >
            {studentName} · {studentIdentifier} · {timestamp} · PETROGEO SECURE
          </div>
        ))}
      </div>

      {/* 2. Floating Animated Anti-Crop Security Badge */}
      <div
        className="absolute pointer-events-none z-30 select-none transition-all duration-1000 ease-in-out opacity-20 hover:opacity-10"
        style={{
          top: floatingPos.top,
          left: floatingPos.left,
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden="true"
      >
        <div className="bg-slate-950/80 text-amber-300 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-xl text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-sm">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>{studentName}</span>
          <span>·</span>
          <span>{studentIdentifier}</span>
        </div>
      </div>

      {/* 3. Window Blur Overlay (Triggers when user activates snipping tools or clicks outside window) */}
      {isBlurred && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 select-none transition-all duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white mb-2">
            المحتوى محمي بحقوق الملكية الفكرية
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
            تم إخفاء المحتوى مؤقتاً بسبب فقدان تركيز النافذة أو تفعيل أدوات الالتقاط. يرجى النقر والعودة للنافذة للمتابعة.
          </p>
          <div className="mt-4 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-amber-400 font-mono">
            {studentName} · حساب موثق
          </div>
        </div>
      )}

      {/* 4. Screenshot Attempt Blackout / Flash Alert */}
      {isBlackedOut && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-100">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center mb-4 animate-bounce">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-rose-400 mb-2">
            ⚠️ تحذير أمني: تصوير الشاشة محظور!
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed mb-4">
            {warningMessage || 'تم تسجيل محاولة أخذ لقطة شاشة. المحتوى مخصص للدراسة المباشرة فقط داخل المنصة.'}
          </p>
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-400 max-w-sm">
            تم إفراغ الحافظة وتوثيق المحاولة تحت معرّف الطالب:
            <span className="block font-mono text-amber-400 font-bold mt-1">
              {studentIdentifier}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
