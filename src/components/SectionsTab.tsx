import React from 'react';
import { Layers, Plus, Video, Play, FileText, Image as ImageIcon, Trash2, BookOpen, Film, AlertCircle, Download } from 'lucide-react';
import { Course, Lecture } from '../types';
import { downloadPdfFile } from './PdfViewer';

interface SectionsTabProps {
  courses: Course[];
  secTabCourseId: string;
  setSecTabCourseId: (id: string) => void;
  secTabLectureId: string;
  setSecTabLectureId: (id: string) => void;
  onOpenSectionModal: (courseId: string, courseTitle: string, lecture: Lecture) => void;
  onDeleteSection: (courseId: string, lectureId: string, sectionId: string, sectionTitle: string) => void;
  onPreviewVideo: (url: string) => void;
  onPreviewImage: (url: string) => void;
  onPreviewPdf?: (url: string, title?: string, fileSize?: string) => void;
  onSwitchToCoursesTab: () => void;
}

export const SectionsTab: React.FC<SectionsTabProps> = ({
  courses,
  secTabCourseId,
  setSecTabCourseId,
  secTabLectureId,
  setSecTabLectureId,
  onOpenSectionModal,
  onDeleteSection,
  onPreviewVideo,
  onPreviewImage,
  onPreviewPdf,
  onSwitchToCoursesTab,
}) => {
  const currentCourse = courses.find((c) => c.id === secTabCourseId) || courses[0];
  const lectures = currentCourse?.lectures || [];
  const currentLecture = lectures.find((l) => l.id === secTabLectureId) || lectures[0];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 animate-in fade-in duration-200 text-right">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-100">
              خانة السكاشين والتطبيقات المعملية للمحاضرات
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إضافة فيديوهات السكاشن من جهازك، صور وعينات الصخور، ومذكرات PDF العملية لكل محاضرة.
          </p>
        </div>

        {currentLecture && (
          <button
            type="button"
            onClick={() => onOpenSectionModal(currentCourse.id, currentCourse.title, currentLecture)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة سكشن لهذه المحاضرة</span>
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">لا توجد مواد دراسية مسجلة حالياً</h3>
          <p className="text-xs text-slate-400">يرجى إضافة مادة ومحاضرات أولاً لتتمكن من إضافة سكاشين لها.</p>
          <button
            type="button"
            onClick={onSwitchToCoursesTab}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            الانتقال لتبويب المواد والمحاضرات
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course & Lecture Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Select Course */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>1. اختر المادة / المقرر:</span>
              </label>
              <select
                value={secTabCourseId || (courses[0]?.id ?? '')}
                onChange={(e) => {
                  const newCId = e.target.value;
                  setSecTabCourseId(newCId);
                  const newC = courses.find((c) => c.id === newCId);
                  if (newC?.lectures && newC.lectures.length > 0) {
                    setSecTabLectureId(newC.lectures[0].id);
                  } else {
                    setSecTabLectureId('');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 text-right focus:border-purple-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (الفرقة {c.year}) · [{c.lectures?.length || 0} محاضرة]
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Lecture */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. اختر المحاضرة لإدارة سكاشنها:</span>
              </label>
              {lectures.length === 0 ? (
                <div className="text-xs text-amber-400/90 py-2 bg-slate-950 rounded-xl px-3 border border-slate-800">
                  لا توجد محاضرات في هذه المادة بعد.
                </div>
              ) : (
                <select
                  value={currentLecture?.id || ''}
                  onChange={(e) => setSecTabLectureId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 text-right focus:border-purple-500 focus:outline-none"
                >
                  {lectures.map((l, idx) => (
                    <option key={l.id} value={l.id}>
                      محاضرة {idx + 1}: {l.title} ({l.sections?.length || 0} سكشن)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Lecture Details & Sections List */}
          {currentLecture ? (
            <div className="space-y-4">
              {/* Lecture Summary Box */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      المحاضرة المحددة
                    </span>
                    <span className="text-xs text-slate-400">المدة: {currentLecture.duration}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 mt-1">
                    {currentLecture.title}
                  </h3>
                  {currentLecture.description && (
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      {currentLecture.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSectionModal(currentCourse.id, currentCourse.title, currentLecture)}
                  className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سكشن جديد (فيديو، صور، PDF)</span>
                </button>
              </div>

              {/* Sections Listing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>السكاشين المضافة لهذه المحاضرة ({currentLecture.sections?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    تظهر للطالب داخل تبويب السكاشين في صفحة المحاضرة
                  </span>
                </div>

                {(!currentLecture.sections || currentLecture.sections.length === 0) ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 space-y-3">
                    <Layers className="w-10 h-10 text-purple-400/40 mx-auto" />
                    <h5 className="text-xs sm:text-sm font-bold text-slate-300">
                      لم يتم إضافة أي سكشن لهذه المحاضرة حتى الآن
                    </h5>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      يمكنك تنزيل ورفع فيديو السكشن من جهازك، إرفاق صور العينات المجهرية وشيتات PDF.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenSectionModal(currentCourse.id, currentCourse.title, currentLecture)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة السكشن الأول الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentLecture.sections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-bold">
                              <span>سكشن {idx + 1}</span>
                              {sec.instructor && (
                                <span className="text-slate-400 font-normal">· {sec.instructor}</span>
                              )}
                            </div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
                              {sec.title}
                            </h5>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteSection(currentCourse.id, currentLecture.id, sec.id, sec.title)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا السكشن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {sec.description && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {sec.description}
                          </p>
                        )}

                        {/* Attachments overview */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                          {sec.videoUrl && (
                            <button
                              type="button"
                              onClick={() => onPreviewVideo(sec.videoUrl!)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/20 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-cyan-400" />
                              <span>فيديو السكشن</span>
                            </button>
                          )}

                          {sec.images && sec.images.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onPreviewImage(sec.images![0].url)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/20 cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>الصور ({sec.images.length})</span>
                            </button>
                          )}

                          {sec.pdfUrl && (
                            <div className="flex items-center gap-1.5">
                              {onPreviewPdf && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onPreviewPdf(
                                      sec.pdfUrl!,
                                      sec.pdfFileName || `${sec.title} - شيت السكشن`,
                                      sec.pdfFileSize
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500/30 cursor-pointer"
                                  title="فتح ملف الـ PDF مباشرة داخل المنصة"
                                >
                                  <FileText className="w-3 h-3 text-rose-400" />
                                  <span>فتح الـ PDF بالمنصة</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => downloadPdfFile(sec.pdfUrl!, sec.pdfFileName || `${sec.title}.pdf`)}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="تحميل على الجهاز"
                              >
                                <Download className="w-3 h-3 text-slate-400" />
                                <span>تحميل</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
              اختر محاضرة من القائمة أعلاه لإدارة سكاشنها.
            </div>
          )}

          {/* Quick Overview Table of All Lectures */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-200">
              جدول المحاضرات السريع لإضافة السكاشين عبر كافة المقررات
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">المقرر الدراسي</th>
                    <th className="py-2.5 px-3">عنوان المحاضرة</th>
                    <th className="py-2.5 px-3">السكاشين الحالية</th>
                    <th className="py-2.5 px-3 text-left">إجراء سريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {courses.flatMap((c) =>
                    (c.lectures || []).map((lec) => (
                      <tr key={lec.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-semibold text-slate-300">
                          {c.title} (سنة {c.year})
                        </td>
                        <td className="py-3 px-3 text-slate-100 font-bold">{lec.title}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              lec.sections && lec.sections.length > 0
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {lec.sections?.length || 0} سكشن
                          </span>
                        </td>
                        <td className="py-3 px-3 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setSecTabCourseId(c.id);
                              setSecTabLectureId(lec.id);
                              onOpenSectionModal(c.id, c.title, lec);
                            }}
                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ إضافة سكشن</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
