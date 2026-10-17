import React, { useState } from 'react';
import { User as UserIcon, Phone, Mail, GraduationCap, Building, Key, Check, LogOut, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdateProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateProfile, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [department, setDepartment] = useState(user.department);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await onUpdateProfile({
        name,
        phone,
        department,
        currentPassword,
        newPassword,
      });
      setIsSaved(true);
      setMessage('تم حفظ التعديلات بنجاح في قاعدة البيانات!');
      setTimeout(() => setIsSaved(false), 3000);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
        <h1 className="text-xl font-black text-slate-100 mb-1">إعدادات الحساب والبيانات الشخصية</h1>
        <p className="text-xs text-slate-400">
          تعديل الاسم، رقم الهاتف، القسم، وكلمة المرور الخاصة بحسابك على منصة PETROGEO.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold ${
            isSaved
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
            المعلومات الشخصية والأكاديمية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">اسم الطالب الشامل</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">رقم الهاتف المحمول</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-right focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Email (Read only) */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">البريد الإلكتروني (المعرف الدائم)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-400 font-mono text-right cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500">لا يمكن تعديل البريد لأنه مرتبط بسجلك الأكاديمي.</span>
            </div>

            {/* Academic Year (Read only - determines content) */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">الفرقة / السنة الدراسية</label>
              <input
                type="text"
                value={`الفرقة ${user.year}`}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-amber-400 font-bold text-right cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500">محدد وفقاً لسنة القيد لضمان عزل المحتوى الدراسي.</span>
            </div>

            {/* Department */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-slate-300 font-semibold block">القسم والتخصص</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:outline-none focus:border-amber-500"
              >
                <option value="قسم الجيولوجيا">قسم الجيولوجيا</option>
                <option value="قسم جيولوجيا البترول والغاز الطبيعي">قسم جيولوجيا البترول والغاز الطبيعي</option>
                <option value="قسم الجيوفيزياء">قسم الجيوفيزياء</option>
                <option value="قسم هندسة البترول">قسم هندسة البترول</option>
              </select>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <span>تغيير كلمة المرور</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button & Logout */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            {saving ? (
              <span>جاري الحفظ...</span>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم الحفظ بنجاح</span>
              </>
            ) : (
              <span>حفظ التعديلات</span>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </form>
    </div>
  );
};
