export type AcademicYear = 1 | 2 | 3 | 4;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  year: AcademicYear;
  department: string;
  role: 'student' | 'doctor' | 'admin';
  avatar?: string;
  password?: string;
  createdAt: string;
  subscriptionStatus?: 'none' | 'pending' | 'active' | 'rejected';
  subscriptionExpiresAt?: string;
  currentDeviceId?: string;
  currentDeviceName?: string;
  boundDeviceId?: string;
  boundDeviceName?: string;
  boundAt?: string;
  activeSessionToken?: string;
  lastLoginAt?: string;
  adminTitle?: string;
  isPrimaryAdmin?: boolean;
}

export type PlatformBrand = 'petrogeo' | 'new_platform';

export interface CustomBrandSettings {
  name: string;
  shortName: string;
  tagline: string;
  subTitle: string;
  englishTitle: string;
  badge: string;
  icon: string;
  primaryColor: string;
  defaultDepartments: string[];
}

export interface PlatformSettings {
  brand?: PlatformBrand;
  platformName?: string;
  customBrand?: CustomBrandSettings;
  isPaidMode: boolean; // false = free, true = paid
  allowFirstLectureFree?: boolean; // true = first lecture of each course is free trial
  strictSingleDevice?: boolean; // enforce single active device per student
  subscriptionPrice: number; // in EGP
  instapayNumber: string; // admin phone for InstaPay
  instapayAccountName: string; // account name
  instapayUsername?: string; // IPA username
  subscriptionDuration: string; // e.g. "فصل دراسي كامل"
  paymentInstructions: string;
  protectPdfsFromDownload?: boolean; // true = prevent students from downloading PDFs to their device
  preventScreenRecording?: boolean; // true = anti-screen recording, moving dynamic watermark & blur on window focus loss
  updatedAt?: string;
}

export interface PaymentRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentYear: AcademicYear;
  studentDepartment: string;
  amount: number;
  senderPhone: string;
  referenceNumber?: string;
  receiptImageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SectionImage {
  id: string;
  url: string;
  caption?: string;
  name?: string;
  size?: string;
}

export interface LectureSection {
  id: string;
  lectureId?: string;
  title: string;
  instructor?: string;
  description?: string;
  videoUrl?: string;
  videoFileName?: string;
  videoFileSize?: string;
  videoSourceType?: 'upload' | 'link';
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  images?: SectionImage[];
  notes?: string;
  order?: number;
  clipStart?: number;
  clipEnd?: number;
  aspectRatio?: string;
  videoDimensions?: {
    aspectRatio?: string;
    scaleMode?: 'contain' | 'cover' | 'fill';
    zoom?: number;
    customWidth?: number;
    customHeight?: number;
    playbackSpeed?: number;
  };
  duration?: string;
  createdAt?: string;
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  description: string;
  videoUrl: string;
  clipStart?: number; // Video trim start time in seconds
  clipEnd?: number; // Video trim end time in seconds
  aspectRatio?: string; // e.g. '16/9', '4/3', '21/9', 'cover', 'contain'
  videoDimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    scaleMode?: 'contain' | 'cover' | 'fill';
    zoom?: number;
  };
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  sectionNotes?: string;
  sections?: LectureSection[];
  order: number;
  sourceType?: 'link' | 'upload';
  fileName?: string;
  fileSize?: string;
  isFree?: boolean; // true = free trial preview lecture even if platform is paid
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  year: AcademicYear;
  category: string;
  thumbnail?: string;
  instructor: string;
  totalLectures: number;
  lectures: Lecture[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  year: AcademicYear;
  type: 'quiz' | 'midterm' | 'final';
  durationMinutes: number;
  totalMarks: number;
  questions: Question[];
  isPublished: boolean;
  dueDate?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  completedAt: string;
  answers: Record<string, number>;
}

export interface StudentProgress {
  studentId: string;
  completedLectureIds: string[];
  courseProgress: Record<string, number>; // courseId -> percentage
  overallPercentage: number;
  lastActiveLectureId?: string;
  lastActiveCourseId?: string;
  lastActiveTimestamp?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetYear: 'all' | AcademicYear;
  priority: 'normal' | 'important' | 'urgent';
  author: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  year: AcademicYear;
  day: string;
  time: string;
  subject: string;
  type: 'محاضرة' | 'سكشن' | 'امتحان' | 'تدريب';
  location: string;
  instructor: string;
}
