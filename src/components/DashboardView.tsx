import React from 'react';
import {
  Trophy,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  User as UserIcon,
  Phone,
  Mail,
  GraduationCap,
  Building,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { User, Course, StudentProgress, Announcement, Exam } from '../types';

interface DashboardViewProps {
  user: User;
  courses: Course[];
  progress: StudentProgress;
  announcements: Announcement[];
  upcomingExams: Exam[];
  onSelectCourse: (course: Course) => void;
  onNavigateTab: (tab: any) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  courses,
  progress,
  announcements,
  upcomingExams,
  onSelectCourse,
  onNavigateTab,
  onOpenSettings,
}) => {
  const totalLectures = courses.reduce((acc, c) => acc + (c.totalLectures || c.lectures?.length || 0), 0);
  const completedLecturesCount = progress.completedLectureIds?.length || 0;
  const overallPercentage = progress.overallPercentage || 0;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
      {/* 1. Hero Amber Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#d97706] via-[#ea580c] to-[#c2410c] text-white p-4 sm:p-6 md:p-8 shadow-xl shadow-amber-950/20 border border-amber-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
          {/* Right Text in RTL */}
          <div className="space-y-1.5 text-right flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>أهلاً بيك تاني 👋 {user.name}، جاهز تكمل مذاكرتك؟</span>
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm md:text-base font-medium opacity-90">
              سنة {user.year} · {user.department} — كل محتواك الخاص مستنيك.
            </p>
          </div>

          {/* Left Progress Box in Banner */}
          <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">{overallPercentage}%</div>
              <div className="text-[11px] sm:text-xs text-amber-200 font-semibold">إجمالي التقدم</div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200 shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Ambient subtle background glow */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Available Courses */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition-all text-right group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-100 tabular-nums">
              {courses.length}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-400">المواد المتاحة</div>
        </div>

        {/* Card 2: Total Lectures */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition-all text-right group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
              <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-100 tabular-nums">
              {totalLectures}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-400">إجمالي المحاضرات</div>
        </div>

        {/* Card 3: Completed Lectures */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition-all text-right group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-100 tabular-nums">
              {completedLecturesCount}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-400">محاضرات مكتملة</div>
        </div>

        {/* Card 4: Progress Percentage */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-3.5 sm:p-5 hover:border-slate-700 transition-all text-right group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-100 tabular-nums">
              {overallPercentage}%
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-400">نسبة التقدم</div>
        </div>
      </div>

      {/* 3. Main 2-Column Section (Courses list + Profile data card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right side in RTL (Width ~ 8/12): Continue Studying "كمّل مذاكرتك" */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-slate-800/90 rounded-2xl p-6 text-right space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>كمّل مذاكرتك</span>
            </h2>
            <button
              onClick={() => onNavigateTab('courses')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>كل موادي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Courses List */}
          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                لا توجد مواد مسجلة لفرقتك الدراسية حالياً.
              </div>
            ) : (
              courses.map((course) => {
                const courseProgressPct = progress.courseProgress?.[course.id] || 0;
                return (
                  <div
                    key={course.id}
                    onClick={() => onSelectCourse(course)}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    {/* Action button */}
                    <button className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all shrink-0">
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* Course info */}
                    <div className="flex items-center gap-3.5 flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                          {course.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {course.totalLectures} محاضرة · {course.category}
                        </div>
                      </div>

                      {/* Course Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Overall Progress Bar at bottom */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">تقدمك العام</span>
              <span className="text-amber-400 tabular-nums">{overallPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Left side in RTL (Width ~ 4/12): Student Profile Data "بياناتي" */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800/90 rounded-2xl p-6 text-right space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">بياناتي</h2>
            <button
              onClick={onOpenSettings}
              className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
            >
              تعديل
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Name */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-slate-100 font-semibold truncate max-w-[160px]">
                {user.name}
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <span>الاسم</span>
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-slate-100 font-semibold font-mono tabular-nums">
                {user.phone || 'غير مسجل'}
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <span>رقم الهاتف</span>
                <Phone className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-slate-100 font-semibold truncate max-w-[150px] font-mono text-[11px]">
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <span>البريد الإلكتروني</span>
                <Mail className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Academic Year */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-amber-400 font-bold">
                سنة {user.year}
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <span>الفرقة الدراسية</span>
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-slate-100 font-semibold">
                {user.department}
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <span>القسم</span>
                <Building className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Quick AI Help Banner in Profile card */}
          <div
            onClick={() => onNavigateTab('ai')}
            className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors flex items-center justify-between"
          >
            <div className="text-right">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>معيد PETROGEO الذكي</span>
              </div>
              <p className="text-[11px] text-slate-400">واقف معاك في أي سؤال بالمصري</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>

      {/* 4. Bottom Quick Information: Announcements & Upcoming Exam */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latest Announcement */}
        {announcements.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 text-right flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {announcements[0].title}
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                  تنبيه
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {announcements[0].content}
              </p>
            </div>
          </div>
        )}

        {/* Next Exam / Quiz */}
        {upcomingExams.length > 0 && (
          <div
            onClick={() => onNavigateTab('quizzes')}
            className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 hover:border-cyan-500/40 cursor-pointer transition-all text-right flex items-start gap-3.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                  {upcomingExams[0].title}
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold">
                  كويز متاح
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المدة: {upcomingExams[0].durationMinutes} دقيقة · إجمالي الدرجات: {upcomingExams[0].totalMarks} درجة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
