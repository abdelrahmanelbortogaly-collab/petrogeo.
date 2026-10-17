import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  FileCode,
  HardDrive,
  Users,
  BookOpen,
  FileText,
  Download,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Link as LinkIcon,
  ClipboardPaste,
  HelpCircle,
} from 'lucide-react';
import { updateSupabaseClient, clearSupabaseClient } from '../lib/supabaseClient';

interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  anonKey?: string;
  hasAnonKey?: boolean;
  hasServiceKey?: boolean;
  error?: string | null;
  message: string;
  counts?: {
    courses: number;
    exams: number;
    students: number;
  };
  tablesChecked?: {
    courses: boolean;
    exams: boolean;
    profiles: boolean;
  };
}

export const AdminSupabaseTab: React.FC = () => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [sqlContent, setSqlContent] = useState('');

  // Form Inputs for direct credentials setup
  const [inputUrl, setInputUrl] = useState('');
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [inputServiceRoleKey, setInputServiceRoleKey] = useState('');
  const [rawEnvPaste, setRawEnvPaste] = useState('');
  const [showEnvPaste, setShowEnvPaste] = useState(false);
  const [autoCleanNotice, setAutoCleanNotice] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setStatus(data);
      if (data.url && !inputUrl) {
        setInputUrl(data.url);
      }
      if (data.anonKey && !inputAnonKey) {
        setInputAnonKey(data.anonKey);
      }
    } catch (e: any) {
      setStatus({
        configured: false,
        connected: false,
        url: '',
        message: 'فشل فحص الاتصال بالخادم',
      });
    } finally {
      setLoading(false);
    }
  };

  // Smart .env text parser
  const handleParseEnvText = (rawText: string) => {
    if (!rawText.trim()) return;
    const lines = rawText.split('\n');
    let extractedUrl = '';
    let extractedAnon = '';
    let extractedService = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim().toUpperCase();
        let val = trimmed.slice(eqIdx + 1).trim();
        val = val.replace(/^['"`\s]+|['"`\s]+$/g, '');
        if (key.includes('SUPABASE_URL') || key.includes('PROJECT_URL')) {
          extractedUrl = val;
        } else if (key.includes('SERVICE_ROLE') || key.includes('SERVICE_KEY')) {
          extractedService = val;
        } else if (key.includes('ANON_KEY') || key.includes('PUBLIC_KEY') || key.includes('API_KEY')) {
          extractedAnon = val;
        }
      }
    }

    let parsedCount = 0;
    if (extractedUrl) {
      handleUrlChange(extractedUrl);
      parsedCount++;
    }
    if (extractedAnon) {
      handleAnonChange(extractedAnon);
      parsedCount++;
    }
    if (extractedService) {
      handleServiceChange(extractedService);
      parsedCount++;
    }

    if (parsedCount > 0) {
      setAutoCleanNotice(`تم استخراج وتعبئة ${parsedCount} متغيرات بنجاح من نص .env 🪄`);
      setTimeout(() => setAutoCleanNotice(null), 5000);
    } else {
      setAutoCleanNotice('لم يتم العثور على متغيرات SUPABASE_URL أو ANON_KEY في النص الملصق.');
      setTimeout(() => setAutoCleanNotice(null), 4000);
    }
  };

  const handleUrlChange = (val: string) => {
    // If user pasted multi-line .env chunk into the URL field by mistake
    if (val.includes('=') && (val.includes('SUPABASE') || val.includes('ANON'))) {
      handleParseEnvText(val);
      return;
    }
    let cleaned = val.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
    const dashMatch = cleaned.match(/(?:supabase\.com\/dashboard\/project|app\.supabase\.com\/project)\/([a-z0-9_-]+)/i);
    if (dashMatch && dashMatch[1]) {
      cleaned = `https://${dashMatch[1]}.supabase.co`;
      setAutoCleanNotice('تم تحويل رابط لوحة التحكم إلى رابط الـ API تلقائياً ⚡');
      setTimeout(() => setAutoCleanNotice(null), 4000);
    }
    setInputUrl(cleaned);
  };

  const handleAnonChange = (val: string) => {
    let cleaned = val.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
    cleaned = cleaned.replace(/^(?:Bearer\s+|anon\s*:\s*|apikey\s*:\s*)/i, '').trim();
    setInputAnonKey(cleaned);
  };

  const handleServiceChange = (val: string) => {
    let cleaned = val.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
    cleaned = cleaned.replace(/^(?:Bearer\s+|service_role\s*:\s*)/i, '').trim();
    setInputServiceRoleKey(cleaned);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputAnonKey.trim()) {
      setConfigMessage({ type: 'error', text: 'يرجى إدخال عنوان المشروع ومفتاح الـ API العام (anon public key)' });
      return;
    }

    setSavingConfig(true);
    setConfigMessage(null);

    try {
      const res = await fetch('/api/admin/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl.trim(),
          anonKey: inputAnonKey.trim(),
          serviceRoleKey: inputServiceRoleKey.trim() || undefined,
          rawEnvText: rawEnvPaste.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ وتفعيل المفاتيح');
      }

      // Update frontend client instance with normalized URL
      const finalUrl = data.config?.url || inputUrl.trim();
      updateSupabaseClient(finalUrl, inputAnonKey.trim());
      setInputUrl(finalUrl);

      setConfigMessage({ type: 'success', text: data.message || 'تم حفظ مفاتيح Supabase وتفعيل الاتصال بنجاح 🟢' });
      await fetchStatus();
      setTimeout(() => setConfigMessage(null), 8000);
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ المفاتيح' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء ربط مشروع Supabase ومسح المفاتيح المخزنة؟')) {
      return;
    }
    setDisconnecting(true);
    setConfigMessage(null);
    try {
      const res = await fetch('/api/admin/supabase/disconnect', { method: 'POST' });
      const data = await res.json();
      clearSupabaseClient();
      setInputUrl('');
      setInputAnonKey('');
      setInputServiceRoleKey('');
      setConfigMessage({ type: 'success', text: data.message || 'تم إلغاء الربط بنجاح' });
      await fetchStatus();
      setTimeout(() => setConfigMessage(null), 5000);
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء إلغاء الربط' });
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Load schema file content for copying
    fetch('/supabase-schema.sql')
      .then((r) => r.text())
      .then((t) => setSqlContent(t))
      .catch(() => {});
  }, []);

  const handleSeed = async () => {
    if (!window.confirm('هل تريد تهيئة وزرع المواد والامتحانات التجريبية في قاعدة بيانات Supabase؟')) {
      return;
    }
    setSeeding(true);
    setSeedSuccess('');
    try {
      const res = await fetch('/api/supabase/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشلت التهيئة');
      setSeedSuccess('تمت زراعة وتحديث البيانات الأولية في Supabase بنجاح 🟢');
      fetchStatus();
      setTimeout(() => setSeedSuccess(''), 5000);
    } catch (err: any) {
      alert(`خطأ أثناء التهيئة: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopySql = () => {
    if (sqlContent) {
      navigator.clipboard.writeText(sqlContent);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <span>ربط وإدارة قاعدة بيانات Supabase ⚡</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                السحابة المباشرة (Cloud DB)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              متابعة حالة الاتصال بقاعدة بيانات Supabase، تخزين ملفات ومحاضرات البترول، وسياسات الحماية RLS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>فحص الاتصال</span>
          </button>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>لوحة تحكم Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {/* Interactive Supabase Credentials Setup Form (Requested by user) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>إدخال وحفظ مفاتيح ربط Supabase مباشرة 🔑</span>
                {status?.connected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    مفعل ومتصل 🟢
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ألصق عنوان مشروعك ومفاتيح الـ API هنا لحفظها وتفعيل قاعدة البيانات والتخزين السحابي فوراً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeys ? 'إخفاء المفاتيح' : 'إظهار المفاتيح'}</span>
            </button>

            {status?.configured && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="إلغاء ربط المشروع ومسح المفاتيح"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{disconnecting ? 'جاري المسح...' : 'إلغاء الربط 🗑️'}</span>
              </button>
            )}
          </div>
        </div>

        {autoCleanNotice && (
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{autoCleanNotice}</span>
          </div>
        )}

        {configMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              configMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
            }`}
          >
            {configMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{configMessage.text}</span>
          </div>
        )}

        {/* Quick .env Import Accordion (Requested by user for easy key setup) */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowEnvPaste(!showEnvPaste)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>📋 لصق سريع لكود .env الكامل (Auto-Import من ملف البيئة)</span>
            </button>
            <span className="text-[10px] text-slate-500">طريقة سريعة بنقرة واحدة</span>
          </div>

          {showEnvPaste && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80 animate-in fade-in">
              <p className="text-[11px] text-slate-400">
                الصق كود الـ <code>.env</code> الكامل أو الأسطر التي نسختها من Supabase، وسيقوم النظام باستخراج رابط المشروع ومفتاح Anon ومفتاح Service Role تلقائياً:
              </p>
              <textarea
                rows={3}
                value={rawEnvPaste}
                onChange={(e) => setRawEnvPaste(e.target.value)}
                placeholder={`VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"\nVITE_SUPABASE_ANON_KEY="eyJhbGciOi..."\nSUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."`}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500 text-left"
                dir="ltr"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleParseEnvText(rawEnvPaste)}
                  disabled={!rawEnvPaste.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>استخراج وتطبيق القيم على النموذج 🪄</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. عنوان مشروع Supabase (Project URL أو رابط لوحة التحكم): *</span>
                <span className="text-[10px] text-slate-500 font-normal">يقبل رابط https://xxx.supabase.co أو رابط المشروع المباشر</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-cyan-300 font-mono focus:outline-none text-left"
                  dir="ltr"
                />
                <LinkIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Anon Public Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>2. المفتاح العام (anon public key): *</span>
                <span className="text-[10px] text-slate-500 font-normal">من Project Settings &gt; API &gt; anon public</span>
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                required
                value={inputAnonKey}
                onChange={(e) => handleAnonChange(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none text-left"
                dir="ltr"
              />
            </div>

            {/* Service Role Secret Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>3. مفتاح الخدمة السري (service_role key):</span>
                <span className="text-[10px] text-amber-400/80 font-normal">اختياري - موصى به لصلاحيات الأدمن الكاملة</span>
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={inputServiceRoleKey}
                onChange={(e) => handleServiceChange(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (اختياري)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-amber-300 font-mono focus:outline-none text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>يتم الحفظ والتخزين الدائم في المنصة والملف الداخلي، وتحديث المتصفح والخادم فوراً.</span>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق والاتصال بـ Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ واختبار الاتصال فوراً ⚡</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Connection Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Box */}
        <div className="md:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-bold text-slate-300">حالة الاتصال المباشر بـ Supabase:</span>
            {status?.connected ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>متصل بقاعدة البيانات السحابية 🟢</span>
              </span>
            ) : status?.configured ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>المفاتيح موجودة وبانتظار تشغيل كود SQL 🟡</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>بانتظار إدخال المتغيرات في البيئة ⚙️</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-400">عنوان المشروع (Project URL):</span>
              <span className="font-mono text-cyan-300 text-[11px] truncate max-w-[240px]" dir="ltr">
                {status?.url || 'لم يتم تحديده بعد'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-400">صلاحية المفتاح الإداري (Service Role):</span>
              <span className={`text-[11px] font-bold ${status?.hasServiceKey ? 'text-emerald-400' : 'text-slate-500'}`}>
                {status?.hasServiceKey ? 'نشط (صلاحيات كاملة لإدارة المحتوى) 🛡️' : 'غير متوفر (يعمل بمفتاح Anon)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              {status?.message}
            </div>
          </div>
        </div>

        {/* Live Counts in Supabase */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3.5 flex flex-col justify-between">
          <span className="text-sm font-bold text-slate-300 block pb-2 border-b border-slate-800">
            البيانات المخزنة في Supabase:
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>المواد والمحاضرات</span>
              </div>
              <span className="font-black text-amber-400 text-sm">{status?.counts?.courses ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>الامتحانات والكويزات</span>
              </div>
              <span className="font-black text-purple-400 text-sm">{status?.counts?.exams ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>الطلاب المسجلين</span>
              </div>
              <span className="font-black text-cyan-400 text-sm">{status?.counts?.students ?? 0}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding || !status?.connected}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            title="زرع المواد والامتحانات في Supabase"
          >
            <Sparkles className="w-4 h-4" />
            <span>{seeding ? 'جاري الزرع...' : 'زرع المناهج في Supabase ✨'}</span>
          </button>
        </div>
      </div>

      {/* SQL Setup Instructions & Quick Copy */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-amber-400" />
              <span>كود تهيئة قاعدة بيانات Supabase (SQL Migration Script)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ينشئ جميع الجداول (الطلاب، الكورسات، المحاضرات، الامتحانات، النتائج، سياسات RLS، وسلات التخزين Storage).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم النسخ للحافظة ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ كود SQL بالكامل 📋</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              {showSqlPreview ? 'إخفاء المعاينة' : 'معاينة كود SQL'}
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              <span>تشغيل كود SQL:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              اضغط على زر <strong>نسخ كود SQL</strong> أعلاه، ثم افتح <strong>SQL Editor</strong> داخل لوحة تحكم Supabase والصقه واضغط <strong>Run</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
              <span>نسخ مفاتيح الـ API:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              من لوحة Supabase اذهب إلى <strong>Project Settings</strong> ثم <strong>API</strong> وانسخ <strong>Project URL</strong> ومفتاح <strong>anon public</strong> ومفتاح <strong>service_role</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
              <span>حفظ وتفعيل المفاتيح بالمنصة:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              ألصق المفاتيح في النموذج بالأعلى أو استخدم زر <strong>لصق سريع لـ .env</strong> واضغط <strong>حفظ واختبار الاتصال</strong>، وسيتم حفظها بشكل دائم في خادم المنصة وتفعيلها فوراً دون الحاجة لتعديل يدوي.
            </p>
          </div>
        </div>

        {/* SQL Preview Box */}
        {showSqlPreview && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-850 font-mono text-[11px] text-slate-300 max-h-80 overflow-y-auto text-left" dir="ltr">
            <pre className="whitespace-pre-wrap">{sqlContent || '-- Loading supabase-schema.sql...'}</pre>
          </div>
        )}
      </div>

      {/* Source Code Download Card for Vercel / GitHub Export */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <span>تحميل سورس كود المشروع بالكامل (ZIP)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">جاهز لـ Vercel & GitHub</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              يشمل كافة مكونات React، خادم Express، إعدادات Vercel Serverless، ومخطط قاعدة بيانات Supabase SQL.
            </p>
          </div>
        </div>

        <a
          href="/api/download-source-code"
          download="petrogeo-source-code.zip"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer text-center"
        >
          <Download className="w-4 h-4" />
          <span>تحميل السورس كود الآن (.ZIP)</span>
        </a>
      </div>

      {/* Security & RLS Confirmation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-300 block font-bold mb-0.5">سياسات حماية Row Level Security (RLS) مفعلة بالكامل:</strong>
          كل طالب مقيد برؤية بياناته وامتحانات سنته الدراسية فقط، مع قفل الحساب على جهاز واحد لمنع تداول الحسابات، وصلاحيات كاملة للمشرف والأدمن فقط.
        </div>
      </div>
    </div>
  );
};
