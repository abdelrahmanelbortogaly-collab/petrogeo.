import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('petrogeo_custom_brand_config');
    } catch {}
    window.location.reload();
  };

  private handleClearAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#0b131e] text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 font-sans"
          dir="rtl"
        >
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-amber-500/40 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-100">حدث خطأ غير متوقع أثناء تحميل الصفحة</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                تم رصد المشكلة بنجاح. يمكنك تحديث الصفحة أو إعادة ضبط الذاكرة المؤقتة لفتح المنصة فوراً.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-rose-300 font-mono text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل المنصة</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAll}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>إعادة ضبط الحساب</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
