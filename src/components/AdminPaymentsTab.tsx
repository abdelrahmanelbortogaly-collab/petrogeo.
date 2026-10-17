import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Shield,
  Sparkles,
  Users,
  Smartphone,
  Gift,
  ShieldAlert,
  FileText,
  Video,
} from 'lucide-react';
import { PlatformSettings, PaymentRequest, User } from '../types';

interface AdminPaymentsTabProps {
  onPreviewImage?: (url: string) => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({ onPreviewImage }) => {
  const [settings, setSettings] = useState<PlatformSettings>({
    isPaidMode: false,
    subscriptionPrice: 150,
    instapayNumber: '01007821389',
    instapayAccountName: 'م. عبدالرحمن محمد',
    instapayUsername: 'abdelrahman@instapay',
    subscriptionDuration: 'فصل دراسي كامل',
    paymentInstructions: 'حول مبلغ الاشتراك عبر تطبيق InstaPay إلى رقم الموبايل أعلاه، ثم ارفع لقطة شاشة لإيصال التحويل لتفعيل اشتراكك فوراً.',
  });

  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, paymentsRes] = await Promise.all([
        fetch('/api/platform-settings'),
        fetch('/api/admin/payments'),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData);
      }
      if (paymentsRes.ok) {
        const pData = await paymentsRes.json();
        setPayments(pData);
      }
    } catch (err) {
      console.error('Error loading admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving platform settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePaidMode = async () => {
    const updated = !settings.isPaidMode;
    setSettings((prev) => ({ ...prev, isPaidMode: updated }));

    try {
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaidMode: updated }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle mode:', err);
    }
  };

  const handleToggleStrictSingleDevice = async () => {
    const updated = settings.strictSingleDevice === false ? true : false;
    setSettings((prev) => ({ ...prev, strictSingleDevice: updated }));

    try {
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strictSingleDevice: updated }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle strict single device:', err);
    }
  };

  const handleToggleFirstLectureFree = async () => {
    const updated = settings.allowFirstLectureFree === false ? true : false;
    setSettings((prev) => ({ ...prev, allowFirstLectureFree: updated }));

    try {
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowFirstLectureFree: updated }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle first lecture free trial:', err);
    }
  };

  const handleToggleProtectPdfs = async () => {
    const updated = settings.protectPdfsFromDownload === false ? true : false;
    setSettings((prev) => ({ ...prev, protectPdfsFromDownload: updated }));

    try {
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protectPdfsFromDownload: updated }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle PDF download protection:', err);
    }
  };

  const handleTogglePreventScreenRecording = async () => {
    const updated = settings.preventScreenRecording === false ? true : false;
    setSettings((prev) => ({ ...prev, preventScreenRecording: updated }));

    try {
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preventScreenRecording: updated }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle screen recording prevention:', err);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status: 'approved' } : p))
        );
      }
    } catch (err) {
      console.error('Error approving payment:', err);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('يرجى كتابة سبب رفض الطلب (سيظهر للطالب):', 'بيانات التحويل غير مطابقة أو لم يتم استلام المبلغ');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status: 'rejected', rejectionReason: reason } : p))
        );
      }
    } catch (err) {
      console.error('Error rejecting payment:', err);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentPhone.includes(searchQuery) ||
      p.senderPhone.includes(searchQuery) ||
      p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/30 border border-purple-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>نظام الدفع واشتراكات InstaPay 💳</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  انستا باي مصر
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                التحكم في جعل المنصة مجانية أو مدفوعة، وتحديد رقم هاتف InstaPay وتفعيل اشتراكات الطلاب
              </p>
            </div>
          </div>
        </div>

        {/* Quick Refresh */}
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* 1. MASTER TOGGLE: Free vs Paid Mode (requested by user) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-slate-100">
                وضع المنصة الحالي (مجانية أو بفلوس):
              </span>
              {settings.isPaidMode ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black animate-pulse">
                  🔒 المنصة مدفوعة باشتراك
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black">
                  🟢 المنصة مجانية للجميع
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {settings.isPaidMode
                ? 'يطلب من الطلاب الاشتراك والتحويل عبر InstaPay لفتح المحاضرات والسكاشين ومذكرات الـ PDF.'
                : 'المنصة مفتوحة ومجانية تماماً لجميع الطلاب بدون أي طلب دفع أو اشتراك.'}
            </p>
          </div>

          {/* Big Interactive Toggle Switch */}
          <button
            type="button"
            onClick={handleTogglePaidMode}
            className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 ${
              settings.isPaidMode
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-600'
            }`}
          >
            {settings.isPaidMode ? (
              <>
                <ToggleRight className="w-6 h-6" />
                <span>تبديل المنصة إلى مجانية 🟢</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6" />
                <span>تبديل المنصة إلى مدفوعة (بفلوس) 🔒</span>
              </>
            )}
          </button>
        </div>

        {/* 1b. SINGLE DEVICE LOCK TOGGLE (Requested by user) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span className="text-sm sm:text-base font-black text-slate-100">
                قفل الحساب على جهاز واحد فقط (Strict Single-Device Policy):
              </span>
              {settings.strictSingleDevice !== false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[11px] font-bold">
                  مفعل 🔒 (جهاز واحد فقط لكل طالب)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold">
                  معطل (مفتوح لأي جهاز)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              يربط حساب كل طالب بأول هاتف أو كمبيوتر يسجل الدخول منه ويمنع فتح الحساب على جهاز آخر منعاً لتداول الحسابات. يمكن للمشرف فك ارتباط جهاز أي طالب من قائمة الطلاب بنقرة واحدة.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleStrictSingleDevice}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              settings.strictSingleDevice !== false
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {settings.strictSingleDevice !== false ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>إلغاء قفل الجهاز</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>تفعيل القفل (جهاز واحد فقط) 🔒</span>
              </>
            )}
          </button>
        </div>

        {/* 1c. AUTO FIRST LECTURE FREE TRIAL (Requested by user) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-sm sm:text-base font-black text-slate-100">
                المحاضرة الأولى تجريبية مجاناً (Auto First Lecture Free):
              </span>
              {settings.allowFirstLectureFree !== false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                  مفعلة كمعاينة تجريبية 🎁
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold">
                  معطلة (جميع المحاضرات تتطلب اشتراك) 🔒
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              عند تفعيل هذا الخيار، تصبح المحاضرة الأولى رقم (1) في كل مادة مفتوحة ومجانية تماماً لجميع الطلاب (فيديو وملفات) لتجربة الشرح، وباقي المحاضرات تتطلب التحويل والاشتراك.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleFirstLectureFree}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              settings.allowFirstLectureFree !== false
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {settings.allowFirstLectureFree !== false ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-400" />
                <span>المحاضرة الأولى تجريبية 🎁</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>تفعيل المعاينة المجانية</span>
              </>
            )}
          </button>
        </div>

        {/* 1d. PDF DOWNLOAD PROTECTION (Requested by user) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-5 h-5 text-rose-400" />
              <span className="text-sm sm:text-base font-black text-slate-100">
                حظر تحميل ملفات الـ PDF على أجهزة الطلاب (PDF Download Lock):
              </span>
              {settings.protectPdfsFromDownload !== false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                  محمي بنجاح 🛡️ (معاينة فقط بالمنصة)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold">
                  مفتوح للتحميل المباشر ⚠️
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              عند تفعيل هذا الخيار، يتم منع الطلاب من تنزيل ملفات الـ PDF على أجهزتهم نهائياً، واقتصار دراستها وتصفحها على القارئ الذكي المائي المشفر داخل المنصة، مع منع الطباعة والنسخ لضمان حقوق الملكية الفكرية.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleProtectPdfs}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              settings.protectPdfsFromDownload !== false
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {settings.protectPdfsFromDownload !== false ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-400" />
                <span>حظر التحميل مفعل 🛡️</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>السماح بالتحميل</span>
              </>
            )}
          </button>
        </div>

        {/* 1e. ANTI-SCREEN RECORDING & WATERMARK PROTECTION (Requested by user) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span className="text-sm sm:text-base font-black text-slate-100">
                منع تصوير وتسجيل الشاشة + العلامة المائية (Anti-Screen Recording):
              </span>
              {settings.preventScreenRecording !== false ? (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold">
                  نظام الحماية الذكي نشط 🔒
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold">
                  معطل
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              يقوم بإظهار علامة مائية ديناميكية متحركة تحمل اسم الطالب ورقم هاتفه وكود حسابه تطفو فوق الفيديو، مع إيقاف الفيديو وحجب الشاشة فوراً عند محاولة تشغيل برامج التسجيل أو الضغط على PrintScreen أو مغادرة نافذة المحاضرة.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTogglePreventScreenRecording}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              settings.preventScreenRecording !== false
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {settings.preventScreenRecording !== false ? (
              <>
                <ToggleRight className="w-5 h-5 text-purple-400" />
                <span>حماية الشاشة مفعلة 🛡️</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>تفعيل حماية الشاشة</span>
              </>
            )}
          </button>
        </div>

        {/* 2. INSTAPAY SETTINGS FORM */}
        <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* InstaPay Phone Number (Requested by user) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                رقم موبايل InstaPay للتحويل: *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={settings.instapayNumber}
                  onChange={(e) => setSettings({ ...settings, instapayNumber: e.target.value })}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-amber-400 font-mono font-bold focus:outline-none text-right"
                  dir="ltr"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-400">
                هذا هو الرقم الذي سيظهر لجميع الطلاب لتحويل رسوم الاشتراك عليه.
              </p>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                اسم صاحب الحساب على InstaPay: *
              </label>
              <input
                type="text"
                required
                value={settings.instapayAccountName}
                onChange={(e) => setSettings({ ...settings, instapayAccountName: e.target.value })}
                placeholder="م. عبدالرحمن محمد"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-slate-100 font-bold focus:outline-none"
              />
            </div>

            {/* Subscription Price in EGP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                سعر الاشتراك (بالجنيه المصري): *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={settings.subscriptionPrice}
                  onChange={(e) => setSettings({ ...settings, subscriptionPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-slate-100 font-bold focus:outline-none text-right"
                />
                <span className="text-xs text-slate-500 font-bold absolute left-3 top-1/2 -translate-y-1/2">
                  ج.م
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IPA Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                عنوان انستا باي (IPA Username - اختياري):
              </label>
              <input
                type="text"
                value={settings.instapayUsername || ''}
                onChange={(e) => setSettings({ ...settings, instapayUsername: e.target.value })}
                placeholder="username@instapay"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none font-mono text-right"
                dir="ltr"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                مدة صلاحية الاشتراك:
              </label>
              <input
                type="text"
                value={settings.subscriptionDuration}
                onChange={(e) => setSettings({ ...settings, subscriptionDuration: e.target.value })}
                placeholder="فصل دراسي كامل / سنة دراسية"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Instructions for Students */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              تعليمات التحويل التي تظهر للطلاب في النافذة:
            </label>
            <textarea
              rows={2}
              value={settings.paymentInstructions}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-200 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ إعدادات الدفع بنجاح!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                تطبق التغييرات فوراً على جميع الطلاب في المنصة.
              </span>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات انستا باي'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">إجمالي المشتركين المفعلين</span>
          <p className="text-xl font-black text-emerald-400">{approvedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">طلبات بانتظار التأكيد</span>
          <p className="text-xl font-black text-amber-400">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">إجمالي الإيرادات المؤكدة</span>
          <p className="text-xl font-black text-purple-400">{totalRevenue} ج.م</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">وضع المنصة الحالي</span>
          <p className={`text-sm font-black mt-1 ${settings.isPaidMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {settings.isPaidMode ? 'مدفوعة باشتراك 🔒' : 'مجانية للجميع 🟢'}
          </p>
        </div>
      </div>

      {/* 4. STUDENT PAYMENT REQUESTS TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-100">
              طلبات اشتراك وتحويلات الطلاب المستلمة
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">
              {filteredPayments.length} طلب
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الطالب أو الهاتف..."
                className="pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterStatus === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterStatus === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                المعلقة ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('approved')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterStatus === 'approved' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                المفعلة
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">لا توجد طلبات اشتراك في هذا القسم</h4>
            <p className="text-xs text-slate-500">
              عند قيام أي طالب بتحويل الرسوم عبر InstaPay ورفع صورة الإيصال ستظهر تفاصيلها هنا فوراً.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  payment.status === 'pending'
                    ? 'bg-slate-950 border-amber-500/40 shadow-md shadow-amber-500/5'
                    : payment.status === 'approved'
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 opacity-75'
                }`}
              >
                {/* Left/Main Info */}
                <div className="flex items-start gap-3.5">
                  {/* Receipt Thumbnail with Lightbox trigger */}
                  <div
                    onClick={() => {
                      if (onPreviewImage) onPreviewImage(payment.receiptImageUrl);
                      else setSelectedReceipt(payment.receiptImageUrl);
                    }}
                    className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 cursor-pointer group shrink-0"
                    title="اضغط لتكبير ومعاينة إشعار التحويل"
                  >
                    <img
                      src={payment.receiptImageUrl}
                      alt="إشعار التحويل"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-100">{payment.studentName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        الفرقة {payment.studentYear} · {payment.studentDepartment}
                      </span>
                      {payment.status === 'pending' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>بانتظار المراجعة</span>
                        </span>
                      )}
                      {payment.status === 'approved' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تم التفعيل بنجاح</span>
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>مرفوض</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>
                        المبلغ: <strong className="text-amber-400">{payment.amount} ج.م</strong>
                      </span>
                      <span>
                        هاتف التحويل: <strong className="text-slate-200" dir="ltr">{payment.senderPhone}</strong>
                      </span>
                      {payment.referenceNumber && (
                        <span>
                          الرقم المرجعي: <strong className="text-slate-200 font-mono">{payment.referenceNumber}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1">
                      <span>تاريخ الطلب: {new Date(payment.createdAt).toLocaleString('ar-EG')}</span>
                      {payment.rejectionReason && (
                        <span className="text-rose-400">· سبب الرفض: {payment.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPreviewImage) onPreviewImage(payment.receiptImageUrl);
                      else setSelectedReceipt(payment.receiptImageUrl);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة الإيصال</span>
                  </button>

                  {payment.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprovePayment(payment.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>تفعيل فوراً ✅</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectPayment(payment.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </>
                  )}

                  {payment.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleRejectPayment(payment.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold cursor-pointer"
                      title="إلغاء التفعيل"
                    >
                      إلغاء التفعيل
                    </button>
                  )}

                  {payment.status === 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleApprovePayment(payment.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      إعادة التفعيل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Standalone Receipt Lightbox */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="relative max-w-xl max-h-[90vh] p-2 bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedReceipt}
              alt="صورة إشعار التحويل من InstaPay"
              className="max-h-[82vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
