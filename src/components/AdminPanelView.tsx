import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileText,
  Megaphone,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  Eye,
  Filter,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  UploadCloud,
  Link as LinkIcon,
  Video,
  Film,
  HardDrive,
  Play,
  Loader2,
  X,
  Image as ImageIcon,
  Layers,
  FileUp,
  Maximize2,
  ExternalLink,
  CreditCard,
  Smartphone,
  Edit,
  Copy,
  HelpCircle,
  CheckSquare,
  PlusCircle,
  Database,
  Lock,
  Gift,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Shield,
  Key,
  Crown,
  Scissors,
} from 'lucide-react';
import { User, Course, Lecture, LectureSection, SectionImage, Exam, Announcement, PlatformSettings } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { SectionsTab } from './SectionsTab';
import { PdfModalViewer } from './PdfModalViewer';
import { AdminPaymentsTab } from './AdminPaymentsTab';
import { AdminSupabaseTab } from './AdminSupabaseTab';
import { VideoEditorModal } from './VideoEditorModal';
import { resilientUploadFile } from '../utils/resilientUploader';
import {
  getAllFirestoreStudents,
  deleteStudentFromFirestore,
  deleteAdminFromFirestore,
  clearAllFirestoreStudents,
  getAllFirestoreCourses,
  saveCourseToFirestore,
  deleteCourseFromFirestore,
  clearAllFirestoreCourses,
  getAllFirestoreExams,
  saveExamToFirestore,
  deleteExamFromFirestore,
  clearAllFirestoreExams,
  getPlatformSettingsFromFirestore,
} from '../lib/firebase';
import { PlatformBrand } from '../types';

interface AdminPanelViewProps {
  currentUser: User;
  courses: Course[];
  exams: Exam[];
  announcements: Announcement[];
  onRefreshData: () => void;
  onUpdateCourse?: (course: Course) => void;
  currentBrand?: PlatformBrand;
  onBrandChanged?: (brand: PlatformBrand) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser,
  courses,
  exams,
  announcements,
  onRefreshData,
  onUpdateCourse,
  currentBrand = 'petrogeo',
  onBrandChanged,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'students' | 'admins' | 'courses' | 'sections' | 'exams' | 'announcements' | 'payments' | 'supabase'>('courses');
  const [students, setStudents] = useState<any[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');

  // Co-Admin and Supervisors state
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('admin123');
  const [newAdminDept, setNewAdminDept] = useState('إدارة المنصة والإشراف الأكاديمي');
  const [newAdminTitle, setNewAdminTitle] = useState('مشرف إداري معتمد 🛡️');
  const [searchAdmin, setSearchAdmin] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [copiedAdminCreds, setCopiedAdminCreds] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalCourses: courses.length,
    totalExams: exams.length,
    totalLecturesWatched: 0,
    totalExamSubmissions: 0,
  });

  // New Course Modal / State
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseYear, setNewCourseYear] = useState('2');
  const [newCourseCategory, setNewCourseCategory] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');

  // New Lecture State
  const [selectedCourseForLec, setSelectedCourseForLec] = useState<string>(courses[0]?.id || '');
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [lectureSourceMode, setLectureSourceMode] = useState<'upload' | 'link'>('upload');
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('45 دقيقة');
  const [newLectureDesc, setNewLectureDesc] = useState('');
  const [newLectureVideo, setNewLectureVideo] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoFilePreview, setVideoFilePreview] = useState<string>('');
  const [videoFileSize, setVideoFileSize] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [previewVideoModalUrl, setPreviewVideoModalUrl] = useState<string | null>(null);

  // New Lecture Video Clip & Dimensions state (من استوديو القص والتحكم في العرض)
  const [newLectureClipStart, setNewLectureClipStart] = useState<number | undefined>(undefined);
  const [newLectureClipEnd, setNewLectureClipEnd] = useState<number | undefined>(undefined);
  const [newLectureAspectRatio, setNewLectureAspectRatio] = useState<string>('16/9');
  const [newLectureScaleMode, setNewLectureScaleMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [newLectureZoom, setNewLectureZoom] = useState<number>(100);

  // PDF Attachment State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string>('');
  const [newLecturePdfUrl, setNewLecturePdfUrl] = useState<string>('');
  const [pdfMode, setPdfMode] = useState<'upload' | 'link'>('upload');

  // Free Trial State for New Lecture (متاح مجاناً للمعاينة حتى في الوضع المدفوع)
  const [newLectureIsFree, setNewLectureIsFree] = useState<boolean>(true);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Lecture Sections Manager State
  const [activeSectionModalLecture, setActiveSectionModalLecture] = useState<{
    courseId: string;
    courseTitle: string;
    lecture: Lecture;
  } | null>(null);

  // Section Form State (inside Modal)
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstructor, setNewSectionInstructor] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // Section Video State
  const [newSectionVideoMode, setNewSectionVideoMode] = useState<'upload' | 'link'>('upload');
  const [newSectionVideoUrl, setNewSectionVideoUrl] = useState('');
  const [selectedSectionVideoFile, setSelectedSectionVideoFile] = useState<File | null>(null);
  const [sectionVideoPreview, setSectionVideoPreview] = useState<string>('');
  const [sectionVideoSize, setSectionVideoSize] = useState<string>('');

  // Section Images (Multi-image from device)
  const [selectedSectionImages, setSelectedSectionImages] = useState<Array<{
    id: string;
    file: File;
    preview: string;
    caption: string;
    name: string;
    size: string;
  }>>([]);

  // Section PDF (from device or link)
  const [newSectionPdfMode, setNewSectionPdfMode] = useState<'upload' | 'link'>('upload');
  const [newSectionPdfUrl, setNewSectionPdfUrl] = useState('');
  const [selectedSectionPdfFile, setSelectedSectionPdfFile] = useState<File | null>(null);
  const [sectionPdfSize, setSectionPdfSize] = useState<string>('');

  // Section upload status & progress
  const [isSectionUploading, setIsSectionUploading] = useState(false);
  const [sectionUploadProgress, setSectionUploadProgress] = useState(0);
  const [sectionError, setSectionError] = useState('');
  const [sectionSuccess, setSectionSuccess] = useState('');

  // Image lightbox preview state
  const [previewImageModal, setPreviewImageModal] = useState<{
    url: string;
    caption?: string;
    title?: string;
  } | null>(null);

  // In-platform PDF modal state
  const [activePdfModal, setActivePdfModal] = useState<{
    url: string;
    title?: string;
    fileSize?: string;
  } | null>(null);

  // Video Editor & Trimmer Modal State (supports both Lectures and Sections)
  const [activeVideoEditorModal, setActiveVideoEditorModal] = useState<{
    courseId: string;
    courseTitle: string;
    lecture: Lecture;
    section?: LectureSection;
  } | null>(null);

  // Inline Section state in Add Lecture form (خانة السكاشين عند إضافة المحاضرة)
  const [includeSectionWithLecture, setIncludeSectionWithLecture] = useState(false);
  const [lecSecTitle, setLecSecTitle] = useState('');
  const [lecSecInstructor, setLecSecInstructor] = useState('');
  const [lecSecDesc, setLecSecDesc] = useState('');
  const [lecSecVideoMode, setLecSecVideoMode] = useState<'upload' | 'link'>('upload');
  const [lecSecVideoUrl, setLecSecVideoUrl] = useState('');
  const [selectedLecSecVideoFile, setSelectedLecSecVideoFile] = useState<File | null>(null);
  const [lecSecVideoSize, setLecSecVideoSize] = useState('');
  const [selectedLecSecImages, setSelectedLecSecImages] = useState<Array<{
    id: string;
    file: File;
    preview: string;
    caption: string;
    name: string;
    size: string;
  }>>([]);
  const [lecSecPdfMode, setLecSecPdfMode] = useState<'upload' | 'link'>('upload');
  const [lecSecPdfUrl, setLecSecPdfUrl] = useState('');
  const [selectedLecSecPdfFile, setSelectedLecSecPdfFile] = useState<File | null>(null);
  const [lecSecPdfSize, setLecSecPdfSize] = useState('');

  // Sections Tab State (تبويب السكاشين المخصص)
  const [secTabCourseId, setSecTabCourseId] = useState<string>(courses[0]?.id || '');
  const [secTabLectureId, setSecTabLectureId] = useState<string>('');

  // New Exam State (Supports Multiple Questions)
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourseId, setNewExamCourseId] = useState(courses[0]?.id || '');
  const [newExamYear, setNewExamYear] = useState('2');
  const [newExamDuration, setNewExamDuration] = useState('15');
  const [newExamMarks, setNewExamMarks] = useState('20');

  // Multi-Question State
  const [examQuestions, setExamQuestions] = useState<
    Array<{
      id: string;
      text: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>
  >([
    {
      id: `q-1`,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    },
  ]);

  const [isGeneratingAiQuestions, setIsGeneratingAiQuestions] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiQuestionTopic, setAiQuestionTopic] = useState<string>('');

  // New Announcement State
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnYear, setNewAnnYear] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [newAnnPriority, setNewAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>([]);

  // In-app Confirm Modal State (replaces blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const toggleExpandCourse = (courseId: string) => {
    setExpandedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  // Load co-admins
  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data: User[] = await res.json();
        let deletedList: string[] = [];
        try {
          deletedList = JSON.parse(localStorage.getItem('petrogeo_deleted_admins') || '[]');
        } catch {}
        const cleanList = data.filter(
          (u) =>
            u.id !== 'user-admin' &&
            u.email.toLowerCase() !== 'admin@petrogeo.edu' &&
            !deletedList.includes(u.id) &&
            !deletedList.includes(u.email.toLowerCase())
        );
        setAdminUsers(cleanList);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Load students & stats & platform settings & co-admins
  const fetchAdminData = async () => {
    try {
      const [resStudents, resStats, resSettings, resAdmins, firestoreSettings] = await Promise.all([
        fetch('/api/admin/students').catch(() => null),
        fetch('/api/admin/stats').catch(() => null),
        fetch('/api/platform-settings').catch(() => null),
        fetch('/api/admin/admins').catch(() => null),
        getPlatformSettingsFromFirestore().catch(() => null),
      ]);
      const dataStudents = resStudents && resStudents.ok ? await resStudents.json() : [];
      const dataStats = resStats && resStats.ok ? await resStats.json() : null;

      let mergedSettings: PlatformSettings | null = null;
      if (resSettings && resSettings.ok) {
        mergedSettings = await resSettings.json();
      }
      if (firestoreSettings && (firestoreSettings.instapayNumber || firestoreSettings.subscriptionPrice !== undefined || firestoreSettings.isPaidMode !== undefined)) {
        mergedSettings = { ...(mergedSettings || {}), ...firestoreSettings };
      }
      try {
        const stored = localStorage.getItem('petrogeo_platform_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.instapayNumber || parsed.subscriptionPrice !== undefined)) {
            mergedSettings = { ...(mergedSettings || {}), ...parsed };
          }
        }
      } catch {}
      if (mergedSettings) {
        setPlatformSettings(mergedSettings);
      }

      if (resAdmins && resAdmins.ok) {
        const dataAdmins: User[] = await resAdmins.json();
        let deletedList: string[] = [];
        try {
          deletedList = JSON.parse(localStorage.getItem('petrogeo_deleted_admins') || '[]');
        } catch {}
        const cleanList = dataAdmins.filter(
          (u) =>
            u.id !== 'user-admin' &&
            u.email.toLowerCase() !== 'admin@petrogeo.edu' &&
            !deletedList.includes(u.id) &&
            !deletedList.includes(u.email.toLowerCase())
        );
        setAdminUsers(cleanList);
      }

      // Merge with Firestore students so all registered students in the cloud database are displayed
      try {
        const firestoreStudents = await getAllFirestoreStudents();
        if (firestoreStudents && firestoreStudents.length > 0) {
          const studentMap = new Map<string, any>();
          if (Array.isArray(dataStudents)) {
            dataStudents.forEach((s) => studentMap.set(s.id || s.email, s));
          }
          firestoreStudents.forEach((fs) => {
            const key = fs.uid || fs.email;
            if (!studentMap.has(key) && fs.role !== 'admin') {
              studentMap.set(key, {
                id: fs.uid,
                name: fs.displayName || 'طالب مسجل',
                email: fs.email,
                phone: fs.phone || '',
                year: fs.year || 2,
                department: fs.department || 'قسم الجيولوجيا',
                role: 'student',
                avatar: (fs.displayName || 'S').charAt(0).toUpperCase(),
                createdAt: fs.lastLoginAt || new Date().toISOString(),
                boundDeviceId: fs.boundDeviceId,
                boundDeviceName: fs.boundDeviceName,
                subscriptionStatus: 'none',
                completedLecturesCount: 0,
                overallPercentage: 0,
                examsTakenCount: 0,
                averageScore: 0,
                lastActive: fs.lastLoginAt,
              });
            }
          });
          setStudents(Array.from(studentMap.values()));
        } else {
          setStudents(dataStudents);
        }
      } catch (fsErr) {
        setStudents(dataStudents);
      }
      setStats(dataStats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Ensure selectedCourseForLec is always valid
  useEffect(() => {
    if (courses && courses.length > 0) {
      if (!selectedCourseForLec || !courses.find((c) => c.id === selectedCourseForLec)) {
        setSelectedCourseForLec(courses[0].id);
      }
    }
  }, [courses, selectedCourseForLec]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;
    setLoading(true);
    try {
      const courseId = `course-${Date.now()}`;
      const courseObj: Course = {
        id: courseId,
        title: newCourseTitle.trim(),
        code: newCourseCode.trim() || `PETRO-${Date.now().toString().slice(-3)}`,
        description: newCourseDesc.trim(),
        year: (Number(newCourseYear) as 1 | 2 | 3 | 4) || 2,
        category: newCourseCategory || 'مادة تخصصية',
        thumbnail: '/src/assets/images/course_petrophysics_1790513873916.jpg',
        instructor: newCourseInstructor || 'هيئة التدريس',
        totalLectures: 0,
        lectures: [],
      };

      // 1. Direct save to Cloud Firestore Database
      await saveCourseToFirestore(courseObj);

      // 2. Sync to backend server
      try {
        await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseObj),
        });
      } catch (err) {
        console.warn('Server create course sync notice:', err);
      }

      setSuccessMsg('تمت إضافة المادة وحفظها في قاعدة البيانات بنجاح!');
      setShowAddCourse(false);
      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCourseDesc('');
      await onRefreshData();
      await fetchAdminData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Create course error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVideoFileSelected = (file: File) => {
    setUploadError('');
    setSelectedVideoFile(file);
    setVideoFileSize(formatBytes(file.size));

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setVideoFilePreview(objectUrl);

    // Auto set title if empty
    if (!newLectureTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewLectureTitle(cleanName);
    }

    // Auto detect duration
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        const totalSec = Math.floor(tempVideo.duration);
        if (totalSec > 0) {
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          if (mins > 0) {
            setNewLectureDuration(`${mins} دقيقة${secs > 0 ? ` و ${secs} ثانية` : ''}`);
          } else {
            setNewLectureDuration(`${secs} ثانية`);
          }
        }
      };
    } catch (e) {
      console.warn('Could not auto-read video duration:', e);
    }
  };

  const resetLectureForm = () => {
    setShowAddLecture(false);
    setNewLectureTitle('');
    setNewLectureDuration('45 دقيقة');
    setNewLectureDesc('');
    setNewLectureVideo('');
    setSelectedVideoFile(null);
    setVideoFilePreview('');
    setVideoFileSize('');
    setSelectedPdfFile(null);
    setPdfFileSize('');
    setNewLecturePdfUrl('');
    setIncludeSectionWithLecture(false);
    setLecSecTitle('');
    setLecSecInstructor('');
    setLecSecDesc('');
    setLecSecVideoUrl('');
    setSelectedLecSecVideoFile(null);
    setLecSecVideoSize('');
    setSelectedLecSecImages([]);
    setSelectedLecSecPdfFile(null);
    setLecSecPdfSize('');
    setLecSecPdfUrl('');
    setNewLectureIsFree(true);
    setNewLectureClipStart(undefined);
    setNewLectureClipEnd(undefined);
    setNewLectureAspectRatio('16/9');
    setNewLectureScaleMode('contain');
    setNewLectureZoom(100);
    setUploadProgress(0);
    setUploadError('');
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourseId = selectedCourseForLec || (courses[0]?.id ?? '');

    if (!newLectureTitle.trim()) {
      setUploadError('يرجى كتابة عنوان المحاضرة');
      return;
    }

    if (!targetCourseId) {
      setUploadError('يرجى تحديد أو إنشاء مادة دراسية أولاً');
      return;
    }

    if (lectureSourceMode === 'upload' && !selectedVideoFile && !newLectureVideo) {
      setUploadError('يرجى اختيار ملف فيديو من جهازك للرفع');
      return;
    }

    if (lectureSourceMode === 'link' && !newLectureVideo) {
      setUploadError('يرجى إدخال رابط المحاضرة أو رابط الفيديو');
      return;
    }

    setLoading(true);
    setUploadError('');

    try {
      let finalVideoUrl = newLectureVideo;
      let finalFileName = '';
      let finalFileSize = '';

      if (lectureSourceMode === 'upload' && selectedVideoFile) {
        setIsUploadingFile(true);
        setUploadProgress(10);

        const uploadData = await resilientUploadFile(selectedVideoFile, (pct) => {
          setUploadProgress(Math.min(95, Math.max(10, pct)));
        });

        finalVideoUrl = uploadData.url;
        finalFileName = uploadData.originalName || selectedVideoFile.name;
        finalFileSize = videoFileSize || `${(uploadData.size / (1024 * 1024)).toFixed(1)} MB`;
        setUploadProgress(100);
      }

      // Handle PDF upload if selected
      let finalPdfUrl = newLecturePdfUrl;
      let finalPdfFileName = '';
      let finalPdfFileSize = '';

      if (pdfMode === 'upload' && selectedPdfFile) {
        setIsUploadingFile(true);
        const uploadPdfData = await resilientUploadFile(selectedPdfFile, (pct) => {
          setUploadProgress((prev) => Math.max(prev, pct));
        });

        finalPdfUrl = uploadPdfData.url;
        finalPdfFileName = selectedPdfFile.name;
        finalPdfFileSize = pdfFileSize || `${(uploadPdfData.size / (1024 * 1024)).toFixed(1)} MB`;
      } else if (pdfMode === 'link' && newLecturePdfUrl) {
        finalPdfUrl = newLecturePdfUrl;
        finalPdfFileName = 'Slides_PDF';
        finalPdfFileSize = 'PDF Link';
      }

      // Handle inline section if entered in Add Lecture form (خانة السكاشين)
      const attachedSections: LectureSection[] = [];
      if (lecSecTitle.trim()) {
        let secVidUrl = lecSecVideoUrl;
        let secVidFileName = '';
        let secVidFileSize = '';
        if (lecSecVideoMode === 'upload' && selectedLecSecVideoFile) {
          try {
            const res = await resilientUploadFile(selectedLecSecVideoFile);
            secVidUrl = res.url;
            secVidFileName = selectedLecSecVideoFile.name;
            secVidFileSize = lecSecVideoSize || `${(res.size / (1024 * 1024)).toFixed(1)} MB`;
          } catch {}
        }

        let secPdfUrl = lecSecPdfUrl;
        let secPdfFileName = '';
        let secPdfFileSize = '';
        if (lecSecPdfMode === 'upload' && selectedLecSecPdfFile) {
          try {
            const res = await resilientUploadFile(selectedLecSecPdfFile);
            secPdfUrl = res.url;
            secPdfFileName = selectedLecSecPdfFile.name;
            secPdfFileSize = lecSecPdfSize || `${(res.size / (1024 * 1024)).toFixed(1)} MB`;
          } catch {}
        }

        const secImages: SectionImage[] = [];
        for (let i = 0; i < selectedLecSecImages.length; i++) {
          const imgItem = selectedLecSecImages[i];
          let imgUrl = imgItem.preview;
          try {
            const imgRes = await resilientUploadFile(imgItem.file);
            imgUrl = imgRes.url;
          } catch {}
          secImages.push({
            id: `img-${Date.now()}-${i}`,
            url: imgUrl,
            caption: imgItem.caption || imgItem.name,
            name: imgItem.name,
            size: imgItem.size,
          });
        }

        attachedSections.push({
          id: `sec-${Date.now()}`,
          title: lecSecTitle.trim(),
          instructor: lecSecInstructor.trim(),
          description: lecSecDesc.trim(),
          videoUrl: secVidUrl,
          videoFileName: secVidFileName,
          videoFileSize: secVidFileSize,
          videoSourceType: lecSecVideoMode,
          pdfUrl: secPdfUrl,
          pdfFileName: secPdfFileName,
          pdfFileSize: secPdfFileSize,
          images: secImages,
          createdAt: new Date().toISOString(),
        });
      }

      setUploadProgress(95);

      const newLecObj: Lecture = {
        id: `lec-${Date.now()}`,
        courseId: targetCourseId,
        title: newLectureTitle.trim(),
        duration: newLectureDuration || '45 دقيقة',
        description: newLectureDesc,
        videoUrl: finalVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        pdfUrl: finalPdfUrl,
        pdfFileName: finalPdfFileName,
        pdfFileSize: finalPdfFileSize,
        sections: attachedSections,
        sourceType: lectureSourceMode,
        fileName: finalFileName,
        fileSize: finalFileSize,
        isFree: newLectureIsFree,
        clipStart: newLectureClipStart,
        clipEnd: newLectureClipEnd,
        aspectRatio: newLectureAspectRatio,
        videoDimensions: {
          aspectRatio: newLectureAspectRatio || '16/9',
          scaleMode: newLectureScaleMode || 'contain',
          zoom: newLectureZoom || 100,
        },
        order: 1,
      };

      // 1. Direct save updated course with new lecture to Cloud Firestore Database & local cache
      const targetCourse = courses.find((c) => c.id === targetCourseId);
      if (targetCourse) {
        newLecObj.order = (targetCourse.lectures?.length || 0) + 1;
        const updatedCourse: Course = {
          ...targetCourse,
          lectures: [...(targetCourse.lectures || []), newLecObj],
          totalLectures: (targetCourse.lectures?.length || 0) + 1,
        };
        // Update React state in App.tsx immediately (zero latency)
        if (onUpdateCourse) {
          onUpdateCourse(updatedCourse);
        }
        await saveCourseToFirestore(updatedCourse);
      }

      // 2. Sync with backend server
      try {
        await fetch(`/api/admin/courses/${targetCourseId}/lectures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newLectureTitle.trim(),
            duration: newLectureDuration || '45 دقيقة',
            description: newLectureDesc,
            videoUrl: finalVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            pdfUrl: finalPdfUrl,
            pdfFileName: finalPdfFileName,
            pdfFileSize: finalPdfFileSize,
            sections: attachedSections,
            sourceType: lectureSourceMode,
            fileName: finalFileName,
            fileSize: finalFileSize,
            isFree: newLectureIsFree,
            clipStart: newLectureClipStart,
            clipEnd: newLectureClipEnd,
            aspectRatio: newLectureAspectRatio,
            videoDimensions: {
              aspectRatio: newLectureAspectRatio || '16/9',
              scaleMode: newLectureScaleMode || 'contain',
              zoom: newLectureZoom || 100,
            },
          }),
        });
      } catch (srvErr) {
        console.warn('Backend server lecture sync notice:', srvErr);
      }

      // Auto expand course to immediately show the lecture
      setExpandedCourseIds((prev) => (prev.includes(targetCourseId) ? prev : [...prev, targetCourseId]));
      setUploadProgress(100);
      setSuccessMsg('تمت إضافة المحاضرة والملفات المرفقة وحفظها في قاعدة البيانات بنجاح!');
      resetLectureForm();

      // Refresh data immediately
      await onRefreshData();
      await fetchAdminData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Failed to create lecture:', err);
      setUploadError(err.message || 'حدث خطأ أثناء حفظ المحاضرة');
    } finally {
      setLoading(false);
      setIsUploadingFile(false);
    }
  };

  // Toggle single lecture free trial / paid status
  const handleToggleLectureFree = async (courseId: string, lectureId: string, currentIsFree?: boolean) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lectures/${lectureId}/toggle-free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFree: !currentIsFree }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'تم تحديث حالة المحاضرة بنجاح');
        setTimeout(() => setSuccessMsg(''), 3000);
        await onRefreshData();
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to toggle lecture free status:', err);
    }
  };

  // Section Handlers
  const handleSectionVideoSelected = (file: File) => {
    setSectionError('');
    setSelectedSectionVideoFile(file);
    setSectionVideoSize(formatBytes(file.size));
    const objectUrl = URL.createObjectURL(file);
    setSectionVideoPreview(objectUrl);
    if (!newSectionTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewSectionTitle(`سكشن: ${cleanName}`);
    }
  };

  const handleSectionPdfSelected = (file: File) => {
    setSectionError('');
    setSelectedSectionPdfFile(file);
    setSectionPdfSize(formatBytes(file.size));
  };

  const handleSectionImagesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSectionError('');
    const newItems: Array<{
      id: string;
      file: File;
      preview: string;
      caption: string;
      name: string;
      size: string;
    }> = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          preview,
          caption: '',
          name: file.name,
          size: formatBytes(file.size),
        });
      }
    });

    setSelectedSectionImages((prev) => [...prev, ...newItems]);
  };

  const removeSectionImage = (id: string) => {
    setSelectedSectionImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateSectionImageCaption = (id: string, caption: string) => {
    setSelectedSectionImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionModalLecture) return;
    const { courseId, lecture } = activeSectionModalLecture;

    if (!newSectionTitle.trim()) {
      setSectionError('يرجى إدخال عنوان السكشن');
      return;
    }

    setIsSectionUploading(true);
    setSectionError('');
    setSectionSuccess('');
    setSectionUploadProgress(15);

    try {
      // 1. Upload Video if selected from device
      let finalVideoUrl = newSectionVideoUrl;
      let finalVideoFileName = '';
      let finalVideoFileSize = '';

      if (newSectionVideoMode === 'upload' && selectedSectionVideoFile) {
        setSectionUploadProgress(20);
        const vidData = await resilientUploadFile(selectedSectionVideoFile, (pct) => {
          setSectionUploadProgress(Math.min(60, Math.max(20, pct)));
        });
        finalVideoUrl = vidData.url;
        finalVideoFileName = vidData.originalName || selectedSectionVideoFile.name;
        finalVideoFileSize = sectionVideoSize || `${(vidData.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      setSectionUploadProgress(65);

      // 2. Upload PDF if selected from device
      let finalPdfUrl = newSectionPdfUrl;
      let finalPdfFileName = '';
      let finalPdfFileSize = '';

      if (newSectionPdfMode === 'upload' && selectedSectionPdfFile) {
        const pdfData = await resilientUploadFile(selectedSectionPdfFile);
        finalPdfUrl = pdfData.url;
        finalPdfFileName = selectedSectionPdfFile.name;
        finalPdfFileSize = sectionPdfSize || `${(pdfData.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      setSectionUploadProgress(80);

      // 3. Upload Images if selected from device
      const finalImages: SectionImage[] = [];
      for (let i = 0; i < selectedSectionImages.length; i++) {
        const imgItem = selectedSectionImages[i];
        let imgUrl = imgItem.preview;
        try {
          const imgData = await resilientUploadFile(imgItem.file);
          imgUrl = imgData.url;
        } catch {}
        finalImages.push({
          id: `img-${Date.now()}-${i}`,
          url: imgUrl,
          caption: imgItem.caption || imgItem.name,
          name: imgItem.name,
          size: imgItem.size,
        });
      }


      setSectionUploadProgress(90);

      // 4. Save section to server
      const res = await fetch(`/api/admin/courses/${courseId}/lectures/${lecture.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle.trim(),
          instructor: newSectionInstructor.trim(),
          description: newSectionDesc.trim(),
          videoUrl: finalVideoUrl,
          videoFileName: finalVideoFileName,
          videoFileSize: finalVideoFileSize,
          videoSourceType: newSectionVideoMode,
          pdfUrl: finalPdfUrl,
          pdfFileName: finalPdfFileName,
          pdfFileSize: finalPdfFileSize,
          images: finalImages,
        }),
      });

      if (!res.ok) {
        throw new Error('حدث خطأ أثناء حفظ السكشن على الخادم');
      }

      const resData = await res.json();
      setSectionUploadProgress(100);
      setSectionSuccess('تمت إضافة السكشن للمحاضرة بنجاح!');

      // Update local modal state
      if (resData.lecture) {
        setActiveSectionModalLecture({
          ...activeSectionModalLecture,
          lecture: resData.lecture,
        });
      }

      // Reset form fields
      setNewSectionTitle('');
      setNewSectionInstructor('');
      setNewSectionDesc('');
      setNewSectionVideoUrl('');
      setSelectedSectionVideoFile(null);
      setSectionVideoPreview('');
      setSectionVideoSize('');
      setSelectedSectionImages([]);
      setSelectedSectionPdfFile(null);
      setSectionPdfSize('');
      setNewSectionPdfUrl('');

      await onRefreshData();
      setTimeout(() => setSectionSuccess(''), 3000);
    } catch (err: any) {
      console.error('Section creation error:', err);
      setSectionError(err.message || 'فشل إضافة السكشن');
    } finally {
      setIsSectionUploading(false);
    }
  };

  const handleDeleteSection = async (courseId: string, lectureId: string, sectionId: string, sectionTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف السكشن',
      message: `هل أنت متأكد من حذف السكشن "${sectionTitle}" من هذه المحاضرة؟ سيتم حذف جميع الملفات والصور المرفقة به.`,
      confirmText: 'نعم، احذف السكشن',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/courses/${courseId}/lectures/${lectureId}/sections/${sectionId}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            const data = await res.json();
            if (activeSectionModalLecture && data.lecture) {
              setActiveSectionModalLecture({
                ...activeSectionModalLecture,
                lecture: data.lecture,
              });
            }
            await onRefreshData();
            setSuccessMsg('تم حذف السكشن بنجاح');
            setTimeout(() => setSuccessMsg(''), 3000);
          }
        } catch (err) {
          console.error('Delete section error:', err);
        }
      },
    });
  };

  // Multi-Question Exam Builder Handlers
  const handleAddQuestionToDraft = () => {
    setExamQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestionFromDraft = (index: number) => {
    if (examQuestions.length <= 1) return;
    setExamQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = examQuestions[index];
    if (!target) return;
    setExamQuestions((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...target,
        id: `q-${Date.now()}-${prev.length + 1}`,
        text: `${target.text} (نسخة)`,
        options: [...target.options],
      },
      ...prev.slice(index + 1),
    ]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    setExamQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setExamQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = val;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleAiGenerateQuestions = async () => {
    setIsGeneratingAiQuestions(true);
    try {
      const selectedCourse = courses.find((c) => c.id === newExamCourseId);
      const res = await fetch('/api/ai/generate-exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: selectedCourse?.title || 'جيولوجيا وهندسة بترول',
          topic: aiQuestionTopic || newExamTitle || 'شامل المنهج',
          questionCount: aiQuestionCount || 5,
          year: newExamYear,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setExamQuestions(data.questions);
        setSuccessMsg(`تم توليد ${data.questions.length} أسئلة نموذجية بالذكاء الاصطناعي بنجاح! راجعها وقم بالتعديل عليها.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to generate exam questions with AI:', err);
    } finally {
      setIsGeneratingAiQuestions(false);
    }
  };

  const handleStartEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setNewExamTitle(exam.title);
    setNewExamCourseId(exam.courseId);
    setNewExamYear(String(exam.year));
    setNewExamDuration(String(exam.durationMinutes));
    setNewExamMarks(String(exam.totalMarks));
    setExamQuestions(
      exam.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      }))
    );
    setShowAddExam(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCreateOrUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    // Filter valid questions
    const validQuestions = examQuestions.filter((q) => q.text.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('يرجى كتابة نص سؤال واحد على الأقل للامتحان');
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = courses.find((c) => c.id === newExamCourseId);
      const body = {
        title: newExamTitle.trim(),
        courseId: newExamCourseId,
        courseTitle: selectedCourse?.title || 'مادة تخصصية',
        year: Number(newExamYear) as 1 | 2 | 3 | 4,
        type: 'quiz' as const,
        durationMinutes: Number(newExamDuration) || 15,
        totalMarks: Number(newExamMarks) || 20,
        questions: validQuestions.map((q, idx) => ({
          id: q.id || `q-${Date.now()}-${idx + 1}`,
          text: q.text.trim(),
          options: q.options.filter(Boolean).length >= 2 ? q.options.filter(Boolean) : ['أ', 'ب'],
          correctAnswer: Number(q.correctAnswer) || 0,
          explanation: q.explanation.trim() || 'سؤال معتمد من إدارة الكلية والقسم.',
        })),
      };

      if (editingExamId) {
        const examObj: Exam = {
          id: editingExamId,
          ...body,
          year: Number(body.year) as 1 | 2 | 3 | 4,
          isPublished: true,
        };
        await saveExamToFirestore(examObj).catch((err) => console.warn('Firestore exam save error:', err));
        await fetch(`/api/admin/exams/${editingExamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        setSuccessMsg(`تم تحديث الامتحان والأسئلة وحفظها في قاعدة البيانات بنجاح!`);
      } else {
        const examId = `exam-${Date.now()}`;
        const examObj: Exam = {
          id: examId,
          ...body,
          year: Number(body.year) as 1 | 2 | 3 | 4,
          isPublished: true,
        };
        await saveExamToFirestore(examObj).catch((err) => console.warn('Firestore exam save error:', err));
        await fetch('/api/admin/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: examId }),
        });
        setSuccessMsg(`تم إنشاء ونشر الامتحان للطلاب وحفظه في قاعدة البيانات بنجاح ومعه ${validQuestions.length} أسئلة!`);
      }

      setShowAddExam(false);
      setEditingExamId(null);
      setNewExamTitle('');
      setExamQuestions([
        {
          id: `q-1`,
          text: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
        },
      ]);
      onRefreshData();
      fetchAdminData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save exam error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset Student Device (Unbind single-device restriction)
  const handleResetStudentDevice = (studentId: string, studentName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'فك ارتباط جهاز الطالب',
      message: `هل أنت متأكد من فك ارتباط الجهاز المسجل للطالب (${studentName})؟ بعد فك الارتباط، سيتمكن الطالب من تسجيل الدخول من هاتفه أو كمبيوتره الجديد وربطه تلقائياً.`,
      confirmText: 'نعم، فك ارتباط الجهاز',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/reset-student-device/${studentId}`, {
            method: 'POST',
          });
          const data = await res.json();
          setSuccessMsg(data.message || 'تم فك ارتباط الجهاز بنجاح!');
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          console.error('Reset device error:', err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Toggle Student Subscription (Direct 1-click activation when paid via InstaPay)
  const handleToggleStudentSubscription = async (
    studentId: string,
    currentStatus: string | undefined,
    studentName: string
  ) => {
    const newStatus = currentStatus === 'active' ? 'none' : 'active';
    try {
      const res = await fetch(`/api/admin/students/${studentId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      setSuccessMsg(data.message || (newStatus === 'active' ? 'تم تفعيل الاشتراك بنجاح!' : 'تم إلغاء التفعيل'));
      fetchAdminData();
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Subscription toggle error:', err);
    }
  };

  // Delete Single Student / User Account
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف حساب الطالب نهائياً',
      message: `هل أنت متأكد من رغبتك في حذف حساب الطالب "${studentName}" نهائياً من المنصة؟ سيتم مسح حسابه وسجلات تسجيل الدخول والجهاز المقترن والامتحانات، ولن يتمكن من الدخول مجدداً.`,
      confirmText: 'نعم، حذف الحساب نهائياً',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // 1. Delete from Cloud Firestore Database
          await deleteStudentFromFirestore(studentId);

          // 2. Clear from localStorage cache
          try {
            const storedUsersRaw = localStorage.getItem('petrogeo_registered_users');
            if (storedUsersRaw) {
              const localUsers = JSON.parse(storedUsersRaw).filter((u: any) => u.id !== studentId);
              localStorage.setItem('petrogeo_registered_users', JSON.stringify(localUsers));
            }
          } catch {}

          // 3. Delete from backend server
          const res = await fetch(`/api/admin/students/${studentId}`, {
            method: 'DELETE',
          });
          const data = await res.json().catch(() => ({}));
          setSuccessMsg(data.message || `تم حذف حساب الطالب (${studentName}) بنجاح!`);
          await fetchAdminData();
          await onRefreshData();
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          console.error('Delete student error:', err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Clear All Registered Student Accounts
  const handleClearAllStudents = () => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف جميع حسابات الطلاب المسجلة',
      message: 'تحذير: هل أنت متأكد من حذف كافة حسابات الطلاب المسجلة في المنصة بالكامل؟ سيتم الحفاظ فقط على حسابك كأدمن ومسؤول.',
      confirmText: 'نعم، حذف كافة حسابات الطلاب',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // 1. Clear all students from Cloud Firestore Database
          await clearAllFirestoreStudents();

          // 2. Clear from localStorage cache
          try {
            localStorage.removeItem('petrogeo_registered_users');
          } catch {}

          // 3. Clear from backend server
          const res = await fetch('/api/admin/students/clear-all', {
            method: 'POST',
          });
          const data = await res.json().catch(() => ({}));
          setSuccessMsg(data.message || 'تم حذف جميع حسابات الطلاب المسجلة وتفريغها بنجاح!');
          await fetchAdminData();
          await onRefreshData();
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          console.error('Clear students error:', err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ------------------- CO-ADMIN HANDLERS (إدارة المشرفين والأدمن) -------------------

  // Create or promote a new admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      alert('يرجى كتابة اسم المشرف والبريد الإلكتروني');
      return;
    }
    setAdminActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          phone: newAdminPhone.trim() || '01000000000',
          password: newAdminPassword || 'admin123',
          department: newAdminDept.trim() || 'إدارة المنصة والإشراف الأكاديمي',
          adminTitle: newAdminTitle.trim() || 'مشرف إداري معتمد 🛡️',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إضافة المشرف');
      }
      setSuccessMsg(data.message || 'تمت إضافة المشرف بنجاح');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminPassword('admin123');
      await fetchAdminUsers();
      await fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إضافة المشرف');
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Promote existing student to admin
  const handlePromoteStudentToAdmin = (student: any) => {
    setConfirmModal({
      isOpen: true,
      title: `ترقية الطالب (${student.name}) لأدمن ومشرف`,
      message: `هل أنت متأكد من رغبتك في ترقية الطالب "${student.name}" ليصبح أدمن ومشرف معك في المنصة بصلاحيات كاملة للتحكم في الكورسات والطلاب؟`,
      confirmText: 'نعم، ترقية لأدمن 🛡️',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/students/${student.id}/promote`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message || 'تمت الترقية لأدمن بنجاح!');
            setTimeout(() => setSuccessMsg(''), 4000);
            await fetchAdminData();
            await fetchAdminUsers();
            onRefreshData();
          } else {
            alert(data.error || 'تعذر ترقية الطالب');
          }
        } catch (e) {
          console.error('Promote student error:', e);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Co-Admin
  const handleDeleteAdmin = (adminUser: User) => {
    if (adminUser.isPrimaryAdmin || adminUser.email.toLowerCase() === 'abdelrahmanelbortogaly@gmail.com') {
      alert('لا يمكن حذف حساب المؤسس والمشرف العام للمنصة');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `حذف حساب المشرف (${adminUser.name})`,
      message: `هل أنت متأكد من رغبتك في حذف حساب المشرف "${adminUser.name}"؟ سيتم إلغاء صلاحياته بالكامل ومسح حسابه من قاعدة البيانات ولن يتمكن من الدخول للوحة التحكم.`,
      confirmText: 'نعم، حذف حساب المشرف نهائياً',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // 1. Delete from Cloud Firestore Database
          await deleteAdminFromFirestore(adminUser.id, adminUser.email);

          // 2. Remove from localStorage caches and add to permanent deleted blacklist
          try {
            const storedUsersRaw = localStorage.getItem('petrogeo_registered_users');
            if (storedUsersRaw) {
              const localUsers = JSON.parse(storedUsersRaw).filter(
                (u: any) => u.id !== adminUser.id && u.email?.toLowerCase() !== adminUser.email.toLowerCase()
              );
              localStorage.setItem('petrogeo_registered_users', JSON.stringify(localUsers));
            }
            const delAdmins: string[] = JSON.parse(localStorage.getItem('petrogeo_deleted_admins') || '[]');
            if (!delAdmins.includes(adminUser.id)) delAdmins.push(adminUser.id);
            if (!delAdmins.includes(adminUser.email.toLowerCase())) delAdmins.push(adminUser.email.toLowerCase());
            localStorage.setItem('petrogeo_deleted_admins', JSON.stringify(delAdmins));
          } catch {}

          // 3. Update local state immediately
          setAdminUsers((prev) =>
            prev.filter(
              (a) => a.id !== adminUser.id && a.email.toLowerCase() !== adminUser.email.toLowerCase()
            )
          );

          // 4. Send DELETE request to backend server
          const res = await fetch(`/api/admin/admins/${adminUser.id}`, { method: 'DELETE' });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            setSuccessMsg(data.message || `تم حذف حساب المشرف (${adminUser.name}) بنجاح`);
            setTimeout(() => setSuccessMsg(''), 4000);
            await fetchAdminUsers();
            await fetchAdminData();
            onRefreshData();
          } else {
            alert(data.error || 'تعذر حذف المشرف');
          }
        } catch (e) {
          console.error('Delete admin error:', e);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Demote Co-Admin back to student
  const handleDemoteAdmin = (adminUser: User) => {
    if (adminUser.isPrimaryAdmin || adminUser.email.toLowerCase() === 'abdelrahmanelbortogaly@gmail.com') {
      alert('لا يمكن تغيير رتبة المؤسس والمشرف العام للمنصة');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `تحويل المشرف (${adminUser.name}) إلى طالب`,
      message: `هل تريد سحب صلاحيات الأدمن من "${adminUser.name}" وتحويل حسابه إلى حساب طالب عادي؟`,
      confirmText: 'نعم، تحويل إلى طالب',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/admins/${adminUser.id}/demote`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message || 'تم تحويل المشرف إلى طالب بنجاح');
            setTimeout(() => setSuccessMsg(''), 4000);
            await fetchAdminUsers();
            await fetchAdminData();
            onRefreshData();
          } else {
            alert(data.error || 'تعذر تحويل المشرف');
          }
        } catch (e) {
          console.error('Demote admin error:', e);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Copy Admin Credentials
  const handleCopyAdminCreds = (adminUser: User) => {
    const credText = `بيانات دخول المشرف إلى منصة PETROGEO:\n👤 الاسم: ${adminUser.name}\n📧 البريد: ${adminUser.email}\n📱 الهاتف: ${adminUser.phone}\n🔑 كلمة المرور الافتراضية: admin123\n🌐 رابط المنصة: ${window.location.origin}`;
    navigator.clipboard.writeText(credText);
    setCopiedAdminCreds(adminUser.id);
    setTimeout(() => setCopiedAdminCreds(null), 3000);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    setLoading(true);
    try {
      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAnnTitle,
          content: newAnnContent,
          targetYear: newAnnYear,
          priority: newAnnPriority,
          author: currentUser.name,
        }),
      });
      setSuccessMsg('تم نشر الإعلان بنجاح!');
      setShowAddAnn(false);
      setNewAnnTitle('');
      setNewAnnContent('');
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: string, courseTitle?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف المادة وجميع محاضراتها',
      message: `هل أنت متأكد من حذف مقرر "${courseTitle || 'هذه المادة'}" وكافة المحاضرات المرتبطة به نهائياً؟`,
      confirmText: 'حذف المادة',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCourseFromFirestore(courseId).catch((err) => console.warn('Firestore delete course error:', err));
          await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
          setSuccessMsg('تم حذف المادة بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteLecture = (courseId: string, lectureId: string, lectureTitle?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف المحاضرة',
      message: `هل أنت متأكد من حذف محاضرة "${lectureTitle || 'المحاضرة'}" من هذا المقرر؟`,
      confirmText: 'حذف المحاضرة',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/courses/${courseId}/lectures/${lectureId}`, { method: 'DELETE' });
          const targetCourse = courses.find((c) => c.id === courseId);
          if (targetCourse) {
            const updatedLectures = (targetCourse.lectures || []).filter((l) => l.id !== lectureId);
            const updatedCourse = {
              ...targetCourse,
              lectures: updatedLectures,
              totalLectures: updatedLectures.length,
            };
            await saveCourseToFirestore(updatedCourse).catch((err) => console.warn('Firestore sync lecture delete error:', err));
          }
          setSuccessMsg('تم حذف المحاضرة بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveVideoEdits = async (settings: {
    clipStart?: number;
    clipEnd?: number;
    aspectRatio?: string;
    scaleMode?: 'contain' | 'cover' | 'fill';
    zoom?: number;
    rotation?: number;
    durationFormatted?: string;
    newVideoBlob?: Blob;
    newVideoUrl?: string;
  }) => {
    if (!activeVideoEditorModal) return;
    const { courseId, lecture, section } = activeVideoEditorModal;

    try {
      setLoading(true);
      let finalVideoUrl = section ? (section.videoUrl || '') : lecture.videoUrl;
      let finalFileName = section ? (section.videoFileName || '') : lecture.fileName;
      let finalFileSize = section ? (section.videoFileSize || '') : lecture.fileSize;

      // If a new video file/blob was processed/trimmed
      if (settings.newVideoBlob) {
        try {
          const uploadRes = await resilientUploadFile(
            settings.newVideoBlob,
            undefined,
            `trimmed_${Date.now()}.webm`
          );
          finalVideoUrl = uploadRes.url;
          finalFileName = uploadRes.originalName;
          finalFileSize = `${(settings.newVideoBlob.size / (1024 * 1024)).toFixed(1)} MB`;
        } catch (uploadErr) {
          console.warn('Trimmed video upload notice:', uploadErr);
          if (settings.newVideoUrl) {
            finalVideoUrl = settings.newVideoUrl;
          }
        }
      }

      // 1. If editing video for a NEW lecture that hasn't been created yet (temp-new-lec)
      if (lecture.id === 'temp-new-lec') {
        setNewLectureClipStart(settings.clipStart);
        setNewLectureClipEnd(settings.clipEnd);
        setNewLectureAspectRatio(settings.aspectRatio || '16/9');
        setNewLectureScaleMode(settings.scaleMode || 'contain');
        setNewLectureZoom(settings.zoom || 100);
        if (settings.durationFormatted) {
          setNewLectureDuration(settings.durationFormatted);
        }
        if (settings.newVideoUrl) {
          setVideoFilePreview(settings.newVideoUrl);
        }
        const startSec = Math.floor(settings.clipStart || 0);
        const endSec = Math.floor(settings.clipEnd || 0);
        setSuccessMsg(`تم حفظ وتطبيق قص الفيديو بنجاح (من ثانية ${startSec} حتى ${endSec}) ✂️🎬! يمكنك الآن حفظ المحاضرة.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        setActiveVideoEditorModal(null);
        return;
      }

      // 2. Update existing lecture/section in courses array
      const targetCourse = courses.find((c) => c.id === courseId);
      if (targetCourse) {
        let updatedLectures: Lecture[];

        if (section) {
          // Update Section Video
          updatedLectures = (targetCourse.lectures || []).map((l) => {
            if (l.id === lecture.id) {
              const updatedSections = (l.sections || []).map((s) => {
                if (s.id === section.id) {
                  return {
                    ...s,
                    videoUrl: finalVideoUrl,
                    videoFileName: finalFileName,
                    videoFileSize: finalFileSize,
                    duration: settings.durationFormatted || s.duration,
                    clipStart: settings.clipStart,
                    clipEnd: settings.clipEnd,
                    aspectRatio: settings.aspectRatio,
                    videoDimensions: {
                      aspectRatio: settings.aspectRatio,
                      scaleMode: settings.scaleMode,
                      zoom: settings.zoom,
                    },
                  };
                }
                return s;
              });
              return { ...l, sections: updatedSections };
            }
            return l;
          });
        } else {
          // Update Main Lecture Video
          updatedLectures = (targetCourse.lectures || []).map((l) => {
            if (l.id === lecture.id) {
              return {
                ...l,
                videoUrl: finalVideoUrl,
                fileName: finalFileName,
                fileSize: finalFileSize,
                duration: settings.durationFormatted || l.duration,
                clipStart: settings.clipStart,
                clipEnd: settings.clipEnd,
                aspectRatio: settings.aspectRatio,
                videoDimensions: {
                  aspectRatio: settings.aspectRatio,
                  scaleMode: settings.scaleMode,
                  zoom: settings.zoom,
                },
              };
            }
            return l;
          });
        }

        const updatedCourse: Course = {
          ...targetCourse,
          lectures: updatedLectures,
        };

        // 1. Direct update to React state in App.tsx (Immediate zero-delay UI update!)
        if (onUpdateCourse) {
          onUpdateCourse(updatedCourse);
        }

        // 2. Direct save to localStorage cache so it can never be wiped
        try {
          const stored = localStorage.getItem('petrogeo_cached_courses');
          const list: Course[] = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex((c) => c.id === updatedCourse.id);
          if (idx !== -1) list[idx] = updatedCourse;
          else list.push(updatedCourse);
          localStorage.setItem('petrogeo_cached_courses', JSON.stringify(list));
        } catch {}

        // 3. Direct save to Cloud Firestore (with 3s timeout)
        await saveCourseToFirestore(updatedCourse);

        // 2. Sync to local backend server
        try {
          if (section) {
            await fetch(`/api/admin/courses/${courseId}/lectures/${lecture.id}/sections/${section.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoUrl: finalVideoUrl,
                videoFileName: finalFileName,
                videoFileSize: finalFileSize,
                duration: settings.durationFormatted || section.duration,
                clipStart: settings.clipStart,
                clipEnd: settings.clipEnd,
                aspectRatio: settings.aspectRatio,
                videoDimensions: {
                  aspectRatio: settings.aspectRatio,
                  scaleMode: settings.scaleMode,
                  zoom: settings.zoom,
                },
              }),
            });
          } else {
            await fetch(`/api/admin/courses/${courseId}/lectures/${lecture.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoUrl: finalVideoUrl,
                fileName: finalFileName,
                fileSize: finalFileSize,
                duration: settings.durationFormatted || lecture.duration,
                clipStart: settings.clipStart,
                clipEnd: settings.clipEnd,
                aspectRatio: settings.aspectRatio,
                videoDimensions: {
                  aspectRatio: settings.aspectRatio,
                  scaleMode: settings.scaleMode,
                  zoom: settings.zoom,
                },
              }),
            });
          }
        } catch (_) {}

        // If section modal is active, update its state
        if (activeSectionModalLecture) {
          setActiveSectionModalLecture((prev) => {
            if (!prev) return null;
            const curLec = updatedLectures.find((l) => l.id === prev.lecture.id);
            return curLec ? { ...prev, lecture: curLec } : prev;
          });
        }

        setSuccessMsg(
          section
            ? `تم حفظ وتطبيق تعديل وقص فيديو السكشن (${section.title}) بنجاح ✂️🎬!`
            : 'تم حفظ وتطبيق تعديل وقص الفيديو على المحاضرة بنجاح!'
        );
        onRefreshData();
        fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to save video edits:', err);
    } finally {
      setLoading(false);
      setActiveVideoEditorModal(null);
    }
  };


  const handleClearAllCourses = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تفريغ وحذف كافة المقررات والمحاضرات',
      message: 'سيتم حذف جميع المواد والمحاضرات المسجلة في المنصة وتصفيرها بالكامل لتتمكن من إضافة مقرراتك الخاصة. لن تظهر أي محاضرات تجريبية مجدداً إلا إذا قمت باستعادتها.',
      confirmText: 'نعم، تفريغ كافة المواد',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await clearAllFirestoreCourses().catch((err) => console.warn('Firestore clear error:', err));
          await fetch('/api/admin/courses/clear-all', { method: 'POST' });
          setSuccessMsg('تم تفريغ كافة المواد والمحاضرات بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRestoreDemoCourses = () => {
    setConfirmModal({
      isOpen: true,
      title: 'استعادة المقررات النموذجية',
      message: 'هل تريد إعادة استيراد مقررات الجيولوجيا والبترول النموذجية التجريبية (بتروفيزياء، معادن، طبقات، جيولوجيا نفط)؟',
      confirmText: 'استعادة المقررات',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await fetch('/api/admin/courses/restore-demo', { method: 'POST' });
          setSuccessMsg('تمت استعادة المقررات النموذجية بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteAnnouncement = (annId: string, annTitle?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الإعلان',
      message: `هل أنت متأكد من حذف إعلان "${annTitle || 'هذا الإعلان'}"؟`,
      confirmText: 'حذف الإعلان',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/announcements/${annId}`, { method: 'DELETE' });
          setSuccessMsg('تم حذف الإعلان بنجاح!');
          onRefreshData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteExam = (examId: string, examTitle?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الامتحان',
      message: `هل أنت متأكد من حذف امتحان "${examTitle || 'هذا الامتحان'}" نهائياً من المنصة وقاعدة البيانات؟`,
      confirmText: 'حذف الامتحان',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteExamFromFirestore(examId).catch((err) => console.warn('Firestore exam delete error:', err));
          await fetch(`/api/admin/exams/${examId}`, { method: 'DELETE' });
          setSuccessMsg('تم حذف الامتحان بنجاح من المنصة وقاعدة البيانات!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleClearAllExams = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تفريغ وحذف كافة الامتحانات التجريبية',
      message: 'سيتم حذف جميع الامتحانات والكويزات التجريبية وتصفيرها بالكامل من المنصة وقاعدة البيانات. لن تظهر أي امتحانات تجريبية مجدداً إلا إذا قمت باستعادتها.',
      confirmText: 'نعم، تفريغ كافة الامتحانات',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await clearAllFirestoreExams().catch((err) => console.warn('Firestore clear exams error:', err));
          await fetch('/api/admin/exams/clear-all', { method: 'POST' });
          setSuccessMsg('تم تفريغ وحذف كافة الامتحانات بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRestoreDemoExams = () => {
    setConfirmModal({
      isOpen: true,
      title: 'استعادة الامتحانات النموذجية',
      message: 'هل تريد إعادة استيراد الامتحانات النموذجية التجريبية لمنصة PETROGEO؟',
      confirmText: 'استعادة الامتحانات',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await fetch('/api/admin/exams/restore-demo', { method: 'POST' });
          setSuccessMsg('تمت استعادة الامتحانات النموذجية بنجاح!');
          onRefreshData();
          fetchAdminData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.phone.includes(searchStudent) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesYear = selectedYearFilter === 'all' || s.year.toString() === selectedYearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Admin Title Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-l from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-black text-slate-100">لوحة تحكم المشرف العام (Admin Control)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة الطلاب، متابعة الأداء والدرجات، إضافة المقررات والمحاضرات، وإصدار الامتحانات والإعلانات الموجهة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/petrogeo-platform.zip"
            download="petrogeo-platform.zip"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            title="تحميل السورس كود الكامل للمنصة كملف ZIP"
          >
            <HardDrive className="w-4 h-4" />
            <span>تحميل ملف المنصة المضغوط (ZIP) 📦</span>
          </a>

          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <span>دخول مؤمّن بصلاحيات الإدارة</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-3xl font-black text-cyan-400 tabular-nums">{stats.totalStudents || students.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">الطلاب المسجلين</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-3xl font-black text-amber-400 tabular-nums">{courses.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">إجمالي المواد عبر الفرق</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-3xl font-black text-purple-400 tabular-nums">{exams.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">الامتحانات والكويزات</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-3xl font-black text-emerald-400 tabular-nums">{stats.totalLecturesWatched || 0}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">محاضرات تمت مشاهدتها</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeAdminTab === 'students'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الطلاب وأدائهم ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('admins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeAdminTab === 'admins'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25'
              : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>فريق الإدارة والمشرفين ({adminUsers.length}) 🛡️</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeAdminTab === 'courses'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المواد والمحاضرات ({courses.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveAdminTab('sections');
            if (!secTabCourseId && courses.length > 0) {
              setSecTabCourseId(courses[0].id);
              if (courses[0].lectures && courses[0].lectures.length > 0) {
                setSecTabLectureId(courses[0].lectures[0].id);
              }
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeAdminTab === 'sections'
              ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/20'
              : 'text-purple-300 hover:text-purple-200 bg-purple-500/10 border border-purple-500/30'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>خانة السكاشين والتطبيقات العملية ⭐</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeAdminTab === 'exams'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الامتحانات والكويزات ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeAdminTab === 'announcements'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>الإعلانات والتنبيهات ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeAdminTab === 'payments'
              ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white font-black shadow-lg shadow-purple-500/25'
              : 'text-purple-300 hover:text-white bg-purple-950/40 border border-purple-500/40'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>اشتراكات InstaPay والدفع 💳</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('supabase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeAdminTab === 'supabase'
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black shadow-lg shadow-emerald-500/25'
              : 'text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-500/40'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>قاعدة بيانات Supabase ⚡</span>
        </button>
      </div>

      {/* 1. Students Management Tab */}
      {activeAdminTab === 'students' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>دليل الطلاب ومتابعة الأداء الأكاديمي</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                {filteredStudents.length} حساب مسجل
              </span>
            </div>

            {/* Actions: Filter, Search & Clear all */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
              {filteredStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllStudents}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="حذف جميع حسابات الطلاب التجريبية والمسجلة دفعة واحدة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تصفير كافة حسابات الطلاب</span>
                </button>
              )}

              {/* Year filter */}
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 text-right"
              >
                <option value="all">كل الفرق الدراسية</option>
                <option value="1">الفرقة الأولى (سنة 1)</option>
                <option value="2">الفرقة الثانية (سنة 2)</option>
                <option value="3">الفرقة الثالثة (سنة 3)</option>
                <option value="4">الفرقة الرابعة (سنة 4)</option>
              </select>

              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-100 text-right"
                />
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-bold">اسم الطالب</th>
                  <th className="py-3 px-4 font-bold">الفرقة والقسم</th>
                  <th className="py-3 px-4 font-bold">الهاتف والبريد</th>
                  <th className="py-3 px-4 font-bold">المحاضرات المكتملة</th>
                  <th className="py-3 px-4 font-bold">نسبة التقدم</th>
                  <th className="py-3 px-4 font-bold">الامتحانات المحلولة</th>
                  <th className="py-3 px-4 font-bold">متوسط الدرجات</th>
                  <th className="py-3 px-4 font-bold">الجهاز المقترن (Single Device)</th>
                  <th className="py-3 px-4 font-bold text-center">اشتراك المنصة (InstaPay)</th>
                  <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-400">سنة {s.year}</span>
                      <span className="text-slate-400 block text-[11px]">{s.department}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      <div>{s.phone}</div>
                      <div className="text-slate-500">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {s.completedLecturesCount || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${s.overallPercentage || 0}%` }}
                          />
                        </div>
                        <span className="text-amber-400 font-bold tabular-nums">
                          {s.overallPercentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {s.examsTakenCount || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          (s.averageScore || 0) >= 80
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : (s.averageScore || 0) >= 60
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.averageScore || 0}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.boundDeviceName ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{s.boundDeviceName}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {s.boundAt ? new Date(s.boundAt).toLocaleDateString('ar-EG') : 'مقترن 🔒'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">غير مقترن بعد</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {s.subscriptionStatus === 'active' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 text-[11px] inline-flex items-center gap-1">
                            <span>مفعّل</span>
                            <span>👑</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubscription(s.id, s.subscriptionStatus, s.name)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline px-1 py-0.5"
                            title="إلغاء التفعيل"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : s.subscriptionStatus === 'pending' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 text-[10px]">
                            بانتظار التأكيد ⏳
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubscription(s.id, s.subscriptionStatus, s.name)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all cursor-pointer"
                          >
                            تفعيل الآن ✅
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            غير مفعّل
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubscription(s.id, s.subscriptionStatus, s.name)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer"
                            title="تفعيل حساب الطالب لفتح المنصة له مباشرة بعد تحويل InstaPay"
                          >
                            تفعيل الحساب ⚡
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {s.boundDeviceId && (
                          <button
                            type="button"
                            onClick={() => handleResetStudentDevice(s.id, s.name)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="فك ارتباط هذا الجهاز للسماح للطالب بتسجيل الدخول من جهاز جديد"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>فك الارتباط</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePromoteStudentToAdmin(s)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="ترقية هذا الطالب ليصبح مشرف وأدمن معك في إدارة المنصة"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>ترقية لأدمن 🛡️</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="حذف هذا الحساب نهائياً وفصل تسجيل دخوله من المنصة"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف الحساب</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1b. Co-Admins & Supervisors Management Tab (Requested by user) */}
      {activeAdminTab === 'admins' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-slate-100">فريق الإدارة والمشرفين (Co-Admins)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {adminUsers.length} مشرف
                </span>
              </div>
              <p className="text-xs text-slate-400">
                يمكنك إضافة مشرفين ومسؤولين معك في المنصة بصلاحيات الأدمن الكاملة للمساعدة في رفع المحاضرات ومتابعة الطلاب وقبول الاشتراكات.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddAdminModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة حساب أدمن جديد 🛡️</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي فريق الإدارة</span>
                <span className="text-2xl font-black text-amber-400 mt-0.5 block">{adminUsers.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">المشرف العام المؤسس</span>
                <span className="text-xs font-black text-slate-200 mt-1 block">Abdelrahman El bortogaly</span>
                <span className="text-[10px] text-emerald-400 font-mono">المالك الأساسي للمنصة</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">المشرفين المساعدين المضافين</span>
                <span className="text-2xl font-black text-cyan-400 mt-0.5 block">
                  {adminUsers.filter((a) => !a.isPrimaryAdmin && a.email.toLowerCase() !== 'abdelrahmanelbortogaly@gmail.com').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-900/70 border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني أو رقم هاتف المشرف..."
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
              className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
            {searchAdmin && (
              <button
                type="button"
                onClick={() => setSearchAdmin('')}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                مسح
              </button>
            )}
          </div>

          {/* Admins Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">المشرف</th>
                  <th className="py-3 px-4">بيانات التواصل</th>
                  <th className="py-3 px-4">المسمى الإداري والتخصص</th>
                  <th className="py-3 px-4 text-center">نوع الصلاحية</th>
                  <th className="py-3 px-4 text-center">آخر تسجيل دخول</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {adminUsers
                  .filter((a) => {
                    if (!searchAdmin.trim()) return true;
                    const q = searchAdmin.toLowerCase();
                    return (
                      a.name.toLowerCase().includes(q) ||
                      a.email.toLowerCase().includes(q) ||
                      (a.phone && a.phone.includes(q))
                    );
                  })
                  .map((admin) => {
                    const isPrimary =
                      admin.isPrimaryAdmin ||
                      admin.email.toLowerCase() === 'abdelrahmanelbortogaly@gmail.com' ||
                      admin.id === 'user-abdelrahman';

                    return (
                      <tr key={admin.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                              isPrimary
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}>
                              {admin.avatar || admin.name.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{admin.name}</span>
                                {isPrimary && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                ID: {admin.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] space-y-1">
                          <div className="text-slate-300 flex items-center gap-1.5" dir="ltr">
                            <span>{admin.email}</span>
                          </div>
                          <div className="text-slate-400 flex items-center gap-1.5" dir="ltr">
                            <span>{admin.phone || '01000000000'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-bold">
                            {admin.adminTitle || (isPrimary ? 'المؤسس والمشرف العام 👑' : 'مشرف إداري معتمد 🛡️')}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {admin.department || 'إدارة المنصة والإشراف الأكاديمي'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isPrimary ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              <span>المالك والمؤسس</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>مشرف أدمن معتمد</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                          {admin.lastLoginAt ? (
                            <span>{new Date(admin.lastLoginAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-slate-600">لم يسجل بعد</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Copy Credentials Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyAdminCreds(admin)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="نسخ بيانات الدخول لمشاركتها مع المشرف على واتساب"
                            >
                              <Copy className="w-3 h-3 text-cyan-400" />
                              <span>{copiedAdminCreds === admin.id ? 'تم النسخ ✅' : 'نسخ الدخول'}</span>
                            </button>

                            {!isPrimary && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDemoteAdmin(admin)}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                                  title="سحب صلاحيات الأدمن وتحويل الحساب إلى طالب"
                                >
                                  <span>تحويل لطالب</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                  title="حذف حساب المشرف بالكامل"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>حذف</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Co-Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">إضافة مشرف وأدمن جديد معاي</h3>
                  <p className="text-[11px] text-slate-400">سيمتلك الحساب صلاحيات الإدارة الكاملة للتحكم في المنصة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">اسم المشرف بالكامل: *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م. أحمد كمال أو د. سامح الشريف"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">البريد الإلكتروني للدخول: *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@petrogeo.edu"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left focus:outline-none"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">رقم الموبايل / واتساب:</label>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">كلمة المرور للحساب:</label>
                  <input
                    type="text"
                    required
                    placeholder="admin123"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left focus:outline-none"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-500">كلمة المرور الافتراضية المقترحة: admin123</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">المسمى الإداري:</label>
                  <input
                    type="text"
                    placeholder="مثال: مشرف مساعد 🛡️"
                    value={newAdminTitle}
                    onChange={(e) => setNewAdminTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">القسم أو المهمة الأكاديمية:</label>
                <input
                  type="text"
                  placeholder="مثال: إدارة المواد والسكاشين / قسم الجيولوجيا"
                  value={newAdminDept}
                  onChange={(e) => setNewAdminDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:outline-none"
                />
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold block">اقتراحات سريعة للمسمى:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['مشرف إداري معتمد 🛡️', 'دكتور ومحاضر مادة 👨‍🏫', 'مسؤول مالي واشتراكات 💳', 'مشرف عام مساعد 👑'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setNewAdminTitle(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{adminActionLoading ? 'جاري الإنشاء...' : 'إنشاء وتفعيل حساب الأدمن فوراً ✅'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Courses Management Tab */}
      {activeAdminTab === 'courses' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>إدارة المواد والكورسات الدراسية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة وحذف المواد، إدارة وتفريغ المحاضرات، وتعديل محتوى الفرق الدراسية.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllCourses}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تفريغ المنصة وحذف كافة المواد والمحاضرات لتجهيزها لمحتواك الخاص"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ وحذف كافة المواد</span>
              </button>
              <button
                type="button"
                onClick={handleRestoreDemoCourses}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="استعادة المقررات التجريبية الأربعة لقسم الجيولوجيا"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة المقررات التجريبية</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab('sections');
                  if (!secTabCourseId && courses.length > 0) {
                    setSecTabCourseId(courses[0].id);
                    if (courses[0].lectures && courses[0].lectures.length > 0) {
                      setSecTabLectureId(courses[0].lectures[0].id);
                    }
                  }
                }}
                className="px-3.5 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>خانة السكاشين</span>
              </button>
              {courses.some((c) => c.lectures && c.lectures.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    const firstCourseWithLec = courses.find((c) => c.lectures && c.lectures.length > 0);
                    if (firstCourseWithLec && firstCourseWithLec.lectures[0]) {
                      setActiveVideoEditorModal({
                        courseId: firstCourseWithLec.id,
                        courseTitle: firstCourseWithLec.title,
                        lecture: firstCourseWithLec.lectures[0],
                      });
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="استوديو قص وتعديل حجم الفيديو والتحكم في أبعاد العرض"
                >
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>استوديو قص وتعديل الفيديو ✂️</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddLecture(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة محاضرة</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddCourse(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مادة جديدة</span>
              </button>
            </div>
          </div>

          {/* Add Course Form */}
          {showAddCourse && (
            <form onSubmit={handleCreateCourse} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4">
              <h3 className="text-sm font-bold text-amber-400">بيانات المادة الجديدة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <input
                  type="text"
                  placeholder="اسم المادة (مثال: جيولوجيا البترول)"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                  required
                />
                <input
                  type="text"
                  placeholder="كود المادة (مثال: PETRO-301)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                />
                <select
                  value={newCourseYear}
                  onChange={(e) => setNewCourseYear(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                >
                  <option value="1">الفرقة الأولى</option>
                  <option value="2">الفرقة الثانية</option>
                  <option value="3">الفرقة الثالثة</option>
                  <option value="4">الفرقة الرابعة</option>
                </select>
                <input
                  type="text"
                  placeholder="أستاذ المادة"
                  value={newCourseInstructor}
                  onChange={(e) => setNewCourseInstructor(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                />
                <input
                  type="text"
                  placeholder="التصنيف (مثال: مكامن وحقول)"
                  value={newCourseCategory}
                  onChange={(e) => setNewCourseCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                />
                <input
                  type="text"
                  placeholder="وصف مختصر للمقرر"
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
                >
                  حفظ ونشر المادة
                </button>
              </div>
            </form>
          )}

          {/* Add Lecture Form with Device Upload or URL Link */}
          {showAddLecture && (
            <form onSubmit={handleCreateLecture} className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-cyan-400 flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span>إضافة محاضرة جديدة للمقرر</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    يمكنك رفع فيديو المحاضرة مباشرة من جهازك أو وضع رابط (YouTube / رابط مباشر).
                  </p>
                </div>

                {/* Source Mode Toggle Switcher */}
                <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setLectureSourceMode('upload');
                      setUploadError('');
                    }}
                    className={`py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      lectureSourceMode === 'upload'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>رفع من الجهاز</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLectureSourceMode('link');
                      setUploadError('');
                    }}
                    className={`py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      lectureSourceMode === 'link'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>رابط خارجي</span>
                  </button>
                </div>
              </div>

              {/* Course Selection & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">اختر المقرر الدراسي:</label>
                  <select
                    value={selectedCourseForLec}
                    onChange={(e) => setSelectedCourseForLec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:border-cyan-500 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (الفرقة {c.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">عنوان المحاضرة:</label>
                  <input
                    type="text"
                    placeholder="مثال: Lecture 4: Reservoir Fluid Saturation & Archie Law"
                    value={newLectureTitle}
                    onChange={(e) => setNewLectureTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Upload from Device Section */}
              {lectureSourceMode === 'upload' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>ملف الفيديو من جهازك:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">الصيغ المدعومة: MP4, WebM, MOV, MKV</span>
                  </div>

                  {!selectedVideoFile ? (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-400/60 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        اضغط هنا لاختيار ملف الفيديو من جهازك أو اسحبه إلى هنا
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        سيتم قراءة مدة الفيديو وتفاصيله تلقائياً
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleVideoFileSelected(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-100 max-w-sm truncate">
                              {selectedVideoFile.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>الحجم: {videoFileSize}</span>
                              <span>·</span>
                              <span className="text-cyan-400">المدة المحسوبة: {newLectureDuration}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoEditorModal({
                                courseId: selectedCourseForLec || (courses[0]?.id ?? ''),
                                courseTitle: newLectureTitle || 'المحاضرة الجديدة',
                                lecture: {
                                  id: 'temp-new-lec',
                                  courseId: selectedCourseForLec || (courses[0]?.id ?? ''),
                                  title: newLectureTitle || selectedVideoFile.name,
                                  duration: newLectureDuration,
                                  description: newLectureDesc,
                                  videoUrl: videoFilePreview,
                                  fileName: selectedVideoFile.name,
                                  fileSize: videoFileSize,
                                  clipStart: newLectureClipStart,
                                  clipEnd: newLectureClipEnd,
                                  aspectRatio: newLectureAspectRatio,
                                  videoDimensions: {
                                    aspectRatio: newLectureAspectRatio,
                                    scaleMode: newLectureScaleMode,
                                    zoom: newLectureZoom,
                                  },
                                  order: 1,
                                },
                              });
                            }}
                            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                          >
                            <Scissors className="w-3.5 h-3.5 text-amber-400" />
                            <span>قص وتعديل الحجم ✂️</span>
                          </button>
                          <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                            <span>تغيير الملف</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleVideoFileSelected(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVideoFile(null);
                              setVideoFilePreview('');
                              setVideoFileSize('');
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="إلغاء الملف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {(newLectureClipStart !== undefined || newLectureClipEnd !== undefined) && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            تم قص واقتطاع المقطع بنجاح: يبدأ من {Math.floor(newLectureClipStart || 0)} ثانية حتى {Math.floor(newLectureClipEnd || 0)} ثانية
                          </span>
                        </div>
                      )}

                      {/* Video Preview */}
                      {videoFilePreview && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 block">معاينة الفيديو المختار:</span>
                          <div className="rounded-xl overflow-hidden bg-black border border-slate-800 max-h-52 aspect-video flex items-center justify-center">
                            <video
                              src={videoFilePreview}
                              controls
                              className="w-full h-full max-h-52 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Link Input Section */}
              {lectureSourceMode === 'link' && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>رابط الفيديو أو المحاضرة عبر الويب:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">YouTube, Vimeo, Google Drive, MP4 Direct</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... أو https://example.com/video.mp4"
                    value={newLectureVideo}
                    onChange={(e) => setNewLectureVideo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-left font-mono text-xs focus:border-amber-500 focus:outline-none"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-500">
                    💡 يمكنك وضع رابط يوتيوب العادي (Watch) أو رابط التضمين (Embed)، وسيتكفل المشغل بتشغيله تلقائياً.
                  </p>
                </div>
              )}

              {/* Duration & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">مدة المحاضرة:</label>
                  <input
                    type="text"
                    placeholder="مثال: 45 دقيقة"
                    value={newLectureDuration}
                    onChange={(e) => setNewLectureDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-semibold block">شرح ونقاط المحاضرة الأساسية:</label>
                  <input
                    type="text"
                    placeholder="نبذة عن موضوعات ومحاور المحاضرة الهندسية والجيولوجية"
                    value={newLectureDesc}
                    onChange={(e) => setNewLectureDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* PDF Slides & Attachment Section */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-rose-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                      PDF
                    </div>
                    <span className="text-xs font-bold text-rose-300">
                      ملف السلايدات أو الملخص للمحاضرة (PDF):
                    </span>
                  </div>

                  <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPdfMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        pdfMode === 'upload'
                          ? 'bg-rose-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      رفع PDF من الجهاز
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfMode('link')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        pdfMode === 'link'
                          ? 'bg-rose-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      رابط PDF
                    </button>
                  </div>
                </div>

                {pdfMode === 'upload' ? (
                  !selectedPdfFile ? (
                    <label className="flex items-center justify-between p-4 border border-dashed border-slate-700 hover:border-rose-400/60 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            اضغط لاختيار ملف PDF من جهازك (اختياري)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            سلايدات الشرح، المذكرات، أو شيتات التمارين
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
                        تصفح الملفات
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSelectedPdfFile(file);
                            setPdfFileSize(formatBytes(file.size));
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 max-w-sm truncate">
                            {selectedPdfFile.name}
                          </div>
                          <div className="text-[11px] text-rose-400">
                            حجم الملف: {pdfFileSize} · جاهز للرفع والإرفاق
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer">
                          <span>تغيير</span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setSelectedPdfFile(file);
                                setPdfFileSize(formatBytes(file.size));
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPdfFile(null);
                            setPdfFileSize('');
                          }}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="حذف الملف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <input
                    type="url"
                    placeholder="https://example.com/slides.pdf أو رابط Google Drive للملف"
                    value={newLecturePdfUrl}
                    onChange={(e) => setNewLecturePdfUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-left font-mono text-xs focus:border-rose-500 focus:outline-none"
                    dir="ltr"
                  />
                )}
              </div>

              {/* SECTION: LECTURE SECTION FIELD (خانة السكاشين والتطبيقات المعملية للمحاضرة) */}
              <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-purple-950/20 border-2 border-purple-500/40 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-purple-300 block">
                        خانة السكاشين والتطبيقات المعملية للمحاضرة (فيديو من الجهاز، صور، PDF)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        يمكنك إضافة وتنزيل سكشن عملي مع هذه المحاضرة مباشرة من هنا
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeSectionWithLecture(!includeSectionWithLecture)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      includeSectionWithLecture
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-500/30'
                    }`}
                  >
                    <span>{includeSectionWithLecture ? 'إلغاء السكشن ✕' : '+ تفعيل خانة إضافة سكشن'}</span>
                  </button>
                </div>

                {includeSectionWithLecture && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-semibold block">عنوان السكشن:</label>
                        <input
                          type="text"
                          placeholder="مثال: سكشن 1 - فحص المسامية والنفاذية معملياً"
                          value={lecSecTitle}
                          onChange={(e) => setLecSecTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-slate-100 text-right focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 font-semibold block">المعيد / القائم بالشرح:</label>
                        <input
                          type="text"
                          placeholder="مثال: م. أحمد عبد العزيز / معيد المادة"
                          value={lecSecInstructor}
                          onChange={(e) => setLecSecInstructor(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-slate-100 text-right focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-slate-300 font-semibold block">شرح وملاحظات السكشن والتكليفات:</label>
                      <input
                        type="text"
                        placeholder="نبذة عن تجارب السكشن، الأدوات المطلوبة، والتكليف العملي..."
                        value={lecSecDesc}
                        onChange={(e) => setLecSecDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-slate-100 text-right focus:outline-none"
                      />
                    </div>

                    {/* 1. فيديو السكشن من الجهاز أو رابط */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>فيديو السكشن:</span>
                        </span>
                        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setLecSecVideoMode('upload')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              lecSecVideoMode === 'upload' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                            }`}
                          >
                            من جهازي 💻
                          </button>
                          <button
                            type="button"
                            onClick={() => setLecSecVideoMode('link')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              lecSecVideoMode === 'link' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                            }`}
                          >
                            رابط 🔗
                          </button>
                        </div>
                      </div>

                      {lecSecVideoMode === 'upload' ? (
                        !selectedLecSecVideoFile ? (
                          <label className="border border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition-colors">
                            <UploadCloud className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-slate-200">اختر فيديو السكشن من جهازك</span>
                            <span className="text-[10px] text-slate-500">(MP4, WebM, MOV)</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/quicktime"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setSelectedLecSecVideoFile(file);
                                  setLecSecVideoSize(formatBytes(file.size));
                                  if (!lecSecTitle) {
                                    setLecSecTitle(`سكشن: ${file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}`);
                                  }
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-cyan-500/30">
                            <div className="flex items-center gap-2 text-xs truncate">
                              <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-slate-200 truncate font-semibold">{selectedLecSecVideoFile.name}</span>
                              <span className="text-cyan-400 text-[10px] shrink-0">({lecSecVideoSize})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLecSecVideoFile(null);
                                setLecSecVideoSize('');
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) : (
                        <input
                          type="url"
                          placeholder="رابط يوتيوب أو Google Drive لفيديو السكشن"
                          value={lecSecVideoUrl}
                          onChange={(e) => setLecSecVideoUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                          dir="ltr"
                        />
                      )}
                    </div>

                    {/* 2. صور السكشن من الجهاز */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>صور السكشن من جهازك (عينات، شرائح، رسومات):</span>
                        </span>
                        <label className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition-colors">
                          <FileUp className="w-3 h-3" />
                          <span>+ اختيار صور من جهازي</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach((f) => {
                                  if (f.type.startsWith('image/')) {
                                    setSelectedLecSecImages((prev) => [
                                      ...prev,
                                      {
                                        id: `secimg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                        file: f,
                                        preview: URL.createObjectURL(f),
                                        caption: '',
                                        name: f.name,
                                        size: formatBytes(f.size),
                                      },
                                    ]);
                                  }
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {selectedLecSecImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {selectedLecSecImages.map((img) => (
                            <div key={img.id} className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 p-1.5 space-y-1">
                              <div className="relative aspect-video rounded overflow-hidden bg-black">
                                <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setSelectedLecSecImages((prev) => prev.filter((i) => i.id !== img.id))}
                                  className="absolute top-1 right-1 p-0.5 rounded bg-rose-950/80 text-rose-300 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="وصف الصورة..."
                                value={img.caption}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedLecSecImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, caption: val } : i)));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. شيت أو ملزمة السكشن PDF */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>شيت أو ملزمة السكشن PDF:</span>
                        </span>
                        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setLecSecPdfMode('upload')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              lecSecPdfMode === 'upload' ? 'bg-rose-500 text-slate-950' : 'text-slate-400'
                            }`}
                          >
                            من جهازي 📄
                          </button>
                          <button
                            type="button"
                            onClick={() => setLecSecPdfMode('link')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              lecSecPdfMode === 'link' ? 'bg-rose-500 text-slate-950' : 'text-slate-400'
                            }`}
                          >
                            رابط 🔗
                          </button>
                        </div>
                      </div>

                      {lecSecPdfMode === 'upload' ? (
                        !selectedLecSecPdfFile ? (
                          <label className="border border-dashed border-slate-700 hover:border-rose-400 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition-colors">
                            <FileText className="w-4 h-4 text-rose-400" />
                            <span className="text-xs font-bold text-slate-200">اختر ملف PDF للسكشن</span>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setSelectedLecSecPdfFile(file);
                                  setLecSecPdfSize(formatBytes(file.size));
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-rose-500/30">
                            <div className="flex items-center gap-2 text-xs truncate">
                              <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                              <span className="text-slate-200 truncate font-semibold">{selectedLecSecPdfFile.name}</span>
                              <span className="text-rose-400 text-[10px] shrink-0">({lecSecPdfSize})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLecSecPdfFile(null);
                                setLecSecPdfSize('');
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) : (
                        <input
                          type="url"
                          placeholder="رابط ملف PDF للسكشن"
                          value={lecSecPdfUrl}
                          onChange={(e) => setLecSecPdfUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                          dir="ltr"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar if Uploading */}
              {isUploadingFile && (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>جاري رفع ملف المحاضرة ومعالجته على الخادم...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Free Trial Toggle Option for this Lecture (Requested by user) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-emerald-400">
                      محاضرة تجريبية مجانية 🎁 (Free Trial Lecture):
                    </span>
                    {newLectureIsFree ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        مفتوحة مجاناً للمعاينة 🟢
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        مدفوعة باشتراك 🔒
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    عند التفعيل، يستطيع أي طالب مشاهدة فيديو المحاضرة وتحميل ملخص الـ PDF مجاناً لتجربة الشرح حتى لو كانت المنصة بنظام الاشتراك المدفوع.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNewLectureIsFree(!newLectureIsFree)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    newLectureIsFree
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {newLectureIsFree ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      <span>مفعلة مجاناً للمعاينة 🎁</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                      <span>محاضرة مدفوعة 🔒</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetLectureForm}
                  disabled={loading || isUploadingFile}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || isUploadingFile}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري رفع المحاضرة...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>إضافة المحاضرة للمقرر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Courses List */}
          {courses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">لا توجد مقررات دراسية مسجلة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                تم تفريغ كافة المواد بنجاح. يمكنك الآن إضافة مواد ومحاضرات حقيقية عبر الزر أعلاه، أو استعادة المقررات التجريبية في أي وقت.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  إضافة مادة جديدة
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDemoCourses}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                >
                  استعادة المقررات النموذجية
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((c) => {
                const isExpanded = expandedCourseIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 transition-all hover:border-slate-700 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded">
                            الفرقة {c.year}
                          </span>
                          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                          {c.category && (
                            <span className="text-xs text-slate-400">· {c.category}</span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-100">{c.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>أستاذ المقرر: <span className="text-slate-300">{c.instructor || 'قسم الجيولوجيا'}</span></span>
                          <span>·</span>
                          <span className="text-amber-400/90 font-medium">
                            {c.lectures?.length || 0} محاضرة مسجلة
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Expand lectures button */}
                        <button
                          type="button"
                          onClick={() => toggleExpandCourse(c.id)}
                          className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
                        >
                          <span>المحاضرات ({c.lectures?.length || 0})</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Delete Course Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          className="px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="حذف هذه المادة وجميع محاضراتها"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف المادة</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Lectures Accordion */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                          <span className="font-semibold text-slate-300">قائمة محاضرات هذا المقرر:</span>
                          <span className="text-[11px]">يمكنك حذف أي محاضرة بشكل منفرد بالضغط على أيقونة الحذف</span>
                        </div>

                        {(!c.lectures || c.lectures.length === 0) ? (
                          <p className="text-xs text-slate-500 italic py-2">لا توجد محاضرات مضافة لهذا المقرر بعد.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {c.lectures.map((lec, idx) => {
                              const isUpload = lec.sourceType === 'upload' || lec.videoUrl?.startsWith('/uploads') || lec.videoUrl?.startsWith('blob:');
                              return (
                                <div
                                  key={lec.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-xs transition-colors gap-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="font-bold text-slate-200">{lec.title}</h5>
                                        {isUpload ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                                            <HardDrive className="w-3 h-3" />
                                            <span>فيديو من الجهاز</span>
                                            {lec.fileSize && <span>({lec.fileSize})</span>}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" />
                                            <span>رابط فيديو</span>
                                          </span>
                                        )}

                                        {lec.pdfUrl && (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            <span>PDF مرفق</span>
                                            {lec.pdfFileSize && <span>({lec.pdfFileSize})</span>}
                                          </span>
                                        )}

                                        {lec.sections && lec.sections.length > 0 ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-purple-400" />
                                            <span>{lec.sections.length} سكاشين</span>
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-800 flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            <span>بدون سكاشن</span>
                                          </span>
                                        )}

                                        {/* Free Trial Badge (Requested by user) */}
                                        {lec.isFree || (idx === 0 && platformSettings?.allowFirstLectureFree !== false && lec.isFree !== false) ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                            <Gift className="w-3 h-3 text-emerald-400" />
                                            <span>تجريبية مجانية 🎁</span>
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                            <Lock className="w-3 h-3 text-slate-400" />
                                            <span>مدفوعة 🔒</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span>المدة: {lec.duration}</span>
                                        {lec.fileName && <span>· الفيديو: {lec.fileName}</span>}
                                        {lec.pdfFileName && <span>· المستند: {lec.pdfFileName}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                                    {/* Quick Toggle Free / Paid Status Button (Requested by user) */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLectureFree(c.id, lec.id, lec.isFree ?? (idx === 0 && platformSettings?.allowFirstLectureFree !== false))}
                                      className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border text-[11px] font-bold ${
                                        lec.isFree || (idx === 0 && platformSettings?.allowFirstLectureFree !== false && lec.isFree !== false)
                                          ? 'text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                          : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                                      }`}
                                      title={
                                        lec.isFree || (idx === 0 && platformSettings?.allowFirstLectureFree !== false && lec.isFree !== false)
                                          ? 'اضغط لجعل هذه المحاضرة مدفوعة باشتراك'
                                          : 'اضغط لجعل هذه المحاضرة تجريبية مجانية لجميع الطلاب'
                                      }
                                    >
                                      {lec.isFree || (idx === 0 && platformSettings?.allowFirstLectureFree !== false && lec.isFree !== false) ? (
                                        <>
                                          <Gift className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>مجانية 🟢</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                                          <span>مدفوعة 🔒</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Manage Sections Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveSectionModalLecture({
                                          courseId: c.id,
                                          courseTitle: c.title,
                                          lecture: lec,
                                        });
                                        setNewSectionTitle('');
                                        setNewSectionInstructor('');
                                        setNewSectionDesc('');
                                        setSelectedSectionVideoFile(null);
                                        setSectionVideoPreview('');
                                        setSelectedSectionImages([]);
                                        setSelectedSectionPdfFile(null);
                                        setSectionError('');
                                        setSectionSuccess('');
                                      }}
                                      className="px-2.5 py-1 text-purple-300 hover:text-purple-200 hover:bg-purple-950/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-purple-500/30 bg-purple-500/10 font-bold"
                                      title="إدارة وإضافة سكاشن هذه المحاضرة (فيديو من الجهاز، صور، PDF)"
                                    >
                                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                                      <span className="text-[11px]">السكاشين ({lec.sections?.length || 0})</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveVideoEditorModal({
                                          courseId: c.id,
                                          courseTitle: c.title,
                                          lecture: lec,
                                        })
                                      }
                                      className="px-2.5 py-1 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-500/30 bg-amber-500/10 font-bold"
                                      title="قص واقتطاع المقطع وتعديل أبعاد وحجم الفيديو للمحاضرة"
                                    >
                                      <Scissors className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="text-[11px]">قص وتعديل الحجم ✂️</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setPreviewVideoModalUrl(lec.videoUrl)}
                                      className="px-2.5 py-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-cyan-500/20"
                                      title="معاينة وتشغيل الفيديو"
                                    >
                                      <Play className="w-3 h-3 fill-cyan-400" />
                                      <span className="text-[11px]">تشغيل</span>
                                    </button>

                                    {lec.pdfUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActivePdfModal({
                                            url: lec.pdfUrl!,
                                            title: lec.pdfFileName || `${lec.title} - ملخص وسلايدات المحاضرة`,
                                            fileSize: lec.pdfFileSize,
                                          })
                                        }
                                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-rose-500/20"
                                        title="فتح واستعراض ملف الـ PDF داخل المنصة"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span className="text-[11px]">معاينة PDF</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLecture(c.id, lec.id, lec.title)}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="حذف هذه المحاضرة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="text-[11px]">حذف</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sections Management Tab */}
      {activeAdminTab === 'sections' && (
        <SectionsTab
          courses={courses}
          secTabCourseId={secTabCourseId}
          setSecTabCourseId={setSecTabCourseId}
          secTabLectureId={secTabLectureId}
          setSecTabLectureId={setSecTabLectureId}
          onOpenSectionVideoEditor={(cId, cTitle, lec, sec) => {
            setActiveVideoEditorModal({
              courseId: cId,
              courseTitle: cTitle,
              lecture: lec,
              section: sec,
            });
          }}
          onOpenSectionModal={(cId, cTitle, lec) => {
            setActiveSectionModalLecture({
              courseId: cId,
              courseTitle: cTitle,
              lecture: lec,
            });
            setNewSectionTitle('');
            setNewSectionInstructor('');
            setNewSectionDesc('');
            setSelectedSectionVideoFile(null);
            setSectionVideoPreview('');
            setSelectedSectionImages([]);
            setSelectedSectionPdfFile(null);
            setSectionError('');
            setSectionSuccess('');
          }}
          onDeleteSection={handleDeleteSection}
          onPreviewVideo={(url) => setPreviewVideoModalUrl(url)}
          onPreviewImage={(url) => setPreviewImageModal({ url, title: 'معاينة صورة السكشن', caption: '' })}
          onPreviewPdf={(url, title, fileSize) => setActivePdfModal({ url, title, fileSize })}
          onSwitchToCoursesTab={() => setActiveAdminTab('courses')}
        />
      )}

      {/* 3. Exams Management Tab */}
      {activeAdminTab === 'exams' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-400" />
                <span>إدارة الامتحانات والكويزات (نظام متعدد الأسئلة)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إنشاء وتعديل الامتحانات بعدد الأسئلة الذي تحدده بحرية، مع خيارات الإجابة، الشرح النموذجي، وتفريغ الامتحانات التجريبية.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllExams}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تفريغ المنصة وحذف كافة الامتحانات والكويزات التجريبية لتجهيزها لمحتواك الخاص"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ وحذف كافة الامتحانات</span>
              </button>
              <button
                type="button"
                onClick={handleRestoreDemoExams}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="استعادة الامتحانات النموذجية التجريبية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الامتحانات النموذجية</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingExamId(null);
                  setNewExamTitle('');
                  setExamQuestions([
                    {
                      id: `q-${Date.now()}-1`,
                      text: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: '',
                    },
                  ]);
                  setShowAddExam(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء امتحان/كويز جديد</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Exam Form (Full Multi-Question Support) */}
          {showAddExam && (
            <form onSubmit={handleCreateOrUpdateExam} className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-6 text-xs shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-amber-400">
                      {editingExamId ? 'تعديل الامتحان والأسئلة الحالية' : 'إنشاء امتحان جديد وتحديد عدد الأسئلة'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      يمكنك كتابة أي عدد تريده من الأسئلة وتحديد الخيارات والإجابة الصحيحة لكل سؤال.
                    </p>
                  </div>
                </div>

                {editingExamId && (
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold self-start sm:self-center">
                    وضع التعديل النشط ✏️
                  </span>
                )}
              </div>

              {/* General Exam Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-300">عنوان الامتحان / الكويز: *</label>
                  <input
                    type="text"
                    placeholder="مثال: كويز البتروفيزياء الشامل - خواص الصخور"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">المادة المقررة:</label>
                  <select
                    value={newExamCourseId}
                    onChange={(e) => setNewExamCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:border-amber-500 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">الفرقة الدراسية:</label>
                  <select
                    value={newExamYear}
                    onChange={(e) => setNewExamYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:border-amber-500 focus:outline-none"
                  >
                    <option value="1">الفرقة الأولى (سنة 1)</option>
                    <option value="2">الفرقة الثانية (سنة 2)</option>
                    <option value="3">الفرقة الثالثة (سنة 3)</option>
                    <option value="4">الفرقة الرابعة (سنة 4)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">المدة بالدقائق:</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="المدة (15)"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">إجمالي الدرجة:</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="إجمالي الدرجة (20)"
                    value={newExamMarks}
                    onChange={(e) => setNewExamMarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-right focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Quick Question Generator Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300">مساعد الذكاء الاصطناعي لتوليد الأسئلة الأكاديمية (Gemini AI):</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يمكنك إدخال موضوع معين وتوليد 3 إلى 10 أسئلة تخصصية بضغطة واحدة وتعديلها كما تحب.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="موضوع التركيز (اختياري)..."
                    value={aiQuestionTopic}
                    onChange={(e) => setAiQuestionTopic(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 text-right text-xs w-44"
                  />
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-amber-400 font-bold text-xs"
                  >
                    <option value={3}>3 أسئلة</option>
                    <option value={5}>5 أسئلة</option>
                    <option value={8}>8 أسئلة</option>
                    <option value={10}>10 أسئلة</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAiGenerateQuestions}
                    disabled={isGeneratingAiQuestions}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAiQuestions ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التوليد...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>توليد الأسئلة فوراً ✨</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QUESTIONS LIST BUILDER (Multi-Question) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">
                      قائمة أسئلة الامتحان:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-xs">
                      {examQuestions.length} سؤال مضاف
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestionToDraft}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة سؤال جديد (+)</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {examQuestions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3.5 relative hover:border-slate-700 transition-colors shadow-inner"
                    >
                      {/* Question Top Header Bar */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="font-bold text-slate-200">
                            السؤال رقم {qIdx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(qIdx)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="تكرار السؤال"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {examQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromDraft(qIdx)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذا السؤال"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-300 text-xs block">نص السؤال: *</label>
                        <textarea
                          rows={2}
                          placeholder={`اكتب نص السؤال ${qIdx + 1} هنا...`}
                          value={q.text}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'text', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 text-right text-xs focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </div>

                      {/* 4 Choices */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-300 text-xs block">خيارات الإجابة (اختر الإجابة الصحيحة بالزر الأخضر):</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {['أ', 'ب', 'ج', 'د'].map((label, optIdx) => {
                            const isCorrect = q.correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestion(qIdx, 'correctAnswer', optIdx)}
                                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                  title={isCorrect ? 'هذه هي الإجابة الصحيحة ✓' : 'اضغط لجعلها الإجابة الصحيحة'}
                                >
                                  {label}
                                </button>

                                <input
                                  type="text"
                                  placeholder={`الخيار (${label})`}
                                  value={q.options[optIdx] || ''}
                                  onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                  className="w-full bg-transparent border-none text-slate-100 text-xs text-right focus:outline-none"
                                />

                                {isCorrect && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                                    صحيحة ✓
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question Explanation */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 text-[11px] block">الشرح والتفسير العلمي للحل النموذجي (يظهر للطالب بعد التسليم):</label>
                        <input
                          type="text"
                          placeholder="اكتب تفسير الإجابة الصحيحة أو القانون المستخدم..."
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 text-right text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Question Button */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleAddQuestionToDraft}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/40 font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-102 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال آخر إلى الامتحان (+ سؤال {examQuestions.length + 1})</span>
                  </button>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExam(false);
                    setEditingExamId(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-750 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? 'جاري الحفظ...'
                    : editingExamId
                    ? `حفظ التعديلات ونشر (${examQuestions.length} سؤال)`
                    : `نشر الامتحان للطلاب (${examQuestions.length} سؤال) 🚀`}
                </button>
              </div>
            </form>
          )}

          {/* Exams List */}
          <div className="space-y-3">
            {exams.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                لا توجد امتحانات مسجلة حالياً. يمكنك إنشاء امتحانك الأول وتحديد عدد الأسئلة من الزر أعلاه.
              </p>
            ) : (
              exams.map((ex) => {
                const isPreviewOpen = previewExamId === ex.id;
                return (
                  <div
                    key={ex.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            الفرقة {ex.year}
                          </span>
                          <span className="text-slate-300 font-bold">{ex.courseTitle}</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-100">{ex.title}</h4>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                        <span className="text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg font-bold border border-amber-500/20">
                          {ex.questions.length} أسئلة
                        </span>
                        <span className="text-slate-400 font-mono">{ex.durationMinutes} دقيقة</span>
                        <span className="font-bold text-emerald-400 font-mono">{ex.totalMarks} درجة</span>

                        {/* Preview questions toggle button */}
                        <button
                          type="button"
                          onClick={() => setPreviewExamId(isPreviewOpen ? null : ex.id)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                          title="معاينة أسئلة الامتحان"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isPreviewOpen ? 'إخفاء' : 'معاينة الأسئلة'}</span>
                        </button>

                        {/* Edit Exam button */}
                        <button
                          type="button"
                          onClick={() => handleStartEditExam(ex)}
                          className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                          title="تعديل الامتحان والأسئلة"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل الأسئلة</span>
                        </button>

                        {/* Delete Exam button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteExam(ex.id, ex.title)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="حذف الامتحان"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Questions Accordion */}
                    {isPreviewOpen && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>معاينة جميع أسئلة الامتحان ({ex.questions.length} أسئلة)</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            معدل الدرجة لكل سؤال: {(ex.totalMarks / (ex.questions.length || 1)).toFixed(1)} درجة
                          </span>
                        </div>

                        <div className="space-y-3">
                          {ex.questions.map((q, idx) => (
                            <div key={q.id || idx} className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-2 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                  {idx + 1}
                                </span>
                                <p className="font-bold text-slate-100 flex-1">{q.text}</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-7">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`px-2.5 py-1 rounded-md text-[11px] flex items-center justify-between ${
                                      q.correctAnswer === oIdx
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                        : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {q.correctAnswer === oIdx && <span className="text-emerald-400">✓ صحيحة</span>}
                                  </div>
                                ))}
                              </div>

                              {q.explanation && (
                                <p className="text-[11px] text-cyan-300/80 bg-cyan-950/30 p-2 rounded-md pr-7">
                                  💡 التفسير: {q.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. Announcements Management Tab */}
      {activeAdminTab === 'announcements' && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100">إدارة الإعلانات والتنبيهات الموجهة</h2>
              <p className="text-xs text-slate-400">نشر إعلانات عامة أو مخصصة لفرقة دراسية بعينها.</p>
            </div>
            <button
              onClick={() => setShowAddAnn(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان جديد</span>
            </button>
          </div>

          {showAddAnn && (
            <form onSubmit={handleCreateAnnouncement} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-amber-400">نشر إعلان جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="عنوان الإعلان"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                  required
                />
                <select
                  value={newAnnYear}
                  onChange={(e) => setNewAnnYear(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                >
                  <option value="all">إعلان عام لجميع الفرق</option>
                  <option value="1">الفرقة الأولى فقط</option>
                  <option value="2">الفرقة الثانية فقط</option>
                  <option value="3">الفرقة الثالثة فقط</option>
                  <option value="4">الفرقة الرابعة فقط</option>
                </select>
                <select
                  value={newAnnPriority}
                  onChange={(e) => setNewAnnPriority(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-right"
                >
                  <option value="normal">عادي</option>
                  <option value="important">تنبيه هام</option>
                  <option value="urgent">عاجل جداً</option>
                </select>
                <textarea
                  placeholder="نص وتفاصيل الإعلان..."
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-right"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnn(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold cursor-pointer"
                >
                  نشر الإعلان الآن
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">لا توجد إعلانات منشورة حالياً.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4 text-xs hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {ann.targetYear === 'all' ? 'عام' : `سنة ${ann.targetYear}`}
                      </span>
                      <span className="text-slate-400 font-semibold">{ann.author}</span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">{ann.title}</h4>
                    <p className="text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. InstaPay Payments & Platform Settings Tab */}
      {activeAdminTab === 'payments' && (
        <AdminPaymentsTab
          onPreviewImage={(url) =>
            setPreviewImageModal({
              url,
              title: 'معاينة إشعار التحويل من InstaPay',
              caption: 'إيصال سداد رسوم الاشتراك',
            })
          }
        />
      )}

      {/* 6. Supabase Cloud Database Tab */}
      {activeAdminTab === 'supabase' && (
        <AdminSupabaseTab />
      )}

      {/* Lecture Sections Manager Modal */}
      {activeSectionModalLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-right"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>سكاشن وتطبيقات المحاضرة:</span>
                    <span className="text-purple-400 font-extrabold">{activeSectionModalLecture.lecture.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    مقرر: {activeSectionModalLecture.courseTitle} · إضافة فيديوهات من الجهاز، صور العينات والمعمل، وملفات PDF
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSectionModalLecture(null);
                  setSectionError('');
                  setSectionSuccess('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Status Notifications */}
              {sectionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{sectionSuccess}</span>
                </div>
              )}

              {sectionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sectionError}</span>
                </div>
              )}

              {/* 1. Existing Sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>السكاشن والتطبيقات المضافة ({activeSectionModalLecture.lecture.sections?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    يمكن للطلاب مشاهدة هذه السكاشن في تبويب "المحاضرة والسكشن"
                  </span>
                </div>

                {(!activeSectionModalLecture.lecture.sections || activeSectionModalLecture.lecture.sections.length === 0) ? (
                  <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-semibold">لا توجد سكاشن مضافة لهذه المحاضرة حتى الآن.</p>
                    <p className="text-[11px] text-slate-500">استخدم النموذج أدناه لإضافة سكشن جديد (فيديو، صور، أو PDF).</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSectionModalLecture.lecture.sections.map((sec, secIdx) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/20 hover:border-purple-500/40 space-y-3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                سكشن {secIdx + 1}
                              </span>
                              <h5 className="font-bold text-slate-100 text-sm">{sec.title}</h5>
                              {sec.instructor && (
                                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  القائم بالشرح: {sec.instructor}
                                </span>
                              )}
                            </div>
                            {sec.description && (
                              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                                {sec.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSection(
                                activeSectionModalLecture.courseId,
                                activeSectionModalLecture.lecture.id,
                                sec.id,
                                sec.title
                              )
                            }
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="حذف هذا السكشن"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Media Items in this Section */}
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
                          {/* Video */}
                          {sec.videoUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewVideoModalUrl(sec.videoUrl!)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 fill-cyan-400" />
                                <span>مشاهدة فيديو السكشن</span>
                                {sec.videoFileSize && <span className="text-[10px] text-cyan-300">({sec.videoFileSize})</span>}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveVideoEditorModal({
                                    courseId: activeSectionModalLecture.courseId,
                                    courseTitle: activeSectionModalLecture.courseTitle,
                                    lecture: activeSectionModalLecture.lecture,
                                    section: sec,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                                title="قص وتعديل أبعاد فيديو السكشن"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                                <span>قص وتعديل الفيديو ✂️</span>
                              </button>
                            </>
                          )}

                          {/* PDF */}
                          {sec.pdfUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setActivePdfModal({
                                  url: sec.pdfUrl!,
                                  title: sec.pdfFileName || `${sec.title} - شيت السكشن`,
                                  fileSize: sec.pdfFileSize,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>فتح الـ PDF بالمنصة</span>
                              {sec.pdfFileSize && <span className="text-[10px] text-rose-300">({sec.pdfFileSize})</span>}
                            </button>
                          )}

                          {/* Images Count */}
                          {sec.images && sec.images.length > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{sec.images.length} صور مرفقة</span>
                            </span>
                          )}
                        </div>

                        {/* Images Gallery Preview */}
                        {sec.images && sec.images.length > 0 && (
                          <div className="pt-2">
                            <p className="text-[11px] text-slate-400 mb-1.5 font-medium">صور السكشن والعينات (انقر للتكبير):</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {sec.images.map((img) => (
                                <div
                                  key={img.id}
                                  onClick={() =>
                                    setPreviewImageModal({
                                      url: img.url,
                                      caption: img.caption || img.name,
                                      title: sec.title,
                                    })
                                  }
                                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/60 cursor-pointer shadow-xs transition-all"
                                  title={img.caption || img.name || 'معاينة الصورة'}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.caption || 'Section preview'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="w-4 h-4 text-amber-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Add New Section Form */}
              <form
                onSubmit={handleCreateSection}
                className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-5 shadow-lg shadow-purple-500/5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span>إضافة سكشن جديد لهذه المحاضرة</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    يمكنك رفع فيديو من الجهاز أو رابط، صور عينات، وملفات PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Section Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>عنوان السكشن</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: سكشن 1 - فحص المسامية والنفاذية معملياً"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Section Instructor / TA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      القائم بالشرح / المعيد (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: م. أحمد عبد العزيز / معيد المادة"
                      value={newSectionInstructor}
                      onChange={(e) => setNewSectionInstructor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Section Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    شرح السكشن وتفاصيل التجارب العملية والتكليفات
                  </label>
                  <textarea
                    rows={2}
                    placeholder="اكتب شرحاً مختصراً لأهداف السكشن، الأدوات المعملية المطلوبة، والتكليف المطلوب تسليمه..."
                    value={newSectionDesc}
                    onChange={(e) => setNewSectionDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* SECTION VIDEO: UPLOAD FROM COMPUTER OR LINK */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-cyan-400" />
                      <span>فيديو السكشن (اختياري)</span>
                    </label>
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setNewSectionVideoMode('upload')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          newSectionVideoMode === 'upload'
                            ? 'bg-cyan-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        رفع من جهازي 💻
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSectionVideoMode('link')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          newSectionVideoMode === 'link'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        رابط يوتيوب/درايف 🔗
                      </button>
                    </div>
                  </div>

                  {newSectionVideoMode === 'upload' ? (
                    <div>
                      {!selectedSectionVideoFile ? (
                        <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-cyan-950/20 transition-all text-center">
                          <UploadCloud className="w-7 h-7 text-cyan-400" />
                          <div className="text-xs font-bold text-slate-200">اختر فيديو السكشن من جهازك</div>
                          <div className="text-[10px] text-slate-500">يدعم صيغ MP4, WebM, MOV من الكمبيوتر مباشرة</div>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleSectionVideoSelected(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      ) : (
                        <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Film className="w-5 h-5 text-cyan-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-200 truncate">{selectedSectionVideoFile.name}</p>
                              <p className="text-[10px] text-cyan-400">{sectionVideoSize}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSectionVideoFile(null);
                              setSectionVideoPreview('');
                              setSectionVideoSize('');
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="إلغاء الفيديو"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... أو رابط فيديو Google Drive"
                      value={newSectionVideoUrl}
                      onChange={(e) => setNewSectionVideoUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-left font-mono text-xs focus:border-amber-500 focus:outline-none"
                      dir="ltr"
                    />
                  )}
                </div>

                {/* SECTION IMAGES: UPLOAD MULTIPLE PHOTOS FROM DEVICE */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>صور السكشن من جهازك (عينات، شرائح مجهرية، رسومات بيانية)</span>
                    </label>
                    <label className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                      <FileUp className="w-3.5 h-3.5" />
                      <span>+ اختيار صور من جهازي</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleSectionImagesSelected(e.target.files)}
                      />
                    </label>
                  </div>

                  {selectedSectionImages.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedSectionImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 space-y-1.5 group"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeSectionImage(img.id)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer"
                                title="حذف الصورة"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 truncate">
                              <span className="truncate">{img.name}</span>
                              <span className="shrink-0">{img.size}</span>
                            </div>
                            <input
                              type="text"
                              placeholder="وصف أو تسمية توضيحية..."
                              value={img.caption}
                              onChange={(e) => updateSectionImageCaption(img.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-200 px-2 py-1 rounded-md focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        تم اختيار {selectedSectionImages.length} صورة وسيتم رفعها وتثبيتها مع السكشن.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      لم يتم اختيار صور بعد. يمكنك إضافة صور للعينات الصخرية، الشرائح الميكروسكوبية، أو جداول المعمل.
                    </p>
                  )}
                </div>

                {/* SECTION PDF: UPLOAD FROM COMPUTER OR LINK */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>شيت أو ملزمة السكشن PDF (اختياري)</span>
                    </label>
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setNewSectionPdfMode('upload')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          newSectionPdfMode === 'upload'
                            ? 'bg-rose-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        رفع PDF من جهازي 📄
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSectionPdfMode('link')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          newSectionPdfMode === 'link'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        رابط PDF خارجي 🔗
                      </button>
                    </div>
                  </div>

                  {newSectionPdfMode === 'upload' ? (
                    <div>
                      {!selectedSectionPdfFile ? (
                        <label className="border border-dashed border-slate-700 hover:border-rose-500/80 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-rose-950/20 transition-all text-center">
                          <FileText className="w-5 h-5 text-rose-400" />
                          <span className="text-xs font-bold text-slate-200">اختر ملف PDF من جهازك</span>
                          <span className="text-[10px] text-slate-500">(شيت السكشن، كراسة التجارب)</span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleSectionPdfSelected(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      ) : (
                        <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-200 truncate">{selectedSectionPdfFile.name}</p>
                              <p className="text-[10px] text-rose-400">{sectionPdfSize}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSectionPdfFile(null);
                              setSectionPdfSize('');
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="إلغاء الملف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://example.com/sheet.pdf أو رابط Google Drive"
                      value={newSectionPdfUrl}
                      onChange={(e) => setNewSectionPdfUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-left font-mono text-xs focus:border-rose-500 focus:outline-none"
                      dir="ltr"
                    />
                  )}
                </div>

                {/* Upload Progress Bar if Uploading */}
                {isSectionUploading && (
                  <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>جاري رفع ملفات وفيديو وصور السكشن إلى المنصة...</span>
                      </span>
                      <span>{sectionUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 transition-all duration-300 rounded-full"
                        style={{ width: `${sectionUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={isSectionUploading}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSectionUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ والرفع...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>حفظ وإضافة السكشن للمحاضرة</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-3 flex flex-col space-y-2 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 truncate">
                {previewImageModal.title || 'معاينة صورة السكشن'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[75vh] flex items-center justify-center bg-black/60 rounded-xl overflow-hidden">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.caption || 'Section preview'}
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>

            {previewImageModal.caption && (
              <p className="text-xs text-slate-300 px-2 py-1 bg-slate-950 rounded-lg">
                {previewImageModal.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Play className="w-4 h-4 fill-cyan-400" />
                <span>معاينة مشغل المحاضرة</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideoModalUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {previewVideoModalUrl.includes('youtube.com') || previewVideoModalUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    previewVideoModalUrl.includes('watch?v=')
                      ? previewVideoModalUrl.replace('watch?v=', 'embed/').split('&')[0]
                      : previewVideoModalUrl.includes('youtu.be/')
                      ? `https://www.youtube.com/embed/${previewVideoModalUrl.split('youtu.be/')[1].split('?')[0]}`
                      : previewVideoModalUrl
                  }
                  title="Video Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideoModalUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-Platform PDF Modal */}
      {activePdfModal && (
        <PdfModalViewer
          isOpen={!!activePdfModal}
          onClose={() => setActivePdfModal(null)}
          url={activePdfModal.url}
          title={activePdfModal.title}
          fileSize={activePdfModal.fileSize}
        />
      )}

      {/* Video Editor & Trimmer Studio Modal */}
      {activeVideoEditorModal && (
        <VideoEditorModal
          isOpen={Boolean(activeVideoEditorModal)}
          onClose={() => setActiveVideoEditorModal(null)}
          videoUrl={activeVideoEditorModal.section ? (activeVideoEditorModal.section.videoUrl || '') : activeVideoEditorModal.lecture.videoUrl}
          videoTitle={
            activeVideoEditorModal.section
              ? `${activeVideoEditorModal.courseTitle} - سكشن: ${activeVideoEditorModal.section.title}`
              : `${activeVideoEditorModal.courseTitle} - ${activeVideoEditorModal.lecture.title}`
          }
          initialClipStart={
            activeVideoEditorModal.section
              ? (activeVideoEditorModal.section.clipStart || 0)
              : (activeVideoEditorModal.lecture.clipStart || 0)
          }
          initialClipEnd={
            activeVideoEditorModal.section
              ? activeVideoEditorModal.section.clipEnd
              : activeVideoEditorModal.lecture.clipEnd
          }
          initialAspectRatio={
            activeVideoEditorModal.section
              ? (activeVideoEditorModal.section.aspectRatio || '16/9')
              : (activeVideoEditorModal.lecture.aspectRatio || '16/9')
          }
          initialScaleMode={
            activeVideoEditorModal.section
              ? (activeVideoEditorModal.section.videoDimensions?.scaleMode || 'contain')
              : (activeVideoEditorModal.lecture.videoDimensions?.scaleMode || 'contain')
          }
          onSave={handleSaveVideoEdits}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
