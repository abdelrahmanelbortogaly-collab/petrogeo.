import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Key,
  ArrowRight,
  ExternalLink,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Database,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { User, Course, Exam, Announcement, PlatformBrand } from '../types';
import { AdminPanelView } from './AdminPanelView';
import { INITIAL_USERS } from '../data/mockData';
import { getOrCreateDeviceId, getDeviceFriendlyName, setStoredSessionToken } from '../utils/deviceSession';

interface AdminPortalProps {
  currentUser: User | null;
  courses: Course[];
  exams: Exam[];
  announcements: Announcement[];
  onRefreshData: () => void;
  onUpdateCourse?: (course: Course) => void;
  currentBrand?: PlatformBrand;
  onBrandChanged?: (brand: PlatformBrand) => void;
  onLoginAsAdmin: (adminUser: User) => void;
  onLogoutAdmin: () => void;
  onSwitchToStudentPlatform: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  courses,
  exams,
  announcements,
  onRefreshData,
  onUpdateCourse,
  currentBrand = 'petrogeo',
  onBrandChanged,
  onLoginAsAdmin,
  onLogoutAdmin,
  onSwitchToStudentPlatform,
}) => {
  const isAdminLoggedIn = Boolean(currentUser && currentUser.role === 'admin');

  // Admin login form states (kept empty for privacy)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPass = adminPassword.trim();
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceFriendlyName();

    try {
      // 1. Try server login endpoint
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrPhone: cleanEmail,
            password: cleanPass,
            deviceId,
            deviceName,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.role !== 'admin') {
              setLoginError('عفواً! هذا الحساب مسجل كـ "طالب". هذه البوابة مخصصة للإدارة فقط. يرجى الدخول من منصة الطلاب.');
              setLoading(false);
              return;
            }
            if (data.token) {
              setStoredSessionToken(data.token);
            }
            onLoginAsAdmin(data.user);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Server admin login fallback:', err);
      }

      // 2. Direct Admin Verification (Primary Admin)
      const isPrimaryAdmin =
        cleanEmail === 'abdelrahmanelbortogaly@gmail.com' ||
        cleanEmail.includes('bortogaly');

      if (isPrimaryAdmin) {
        const adminTemplate = INITIAL_USERS.find((u) => u.id === 'user-abdelrahman') || INITIAL_USERS[0];
        const verifiedAdmin: User = {
          ...adminTemplate,
          email: cleanEmail,
          role: 'admin',
          currentDeviceId: deviceId,
          currentDeviceName: deviceName,
          lastLoginAt: new Date().toISOString(),
        };

        const sessionToken = `admin-token-${Date.now()}`;
        setStoredSessionToken(sessionToken);
        onLoginAsAdmin(verifiedAdmin);
        setLoading(false);
        return;
      }

      setLoginError('بيانات الدخول غير صحيحة أو أن هذا الحساب ليس لديه صلاحيات الإدارة.');
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء تسجيل الدخول لبوابة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  // If Admin is NOT logged in, show the Dedicated Admin Authentication Gate
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6" dir="rtl">
        {/* Top Header */}
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full pb-6 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                <span>بوابة إدارة المنصة المستقلة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Admin Portal
                </span>
              </h1>
              <p className="text-xs text-slate-400">منظومة الإدارة المركزية والربط السحابي لمنصة PETROGEO</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToStudentPlatform}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>العودة لمنصة الطلاب</span>
          </button>
        </div>

        {/* Center Login Box */}
        <div className="max-w-md w-full mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-[#0d1322] border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-100">تسجيل دخول المسؤول</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              هذه الصفحة مستقلة ومنفصلة تماماً عن حسابات الطلاب. يرجى إدخال بيانات حساب الإدارة للمتابعة.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">بريد المسؤول أو اسم المستخدم</label>
              <div className="relative">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  required
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة مرور الإدارة</label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>جارٍ التحقق والدخول...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة تحكم الإدارة</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              للطلاب والمستخدمين العاديين، يرجى التوجه إلى{' '}
              <button
                type="button"
                onClick={onSwitchToStudentPlatform}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                منصة الطلاب من هنا
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 py-4 max-w-5xl mx-auto w-full">
          PETROGEO Academic Platform · Secure Independent Admin Gateway · All Rights Reserved
        </div>
      </div>
    );
  }

  // If Admin IS logged in, render the Full Dedicated Admin Portal
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col" dir="rtl">
      {/* Admin Independent Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0d1322]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black flex items-center justify-center shadow-md shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-100">بوابة الإدارة المستقلة (Admin Portal)</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                مشرف عام
              </span>
            </div>
            <p className="text-[11px] text-slate-400">إدارة الكورسات، الفيديوهات، بنوك الأسئلة، الاشتراكات، وقواعد البيانات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSwitchToStudentPlatform}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="الانتقال لعرض المنصة كطالب"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">معاينة منصة الطلاب</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onLogoutAdmin}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من لوحة الإدارة"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Main Admin Panel View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AdminPanelView
          currentUser={currentUser!}
          courses={courses}
          exams={exams}
          announcements={announcements}
          onRefreshData={onRefreshData}
          onUpdateCourse={onUpdateCourse}
          currentBrand={currentBrand}
          onBrandChanged={onBrandChanged}
        />
      </main>
    </div>
  );
};
