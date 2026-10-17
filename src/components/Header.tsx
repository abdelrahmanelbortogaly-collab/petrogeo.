import React, { useState } from 'react';
import { Search, Bell, Shield, LogOut, Settings, X, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types';
import designerBadge from '../assets/images/abdelrahman_designer_badge_1790942819635.jpg';
import { PlatformBrand, getBrandConfig } from '../utils/platformBranding';

interface HeaderProps {
  user: User;
  currentBrand?: PlatformBrand;
  onToggleBrand?: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentBrand = 'petrogeo',
  onToggleBrand,
  onOpenSettings,
  onOpenAdmin,
  onLogout,
  onSearch,
  searchQuery,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const brandConfig = getBrandConfig(currentBrand);
  const logoSrc = brandConfig.logoSrc;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-6 py-2 sm:py-3 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 shadow-sm w-full max-w-full overflow-hidden">
      {/* Right side in RTL (User profile, Notifications, Abdelrahman's Badge & Mobile Menu Toggle) */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Mobile Hamburger Menu Toggle Button (Visible only on mobile/tablet < lg) */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الجانبية'}
          className="lg:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-amber-400 border border-slate-700/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
          title="القائمة الرئيسية"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-amber-400" />
          ) : (
            <div className="flex flex-col gap-1 items-center justify-center w-5 h-5">
              <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
              <span className="w-5 h-0.5 bg-amber-400 rounded-full" />
              <span className="w-3.5 h-0.5 bg-amber-400 rounded-full" />
            </div>
          )}
        </button>

        {/* User profile dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-800/70 transition-all text-right group cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-sm sm:text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              {user.avatar && user.avatar.startsWith('http') ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.avatar || user.name.charAt(0)
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                <span className="truncate max-w-[120px] md:max-w-none">{user.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 shrink-0" title="متصل عبر Firebase Auth" />
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span className="truncate">{user.role === 'admin' ? 'مشرف عام المنصة' : `سنة ${user.year} · ${user.department}`}</span>
              </div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-right animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs text-slate-400">تم تسجيل الدخول كـ</p>
                <p className="text-sm font-bold text-amber-400 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>إعدادات الحساب</span>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>بوابة الإدارة المستقلة ↗</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors relative border border-slate-750 cursor-pointer"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-200">التنبيهات الأكاديمية</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">جديد</span>
              </div>
              <div className="space-y-2 text-right">
                <div className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300">
                  <p className="font-semibold text-amber-300 mb-0.5">شيت البتروفيزياء</p>
                  <p className="text-slate-400 text-[11px]">يرجى تسليم تقرير حساب المسامية الأولية قبل الخميس.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300">
                  <p className="font-semibold text-cyan-300 mb-0.5">كويز علم المعادن والبلورات</p>
                  <p className="text-slate-400 text-[11px]">تم فتح كويز النظم البلورية السبعة الآن.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Abdelrahman Designer Badge - Prominent on tablet/desktop, cleanly integrated without crowding on mobile */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2 sm:pl-3.5 border-l border-slate-800/90 shrink-0">
          <div
            className="flex items-center gap-2.5 group cursor-default"
            title="تصميم وتطوير: م. عبدالرحمن محمد - The Designer & Developer"
          >
            <div className="relative">
              <img
                src={designerBadge}
                alt="Abdelrahman Mohamed - The Designer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl object-contain bg-white p-0.5 border-2 border-amber-500/80 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900" title="المصمم والمطور المعتمد" />
            </div>
            <div className="hidden lg:block text-right">
              <span className="text-xs font-black text-slate-100 block leading-tight">
                م. عبدالرحمن محمد
              </span>
              <span className="text-[9px] font-extrabold text-amber-400 block tracking-wider uppercase">
                THE DESIGNER 👑
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Search Bar (Responsive - hidden on small mobile) */}
      <div className="hidden md:block flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-2 sm:mx-4 md:mx-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث عن محاضرة أو مادة..."
            className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2 bg-slate-950/60 border border-slate-800/90 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all text-right"
          />
        </div>
      </div>

      {/* Left side in RTL (Platform Main Logo & Brand) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img
            src={logoSrc}
            alt="PETROGEO"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain bg-slate-950 p-0.5 border border-amber-500/60 shadow-sm shadow-amber-500/10 shrink-0"
          />
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-lg font-black tracking-wider text-amber-400">
                PETRO<span className="text-slate-100">GEO</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold hidden sm:inline-block border bg-amber-500/20 text-amber-400 border-amber-500/40">
                مصر 🇪🇬
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block truncate max-w-[200px]">
              البوابة الأكاديمية لطلاب جيولوجيا البترول
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
