import React, { useState } from 'react';
import {
  BookOpen,
  PlayCircle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Trash2,
  RotateCcw,
  PlusCircle,
  Gift,
} from 'lucide-react';
import { Course, StudentProgress, User } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CoursesViewProps {
  courses: Course[];
  progress: StudentProgress;
  user: User;
  onSelectCourse: (course: Course) => void;
  onSelectLecture: (course: Course, lectureId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onRestoreDemo?: () => void;
  onGoToAdmin?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  progress,
  user,
  onSelectCourse,
  onSelectLecture,
  onDeleteCourse,
  onRestoreDemo,
  onGoToAdmin,
}) => {
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const handleDeleteConfirmed = () => {
    if (courseToDelete && onDeleteCourse) {
      onDeleteCourse(courseToDelete.id);
    }
    setCourseToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Top Banner explaining Year content isolation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>مواد وكورسات الفرقة {user.year}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            يتم عرض المقررات الخاصة بفرقتك الدراسية فقط، متوافقة مع الخطة الأكاديمية لقسم الجيولوجيا والبترول.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRestoreDemo && courses.length === 0 && (
            <button
              onClick={onRestoreDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>استعادة المقررات التجريبية</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <GraduationCap className="w-4 h-4" />
            <span>الفرقة {user.year} (قسم الجيولوجيا)</span>
          </div>
        </div>
      </div>

      {/* Courses Cards Grid or Empty State */}
      {courses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f172a] border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100">تم تفريغ كافة المواد والكورسات</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              المنصة فارغة تماماً وجاهزة لإضافة مقرراتك ومحاضراتك الخاصة من لوحة الأدمن، أو يمكنك استعادة المقررات التجريبية في أي وقت.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة مادة من لوحة الأدمن</span>
              </button>
            )}
            {onRestoreDemo && (
              <button
                type="button"
                onClick={onRestoreDemo}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>استعادة المقررات النموذجية</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const courseProgress = progress.courseProgress?.[course.id] || 0;
            const completedCount = (course.lectures || []).filter((l) =>
              progress.completedLectureIds?.includes(l.id)
            ).length;

            return (
              <div
                key={course.id}
                className="bg-[#0f172a] border border-slate-800/90 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-right flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-amber-400 text-xs px-2.5 py-1 rounded-lg font-bold">
                      {course.code}
                    </span>
                    {course.lectures && course.lectures.length > 0 && (
                      <span className="absolute top-3 left-3 bg-emerald-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center gap-1 shadow-md">
                        <Gift className="w-3 h-3 text-emerald-400" />
                        <span>معاينة تجريبية مجانية</span>
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 text-xs font-semibold text-slate-200">
                      {course.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="text-xs text-slate-500 font-medium">
                      أستاذ المادة: <span className="text-slate-300">{course.instructor}</span>
                    </div>

                    {/* Progress info */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">
                          {completedCount} من {course.totalLectures} محاضرة مكتملة
                        </span>
                        <span className="text-amber-400 tabular-nums">{courseProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-5 pt-0 border-t border-slate-800/80 mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>بدء مذاكرة المادة</span>
                  </button>

                  {onDeleteCourse && (
                    <button
                      type="button"
                      onClick={() => setCourseToDelete(course)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                      title="حذف هذه المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      <ConfirmModal
        isOpen={!!courseToDelete}
        title="حذف المادة وجميع محاضراتها"
        message={`هل أنت متأكد من حذف مادة "${courseToDelete?.title || ''}" وجميع المحاضرات التابعة لها؟`}
        confirmText="حذف المادة"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setCourseToDelete(null)}
      />
    </div>
  );
};
