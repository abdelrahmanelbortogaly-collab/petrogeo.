import React, { useEffect } from 'react';
import { X, Sparkles, Download } from 'lucide-react';
import { User } from '../types';
import officialLogo from '../assets/images/petrogeo_official_logo_1790753628782.jpg';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

export const LogoModal: React.FC<LogoModalProps> = ({ isOpen, onClose, user }) => {
  const logoSrc = officialLogo;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="relative w-full max-w-[92vw] sm:max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-amber-500/10 p-4 sm:p-6 text-center space-y-3 sm:space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 p-1.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer border border-slate-700/80 shadow-xs"
          title="إغلاق النافذة"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pt-1 px-4 sm:px-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-bold">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>الشعار الرسمي المعتمد · قسم الجيولوجيا والبترول</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-100 mt-1">
            منصة <span className="text-amber-400">PETROGEO</span> الأكاديمية
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            الهوية البصرية الرسمية لقسم الجيولوجيا وهندسة البترول
          </p>
        </div>

        {/* Logo Container - 100% visible, object-contain, no cropping */}
        <div className="py-2 flex items-center justify-center">
          <div className="relative group max-w-full">
            <div className="absolute -inset-1 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 opacity-25 blur-md group-hover:opacity-40 transition-opacity duration-300" />
            
            <div className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 max-w-[68vw] max-h-[68vw] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-amber-400/80 shadow-2xl p-2 flex items-center justify-center">
              <img
                src={logoSrc}
                alt="PETROGEO Official Logo"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions:
            - STRICT RULE: Download button NEVER shows for students!
            - Only visible if isAdmin === true
        */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {isAdmin ? (
            <>
              <a
                href={logoSrc}
                download="PETROGEO_Official_Logo.jpg"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الشعار (صلاحية المشرف)</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-48 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-700"
            >
              إغلاق النافذة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
