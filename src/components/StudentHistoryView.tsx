import React from 'react';
import { Award, CheckCircle2, Clock, Calendar, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { ExamResult, StudentProgress, Course, User } from '../types';

interface StudentHistoryViewProps {
  user: User;
  progress: StudentProgress;
  courses: Course[];
  results: ExamResult[];
}

export const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({
  user,
  progress,
  courses,
  results,
}) => {
  const completedLecturesCount = progress.completedLectureIds?.length || 0;
  const totalLectures = courses.reduce((acc, c) => acc + (c.totalLectures || 0), 0);
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Title Card */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>السجل الأكاديمي والتحصيل الدراسي</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            سجل دائم وموثق لجميع المحاضرات التي شاهدتها والامتحانات التي اجتزتها.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-100">{user.name}</div>
            <div className="text-xs text-amber-400 font-semibold">سنة {user.year} · {user.department}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-2xl font-black text-amber-400 tabular-nums">{progress.overallPercentage || 0}%</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">نسبة التقدم الكلي</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-2xl font-black text-slate-100 tabular-nums">
            {completedLecturesCount} / {totalLectures}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">محاضرات منتهية</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-2xl font-black text-cyan-400 tabular-nums">{results.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">امتحانات وكويزات تم حلها</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-2xl font-black text-emerald-400 tabular-nums">{averageScore}%</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">متوسط الدرجات التراكمي</div>
        </div>
      </div>

      {/* Exam Results History Table */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>سجل درجات الامتحانات والكويزات</span>
        </h2>

        {results.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            لم تقم بحل أي كويز بعد. توجه إلى قسم "الكويزات" لاختبار معلوماتك وحفظ نتيجتك!
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-100 text-sm mb-1">{res.examTitle}</h4>
                  <p className="text-slate-400">
                    المادة: <span className="text-slate-200">{res.courseTitle}</span> · تاريخ الحل:{' '}
                    {new Date(res.completedAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="font-bold text-slate-200 text-sm">
                      {res.score} / {res.totalMarks}
                    </span>
                    <div className="text-[10px] text-slate-500">الدرجة الفعلية</div>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-lg font-bold text-xs ${
                      res.percentage >= 85
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : res.percentage >= 65
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {res.percentage}% - {res.percentage >= 85 ? 'ممتاز' : res.percentage >= 65 ? 'جيد جداً' : 'يحتاج مراجعة'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses Breakdown */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>حالة إتمام المواد الدراسية</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const courseCompletedCount = course.lectures.filter((l) =>
              progress.completedLectureIds?.includes(l.id)
            ).length;
            const pct = progress.courseProgress?.[course.id] || 0;

            return (
              <div key={course.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{course.title}</span>
                  <span className="text-xs text-amber-400 font-bold tabular-nums">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{course.category}</span>
                  <span>{courseCompletedCount} من {course.totalLectures} محاضرة مكتملة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
