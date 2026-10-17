import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Languages,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  Compass,
  Layers,
  Flame,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Eye,
} from 'lucide-react';
import { Course, Lecture, User } from '../types';
import { useAntiScreenshot } from '../hooks/useAntiScreenshot';
import { SecurityWatermarkOverlay } from './SecurityWatermarkOverlay';

interface PdfPageSummaryProps {
  course: Course;
  lecture?: Lecture;
  contentLang: 'ar' | 'en';
  onToggleLang: () => void;
  rawSummaryText: string;
  loadingSummary?: boolean;
  onRegenerateSummary?: () => void;
  user?: User;
}

export const PdfPageSummary: React.FC<PdfPageSummaryProps> = ({
  course,
  lecture,
  contentLang,
  onToggleLang,
  rawSummaryText,
  loadingSummary = false,
  onRegenerateSummary,
  user,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [paperTheme, setPaperTheme] = useState<'paper' | 'dark'>('paper');
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';
  const antiScreenshotEnabled = !isAdmin; // Security strictly enforced for students

  const { isBlackedOut, isBlurred, warningMessage } = useAntiScreenshot({
    enabled: antiScreenshotEnabled,
    user,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Parse markdown headers and bullet points for publication layout
  const parseSections = (text: string) => {
    const lines = text.split('\n');
    const sections: { title: string; content: string[] }[] = [];
    let currentTitle = contentLang === 'ar' ? 'المقدمة والأهداف التعليمية' : 'Introduction & Learning Outcomes';
    let currentContent: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '---') return;

      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        if (currentContent.length > 0) {
          sections.push({ title: currentTitle, content: [...currentContent] });
          currentContent = [];
        }
        currentTitle = trimmed.replace(/^#+\s*/, '');
      } else {
        currentContent.push(trimmed);
      }
    });

    if (currentContent.length > 0) {
      sections.push({ title: currentTitle, content: currentContent });
    }

    return sections;
  };

  const sections = parseSections(rawSummaryText);

  // Generate official serial number
  const serialNo = `PETRO-ACAD-${(course.code || 'GEO').toUpperCase()}-LEC${lecture?.id ? String(lecture.id).padStart(2, '0') : '01'}-2026`;
  const currentDate = new Date().toLocaleDateString(contentLang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* PDF Document Toolbar */}
      <div className="flex items-center justify-between p-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl flex-wrap gap-3 shadow-lg">
        {/* Left / Start Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <FileText className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5">
                <span>{contentLang === 'ar' ? 'معاينة وثيقة الملخص (صفحة PDF A4)' : 'A4 PDF Document Preview'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  A4 Standard · 300 DPI
                </span>
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              {serialNo} · {contentLang === 'ar' ? 'جاهز للطباعة والمراجعة الأكاديمية' : 'Ready for printing and academic review'}
            </p>
          </div>
        </div>

        {/* Center / Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Paper Theme Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPaperTheme('paper')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                paperTheme === 'paper'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={contentLang === 'ar' ? 'طابع الورق الأكاديمي الكلاسيكي' : 'Classic Academic Paper View'}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{contentLang === 'ar' ? 'ورقة PDF رسمية' : 'PDF Paper'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPaperTheme('dark')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
                paperTheme === 'dark'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={contentLang === 'ar' ? 'الوضع الليلي الاحترافي' : 'Dark Mode Document'}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{contentLang === 'ar' ? 'داكن' : 'Dark'}</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold w-10 text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                title="إعادة ضبط 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Language Switch */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{contentLang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Admin Exclusive: Copy & Print controls */}
          {isAdmin ? (
            <>
              {/* Copy Text */}
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="نسخ النص بالكامل (متاح للمسؤولين فقط)"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ (أدمن)</span>
                  </>
                )}
              </button>

              {/* Print / Save as PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="طباعة / تصدير (أدمن فقط)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة / PDF (أدمن)</span>
              </button>
            </>
          ) : (
            /* Student Protected Mode Indicator: No Download, No Print, No Copy */
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-sm select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{contentLang === 'ar' ? 'عرض دراسي آمن فقط (محمي ضد التنزيل وتصوير الشاشة) 🛡️' : 'Protected Study View (No Download/Capture)'}</span>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewport Container (with zoom scaling & anti-screenshot security) */}
      <div
        className="overflow-x-auto pb-8 pt-2 flex justify-center bg-slate-950/70 p-3 sm:p-6 rounded-3xl border border-slate-800/80 relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={printContainerRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            filter: isBlurred ? 'blur(24px)' : undefined,
          }}
          className={`transition-all duration-200 w-full max-w-4xl rounded-2xl shadow-2xl relative protected-content-view select-none print:hidden ${
            paperTheme === 'paper'
              ? 'bg-[#ffffff] text-slate-900 border border-slate-300'
              : 'bg-[#0f172a] text-slate-100 border border-cyan-500/40'
          }`}
          dir={contentLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Active Forensic Security Watermark & Anti-Screenshot Shield */}
          <SecurityWatermarkOverlay
            user={user}
            isBlurred={isBlurred}
            isBlackedOut={isBlackedOut}
            warningMessage={warningMessage}
            enabled={antiScreenshotEnabled}
          />
          {/* Subtle Watermark on the Page */}
          <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0">
            <div
              className={`transform -rotate-30 text-5xl sm:text-7xl font-black uppercase tracking-widest ${
                paperTheme === 'paper' ? 'text-slate-900/[0.03]' : 'text-cyan-400/[0.04]'
              }`}
            >
              PETROGEO ACADEMY
            </div>
          </div>

          {/* Page Padding Container */}
          <div className="relative z-10 p-6 sm:p-10 space-y-6">
            {/* ================= OFFICIAL ACADEMIC HEADER ================= */}
            <div
              className={`pb-5 border-b-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                paperTheme === 'paper' ? 'border-amber-600/40' : 'border-cyan-500/40'
              }`}
            >
              {/* Institution Title */}
              <div className="flex items-center gap-3.5 text-right">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-inner shrink-0 ${
                    paperTheme === 'paper'
                      ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-900/30'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-700 text-slate-950 shadow-cyan-500/30'
                  }`}
                >
                  <Flame className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                        paperTheme === 'paper'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {contentLang === 'ar' ? 'وثيقة ملخص أكاديمي معتمد' : 'OFFICIAL ACADEMIC SUMMARY'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Vol. 2026-II</span>
                  </div>
                  <h2
                    className={`text-lg sm:text-xl font-black tracking-tight mt-0.5 ${
                      paperTheme === 'paper' ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {contentLang === 'ar'
                      ? 'منصة PETROGEO الأكاديمية لعلوم الجيولوجيا وهندسة البترول'
                      : 'PETROGEO Academy of Petroleum & Earth Sciences'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {contentLang === 'ar'
                      ? 'قسم الاستكشاف وهندسة الخزانات والجيوفيزياء التطبيقية'
                      : 'Department of Reservoir Engineering, Exploration & Geophysics'}
                  </p>
                </div>
              </div>

              {/* Official Document Details Box */}
              <div
                className={`p-3 rounded-xl border text-xs min-w-[200px] space-y-1 ${
                  paperTheme === 'paper'
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-400">{contentLang === 'ar' ? 'كود المقرر:' : 'Course:'}</span>
                  <span className="font-bold text-amber-600">{course.code || 'GEO-301'}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-400">{contentLang === 'ar' ? 'تاريخ التوثيق:' : 'Date:'}</span>
                  <span>{currentDate}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-400">{contentLang === 'ar' ? 'رقم الوثيقة:' : 'Ref ID:'}</span>
                  <span className="font-mono text-[9px] font-bold">{serialNo}</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{contentLang === 'ar' ? 'محتوى مراجع ومدقق' : 'Peer-Reviewed'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{contentLang === 'ar' ? 'صفحة ١ من ١' : 'Page 1 of 1'}</span>
                </div>
              </div>
            </div>

            {/* Lecture Meta Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                paperTheme === 'paper'
                  ? 'bg-amber-500/10 border-amber-300/80 text-amber-950'
                  : 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    paperTheme === 'paper' ? 'text-amber-800' : 'text-amber-400'
                  }`}
                >
                  {course.title} · {course.year || 'الفرقة الثالثة'}
                </span>
                <h3
                  className={`text-base sm:text-lg font-black ${
                    paperTheme === 'paper' ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {lecture?.title || 'المحاضرة الأكاديمية'}
                </h3>
                {lecture?.description && (
                  <p className={`text-xs ${paperTheme === 'paper' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {lecture.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                    paperTheme === 'paper'
                      ? 'bg-white text-slate-800 border-slate-300 shadow-sm'
                      : 'bg-slate-950 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {contentLang === 'ar' ? 'محاضرة تأسيسية هامة' : 'Key Core Lecture'}
                </span>
              </div>
            </div>

            {/* Loading Spinner if Regenerating */}
            {loadingSummary && (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">
                  {contentLang === 'ar' ? 'جاري تحديث وتنسيق الوثيقة بالذكاء الاصطناعي...' : 'Formatting document with Gemini...'}
                </p>
              </div>
            )}

            {/* ================= DOCUMENT BODY / SECTIONS ================= */}
            {!loadingSummary && (
              <div className="space-y-6">
                {sections.map((sec, sIdx) => {
                  const isIntro = sIdx === 0;
                  const isEquations = sec.title.includes('معادلات') || sec.title.includes('قوانين') || sec.title.includes('Equation') || sec.title.includes('Law');
                  const isField = sec.title.includes('حقل') || sec.title.includes('تطبيق') || sec.title.includes('Field');

                  return (
                    <div
                      key={sIdx}
                      className={`p-4 sm:p-5 rounded-xl border transition-all ${
                        paperTheme === 'paper'
                          ? isEquations
                            ? 'bg-amber-50/60 border-amber-200'
                            : isField
                            ? 'bg-cyan-50/60 border-cyan-200'
                            : 'bg-slate-50/50 border-slate-200'
                          : isEquations
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : isField
                          ? 'bg-cyan-950/20 border-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      {/* Section Heading with Icon */}
                      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-inherit">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            paperTheme === 'paper'
                              ? isEquations
                                ? 'bg-amber-600 text-white'
                                : isField
                                ? 'bg-cyan-700 text-white'
                                : 'bg-slate-800 text-white'
                              : isEquations
                              ? 'bg-amber-500/20 text-amber-400'
                              : isField
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {sIdx + 1}
                        </div>
                        <h4
                          className={`text-sm sm:text-base font-black ${
                            paperTheme === 'paper'
                              ? isEquations
                                ? 'text-amber-950'
                                : isField
                                ? 'text-cyan-950'
                                : 'text-slate-900'
                              : isEquations
                              ? 'text-amber-400'
                              : isField
                              ? 'text-cyan-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {sec.title}
                        </h4>
                      </div>

                      {/* Section Content */}
                      <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                        {sec.content.map((p, pIdx) => {
                          const isBullet = p.startsWith('-') || p.startsWith('•') || /^\d+\./.test(p);
                          const cleanText = p.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');

                          if (isBullet) {
                            return (
                              <div
                                key={pIdx}
                                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                                  paperTheme === 'paper'
                                    ? 'hover:bg-white/80 text-slate-800'
                                    : 'hover:bg-slate-800/40 text-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                                    isEquations
                                      ? 'bg-amber-500'
                                      : isField
                                      ? 'bg-cyan-500'
                                      : 'bg-slate-500'
                                  }`}
                                />
                                <span className="flex-1 leading-relaxed font-normal">{cleanText}</span>
                              </div>
                            );
                          }

                          return (
                            <p
                              key={pIdx}
                              className={`leading-relaxed font-normal ${
                                paperTheme === 'paper' ? 'text-slate-800' : 'text-slate-300'
                              }`}
                            >
                              {p}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ================= OFFICIAL FOOTER & STAMP ================= */}
            <div
              className={`pt-6 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
                paperTheme === 'paper'
                  ? 'border-slate-300 text-slate-600'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              {/* Left/Start: Academic Stamp */}
              <div className="flex items-center gap-3">
                {/* Official Circular Digital Stamp */}
                <div
                  className={`w-16 h-16 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-center p-1 select-none transform -rotate-12 ${
                    paperTheme === 'paper'
                      ? 'border-amber-700/60 text-amber-900 bg-amber-50'
                      : 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40'
                  }`}
                >
                  <Award className="w-4 h-4 mb-0.5" />
                  <span className="text-[7px] font-black leading-tight tracking-wider uppercase">
                    PETROGEO
                  </span>
                  <span className="text-[6px] font-bold leading-tight">
                    {contentLang === 'ar' ? 'معتمد أكاديمياً' : 'ACADEMIC SEAL'}
                  </span>
                  <span className="text-[6px] font-mono">2026</span>
                </div>

                <div className="space-y-0.5 text-right">
                  <div className="font-bold text-[11px] text-slate-900 dark:text-slate-200">
                    {contentLang === 'ar' ? 'الاعتماد الأكاديمي لمنصة بتروجيو' : 'PETROGEO Academic Certification'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {contentLang === 'ar'
                      ? 'وثيقة معدة لأغراض المراجعة والتحضير للامتحانات النهائية'
                      : 'Certified document for university exam preparations'}
                  </div>
                </div>
              </div>

              {/* Right/End: Verification Barcode & Legal */}
              <div className="text-center sm:text-left space-y-1">
                <div className="font-mono text-[10px] tracking-widest uppercase font-bold text-slate-500">
                  ||||| | |||| ||| ||||| |||||||
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  SEC-VERIFY: GEO-2026-X94B
                </div>
                <div className="text-[9px] text-slate-400">
                  © 2026 PETROGEO Platform. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
