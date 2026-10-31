import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Monitor,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { downloadPdfFile, resolvePdfUrl } from './PdfViewer';
import { User } from '../types';
import { useAntiScreenshot } from '../hooks/useAntiScreenshot';
import { SecurityWatermarkOverlay } from './SecurityWatermarkOverlay';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfModalViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  fileSize?: string;
  allowDownload?: boolean;
  user?: User;
}

export const PdfModalViewer: React.FC<PdfModalViewerProps> = ({
  isOpen,
  onClose,
  url,
  title = 'ملف المحاضرة / السكشن PDF',
  fileSize,
  allowDownload = false,
  user,
}) => {
  const resolvedUrl = resolvePdfUrl(url);

  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Strict permission policy: only admin can download if explicitly allowed
  const isPermittedToDownload = Boolean(allowDownload && user?.role === 'admin');
  const antiScreenshotEnabled = !isPermittedToDownload;

  const { isBlackedOut, isBlurred, warningMessage } = useAntiScreenshot({
    enabled: isOpen && antiScreenshotEnabled,
    user,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

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

  // Load PDF data directly with fetch
  useEffect(() => {
    if (!isOpen || !resolvedUrl) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    const loadDoc = async () => {
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error(`تعذر تحميل الملف (${res.status})`);
        const contentType = res.headers.get('content-type') || '';
        const arrayBuffer = await res.arrayBuffer();

        if (contentType.includes('text/html')) {
          throw new Error('الملف قيد التجهيز على الخادم');
        }

        if (!isMounted) return;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        console.warn('Modal PDF load error:', err);
        if (isMounted) {
          setError(err?.message || 'تعذر عرض ملف الـ PDF');
          setLoading(false);
          setViewMode('native');
        }
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [isOpen, resolvedUrl]);

  // Render on Canvas
  useEffect(() => {
    if (viewMode !== 'canvas' || !pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.height = viewport.height * pixelRatio;
        canvas.width = viewport.width * pixelRatio;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (_) {}
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        // Render subtle security watermark on canvas
        if (user || !allowDownload) {
          context.save();
          context.rotate((-25 * Math.PI) / 180);
          context.font = 'bold 15px sans-serif';
          context.fillStyle = 'rgba(239, 68, 68, 0.13)';
          const watermarkText = `${user?.name || 'طالب المنصة'} · ${user?.phone || 'ترخيص رقمي'} · محتوى محمي`;
          const w = viewport.width;
          const h = viewport.height;
          for (let x = -w; x < w * 2.5; x += 320) {
            for (let y = -h; y < h * 2.5; y += 180) {
              context.fillText(watermarkText, x, y);
            }
          }
          context.restore();
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Modal canvas render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [viewMode, pdfDoc, currentPage, scale, user, allowDownload]);

  // Anti-print / Anti-save interceptor
  useEffect(() => {
    if (allowDownload || !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allowDownload, isOpen]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage((prev) => prev + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.6));
  };

  const handleDownload = async () => {
    if (!isPermittedToDownload) {
      alert('عفواً، تم حظر تنزيل هذا المستند لحماية حقوق النشر والملكية الفكرية. يمكنك دراسته ومعاينته داخل المنصة فقط.');
      return;
    }
    await downloadPdfFile(resolvedUrl, title, true);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right select-none transition-all duration-300 ${
          isFullScreen
            ? 'w-[98vw] h-[96vh]'
            : 'w-full max-w-5xl h-[88vh] max-h-[900px]'
        }`}
        dir="rtl"
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-100 truncate">
                {title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-2">
                <span>{fileSize || 'ملف دراسي PDF'}</span>
                {numPages > 0 && <span>· {numPages} صفحات</span>}
                {!isPermittedToDownload && (
                  <span className="text-amber-400 font-bold">
                    · عرض ومذاكرة فقط داخل المنصة
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPermittedToDownload ? (
              <>
                {/* View Mode Switcher */}
                <div className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('canvas')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'canvas'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>القارئ الذكي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('native')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'native'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>عارض Chrome</span>
                  </button>
                </div>

                {/* Direct Local Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  title="تحميل الـ PDF كاملاً على جهازك (أدمن فقط)"
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span className="hidden xs:inline">تم التحميل!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">تحميل على الجهاز (أدمن)</span>
                    </>
                  )}
                </button>

                {/* Open in Full Chrome Tab */}
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700"
                  title="فتح في تبويب Chrome مستقل"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">معاينة داخل المنصة (محمي من التحميل واللقطات) 🛡️</span>
                <span className="sm:hidden">محمي 🛡️</span>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700"
              title={isFullScreen ? 'تصغير' : 'تكبير الشاشة'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Toolbar (for Canvas Mode) */}
        {viewMode === 'canvas' && (
          <div
            className="p-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs px-4"
            dir="ltr"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                Page {currentPage} / {numPages || 1}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.6 || loading}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 px-1.5">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3.0 || loading}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Viewer Body */}
        {viewMode === 'native' ? (
          <div className="w-full h-full flex-1 bg-slate-950 p-2">
            <object
              data={`${resolvedUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full rounded-2xl border border-slate-800"
            >
              <iframe
                src={`${resolvedUrl}#toolbar=1`}
                className="w-full h-full border-0 rounded-2xl"
                title={title}
              />
            </object>
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070b12] relative protected-content-view select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Active Forensic Security Watermark & Anti-Screenshot Shield */}
            <SecurityWatermarkOverlay
              user={user}
              isBlurred={isBlurred}
              isBlackedOut={isBlackedOut}
              warningMessage={warningMessage}
              enabled={antiScreenshotEnabled}
            />

            {loading && (
              <div className="text-center space-y-3 py-16">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">
                  جاري تحميل وعرض صفحات الـ PDF...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center space-y-3 p-6 max-w-md bg-slate-900 rounded-2xl border border-rose-500/40 relative z-30">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-100">تعذر عرض ملف الـ PDF</h4>
                <p className="text-xs text-slate-400">
                  {error || 'حدث خطأ أثناء تحميل المستند.'}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setLoading(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>إعادة المحاولة</span>
                  </button>
                  {isPermittedToDownload && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل على الجهاز (أدمن)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              style={{
                filter: isBlurred ? 'blur(24px)' : undefined,
              }}
              className={`shadow-2xl rounded-lg bg-white transition-all duration-200 ${loading || error ? 'hidden' : 'block'}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
