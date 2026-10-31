import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  RefreshCw,
  Globe,
  Palette,
  ShieldCheck,
  Video,
  FileQuestion,
  Smartphone,
  CreditCard,
  Bot,
  ExternalLink,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import {
  PlatformBrand,
  getBrandConfig,
  getActiveBrand,
  setActiveBrand,
  getCustomBrandSettings,
  saveCustomBrandSettings,
  DEFAULT_BRAND_CONFIGS,
  CustomBrandSettings,
} from '../utils/platformBranding';

interface AdminBrandTabProps {
  currentBrand: PlatformBrand;
  onBrandChanged: (newBrand: PlatformBrand) => void;
}

export const AdminBrandTab: React.FC<AdminBrandTabProps> = ({
  currentBrand,
  onBrandChanged,
}) => {
  const [activeBrandState, setActiveBrandState] = useState<PlatformBrand>(currentBrand);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Custom Settings State for the New Platform
  const initialCustom = getCustomBrandSettings() || {
    name: 'المنصة التعليمية الجديدة',
    shortName: 'NEW PLATFORM',
    tagline: 'المنصة الأكاديمية المتكاملة للطلاب',
    subTitle: 'بوابة المحاضرات والامتحانات الذكية',
    englishTitle: 'Modern Educational & Academic Platform',
    badge: 'المنصة الجديدة 🚀',
    icon: '🎓',
    primaryColor: '#6366f1',
    defaultDepartments: [
      'القسم العام',
      'قسم العلوم التخصصية',
      'قسم الهندسة والتكنولوجيا',
      'قسم نظم المعلومات والحاسبات',
    ],
  };

  const [customForm, setCustomForm] = useState<CustomBrandSettings>(initialCustom);
  const [departmentsText, setDepartmentsText] = useState(
    Array.isArray(initialCustom.defaultDepartments)
      ? initialCustom.defaultDepartments.join('\n')
      : ''
  );

  useEffect(() => {
    setActiveBrandState(currentBrand);
  }, [currentBrand]);

  const handleSelectBrand = (brand: PlatformBrand) => {
    setActiveBrand(brand);
    setActiveBrandState(brand);
    onBrandChanged(brand);
  };

  const handleSaveCustomBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const depts = departmentsText
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      const updatedSettings: CustomBrandSettings = {
        ...customForm,
        defaultDepartments: depts.length > 0 ? depts : initialCustom.defaultDepartments,
      };

      saveCustomBrandSettings(updatedSettings);

      // Also persist to backend platform-settings
      await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: activeBrandState,
          customBrand: updatedSettings,
        }),
      }).catch(() => {});

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving brand settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const petroConfig = DEFAULT_BRAND_CONFIGS.petrogeo;
  const currentConfig = getBrandConfig(activeBrandState);

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-200" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-amber-950/40 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>نظام المنصات المتعددة والهوية الأكاديمية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>إدارة هوية المنصة الجديدة والتبديل بين المنصات</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            المنصة مصممة بنظام ذكي يتيح لك تشغيل <span className="text-amber-400 font-bold">منصة PETROGEO القديمة</span> كما هي بالكامل بدون أي تعديل أو مساس ببياناتها، مع إمكانية تشغيل <span className="text-indigo-400 font-bold">المنصة الجديدة</span> بنفس المواصفات والمزايا بالكامل وتغيير اسمها وهويتها حسب رغبتك.
          </p>
        </div>
      </div>

      {/* 1. Quick Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PETROGEO Original Card */}
        <div
          onClick={() => handleSelectBrand('petrogeo')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeBrandState === 'petrogeo'
              ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
          }`}
        >
          {activeBrandState === 'petrogeo' && (
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3 h-3" />
              المنصة النشطة حالياً
            </span>
          )}
          <div className="flex items-start gap-4">
            <img
              src={petroConfig.logoSrc}
              alt="PETROGEO"
              className="w-14 h-14 rounded-2xl object-contain bg-slate-950 border border-amber-500/40 p-1 shadow-md shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-amber-400">PETROGEO PLATFORM</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  المنصة الأصلية 🛢️
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                البوابة الأكاديمية لطلاب جيولوجيا وهندسة البترول
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                محفوظة بنسبة 100% بكافة لوجوهاتها وموادها ومساعدها الذكي المصري دون أي تغيير.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectBrand('petrogeo');
                }}
                className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeBrandState === 'petrogeo'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{activeBrandState === 'petrogeo' ? 'مفعلة حالياً' : 'تفعيل منصة PETROGEO الأصلية'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* New Platform Card */}
        <div
          onClick={() => handleSelectBrand('new_platform')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeBrandState === 'new_platform'
              ? 'bg-indigo-950/30 border-indigo-500 shadow-xl shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
          }`}
        >
          {activeBrandState === 'new_platform' && (
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-black text-[10px] flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3 h-3" />
              المنصة النشطة حالياً
            </span>
          )}
          <div className="flex items-start gap-4">
            <img
              src={DEFAULT_BRAND_CONFIGS.new_platform.logoSrc}
              alt="New Platform"
              className="w-14 h-14 rounded-2xl object-contain bg-slate-950 border border-indigo-500/40 p-1 shadow-md shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-white">
                  {customForm.name || 'المنصة التعليمية الجديدة'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {customForm.badge || 'المنصة الجديدة 🚀'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {customForm.subTitle || 'نفس مواصفات ومزايا المنصة بالكامل مع هوية جديدة'}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                تحتوي على كل الخصائص: مشغل الفيديو الآمن، الامتحانات، قفل الجهاز، والمساعد الذكي.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectBrand('new_platform');
                }}
                className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeBrandState === 'new_platform'
                    ? 'bg-indigo-500 text-white font-black'
                    : 'bg-slate-800 text-indigo-300 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{activeBrandState === 'new_platform' ? 'مفعلة حالياً' : 'تفعيل المنصة الجديدة'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customization Form for the New Platform */}
      <form
        onSubmit={handleSaveCustomBrand}
        className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <span>تخصيص بيانات وهوية المنصة الجديدة</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك كتابة أي اسم تختاره للمنصة الجديدة، وسيتم اعتماده في الهيدر، القائمة الجانبية، وصفحة تسجيل الدخول فوراً.
            </p>
          </div>
          {saveSuccess && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ وتطبيق الهوية بنجاح!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              اسم المنصة بالعربي (الاسم الكامل):
            </label>
            <input
              type="text"
              value={customForm.name}
              onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
              placeholder="مثال: المنصة التعليمية الجديدة / أكاديمية التفوق"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-right font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              اسم المنصة بالإنجليزي أو المختصر (يظهر في الشعار):
            </label>
            <input
              type="text"
              value={customForm.shortName}
              onChange={(e) => setCustomForm({ ...customForm, shortName: e.target.value })}
              placeholder="مثال: NEW PLATFORM / ACADEMY"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              الشعار اللفظي (السلوجان / Tagline):
            </label>
            <input
              type="text"
              value={customForm.tagline}
              onChange={(e) => setCustomForm({ ...customForm, tagline: e.target.value })}
              placeholder="مثال: المنصة الأكاديمية المتكاملة للطلاب"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              العنوان الفرعي أو التخصص (Subtitle):
            </label>
            <input
              type="text"
              value={customForm.subTitle}
              onChange={(e) => setCustomForm({ ...customForm, subTitle: e.target.value })}
              placeholder="مثال: بوابة المحاضرات والامتحانات الذكية"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              نص البادج / الشارة الترحيبية:
            </label>
            <input
              type="text"
              value={customForm.badge}
              onChange={(e) => setCustomForm({ ...customForm, badge: e.target.value })}
              placeholder="مثال: المنصة الجديدة 🚀 أو دفعة 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              الأيقونة التعبيرية (Emoji):
            </label>
            <input
              type="text"
              value={customForm.icon}
              onChange={(e) => setCustomForm({ ...customForm, icon: e.target.value })}
              placeholder="مثال: 🎓 أو 🚀 أو 🔬"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 text-center text-lg"
            />
          </div>
        </div>

        {/* Departments Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
            <span>قائمة الأقسام والتخصصات (اكتب كل قسم في سطر مستقل):</span>
            <span className="text-[10px] text-slate-500">تظهر للطلاب أثناء تسجيل الحساب الجديد</span>
          </label>
          <textarea
            rows={4}
            value={departmentsText}
            onChange={(e) => setDepartmentsText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 text-right leading-relaxed font-mono"
            placeholder="القسم العام&#10;قسم العلوم التخصصية&#10;قسم الهندسة&#10;قسم الحاسبات"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتطبيق هوية المنصة الجديدة 💾'}</span>
          </button>
        </div>
      </form>

      {/* 3. Specifications Verification (Same Specs Guarantee) */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>تطابق المواصفات والمزايا بين المنصتين (100% نفس الإمكانيات)</span>
        </h3>
        <p className="text-xs text-slate-400">
          تم الحفاظ على كل المميزات التقنية والأمنية، لتعمل المنصة الجديدة بنفس كفاءة منصة PETROGEO:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Video className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">مشغل الفيديو والعلامة المائية</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                حماية المحاضرات من التصوير بعلامة مائية متحركة باسم ورقم الطالب.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">قفل الجهاز الواحد (Single Device)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                منع مشاركة الحسابات وربط كل طالب بجهازه مع نظام طلب فك الارتباط.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <FileQuestion className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">الامتحانات والتصحيح الفوري</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                امتحانات بمؤقت زمني وتصحيح تلقائي وتسجيل للدرجات والمحاولات.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">المساعد الذكي التفاعلي</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مكالمات صوتية وشات ذكي يشرح للطلاب أي معادلة أو مفهوم علمي.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">نظام الاشتراكات وInstaPay</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                إمكانية تفعيل الوضع المجاني أو المدفوع واستقبال إيصالات الدفع وتفعيلها.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">لوحة تحكم إدارية كاملة</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                إدارة كاملة للطلاب، الكورسات، الفيديوهات، الإعلانات، وجداول المحاضرات.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Deployment Instructions Box */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-400">
          <Info className="w-4 h-4" />
          <span>ملاحظة للأدمن حول تشغيل المنصتين:</span>
        </div>
        <p className="leading-relaxed">
          1. <strong>التبديل الداخلي:</strong> يمكنك التبديل بين المنصة الأصلية والجديدة مباشرة من الزر الموجود في شريط التنقل العلوي (الهيدر) أو من هذه الصفحة.
        </p>
        <p className="leading-relaxed">
          2. <strong>الرفع كمنصة مستقلة تماماً على Vercel:</strong> إذا كنت تريد رفع المنصة الجديدة على رابط (URL) ودومين خاص منفصل عن PETROGEO، يمكنك استخدام نفس الكود وربطه بمشروع جديد على Vercel وستعمل كمنصة منفصلة تماماً مع الاحتفاظ بـ PETROGEO على رابطها الحالي!
        </p>
      </div>
    </div>
  );
};
