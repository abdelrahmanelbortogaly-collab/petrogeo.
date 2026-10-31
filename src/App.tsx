/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CoursesView } from './components/CoursesView';
import { LectureView } from './components/LectureView';
import { ExamsView } from './components/ExamsView';
import { SchedulesView } from './components/SchedulesView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { AiAssistantView } from './components/AiAssistantView';
import { StudentHistoryView } from './components/StudentHistoryView';
import { SettingsView } from './components/SettingsView';
import { AdminPanelView } from './components/AdminPanelView';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { FloatingRobot } from './components/FloatingRobot';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SCHEDULES,
  INITIAL_PROGRESS,
  INITIAL_RESULTS,
} from './data/mockData';
import { User, Course, StudentProgress, Exam, Announcement, ScheduleItem, ExamResult } from './types/index';
import {
  getAllFirestoreCourses,
  isCoursesClearedInFirestore,
  getAllFirestoreExams,
  isExamsClearedInFirestore,
} from './lib/firebase';
import {
  LayoutDashboard,
  BookOpen,
  PlaySquare,
  HelpCircle,
  Menu,
  Smartphone,
  AlertTriangle,
  LogIn,
  UserPlus,
  Sparkles,
  Layers,
  Award,
  ShieldCheck,
} from 'lucide-react';
import {
  getOrCreateDeviceId,
  getDeviceFriendlyName,
  getStoredSessionToken,
  setStoredSessionToken,
  removeStoredSessionToken,
} from './utils/deviceSession';
import {
  PlatformBrand,
  getActiveBrand,
  setActiveBrand,
  getBrandConfig,
} from './utils/platformBranding';

export default function App() {
  const [currentBrand, setCurrentBrand] = useState<PlatformBrand>(() => getActiveBrand());

  // Listen to platform brand change events
  useEffect(() => {
    setCurrentBrand('petrogeo');
  }, []);

  // Current user defaults to saved session IF active token exists, otherwise null (requires login)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const token = getStoredSessionToken();
      const saved = localStorage.getItem('petrogeo_active_user');
      if (saved && token) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return null; // Visitors and students MUST log in or register!
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(!currentUser);

  // Standalone Admin Portal state (completely separated from student platform)
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.toLowerCase().startsWith('#admin')
    );
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const isNowAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.toLowerCase().startsWith('#admin');
      setIsAdminPortal(isNowAdmin);
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const openAdminPortal = () => {
    setIsAdminPortal(true);
    try {
      window.location.hash = '#admin';
    } catch {}
  };

  const closeAdminPortal = () => {
    setIsAdminPortal(false);
    try {
      if (window.location.hash.toLowerCase().startsWith('#admin')) {
        window.location.hash = '';
      }
      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState(null, '', '/');
      }
    } catch {}
  };

  // Sync currentUser to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('petrogeo_active_user', JSON.stringify(currentUser));
      } catch {}
    } else {
      try {
        localStorage.removeItem('petrogeo_active_user');
      } catch {}
    }
  }, [currentUser]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('petrogeo_active_user');
    } catch {}
    removeStoredSessionToken();
    setCurrentUser(null);
    setAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  // App Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<StudentProgress>({
    studentId: currentUser?.id || '',
    completedLectureIds: [],
    courseProgress: {},
    overallPercentage: 0,
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);

  // Navigation context
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | undefined>(undefined);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [deviceMismatchModal, setDeviceMismatchModal] = useState<{
    isOpen: boolean;
    message: string;
    newDeviceName?: string;
  }>({
    isOpen: false,
    message: '',
  });

  // Verify single-device active session
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const checkSession = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const sessionToken = getStoredSessionToken();
        const res = await fetch('/api/auth/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            sessionToken,
            deviceId,
          }),
        });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.valid === false) {
            removeStoredSessionToken();
            if (data.deleted) {
              try {
                localStorage.removeItem('petrogeo_active_user');
              } catch {}
              setCurrentUser(INITIAL_USERS[0]);
            }
            setDeviceMismatchModal({
              isOpen: true,
              message: data.message || 'تم فتح الحساب من جهاز آخر!',
              newDeviceName: data.newDeviceName,
            });
          }
        }
      } catch (e) {
        // Ignore transient network errors
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  // Fetch all relevant data for current user (Server enforces strict Year-level isolation, with client-side fallback for Vercel/offline)
  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const headers = { 'x-user-id': currentUser.id };

      const safeParse = async (promise: Promise<Response>, fallback: any) => {
        try {
          const res = await promise;
          const ct = res.headers.get('content-type') || '';
          if (!res.ok || !ct.includes('application/json')) return fallback;
          return await res.json();
        } catch {
          return fallback;
        }
      };

      const isStudent = currentUser.role === 'student';
      const fallbackCourses = isStudent
        ? INITIAL_COURSES.filter((c) => c.year === currentUser.year)
        : INITIAL_COURSES;
      const fallbackExams = isStudent
        ? INITIAL_EXAMS.filter((e) => e.year === currentUser.year)
        : INITIAL_EXAMS;
      const fallbackAnn = isStudent
        ? INITIAL_ANNOUNCEMENTS.filter((a) => a.targetYear === 'all' || a.targetYear === currentUser.year)
        : INITIAL_ANNOUNCEMENTS;
      const fallbackSch = isStudent
        ? INITIAL_SCHEDULES.filter((s) => s.year === currentUser.year)
        : INITIAL_SCHEDULES;

      const [
        dataCourses,
        dataProg,
        dataExams,
        dataAnn,
        dataSch,
        dataRes,
        firestoreCourses,
        isClearedInFs,
        firestoreExams,
        isExamsClearedInFs,
      ] = await Promise.all([
        safeParse(fetch('/api/courses', { headers }), null),
        safeParse(fetch(`/api/progress/${currentUser.id}`), INITIAL_PROGRESS),
        safeParse(fetch('/api/exams', { headers }), null),
        safeParse(fetch('/api/announcements', { headers }), null),
        safeParse(fetch('/api/schedules', { headers }), null),
        safeParse(fetch(`/api/results/${currentUser.id}`), INITIAL_RESULTS),
        getAllFirestoreCourses().catch(() => []),
        isCoursesClearedInFirestore().catch(() => false),
        getAllFirestoreExams().catch(() => []),
        isExamsClearedInFirestore().catch(() => false),
      ]);

      let finalCourses: Course[] = [];
      if (isClearedInFs) {
        // Admin explicitly cleared all courses in Firestore
        finalCourses = [];
      } else if (Array.isArray(firestoreCourses) && firestoreCourses.length > 0) {
        // Use real cloud Firestore courses
        finalCourses = isStudent
          ? firestoreCourses.filter((c) => c.year === currentUser.year)
          : firestoreCourses;
      } else if (Array.isArray(dataCourses) && dataCourses.length > 0) {
        finalCourses = dataCourses;
      } else if (Array.isArray(dataCourses) && dataCourses.length === 0) {
        finalCourses = [];
      } else {
        finalCourses = fallbackCourses;
      }

      // Check local cache for recent edits (e.g. video trims, lecture edits) so Firestore lag never wipes them
      try {
        const localCachedRaw = localStorage.getItem('petrogeo_cached_courses');
        if (localCachedRaw) {
          const localList: Course[] = JSON.parse(localCachedRaw);
          finalCourses = finalCourses.map((c) => {
            const localMatch = localList.find((lc) => lc.id === c.id);
            if (localMatch && localMatch.lectures) {
              return {
                ...c,
                lectures: localMatch.lectures,
              };
            }
            return c;
          });
        }
      } catch {}

      let finalExams: Exam[] = [];
      if (isExamsClearedInFs) {
        // Admin explicitly cleared all exams in Firestore
        finalExams = [];
      } else if (Array.isArray(firestoreExams) && firestoreExams.length > 0) {
        // Use real cloud Firestore exams
        finalExams = isStudent
          ? firestoreExams.filter((e) => e.year === currentUser.year)
          : firestoreExams;
      } else if (Array.isArray(dataExams) && dataExams.length > 0) {
        finalExams = dataExams;
      } else if (Array.isArray(dataExams) && dataExams.length === 0) {
        finalExams = [];
      } else {
        finalExams = fallbackExams;
      }
      const finalAnn = Array.isArray(dataAnn) ? dataAnn : fallbackAnn;
      const finalSch = Array.isArray(dataSch) ? dataSch : fallbackSch;
      const finalProg = dataProg || INITIAL_PROGRESS;
      const finalRes = Array.isArray(dataRes) ? dataRes : INITIAL_RESULTS;

      setCourses(finalCourses);
      setProgress(finalProg);
      setExams(finalExams);
      setAnnouncements(finalAnn);
      setSchedules(finalSch);
      setResults(finalRes);

      if (finalCourses.length > 0) {
        if (!selectedCourse || !finalCourses.find((c: Course) => c.id === selectedCourse.id)) {
          setSelectedCourse(finalCourses[0]);
        } else {
          const fresh = finalCourses.find((c: Course) => c.id === selectedCourse.id);
          if (fresh) {
            setSelectedCourse(fresh);
          }
        }
      } else {
        setSelectedCourse(null);
      }
      return finalCourses;
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Handle Course Deletion
  const handleDeleteCourse = async (courseId: string) => {
    try {
      await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // Handle Single Lecture Deletion
  const handleDeleteLecture = async (courseId: string, lectureId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/lectures/${lectureId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete lecture:', err);
    }
  };

  // Handle Clear All Courses
  const handleClearAllCourses = async () => {
    try {
      await fetch('/api/courses/clear-all', { method: 'POST' });
      setCourses([]);
      setSelectedCourse(null);
      setSelectedLectureId(undefined);
      await fetchData();
    } catch (err) {
      console.error('Failed to clear courses:', err);
    }
  };

  // Handle Restore Demo Courses
  const handleRestoreDemoCourses = async () => {
    try {
      await fetch('/api/courses/restore-demo', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to restore demo courses:', err);
    }
  };

  // Handle Lecture Toggle Complete
  const handleToggleLectureComplete = async (lectureId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/lectures/${lectureId}/toggle-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      setProgress(data.progress);
    } catch (err) {
      console.error('Failed to toggle lecture:', err);
    }
  };

  // Immediate in-memory and local cache update for course/lecture edits (zero-latency, anti-wipe)
  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCourse.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedCourse;
        return next;
      }
      return [...prev, updatedCourse];
    });

    if (selectedCourse?.id === updatedCourse.id) {
      setSelectedCourse(updatedCourse);
    }

    try {
      const stored = localStorage.getItem('petrogeo_cached_courses');
      const list: Course[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((c) => c.id === updatedCourse.id);
      if (idx !== -1) list[idx] = updatedCourse;
      else list.push(updatedCourse);
      localStorage.setItem('petrogeo_cached_courses', JSON.stringify(list));
    } catch {}
  };

  // Handle Exam Submission
  const handleSaveExamResult = async (examId: string, answers: Record<string, number>) => {
    if (!currentUser) return null;
    const res = await fetch(`/api/exams/${examId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, answers }),
    });
    const data = await res.json();
    fetchData(); // refresh results & stats
    return data;
  };

  // Handle Profile Update
  const handleUpdateProfile = async (
    data: Partial<User> & { currentPassword?: string; newPassword?: string }
  ) => {
    if (!currentUser) return;
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, ...data }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'فشل حفظ التعديلات');
    setCurrentUser(resData.user);
  };

  const handleSelectCourseToStudy = (course: Course) => {
    setSelectedCourse(course);
    setSelectedLectureId(course.lectures?.[0]?.id);
    setActiveTab('lectures');
  };

  const handleSelectLectureFromList = (course: Course, lectureId: string) => {
    setSelectedCourse(course);
    setSelectedLectureId(lectureId);
    setActiveTab('lectures');
  };

  const handleAskAiShortcut = (prompt: string) => {
    setAiPrompt(prompt);
    setActiveTab('ai');
  };

  // Filter courses by search if searching
  const filteredCourses = (courses || []).filter((c) => {
    if (!c) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.lectures || []).some((l) => (l?.title || '').toLowerCase().includes(q))
    );
  });

  // If user requested Standalone Admin Portal, render the dedicated Admin Portal page
  if (isAdminPortal) {
    return (
      <AdminPortal
        currentUser={currentUser}
        courses={courses}
        exams={exams}
        announcements={announcements}
        onRefreshData={fetchData}
        onUpdateCourse={handleUpdateCourse}
        currentBrand={currentBrand}
        onBrandChanged={setCurrentBrand}
        onLoginAsAdmin={(adminUser) => {
          setCurrentUser(adminUser);
          fetchData();
        }}
        onLogoutAdmin={() => {
          handleLogout();
        }}
        onSwitchToStudentPlatform={closeAdminPortal}
      />
    );
  }

  // If not logged in, show the Welcome Landing & Login Gate (visitors must log in first)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b131e] text-[#f1f5f9] flex flex-col selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden font-sans" dir="rtl">
        {/* Landing Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1 shadow-md shadow-amber-500/10">
              <img src={getBrandConfig(currentBrand).logoSrc} alt="PETROGEO" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
                PETROGEO
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">المنصة الأكاديمية لعلوم الجيولوجيا وهندسة البترول</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول 🔑</span>
            </button>
          </div>
        </header>

        {/* Landing Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-4xl mx-auto space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>بوابة التعلم الإلكتروني والتدريب الأكاديمي الشامل</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-100 leading-tight">
              منصة <span className="text-amber-400">PETROGEO</span> الأكاديمية 🛢️
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              المحاضرات التخصصية، السكاشن العملية، دراسة عينات الصخور والقطاعات المجهرية، وبنك الأسئلة والامتحانات التفاعلية لكافة الفرق الدراسية.
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول إلى حسابك</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>إنشاء حساب طالب جديد</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full pt-6 text-right">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">المقررات والمحاضرات</h4>
              <p className="text-[11px] text-slate-400">مناهج متكاملة لفرق الكلية الأربعة</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <Layers className="w-5 h-5 text-purple-400" />
              <h4 className="text-xs font-bold text-slate-200">السكاشن والتطبيقات</h4>
              <p className="text-[11px] text-slate-400">فيديوهات المعامل وشيتات الـ PDF</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <Award className="w-5 h-5 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200">بنك الأسئلة والامتحانات</h4>
              <p className="text-[11px] text-slate-400">كويزات تفاعلية وتصحيح فوري بالدرجات</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">حماية وخصوصية</h4>
              <p className="text-[11px] text-slate-400">نظام أمان لمنع تسريب المحتوى</p>
            </div>
          </div>

          {/* Designer attribution & Standalone Admin Portal entry */}
          <div className="pt-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span>إشراف وتطوير:</span>
              <span className="font-bold text-slate-400">م. عبدالرحمن محمد (Al-Bortogaly)</span>
              <span>·</span>
              <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
            </div>
            <button
              type="button"
              onClick={openAdminPortal}
              className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>بوابة الإدارة المستقلة (Admin Portal)</span>
            </button>
          </div>
        </main>

        {/* Auth & Switch Account Modal */}
        <AuthModal
          isOpen={authModalOpen}
          currentBrand={currentBrand}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard'); // Always direct student to student dashboard!
            setAuthModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b131e] text-[#f1f5f9] flex flex-col selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden" dir="rtl">
      {/* Top Header matching image.png */}
      <Header
        user={currentUser}
        currentBrand={currentBrand}
        onOpenSettings={() => {
          setActiveTab('settings');
          setIsMobileMenuOpen(false);
        }}
        onOpenAdmin={() => {
          openAdminPortal();
          setIsMobileMenuOpen(false);
        }}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Layout: Sidebar on Right (in RTL), Content in Center */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-h-0">
        {/* Right Sidebar (Desktop sticky + Mobile slide drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'ai') setAiPrompt('');
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={currentUser}
          currentBrand={currentBrand}
          onLogout={handleLogout}
          onOpenAdminPortal={openAdminPortal}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={currentUser}
              courses={filteredCourses}
              progress={progress}
              announcements={announcements}
              upcomingExams={exams}
              onSelectCourse={handleSelectCourseToStudy}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesView
              courses={filteredCourses}
              progress={progress}
              user={currentUser}
              onSelectCourse={handleSelectCourseToStudy}
              onSelectLecture={(c, lecId) => handleSelectLectureFromList(c, lecId)}
              onDeleteCourse={currentUser.role === 'admin' ? handleDeleteCourse : undefined}
              onRestoreDemo={currentUser.role === 'admin' ? handleRestoreDemoCourses : undefined}
              onGoToAdmin={currentUser.role === 'admin' ? () => openAdminPortal() : undefined}
            />
          )}

          {activeTab === 'lectures' && (
            selectedCourse ? (
              <LectureView
                course={selectedCourse}
                currentLectureId={selectedLectureId}
                progress={progress}
                user={currentUser}
                onToggleComplete={handleToggleLectureComplete}
                onSelectLecture={(lecId) => setSelectedLectureId(lecId)}
                onAskAi={handleAskAiShortcut}
                onBackToCourses={() => setActiveTab('courses')}
                onDeleteLecture={currentUser.role === 'admin' ? handleDeleteLecture : undefined}
              />
            ) : (
              <div className="p-12 text-center bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4 text-right">
                <h3 className="text-slate-200 font-bold text-base">لا توجد مادة محددة لعرض محاضراتها حالياً</h3>
                <p className="text-xs text-slate-400">يمكنك استعراض المقررات أو إضافة موادك الخاصة أو استعادة المقررات النموذجية.</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    الانتقال لكورساتي
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={handleRestoreDemoCourses}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
                    >
                      استعادة المقررات التجريبية
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'quizzes' && (
            <ExamsView
              exams={exams}
              user={currentUser}
              onSaveResult={handleSaveExamResult}
              onTabChange={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              exams={exams}
              user={currentUser}
              onSaveResult={handleSaveExamResult}
              onTabChange={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesView schedules={schedules} user={currentUser} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsView announcements={announcements} user={currentUser} />
          )}

          {activeTab === 'ai' && (
            <AiAssistantView
              user={currentUser}
              initialPrompt={aiPrompt}
              onClearInitialPrompt={() => setAiPrompt('')}
              brand={currentBrand}
            />
          )}

          {activeTab === 'history' && (
            <StudentHistoryView
              user={currentUser}
              progress={progress}
              courses={courses}
              results={results}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
            />
          )}

          {/* Student Platform Footer */}
          <footer className="mt-16 pt-8 pb-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">منصة PETROGEO الأكاديمية</span>
              <span>·</span>
              <span>قسم علوم الجيولوجيا وهندسة البترول</span>
              <span>·</span>
              <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openAdminPortal}
                className="text-slate-500 hover:text-cyan-400 text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="بوابة إدارة المنصة المستقلة للمشرف"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>بوابة الإدارة المستقلة (Admin Portal)</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Always-present Animated Floating Robot Mascot with Voice Call */}
      <FloatingRobot
        user={currentUser}
        onOpenAiTab={(prompt) => {
          if (prompt) setAiPrompt(prompt);
          else setAiPrompt('');
          setActiveTab('ai');
        }}
      />

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c1524]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-amber-400 font-bold bg-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('courses');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'text-amber-400 font-bold bg-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">كورساتي</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('lectures');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'lectures'
              ? 'text-amber-400 font-bold bg-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlaySquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">المحاضرات</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('exams');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'exams' || activeTab === 'quizzes'
              ? 'text-amber-400 font-bold bg-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">الامتحانات</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isMobileMenuOpen
              ? 'text-amber-400 font-bold bg-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">القائمة</span>
        </button>
      </nav>

      {/* Device Mismatch / Single-Device Eviction Modal */}
      {deviceMismatchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-right animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border-2 border-amber-500/80 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl text-slate-100 relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              <Smartphone className="w-8 h-8 animate-pulse text-amber-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-100">
                تم إنهاء الجلسة على هذا الجهاز
              </h3>
              <p className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 py-1 px-3 rounded-full inline-block">
                سياسة الأمان: جهاز واحد فقط لكل طالب 🔒
              </p>
              <p className="text-xs text-slate-300 leading-relaxed pt-2">
                {deviceMismatchModal.message || 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، لذلك تم إيقاف الجلسة الحالية حمايةً لحسابك ولمنع مشاركته.'}
              </p>
              {deviceMismatchModal.newDeviceName && (
                <p className="text-[11px] text-slate-400">
                  الجهاز المقترن حالياً: <span className="text-amber-400 font-mono font-bold">{deviceMismatchModal.newDeviceName}</span>
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const devId = getOrCreateDeviceId();
                    const devName = getDeviceFriendlyName();
                    const res = await fetch('/api/auth/rebind-current-device', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: currentUser.id,
                        deviceId: devId,
                        deviceName: devName,
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.token) {
                        setStoredSessionToken(data.token);
                      }
                      if (data.user) {
                        setCurrentUser(data.user);
                      }
                      setDeviceMismatchModal({ isOpen: false, message: '' });
                      fetchData();
                      return;
                    }
                  } catch (e) {
                    console.error('Rebind failed:', e);
                  }
                  setDeviceMismatchModal({ isOpen: false, message: '' });
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>تأكيد واستخدام هذا الجهاز الآن 🔓</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeviceMismatchModal({ isOpen: false, message: '' });
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/80 transition-all cursor-pointer"
              >
                <span>تسجيل الدخول بحساب آخر 🔑</span>
              </button>

              <a
                href="https://wa.me/201007435907?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85.%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%D8%8C%20%D8%AA%D9%85%20%D9%82%D9%81%D9%84%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A%20%D8%B9%D9%84%D9%89%20%D9%85%D9%86%D8%B5%D8%A9%20PETROGEO%20%D8%A8%D8%B3%D8%A8%D8%A8%20%D8%A7%D8%AE%D8%AA%D9%84%D8%A7%D9%81%20%D8%A7%D9%84%D8%AC%D9%87%D8%A7%D8%B2%20%D9%88%D8%A3%D8%B1%D9%8A%D8%AF%20%D9%81%D9%83%20%D8%A7%D9%84%D8%A7%D8%B1%D8%AA%D8%A8%D8%A7%D8%B7"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>تواصل مع المشرف عبر واتساب 💬</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Switch Account Modal */}
      <AuthModal
        isOpen={authModalOpen}
        currentBrand={currentBrand}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard'); // Always enter student platform dashboard
          fetchData();
        }}
      />
    </div>
  );
}
