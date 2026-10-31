import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Monitor,
  Layers,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { User } from '../types';
import { useAntiScreenshot } from '../hooks/useAntiScreenshot';
import { SecurityWatermarkOverlay } from './SecurityWatermarkOverlay';
import { resolveMediaUrl } from '../utils/resilientUploader';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const resolvePdfUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl;
  if (
    !rawUrl.startsWith('http://') &&
    !rawUrl.startsWith('https://') &&
    !rawUrl.startsWith('/') &&
    !rawUrl.startsWith('blob:') &&
    !rawUrl.startsWith('data:')
  ) {
    url = `/uploads/${rawUrl}`;
  }
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url;
  }
};

export const downloadPdfFile = async (url: string, fileName: string, allowed: boolean = true) => {
  if (!allowed) {
    alert('عفواً، تم حماية هذا المستند ضد التحميل للحفاظ على حقوق الملكية الفكرية. يمكنك دراسته ومعاينته بالكامل داخل المنصة.');
    return;
  }
  const targetUrl = resolvePdfUrl(url);
  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error('Network error');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  } catch (_) {
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = cleanName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

interface PdfViewerProps {
  url: string;
  fileName?: string;
  fileSize?: string;
  allowDownload?: boolean;
  user?: User;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  fileName,
  fileSize,
  allowDownload = false,
  user,
}) => {
  const [activeUrl, setActiveUrl] = useState<string>(url);

  useEffect(() => {
    setActiveUrl(url);
  }, [url]);

  const resolvedUrl = resolvePdfUrl(activeUrl);
  const displayName = fileName || 'مستند المحاضرة PDF';

  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Strict security policy: Only platform administrators can download if explicitly permitted
  const isPermittedToDownload = Boolean(allowDownload && user?.role === 'admin');
  const antiScreenshotEnabled = !isPermittedToDownload;

  const { isBlackedOut, isBlurred, warningMessage } = useAntiScreenshot({
    enabled: antiScreenshotEnabled,
    user,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const loadDoc = async () => {
      try {
        const targetUrl = await resolveMediaUrl(activeUrl);
        const res = await fetch(targetUrl);
        if (!res.ok) {
          throw new Error(`خطأ في استجابة الخادم (${res.status})`);
        }
        const contentType = res.headers.get('content-type') || '';
        const arrayBuffer = await res.arrayBuffer();

        // If returned HTML instead of PDF, do NOT switch to native iframe
        if (contentType.includes('text/html')) {
          throw new Error('المستند غير متوفر بتنسيق PDF صالح');
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
        console.warn('PDF.js parse warning:', err);
        if (isMounted) {
          setError(err?.message || 'تعذر القراءة عبر العارض الداخلي');
          setLoading(false);
          // Keep canvas mode to avoid rendering entire site inside an iframe
          setViewMode('canvas');
        }
      }
    };

    if (resolvedUrl) {
      loadDoc();
    }

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [resolvedUrl]);

  // Render current page on canvas
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

        // Render dynamic student security watermark on canvas to prevent screenshots / piracy
        if (user || !allowDownload) {
          context.save();
          context.rotate((-25 * Math.PI) / 180);
          context.font = 'bold 15px sans-serif';
          context.fillStyle = 'rgba(239, 68, 68, 0.13)';
          const watermarkText = `${user?.name || 'طالب المنصة'} · ${user?.phone || 'ترخيص رقمي'} · محتوى محمي ضد النسخ`;
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
          console.warn('Canvas render caught:', err);
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

  // Anti-print / Anti-save keyboard shortcut interceptor
  useEffect(() => {
    if (allowDownload) return;
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
  }, [allowDownload]);

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

  const handleResetZoom = () => {
    setScale(1.25);
  };

  const handleDownload = async () => {
    if (!isPermittedToDownload) {
      alert('عفواً، تم حماية هذا المستند للدراسة والمعاينة داخل المنصة فقط ومنع التحميل للحفاظ على حقوق الملكية الفكرية.');
      return;
    }
    await downloadPdfFile(resolvedUrl, displayName, true);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div
      className="space-y-3 w-full text-right select-none"
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Academic Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-100 truncate max-w-[260px] sm:max-w-md">
                {displayName}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold shrink-0">
                PDF محمي داخل المنصة
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{fileSize || 'ملف دراسي معتمد'}</span>
              {numPages > 0 && <span>· {numPages} صفحات دراسية</span>}
              {!isPermittedToDownload && (
                <span className="text-amber-400 font-bold">· للعرض والمذاكرة فقط (غير مصرح بالتنزيل)</span>
              )}
            </p>
          </div>
        </div>

        {/* Dual Actions: Download & Open in Independent Chrome Window (Only for authorized Admin) */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPermittedToDownload ? (
            <>
              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode('canvas')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'canvas'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>العارض الذكي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('native')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'native'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>عارض Chrome</span>
                </button>
              </div>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                title="تحميل ملف الـ PDF كاملاً على جهازك (أدمن فقط)"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>تم التحميل بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل على الجهاز (أدمن)</span>
                  </>
                )}
              </button>

              {/* Open in Full Chrome Tab */}
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="فتح الـ PDF في تبويب Chrome مستقل"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نافذة جديدة</span>
              </a>
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-sm select-none">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>مستند محمي (عرض داخل المنصة فقط - محمي ضد التنزيل وتصوير الشاشة) 🛡️</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Display Container */}
      <div
        className={`rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col transition-all duration-300 ${
          isFullScreen
            ? 'fixed inset-2 sm:inset-4 z-50 shadow-2xl border-2 border-rose-500/40 bg-slate-950'
            : 'relative min-h-[560px]'
        }`}
      >
        {/* Controls Toolbar (Active for Canvas Mode) */}
        {viewMode === 'canvas' && (
          <div
            className="p-2.5 sm:p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
            dir="ltr"
          >
            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs font-bold text-slate-200 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
                Page {currentPage} / {numPages || 1}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.6 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-[11px] text-slate-200 cursor-pointer transition-colors"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3.0 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 ml-1.5 cursor-pointer"
                title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content Viewer Body */}
        {viewMode === 'native' ? (
          /* NATIVE CHROME PDF VIEWER (Direct object/embed with #toolbar=1) */
          <div className="w-full h-full min-h-[620px] flex-1 bg-slate-950 p-1">
            <object
              data={`${resolvedUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full min-h-[600px] rounded-xl border border-slate-800"
            >
              <iframe
                src={`${resolvedUrl}#toolbar=1`}
                className="w-full h-full min-h-[600px] border-0 rounded-xl"
                title={displayName}
              />
            </object>
          </div>
        ) : (
          /* IN-PLATFORM CANVAS RENDERER */
          <div
            className="relative min-h-[520px] max-h-[750px] overflow-auto p-4 flex items-center justify-center bg-[#070b12] protected-content-view select-none"
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
                  جاري قراءة وعرض صفحات الـ PDF على الشاشة...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center space-y-3 p-8 max-w-md bg-slate-900/90 rounded-2xl border border-rose-500/40 relative z-30">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-100">تعذر عرض صفحة الـ PDF</h4>
                <p className="text-xs text-slate-400">
                  {error || 'حدث خطأ أثناء تحميل المستند.'}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setLoading(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>إعادة المحاولة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUrl('/uploads/1790755708064_كتاب_الجيولوجيا_فرقة_تانية_قسم_كيمياء.pdf');
                      setError('');
                      setLoading(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>عرض سلايدات المنهج المعتمدة 📄</span>
                  </button>
                  {isPermittedToDownload && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
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
              className={`shadow-2xl rounded-lg bg-white transition-all duration-200 ${
                loading || error ? 'hidden' : 'block'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
