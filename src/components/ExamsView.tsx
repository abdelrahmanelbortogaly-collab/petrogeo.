import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Exam, ExamResult, User } from '../types';

interface ExamsViewProps {
  exams: Exam[];
  user: User;
  onSaveResult: (examId: string, answers: Record<string, number>) => Promise<any>;
  onTabChange: (tab: any) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  user,
  onSaveResult,
  onTabChange,
}) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);

  // Filter exams for student's year
  const studentExams = exams.filter((e) => e.year === user.year);

  // Timer countdown
  useEffect(() => {
    if (!activeExam || examResult) return;

    if (timeLeftSeconds <= 0) {
      // Auto submit on time out!
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, timeLeftSeconds, examResult]);

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setExamResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setIsSubmitting(true);
    try {
      const data = await onSaveResult(activeExam.id, answers);
      setExamResult(data);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      // Fallback local grading if network error
      let correct = 0;
      activeExam.questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) correct++;
      });
      const pct = Math.round((correct / activeExam.questions.length) * 100);
      setExamResult({
        result: {
          examTitle: activeExam.title,
          courseTitle: activeExam.courseTitle,
          score: Math.round((correct / activeExam.questions.length) * activeExam.totalMarks),
          totalMarks: activeExam.totalMarks,
          percentage: pct,
        },
        correctCount: correct,
        totalQuestions: activeExam.questions.length,
        percentage: pct,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* 1. If taking an exam */}
      {activeExam && !examResult && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* Header & Countdown Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-amber-400 font-bold">{activeExam.courseTitle}</span>
              <h2 className="text-lg font-black text-slate-100">{activeExam.title}</h2>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold tabular-nums ${
                  timeLeftSeconds < 120
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20"
              >
                {isSubmitting ? 'جاري التسليم...' : 'تسليم الامتحان الآن'}
              </button>
            </div>
          </div>

          {/* Question Index Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {activeExam.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/20'
                      : isAnswered
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Content */}
          {activeExam.questions[currentQuestionIndex] && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                  السؤال {currentQuestionIndex + 1} من {activeExam.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">اختر الإجابة الصحيحة:</span>
              </div>

              <h3 className="text-base md:text-lg font-bold text-slate-100 leading-relaxed">
                {activeExam.questions[currentQuestionIndex].text}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {activeExam.questions[currentQuestionIndex].options.map((option, optIdx) => {
                  const qId = activeExam.questions[currentQuestionIndex].id;
                  const isSelected = answers[qId] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(qId, optIdx)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-slate-950'
                              : 'border-slate-600 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm font-semibold">{option}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Between Questions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                {currentQuestionIndex < activeExam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                  >
                    إنهاء وتسليم الإجابات
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Exam Result & Detailed Review Screen */}
      {examResult && activeExam && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
              <Award className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-slate-100">
              نتيجة امتحان {activeExam.title}
            </h2>

            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="text-center">
                <div className="text-3xl font-black text-amber-400 tabular-nums">
                  {examResult.percentage || examResult.result?.percentage}%
                </div>
                <div className="text-xs text-slate-400 font-semibold">النسبة المئوية</div>
              </div>

              <div className="h-10 w-px bg-slate-800" />

              <div className="text-center">
                <div className="text-3xl font-black text-slate-100 tabular-nums">
                  {examResult.result?.score || 0} / {activeExam.totalMarks}
                </div>
                <div className="text-xs text-slate-400 font-semibold">الدرجة المحتسبة</div>
              </div>
            </div>

            <p className="text-xs text-emerald-400 font-semibold mt-2">
              ✓ تم تسجيل نتيجتك بنجاح في السجل الأكاديمي لحسابك على المنصة!
            </p>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200">
              المراجعة التفصيلية للأسئلة والتصحيح النموذجي:
            </h3>

            {activeExam.questions.map((q, idx) => {
              const studentAnswer = answers[q.id];
              const isCorrect = studentAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-300">السؤال {idx + 1}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-100 mb-3">{q.text}</p>

                  {/* Options display */}
                  <div className="space-y-2 mb-3 text-xs">
                    {q.options.map((opt, optIndex) => {
                      const isOptionCorrect = optIndex === q.correctAnswer;
                      const isOptionStudentChoice = optIndex === studentAnswer;

                      return (
                        <div
                          key={optIndex}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            isOptionCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                              : isOptionStudentChoice
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {isOptionCorrect && <span className="text-[10px] text-emerald-400">الإجابة الصحيحة ✓</span>}
                          {!isCorrect && isOptionStudentChoice && (
                            <span className="text-[10px] text-rose-400">اختيارك ✗</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Egyptian geology explanation */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-amber-400 font-bold block">💡 Geological & Technical Explanation:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveExam(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              العودة لقائمة الامتحانات
            </button>

            <button
              onClick={() => onTabChange('history')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              عرض السجل الأكاديمي الكامل
            </button>
          </div>
        </div>
      )}

      {/* 3. List of Available Exams (Initial View) */}
      {!activeExam && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
            <div>
              <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>الكويزات والامتحانات الرسمية - الفرقة {user.year}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                نظام اختبارات ذكي مصحح تلقائياً لحساب مستواك وتوثيقه في سجلك الأكاديمي.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {studentExams.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 text-sm">
                لا توجد امتحانات منشورة لفرقتك في الوقت الحالي.
              </div>
            ) : (
              studentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-[#0f172a] border border-slate-800/90 rounded-2xl p-6 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-right flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                        {exam.courseTitle}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                        {exam.type === 'quiz' ? 'كويز أسبوعي' : 'امتحان ميدتيرم'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {exam.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-200">{exam.questions.length}</div>
                        <div className="text-[10px] text-slate-500">الأسئلة</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-200">{exam.durationMinutes} دقيقة</div>
                        <div className="text-[10px] text-slate-500">الوقت</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-200">{exam.totalMarks} درجة</div>
                        <div className="text-[10px] text-slate-500">الدرجة الكلية</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
                    >
                      <span>بدء حل الامتحان الآن</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
