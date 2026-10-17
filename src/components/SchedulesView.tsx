import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Compass, Bookmark, ShieldCheck } from 'lucide-react';
import { ScheduleItem, User as UserType } from '../types';

interface SchedulesViewProps {
  schedules: ScheduleItem[];
  user: UserType;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({ schedules, user }) => {
  const [filterType, setFilterType] = useState<'all' | 'محاضرة' | 'سكشن' | 'امتحان' | 'تدريب'>('all');

  const filtered = schedules.filter((s) => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>الجداول الدراسية والتدريب الصيفي - الفرقة {user.year}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            جدول المحاضرات والسكاشن ومواعيد الامتحانات وبرامج التدريب الميداني لشركات البترول.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'محاضرة', label: 'المحاضرات' },
            { id: 'سكشن', label: 'السكاشن والمعامل' },
            { id: 'امتحان', label: 'الامتحانات' },
            { id: 'تدريب', label: 'الدورة الصيفية' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summer Internship Highlight Card if selected or in all */}
      {(filterType === 'all' || filterType === 'تدريب') && (
        <div className="p-6 rounded-2xl bg-gradient-to-l from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              الدورة الصيفية 2026 - تدريب شركات البترول
            </span>
            <Compass className="w-5 h-5 text-amber-400" />
          </div>

          <h3 className="text-base font-bold text-slate-100">
            برنامج التدريب الميداني الحقلي بشركات بتروبل (Belayim) وجابكو (GUPCO)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            يشمل التدريب زيارة منصات الحفر البحرية والبرية بخليج السويس، ومتابعة تسجيلات طفلة الحفر (Mud Logging)، وفحص العينات الصخرية على منصات الإنتاج، وتفسير جسات الآبار السلكية بصورة حية.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">الموقع:</span>
              <span className="font-bold text-slate-200">حقول بلاعيم / رأس شقير</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">الفترة:</span>
              <span className="font-bold text-slate-200">أسبوعين عمل مكثف</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">شهادة الاعتماد:</span>
              <span className="font-bold text-emerald-400">معتمدة من وزارة البترول</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                  item.type === 'محاضرة'
                    ? 'bg-amber-500/10 text-amber-400'
                    : item.type === 'سكشن'
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : item.type === 'تدريب'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {item.type}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{item.day} · {item.time}</span>
              </div>
            </div>

            <h4 className="text-base font-bold text-slate-100">{item.subject}</h4>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.location}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">{item.instructor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
