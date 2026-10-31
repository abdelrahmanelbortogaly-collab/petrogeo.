import React from 'react';
import { Megaphone, AlertCircle, Calendar, User, Bell } from 'lucide-react';
import { Announcement, User as UserType } from '../types';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  user: UserType;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements, user }) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Title */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span>لوحة الإعلانات والتنبيهات الرسمية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إعلانات الكلية والقسم الموجهة لطلاب الفرقة {user.year} والإعلانات العامة.
          </p>
        </div>
        <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          {announcements.length} إعلانات نشطة
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-6 rounded-2xl border transition-all ${
              ann.priority === 'urgent'
                ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                : ann.priority === 'important'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-[#0f172a] border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-500 text-slate-950'
                      : ann.priority === 'important'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ann.priority === 'urgent' ? 'عاجل وهام جداً' : ann.priority === 'important' ? 'تنبيه هام' : 'إعلان عام'}
                </span>
                <span className="text-xs text-slate-400">
                  {ann.targetYear === 'all' ? 'موجه للجميع' : `خاص بالفرقة ${ann.targetYear}`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(ann.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-2 leading-snug">
              {ann.title}
            </h3>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {ann.content}
            </p>

            <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500/80" />
                <span>الناشر: <strong className="text-slate-300 font-semibold">{ann.author}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
