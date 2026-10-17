import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  PlaySquare,
  HelpCircle,
  FileText,
  Calendar,
  Megaphone,
  Bot,
  Clock,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  X,
  CreditCard,
} from 'lucide-react';
import { User } from '../types';
import designerBadge from '../assets/images/abdelrahman_designer_badge_1790942819635.jpg';
import { InstaPayModal } from './InstaPayModal.tsx';
import { PlatformBrand, getBrandConfig } from '../utils/platformBranding.ts';

export type ActiveTab =
  | 'dashboard'
  | 'courses'
  | 'lectures'
  | 'quizzes'
  | 'exams'
  | 'schedules'
  | 'announcements'
  | 'ai'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User;
  currentBrand?: PlatformBrand;
  onLogout: () => void;
  onOpenAdminPortal?: () => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  currentBrand = 'petrogeo',
  onLogout,
  onOpenAdminPortal,
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const [showInstaPayModal, setShowInstaPayModal] = useState(false);
  const brandConfig = getBrandConfig(currentBrand);
  const logoSrc = brandConfig.logoSrc;
  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'courses', label: 'كورساتي', icon: BookOpen },
    { id: 'lectures', label: 'المحاضرات', icon: PlaySquare },
    { id: 'quizzes', label: 'الكويزات', icon: HelpCircle },
    { id: 'exams', label: 'الامتحانات', icon: FileText },
    { id: 'schedules', label: 'الجداول', icon: Calendar },
    { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
    {
      id: 'ai',
      label: 'المساعد الذكي',
      icon: Bot,
      badge: 'جديد',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    { id: 'history', label: 'السجل الأكاديمي', icon: Clock },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const handleItemClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onCloseMobileMenu();
  };

  const renderNavContent = () => (
    <>
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider">
          القائمة الرئيسية
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all group cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-bold border-r-4 border-amber-500 shadow-sm shadow-amber-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Standalone Admin Portal Button - Only visible if logged in as Admin */}
        {user.role === 'admin' && onOpenAdminPortal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onOpenAdminPortal();
                onCloseMobileMenu();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 cursor-pointer group shadow-sm"
              title="الانتقال إلى بوابة الإدارة المستقلة"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold">بوابة الإدارة المستقلة ↗</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-400/20 text-cyan-300 rounded font-semibold">
                Admin
              </span>
            </button>
          </div>
        )}

        {/* Student InstaPay Subscription Button */}
        {user.role === 'student' && (
          <div className="pt-2">
            <button
              onClick={() => {
                setShowInstaPayModal(true);
                onCloseMobileMenu();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 text-purple-300 hover:border-purple-500/60 hover:text-white cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold">اشتراك InstaPay</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  user.subscriptionStatus === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {user.subscriptionStatus === 'active' ? 'مفعل 👑' : 'انستا باي 🇪🇬'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: AI Mascot Card & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* Interactive Eilik AI Robot Card */}
        <div
          onClick={() => handleItemClick('ai')}
          className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
        >
          <div className="relative shrink-0">
            <img
              src="/src/assets/images/petrogeo_3d_robot_1790517881314.jpg"
              alt="PETROGEO 3D Robot"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-amber-400/40 group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">معيد PETROGEO 🇪🇬</span>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">اسألني أي سؤال بالمصري!</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            onLogout();
            onCloseMobileMenu();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors border border-transparent hover:border-rose-900/40 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR (Visible on large screens >= lg) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 xl:w-72 bg-[#0a101b] border-l border-slate-800/80 h-[calc(100vh-65px)] sticky top-[65px] select-none p-3.5 overflow-y-auto shrink-0">
        {/* Desktop Sidebar Top Brand Header */}
        <div className="pb-3.5 mb-2 border-b border-slate-800/80">
          <div className="w-full flex items-center gap-3 p-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-right">
            <img
              src={logoSrc}
              alt={brandConfig.name}
              className={`w-10 h-10 rounded-xl object-contain bg-slate-950 p-0.5 border shadow-sm shrink-0 ${
                currentBrand === 'petrogeo' ? 'border-amber-500/60' : 'border-indigo-500/60'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {currentBrand === 'petrogeo' ? (
                  <span className="text-base font-black text-amber-400">
                    PETRO<span className="text-slate-100">GEO</span>
                  </span>
                ) : (
                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
                    {brandConfig.shortName || brandConfig.name}
                  </span>
                )}
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${brandConfig.badgeColor}`}>
                  {brandConfig.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate -mt-0.5">{brandConfig.subTitle}</p>
            </div>
          </div>
        </div>

        {renderNavContent()}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (Visible on mobile/tablet when isMobileMenuOpen = true) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobileMenu}
          />

          {/* Drawer Sidebar */}
          <aside className="fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-[#0a101b] border-l border-slate-800/90 shadow-2xl flex flex-col justify-between p-4 overflow-y-auto z-50 animate-in slide-in-from-right duration-300">
            {/* Drawer Header with Close Button */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-right">
                <img
                  src={logoSrc}
                  alt={brandConfig.name}
                  className={`w-10 h-10 rounded-xl object-contain bg-slate-950 p-0.5 border shadow-sm shrink-0 ${
                    currentBrand === 'petrogeo' ? 'border-amber-500/60' : 'border-indigo-500/60'
                  }`}
                />
                <div className="text-right">
                  {currentBrand === 'petrogeo' ? (
                    <span className="text-base font-black text-amber-500">
                      PETRO<span className="text-slate-100">GEO</span>
                    </span>
                  ) : (
                    <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
                      {brandConfig.shortName || brandConfig.name}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium -mt-1">{brandConfig.tagline}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Designer Badge Card inside mobile drawer */}
            <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 flex items-center gap-3">
              <img
                src={designerBadge}
                alt="The Designer"
                className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-amber-500/60 shadow-md shrink-0"
              />
              <div className="text-right">
                <span className="text-xs font-black text-slate-100 block">
                  م. عبدالرحمن محمد
                </span>
                <span className="text-[9px] font-extrabold text-amber-400 block tracking-wider uppercase">
                  THE DESIGNER 👑
                </span>
              </div>
            </div>

            {/* Nav links and bottom widgets */}
            {renderNavContent()}
          </aside>
        </div>
      )}

      {/* InstaPay Subscription Modal */}
      <InstaPayModal
        isOpen={showInstaPayModal}
        onClose={() => setShowInstaPayModal(false)}
        user={user}
      />
    </>
  );
};
