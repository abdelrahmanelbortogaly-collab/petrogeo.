import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  CheckCircle,
  FileText,
  Download,
  BookOpen,
  ChevronRight,
  Bot,
  HelpCircle,
  Clock,
  Sparkles,
  Share2,
  Trash2,
  Network,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calculator,
  Compass,
  HardDrive,
  Link as LinkIcon,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  X,
  Eye,
  Lock,
  CreditCard,
  Gift,
  Languages,
  Globe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Course, Lecture, LectureSection, StudentProgress, User, PlatformSettings } from '../types';
import { ConfirmModal } from './ConfirmModal.tsx';
import { PdfViewer, downloadPdfFile } from './PdfViewer.tsx';
import { PdfModalViewer } from './PdfModalViewer.tsx';
import { InstaPayModal } from './InstaPayModal.tsx';
import { PdfPageSummary } from './PdfPageSummary.tsx';
import { InteractiveMindMap } from './InteractiveMindMap.tsx';
import {
  getDefaultArabicLectureSummary,
  getArabicMindMapBranchesForLecture,
  getArabicQuizForLecture,
  getKeyTakeawaysForLecture,
  KeyTakeawayPoint,
  translateTextWithAI,
} from '../utils/lectureTranslations.ts';

interface LectureViewProps {
  course: Course;
  currentLectureId?: string;
  progress: StudentProgress;
  user: User;
  onToggleComplete: (lectureId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onAskAi: (prompt: string) => void;
  onBackToCourses: () => void;
  onDeleteLecture?: (courseId: string, lectureId: string) => void;
}

export const LectureView: React.FC<LectureViewProps> = ({
  course,
  currentLectureId,
  progress,
  user,
  onToggleComplete,
  onSelectLecture,
  onAskAi,
  onBackToCourses,
  onDeleteLecture,
}) => {
  const lectures = course.lectures || [];
  const activeLecture =
    lectures.find((l) => l.id === currentLectureId) || lectures[0];

  const isCompleted = progress.completedLectureIds?.includes(activeLecture?.id || '');
  const [activeTab, setActiveTab] = useState<'summary' | 'mindmap' | 'quiz' | 'notes' | 'pdf'>('summary');
  const [copiedLink, setCopiedLink] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayingSectionId, setActivePlayingSectionId] = useState<string | null>(null);
  const [activePdfModal, setActivePdfModal] = useState<{ url: string; title?: string; fileSize?: string } | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; caption?: string; title?: string } | null>(null);

  // Platform Paid Mode & InstaPay state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [showInstaPayModal, setShowInstaPayModal] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    fetch('/api/platform-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPlatformSettings(data);
      })
      .catch(() => {});
  }, []);

  // Free trial calculations (Requested by user: allow first lecture or marked lectures to be free)
  const isFirstLecture = Boolean(
    activeLecture && (activeLecture.order === 1 || lectures[0]?.id === activeLecture.id)
  );
  const isFreeTrial = Boolean(
    activeLecture &&
      (activeLecture.isFree === true ||
        (platformSettings?.allowFirstLectureFree !== false && isFirstLecture && activeLecture.isFree !== false))
  );
  const isPaywallLocked = Boolean(
    platformSettings?.isPaidMode && user.role !== 'admin' && user.subscriptionStatus !== 'active' && !isFreeTrial
  );

  const handleToggleCurrentLectureFree = async () => {
    if (!activeLecture) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/lectures/${activeLecture.id}/toggle-free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFree: !isFreeTrial }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lecture) {
          activeLecture.isFree = data.lecture.isFree;
        }
        setPlatformSettings((prev) => (prev ? { ...prev } : prev));
      }
    } catch (e) {
      console.error('Failed to toggle lecture free:', e);
    }
  };

  // ------------------- ANTI-SCREEN RECORDING & CONTENT SECURITY -------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [watermarkPos, setWatermarkPos] = useState({ top: 35, left: 45 });
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [screenCaptureAlert, setScreenCaptureAlert] = useState<string | null>(null);

  const isAntiScreenRecordingActive = Boolean(
    platformSettings?.preventScreenRecording !== false && user.role !== 'admin'
  );

  // Periodically randomize dynamic watermark coordinates across the video frame
  useEffect(() => {
    if (!isAntiScreenRecordingActive || !isPlaying) return;
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 55) + 20; // 20% to 75%
      const left = Math.floor(Math.random() * 60) + 20; // 20% to 80%
      setWatermarkPos({ top, left });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAntiScreenRecordingActive, isPlaying]);

  // Window blur / Tab switch / external recording tool detector
  useEffect(() => {
    if (!isAntiScreenRecordingActive) return;

    const handleBlur = () => {
      if (isPlaying) {
        setIsWindowBlurred(true);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && isPlaying) {
        setIsWindowBlurred(true);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAntiScreenRecordingActive, isPlaying]);

  // Screen recording & DevTools shortcuts interceptor (PrintScreen, Snipping tool, DevTools)
  useEffect(() => {
    if (!isAntiScreenRecordingActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setScreenCaptureAlert('تم استشعار محاولة التقاط الشاشة عبر مفتاح (PrintScreen)! تم إيقاف المحاضرة لحماية حقوق النشر.');
        if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
        try {
          navigator.clipboard?.writeText('⚠️ محتوى المحاضرة محمي ولا يجوز تصويره أو تسجيله.');
        } catch (_) {}
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setScreenCaptureAlert('تم حظر أداة تصوير الشاشة (Snipping Tool / Screenshot)! تم إيقاف المحاضرة.');
        if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
      }
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J'))
      ) {
        e.preventDefault();
        setScreenCaptureAlert('تم حظر فتح أدوات المطورين أثناء تشغيل الفيديو الأكاديمي.');
      }
    };

    window.addEventListener('keyup', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keyup', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAntiScreenRecordingActive]);

  // Intercept getDisplayMedia (browser screen share / web recorder extensions)
  useEffect(() => {
    if (!isAntiScreenRecordingActive) return;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async function(...args) {
        setScreenCaptureAlert('تم استشعار محاولة تسجيل أو مشاركة الشاشة عبر المتصفح! تم إيقاف العرض فوراً.');
        if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
        return Promise.reject(new Error('Screen capture prohibited on this platform'));
      };
      return () => {
        navigator.mediaDevices.getDisplayMedia = orig;
      };
    }
  }, [isAntiScreenRecordingActive]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Translation state: 'ar' (Arabic translated) or 'en' (Original English)
  const [contentLang, setContentLang] = useState<'ar' | 'en'>('ar');
  const [isTranslatingWithAI, setIsTranslatingWithAI] = useState(false);
  const [translatedSummaryAr, setTranslatedSummaryAr] = useState<string>('');

  const completedCount = lectures.filter((l) =>
    progress.completedLectureIds?.includes(l.id)
  ).length;

  // Video embed / stream resolution helpers
  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith('/uploads/') ||
      url.startsWith('blob:') ||
      url.startsWith('data:') ||
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.ogg') ||
      url.endsWith('.mov') ||
      url.includes('.mp4?') ||
      url.includes('.webm?')
    );
  };

  // Load summary and quiz on lecture change
  useEffect(() => {
    setIsPlaying(false);
    setUserAnswers({});
    setQuizSubmitted(false);
    loadLectureSummary();
    loadLectureQuiz();
  }, [activeLecture?.id]);

  const getDefaultLectureSummary = (cTitle: string, lecTitle: string, desc?: string) => {
    return `### Executive Overview
This lecture provides an in-depth examination of **${lecTitle || 'Geological & Petrophysical Evaluation'}** within **${cTitle || 'Petroleum Engineering'}**. The fundamental objective is establishing quantitative physical relationships governing hydrocarbon storage capacity, fluid transmissibility, and wireline log response in sedimentary reservoir systems.

---

### Core Theoretical Principles & Mechanisms
- **Pore Structure & Petrophysical Heterogeneity**: Total porosity (φt) accounts for bulk pore volume, whereas effective porosity (φe) encompasses interconnected void space essential for commercial fluid displacement and recoverable reserves estimation.
- **Fluid Saturation & Phase Wettability**: Reservoir pore networks host complex multi-phase fluid distributions governed by interfacial tension, capillary pressure gradients, and wettability, determining irreducible water saturation (Swirr).
- **Electrical Conduction & Archie's Rock Physics**: Non-conductive hydrocarbons drastically increase true formation resistivity (Rt), contrasting sharply with highly conductive formation brines (Rw).
- **Radiometric & Density Responses**: Shales exhibit distinct elevated Gamma Ray (GR) signatures due to concentrated Potassium-40, Thorium-232, and Uranium isotopes within clay crystal sheets.

---

### Governing Mathematical Equations
1. **Effective Porosity (φ)**:
   $$\\phi = \\frac{V_p}{V_b} = \\frac{\\rho_{ma} - \\rho_b}{\\rho_{ma} - \\rho_f}$$
   *(where $\\rho_{ma}$ is matrix density, $\\rho_b$ is bulk density from RHOB log, and $\\rho_f$ is fluid density)*

2. **Darcy's Law for Linear Fluid Flow**:
   $$q = \\frac{k \\cdot A}{\\mu} \\cdot \\frac{\\Delta P}{L}$$
   *(where $q$ is flow rate, $k$ is absolute permeability in Darcies, $A$ is cross-sectional area, $\\mu$ is dynamic viscosity, and $\\Delta P/L$ is pressure gradient)*

3. **Archie's Water Saturation Equation**:
   $$S_w = \\left(\\frac{a \\cdot R_w}{\\phi^m \\cdot R_t}\\right)^{1/n}$$
   *(where $a$ is tortuosity factor, $m$ is cementation exponent, $n$ is saturation exponent, and $R_t$ is true formation resistivity)*

---

### Field & Reservoir Engineering Applications
- **Net Pay Delineation**: Combining Gamma Ray (Vsh < 30%), Porosity (φ > 12%), and Water Saturation (Sw < 50%) cutoffs to accurately identify perforated production intervals.
- **Gas Crossover Detection**: Detecting gas caps via dramatic separation between density porosity (apparent increase) and neutron porosity (apparent decrease).
- **Core-to-Log Calibration**: Calibrating continuous downhole wireline measurements against laboratory routine core analysis (RCA) plugs.

---

### High-Yield Exam Takeaways
1. **Always verify effective vs. total porosity**: Total porosity includes isolated non-effective pores which do not contribute to commercial flow.
2. **Archie equation assumptions**: Valid only in clean, clay-free sandstones. Shaly sand models (e.g., Simandoux, Waxman-Smits) must be applied when clay is present.
3. **Permeability is directional**: Horizontal permeability (kh) is generally significantly higher than vertical permeability (kv) due to sediment lamination.`;
  };

  const getDefaultQuizForLecture = (cTitle: string, lecTitle: string) => {
    const t = `${cTitle} ${lecTitle}`.toLowerCase();
    if (t.includes('mineral') || t.includes('crystal') || t.includes('silicate') || t.includes('clay')) {
      return [
        {
          id: 'lq1',
          question: 'Which crystal system is characterized by three mutually perpendicular axes of equal length (a = b = c, α = β = γ = 90°)?',
          options: ['Isometric (Cubic) System', 'Tetragonal System', 'Orthorhombic System', 'Monoclinic System'],
          correctAnswer: 0,
          explanation: 'The Isometric system exhibits the highest crystallographic symmetry with all 3 axes equal and mutually perpendicular at 90 degrees.',
        },
        {
          id: 'lq2',
          question: 'What is the diagnostic cleavage property that distinguishes micas (Biotite & Muscovite) from quartz hand specimens?',
          options: ['Micas have perfect basal cleavage in one direction; quartz has no cleavage and exhibits conchoidal fracture.', 'Micas have hardness of 10.', 'Micas have two cleavages at 90 degrees.', 'Micas dissolve in pure water.'],
          correctAnswer: 0,
          explanation: 'Phyllosilicates (micas) peel along one perfect basal cleavage plane, whereas 3D framework quartz lacks cleavage and displays conchoidal fracture.',
        },
        {
          id: 'lq3',
          question: 'Why does Smectite clay cause acute formation damage when contacted by fresh water during drilling operations?',
          options: ['Smectite shrinks and drops into the sump.', 'Its 2:1 expandable crystal lattice absorbs water and swells tremendously, plugging pore throats.', 'It melts into petroleum asphalt.', 'It emits gamma rays that damage drill bits.'],
          correctAnswer: 1,
          explanation: 'Smectites expandable interlayer hydrates with water, swelling up to several times its volume and causing sloughing shale and permeability impairment.',
        },
      ];
    }

    return [
      {
        id: 'lq1',
        question: `In petrophysical evaluation of ${lecTitle || 'the reservoir'}, what is the fundamental difference between Total Porosity (φt) and Effective Porosity (φe)?`,
        options: [
          'Total porosity measures all void space; effective porosity measures only interconnected pores available for fluid transmission.',
          'Effective porosity is always greater than total porosity.',
          'Total porosity excludes clay bound water.',
          'There is no distinction in reservoir engineering.',
        ],
        correctAnswer: 0,
        explanation: 'Effective porosity represents the interconnected void network that can commercially store and produce hydrocarbons to the wellbore.',
      },
      {
        id: 'lq2',
        question: "According to Archie's empirical equation, what happens to true formation resistivity (Rt) when non-conductive oil or gas fills the pore space?",
        options: [
          'True resistivity increases significantly because hydrocarbons act as electrical insulators.',
          'True resistivity drops to near zero.',
          'Resistivity remains identical to pure brine.',
          'Formation factor F becomes negative.',
        ],
        correctAnswer: 0,
        explanation: 'Hydrocarbons do not conduct electricity. Therefore, replacing conductive formation brine with oil or gas dramatically elevates Rt.',
      },
      {
        id: 'lq3',
        question: "In Darcy's law for laminar porous flow (q = k*A*ΔP / μ*L), how does doubling the fluid dynamic viscosity (μ) affect production flow rate (q)?",
        options: [
          'Flow rate is halved (inversely proportional).',
          'Flow rate doubles.',
          'Flow rate quadruples.',
          'No change in flow rate.',
        ],
        correctAnswer: 0,
        explanation: 'Flow rate is inversely proportional to dynamic fluid viscosity (μ). Higher viscosity reduces flow rate by 50%.',
      },
    ];
  };

  const loadLectureSummary = async () => {
    if (!activeLecture) return;
    setLoadingSummary(true);
    const defaultEn = getDefaultLectureSummary(course.title, activeLecture.title, activeLecture.description);
    const defaultAr = getDefaultArabicLectureSummary(course.title, activeLecture.title, activeLecture.description);
    setTranslatedSummaryAr(defaultAr);
    try {
      const res = await fetch('/api/ai/lecture-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: course.title,
          lectureTitle: activeLecture.title,
          description: activeLecture.description,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary || defaultEn);
    } catch (err) {
      console.error(err);
      setAiSummary(defaultEn);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAiTranslateSummary = async () => {
    if (!activeLecture) return;
    setIsTranslatingWithAI(true);
    try {
      const source = aiSummary || getDefaultLectureSummary(course.title, activeLecture.title, activeLecture.description);
      const translated = await translateTextWithAI(source, 'ar');
      if (translated) {
        setTranslatedSummaryAr(translated);
      }
      setContentLang('ar');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslatingWithAI(false);
    }
  };

  const loadLectureQuiz = async () => {
    if (!activeLecture) return;
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: course.title,
          lectureTitle: activeLecture.title,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        setQuizQuestions(getDefaultQuizForLecture(course.title, activeLecture.title));
      }
    } catch (err) {
      console.error(err);
      setQuizQuestions(getDefaultQuizForLecture(course.title, activeLecture.title));
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleConfirmDeleteLecture = () => {
    if (lectureToDelete && onDeleteLecture) {
      onDeleteLecture(course.id, lectureToDelete.id);
    }
    setLectureToDelete(null);
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: quizQuestions.length };
  };

  // Dynamic Specialized English Mind Map Generator tailored to each lecture & course
  const getMindMapBranchesForLecture = (cTitle: string, lTitle: string) => {
    const text = `${cTitle} ${lTitle}`.toLowerCase();

    if (text.includes('mineral') || text.includes('crystal') || text.includes('silicate') || text.includes('clay') || text.includes('evaporite')) {
      return [
        {
          id: 'branch-1',
          title: '1. Crystallographic Symmetry & 7 Systems',
          badge: 'Crystallography',
          color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
          items: [
            'Symmetry Elements: Rotation axes (1,2,3,4,6-fold), Mirror planes (m), Inversion centers (i)',
            'Isometric / Cubic System: a = b = c, α = β = γ = 90° (Pyrite, Galena, Halite, Garnet)',
            'Tetragonal & Hexagonal: Vertical c-axis distinct length with 90° or 120° prism symmetry',
            'Low Symmetry Systems: Orthorhombic, Monoclinic (Gypsum, Augite), and Triclinic (Plagioclase)',
          ],
        },
        {
          id: 'branch-2',
          title: '2. Physical & Diagnostic Mineral Properties',
          badge: 'Hand Specimen ID',
          color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
          items: [
            'Mohs Hardness Hierarchy: Talc (1) → Calcite (3) → Apatite (5) → Quartz (7) → Diamond (10)',
            'Cleavage vs Fracture: Perfect basal cleavage in micas vs conchoidal fracture in quartz',
            'Streak Plate Test: True powder color independent of surface weathering or impurities',
            'Specific Gravity & Optical Anisotropy: Double refraction in optical spar calcite under polarized light',
          ],
        },
        {
          id: 'branch-3',
          title: '3. Silicate Polymerization & Bowens Reaction',
          badge: 'Silicate Chemistry',
          color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
          items: [
            'Nesosilicates: Isolated [SiO4]4- tetrahedra bonded by Fe/Mg cations (Olivine group)',
            'Inosilicates: Single chains in Pyroxenes (90° cleavage) vs double chains in Amphiboles (124° cleavage)',
            'Phyllosilicates: Continuous 2D sheets in Clays and Micas (Muscovite, Biotite, Kaolinite)',
            'Tectosilicates: Infinite 3D framework in Quartz (SiO2) and Feldspars (K-Spar & Plagioclase)',
          ],
        },
        {
          id: 'branch-4',
          title: '4. Clay Damage & Hydrocarbon Caprock Seals',
          badge: 'Petroleum Impact',
          color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
          items: [
            'Smectite Hydration Swelling: 2:1 expandable interlayer causing severe wellbore sloughing',
            'Fibrous Illite Pore Bridging: Drastic permeability destruction with minimal total porosity loss',
            'Evaporite Salt Diapirism: Halite & Anhydrite precipitation under arid evaporative basins',
            'Impermeable Caprock Seals: Ductile anhydrite beds preventing vertical hydrocarbon column escape',
          ],
        },
      ];
    }

    if (text.includes('basin') || text.includes('petroleum system') || text.includes('source') || text.includes('trap') || text.includes('exploration') || text.includes('seismic')) {
      return [
        {
          id: 'branch-1',
          title: '1. Petroleum System Architecture & Timing',
          badge: 'System Elements',
          color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
          items: [
            'Essential Elements: Active source rock, carrier bed, reservoir rock, seal rock, overburden',
            'System Processes: Generation kinetics, primary expulsion, secondary carrier migration, entrapment',
            'Critical Moment: Geologic timestamp of optimal synchronization among all elements',
            'Preservation vs Biodegradation: Basin inversion, fault leakage, and water washing thresholds',
          ],
        },
        {
          id: 'branch-2',
          title: '2. Source Rock Pyrolysis & Kerogen Maturation',
          badge: 'Geochemistry',
          color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
          items: [
            'Total Organic Carbon (TOC): Richness cutoff (>1.0 wt% in clastics, >0.5 wt% in carbonates)',
            'Rock-Eval Pyrolysis Parameters: S1 (free hydrocarbons), S2 (cracked kerogen yield), S3 (CO2)',
            'Kerogen Types: Type I (Algal lacustrine oil), Type II (Marine oil/gas), Type III (Terrestrial gas)',
            'Thermal Maturation Window: Vitrinite Reflectance Ro% (0.6%–1.3% Oil Window, >1.3% Gas Window)',
          ],
        },
        {
          id: 'branch-3',
          title: '3. Structural Traps, Fault Seals & Migration',
          badge: 'Structural Geology',
          color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
          items: [
            'Gulf of Suez Rift Traps: Tilted pre-rift fault blocks, rollover anticlines, drape structures',
            'Fault Juxtaposition Sealing: Allan mapping of reservoir sand vs impermeable shale contacts',
            'Shale Gouge Ratio (SGR): SGR > 20% indicates high probability of capillary fault seal',
            'Secondary Migration Driving Forces: Buoyancy vector vs capillary entry pressure of carrier bed',
          ],
        },
        {
          id: 'branch-4',
          title: '4. Seismic Geophysics & Prospect Risking',
          badge: 'Exploration Risk',
          color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
          items: [
            'Acoustic Impedance Contrast: Z = ρ · Vp; reflection coefficient R = (Z2 - Z1) / (Z2 + Z1)',
            'Synthetic Seismogram Tie: Sonic log + Density log convolved with extracted seismic wavelet',
            'Direct Hydrocarbon Indicators (DHIs): Bright spots, dim spots, phase reversals, and flat spots',
            'Prospect POS Inversion: P(Source) × P(Reservoir) × P(Trap/Seal) × P(Migration Dynamics)',
          ],
        },
      ];
    }

    if (text.includes('physical') || text.includes('rock cycle') || text.includes('tectonic') || text.includes('earth')) {
      return [
        {
          id: 'branch-1',
          title: '1. Earth Interior & Geophysical Layers',
          badge: 'Global Geophysics',
          color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
          items: [
            'Crustal Domains: Continental granitic crust (~35-70 km, 2.7 g/cm³) vs Oceanic basaltic (~7 km, 3.0 g/cm³)',
            'Moho Discontinuity: Sharp seismic velocity jump marking crust-mantle boundary (Vp > 8.0 km/s)',
            'Asthenosphere: Low-velocity zone (LVZ) exhibiting ductile convective flow beneath rigid lithosphere',
            'Core Geophysics: Liquid outer iron core (S-wave shadow zone) generating Earth geodynamo magnetic field',
          ],
        },
        {
          id: 'branch-2',
          title: '2. Plate Tectonics & Continental Drift',
          badge: 'Dynamic Earth',
          color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
          items: [
            'Divergent Boundaries: Seafloor spreading centers (Red Sea Rift, Mid-Atlantic Ridge) with magnetic stripes',
            'Convergent Boundaries: Subduction trenches, accretionary wedges, volcanic arcs, Wadati-Benioff zones',
            'Transform Boundaries: Conservative strike-slip fault zones (Dead Sea Transform, San Andreas Fault)',
            'Wilson Cycle: Continental breakup → Juvenile ocean basin → Ocean closure → Orogenic collision',
          ],
        },
        {
          id: 'branch-3',
          title: '3. The Dynamic Rock Cycle & Magmatism',
          badge: 'Petrology',
          color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
          items: [
            'Igneous Crystallization: Plutonic deep cooling (phaneritic granite) vs volcanic quench (aphanitic basalt)',
            'Sedimentary Lithification: Mechanical compaction + chemical cementation (calcite, quartz, hematite)',
            'Metamorphic Recrystallization: Regional dynamothermal foliation (schist, gneiss) vs contact thermal hornfels',
            'Bowen Reaction Series: Discontinuous (Olivine→Pyroxene→Amphibole→Biotite) and Continuous (Anorthite→Albite)',
          ],
        },
        {
          id: 'branch-4',
          title: '4. Geological Surface Processes & Basins',
          badge: 'Sedimentary Basins',
          color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
          items: [
            'Sediment Transport: Bedload saltation, suspension transport, and roundness/sorting maturation',
            'Facies Architecture: Alluvial fans, meandering rivers, deltaic lobes, and deep marine turbidites',
            'Thermal Subsidence: Post-rift cooling subsidence creating vast accomodation space for petroleum reservoirs',
            'Stratigraphic Unconformities: Angular unconformities, disconformities, nonconformities recording hiatuses',
          ],
        },
      ];
    }

    // Default Petrophysics & Well Logging Mind Map
    return [
      {
        id: 'branch-1',
        title: '1. Theoretical Foundations & Reservoir Storage',
        badge: 'Core Theory',
        color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
        items: [
          'Total vs Effective Porosity: Interconnected pore volume φe available for commercial hydrocarbon flow',
          'Pore Throat Geometry: Capillary entry pressure Pc and mercury injection capillary pressure (MICP) curves',
          'Fluid Saturations (Sw, So, Sg): Interfacial tension, capillary transition zones, and wettability index',
          'Grain Sorting & Texture: Sphericity, grain packing (cubic 47.6% vs rhombohedral 25.9%), diagenetic quartz cement',
        ],
      },
      {
        id: 'branch-2',
        title: '2. Physical Laws & Governing Formulations',
        badge: 'Governing Equations',
        color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
        items: [
          "Darcy's Law: q = (k·A/μ)·(ΔP/L) [Governs linear laminar flow in porous reservoir rocks]",
          "Archie's Equation: Sw = ((a·Rw)/(φ^m · Rt))^(1/n) [Water saturation from true electrical resistivity]",
          'Formation Factor: F = a / φ^m (Cementation exponent m ≈ 2.0 in clean consolidated sandstones)',
          'Bulk Density Porosity: φ_density = (ρ_matrix - ρ_bulk) / (ρ_matrix - ρ_fluid)',
        ],
      },
      {
        id: 'branch-3',
        title: '3. Wireline Logging Sensors & Cross-Plots',
        badge: 'Downhole Logs',
        color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        items: [
          'Gamma Ray (GR): High API in radioactive shales (K-40, U, Th); low API establishes clean sand baseline',
          'Deep Induction (ILd / LLd): High true resistivity Rt indicates non-conductive hydrocarbon pore fill',
          'Density-Neutron (RHOB-NPHI): Gas effect produces distinct crossover on standard limestone compatibility scales',
          'Acoustic Sonic (BHC / DT): Wyllie time-average equation deriving primary matrix acoustic porosity',
        ],
      },
      {
        id: 'branch-4',
        title: '4. Petroleum Field Decisions & Net Pay Cutoffs',
        badge: 'Reservoir Evaluation',
        color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
        items: [
          'Hydrocarbon Contacts: Free Water Level (FWL), Oil-Water Contact (OWC), and Gas-Oil Contact (GOC)',
          'Net Reservoir Pay Cutoffs: Vshale < 30%, Effective Porosity φ > 12%, Water Saturation Sw < 50%',
          'Volumetric Inversion: Original Oil In Place (OOIP) = 7758 · A · h · φ · (1 - Sw) / Boi [STB]',
          'Formation Damage Mitigation: Salinity matching in water-based drilling muds to prevent smectite swelling',
        ],
      },
    ];
  };

  const englishMindMapBranches = getMindMapBranchesForLecture(course.title, activeLecture?.title || '');
  const arabicMindMapBranches = getArabicMindMapBranchesForLecture(course.title, activeLecture?.title || '');
  const activeMindMapBranches = contentLang === 'ar' ? arabicMindMapBranches : englishMindMapBranches;

  const arabicQuizQuestions = getArabicQuizForLecture(course.title, activeLecture?.title || '');
  const activeQuizQuestions = contentLang === 'ar' ? arabicQuizQuestions : (quizQuestions.length > 0 ? quizQuestions : arabicQuizQuestions);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-right">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between p-3.5 bg-[#0f172a] border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <button
            onClick={onBackToCourses}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            My Courses
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-200">{course.title}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-amber-400 truncate max-w-[200px] sm:max-w-none">{activeLecture?.title}</span>
        </div>

        <div className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
          {completedCount} / {course.totalLectures} Completed
        </div>
      </div>

      {/* Main Lecture Grid: Video Player + Playlist Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left in RTL (Video + Academic Content Tabs) - Width 8/12 */}
        <div className="lg:col-span-8 space-y-5">
          {/* Free Trial Banner for students (Requested by user) */}
          {isFreeTrial && platformSettings?.isPaidMode && user.role !== 'admin' && user.subscriptionStatus !== 'active' && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-purple-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <Gift className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-emerald-400">
                      محاضرة تجريبية مجانية 🎁 (Free Trial)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-emerald-300 border border-emerald-500/30">
                      مفتوحة للجميع
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    هذه المحاضرة متاحة لك بالكامل مجاناً لمشاهدة جودة الشرح وتحميل الملخصات. باقي محاضرات المادة تتطلب اشتراك المنصة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstaPayModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white rounded-xl text-xs font-black flex items-center gap-2 shrink-0 shadow-lg shadow-purple-600/20 cursor-pointer self-start sm:self-center active:scale-95 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>الاشتراك عبر InstaPay ({platformSettings?.subscriptionPrice || 150} ج.م) 💳</span>
              </button>
            </div>
          )}

          {/* Admin Control Bar for this lecture */}
          {user.role === 'admin' && (
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">نوع المحاضرة:</span>
                {isFreeTrial ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    <span>تجريبية مجانية 🎁</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>مدفوعة باشتراك 🔒</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleToggleCurrentLectureFree}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] border border-slate-700 cursor-pointer transition-colors"
                title="تبديل المحاضرة بين مجانية تجريبية أو مدفوعة"
              >
                {isFreeTrial ? 'تحويل إلى مدفوعة 🔒' : 'جعلها تجريبية مجانية 🎁'}
              </button>
            </div>
          )}

          {/* Video Container */}
          <div
            className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* If Platform is in Paid Mode and User is Not Subscribed: Lock Gate */}
            {isPaywallLocked ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-slate-950 via-[#0e1626] to-purple-950/40 relative overflow-hidden">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20">
                  <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] sm:text-[11px] px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold inline-block">
                    المنصة حالياً بنظام الاشتراك المدفوع 🔒
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-100">
                    هذه المحاضرة مخصصة للمشتركين فقط
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    يمكنك تفعيل حسابك فوراً عن طريق التحويل عبر InstaPay بقيمة {platformSettings?.subscriptionPrice || 150} جنيه مصري.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstaPayModal(true)}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تفعيل الاشتراك عبر InstaPay الآن 💳</span>
                </button>
              </div>
            ) : isPlaying ? (
              videoError ? (
                /* Video Playback Recovery State */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950 text-slate-200">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-100">جاري معالجة الفيديو على الخادم</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    يمكنك إعادة المحاولة أو التواصل مع إدارة المنصة.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setVideoError(false)}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة المحاولة</span>
                    </button>
                    {user.role === 'admin' && (
                      <a
                        href={activeLecture?.videoUrl}
                        download={activeLecture?.fileName || `${activeLecture?.title}.mp4`}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل الفيديو (أدمن فقط)</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {isDirectVideo(activeLecture?.videoUrl) ? (
                    <video
                      ref={videoRef}
                      key={activeLecture?.id + '-' + activeLecture?.videoUrl}
                      src={activeLecture?.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      onError={() => setVideoError(true)}
                      className="w-full h-full object-contain bg-black"
                      poster={course.thumbnail}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      key={activeLecture?.id + '-' + activeLecture?.videoUrl}
                      src={getEmbedUrl(activeLecture?.videoUrl)}
                      title={activeLecture?.title}
                      className="w-full h-full border-0 bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}

                  {/* Dynamic Moving Anti-Screen Recording Watermark */}
                  {isAntiScreenRecordingActive && isPlaying && (
                    <div
                      className="absolute pointer-events-none select-none transition-all duration-1000 ease-in-out z-20"
                      style={{
                        top: `${watermarkPos.top}%`,
                        left: `${watermarkPos.left}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs border border-white/10 text-white/80 text-[11px] font-mono shadow-2xl flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="font-bold">{user.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-amber-300 font-mono">{user.phone}</span>
                        <span className="text-slate-400 text-[9px]">(ID:{user.id.slice(-6)})</span>
                      </div>
                    </div>
                  )}

                  {/* Corner Anti-Piracy Identification Watermarks */}
                  {isAntiScreenRecordingActive && isPlaying && (
                    <>
                      <div className="absolute top-3 right-3 pointer-events-none select-none z-10 text-[10px] font-mono text-white/30 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {user.name} ({user.phone})
                      </div>
                      <div className="absolute bottom-12 left-3 pointer-events-none select-none z-10 text-[10px] font-mono text-white/30 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        رقم ترخيص الطالب: {user.phone} · محتوى محمي
                      </div>
                    </>
                  )}

                  {/* Window Focus Loss / Screen Recording Shield */}
                  {isWindowBlurred && isPlaying && (
                    <div
                      onClick={() => {
                        setIsWindowBlurred(false);
                        if (videoRef.current) videoRef.current.play();
                      }}
                      className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer animate-in fade-in duration-150 select-none"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-100">
                        تم إيقاف المحاضرة مؤقتاً لحماية المحتوى الأكاديمي 🛡️
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md">
                        تم استشعار مغادرة نافذة المحاضرة أو تشغيل أداة خارجية. يرجى البقاء داخل نافذة المحاضرة لمتابعة المشاهدة.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsWindowBlurred(false);
                          if (videoRef.current) videoRef.current.play();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        متابعة تشغيل المحاضرة ▶️
                      </button>
                    </div>
                  )}

                  {/* Security Alert Overlay (PrintScreen or getDisplayMedia attempt) */}
                  {screenCaptureAlert && (
                    <div className="absolute inset-0 z-40 bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in select-none">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-red-200">
                        تحذير أمني: تسجيل أو تصوير الشاشة محظور!
                      </h3>
                      <p className="text-xs text-red-300 max-w-md leading-relaxed">
                        {screenCaptureAlert}
                      </p>
                      <p className="text-[11px] text-red-400/80 font-mono">
                        تم تسجيل هذا الإجراء على حساب الطالب: {user.name} ({user.phone})
                      </p>
                      <button
                        type="button"
                        onClick={() => setScreenCaptureAlert(null)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        فهمت، والعودة للمحاضرة
                      </button>
                    </div>
                  )}
                </>
              )
            ) : (
              /* Video Poster with Interactive Play Trigger */
              <div
                onClick={() => {
                  setVideoError(false);
                  setIsPlaying(true);
                }}
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#0a101b] to-slate-900 text-slate-300 relative cursor-pointer group"
              >
                <img
                  src={course.thumbnail}
                  alt={activeLecture?.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-10 text-center p-6 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-115">
                    <Play className="w-7 h-7 fill-slate-950 translate-x-0.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {activeLecture?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeLecture?.sourceType === 'upload' || activeLecture?.videoUrl?.startsWith('/uploads')
                        ? '🎥 Local Video File · Full HD 1080p Playback'
                        : '🔗 Web Stream Video · Academic Engineering Platform'}
                    </p>
                  </div>
                </div>

                {/* Video bar */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 to-transparent flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeLecture?.duration}</span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono">
                    {course.code} · Lecture {activeLecture?.order}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar below Video */}
          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100">{activeLecture?.title}</h2>
                {activeLecture?.sourceType === 'upload' || activeLecture?.videoUrl?.startsWith('/uploads') ? (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Uploaded Video</span>
                    {activeLecture?.fileSize && <span>({activeLecture.fileSize})</span>}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Web Stream</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Instructor: <strong className="text-slate-200">{course.instructor}</strong></span>
                <span>·</span>
                <span>Duration: {activeLecture?.duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
                title="Share Lecture URL"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>

              {/* Mark Completed Toggle */}
              <button
                onClick={() => onToggleComplete(activeLecture.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
              </button>
            </div>
          </div>

          {/* BILINGUAL TRANSLATION BAR UNDER LECTURE */}
          <div className="p-4 bg-gradient-to-r from-[#0f172a] via-[#121c32] to-[#0f172a] border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Languages className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-100">
                    ترجمة المحاضرة والملخصات والأسئلة
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {contentLang === 'ar' ? 'العرض: مترجم للعربية 🇸🇦' : 'Display: English Original 🇬🇧'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  زرار التبديل الفوري والترجمة من الإنجليزي للعربي لجميع ملخصات وخرائط وأسئلة المحاضرة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Language Switch Buttons */}
              <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setContentLang('ar')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    contentLang === 'ar'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🇸🇦 العربية (مترجم)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentLang('en')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    contentLang === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇬🇧 English</span>
                </button>
              </div>

              {/* Instant AI Translation with Gemini */}
              <button
                type="button"
                onClick={handleAiTranslateSummary}
                disabled={isTranslatingWithAI}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="إعادة الترجمة فورياً بالذكاء الاصطناعي (Gemini AI)"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isTranslatingWithAI ? 'animate-spin' : ''}`} />
                <span>{isTranslatingWithAI ? 'جاري الترجمة...' : 'ترجمة فورية بالذكاء الاصطناعي ✨'}</span>
              </button>
            </div>
          </div>

          {/* ACADEMIC TABS: Summary, Mind Map, Quiz, Notes, PDF */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{contentLang === 'ar' ? 'الملخص التنفيذي (Summary)' : 'Executive Summary (الملخص)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('mindmap')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'mindmap'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Network className="w-4 h-4 text-cyan-400" />
                <span>{contentLang === 'ar' ? 'الخريطة الذهنية (Mind Map)' : 'Mind Map (الخريطة الذهنية)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{contentLang === 'ar' ? 'الامتحان والأسئلة (MCQs)' : 'Practice Exam & MCQs (الامتحان)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>{contentLang === 'ar' ? 'المحاضرة والسكاشن (Syllabus)' : 'Syllabus & Lab (المحاضرة والسكشن)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'pdf'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>{contentLang === 'ar' ? 'سلايدات المحاضرة (PDF)' : 'Lecture Slides (PDF)'}</span>
              </button>
            </div>

            {/* TAB 1: EXECUTIVE SUMMARY (PDF PAGE VIEW) */}
            {activeTab === 'summary' && (
              <PdfPageSummary
                course={course}
                lecture={activeLecture}
                contentLang={contentLang}
                onToggleLang={() => setContentLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                rawSummaryText={
                  contentLang === 'ar'
                    ? (translatedSummaryAr || getDefaultArabicLectureSummary(course.title, activeLecture?.title || '', activeLecture?.description))
                    : (aiSummary || getDefaultLectureSummary(course.title, activeLecture?.title || '', activeLecture?.description))
                }
                loadingSummary={loadingSummary}
                onRegenerateSummary={loadLectureSummary}
                user={user}
              />
            )}

            {/* TAB 2: VISUAL MIND MAP & KEY POINTS */}
            {activeTab === 'mindmap' && (
              <InteractiveMindMap
                course={course}
                lecture={activeLecture}
                contentLang={contentLang}
                onToggleLang={() => setContentLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                branches={activeMindMapBranches}
              />
            )}

            {/* TAB 3: PRACTICE QUIZ & EXAM */}
            {activeTab === 'quiz' && (
              <div
                className={`space-y-5 font-sans ${contentLang === 'ar' ? 'text-right' : 'text-left'}`}
                dir={contentLang === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>{contentLang === 'ar' ? 'امتحان وأسئلة تقييم المحاضرة (MCQ)' : 'Lecture Assessment & Exam MCQs'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                          {contentLang === 'ar' ? 'مترجم للعربية 🇸🇦' : 'English Original 🇬🇧'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {contentLang === 'ar'
                          ? 'أسئلة تدريبية قياسية لاختبارات هندسة البترول والجيولوجيا'
                          : 'Standardized petroleum engineering test questions'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContentLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{contentLang === 'ar' ? '🇬🇧 English Quiz' : '🇸🇦 ترجمة الأسئلة للعربية'}</span>
                    </button>

                    {quizSubmitted && (
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                        {contentLang === 'ar'
                          ? `النتيجة: ${calculateScore().correct} / ${calculateScore().total}`
                          : `Score: ${calculateScore().correct} / ${calculateScore().total}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {activeQuizQuestions.map((q, qIndex) => {
                    const selected = userAnswers[q.id];
                    const isAnswered = selected !== undefined;
                    const isCorrect = selected === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {qIndex + 1}
                          </span>
                          <p className="text-sm font-bold text-slate-100 leading-relaxed">
                            {q.question}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            let optStyle = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700';

                            if (quizSubmitted) {
                              if (optIdx === q.correctAnswer) {
                                optStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold';
                              } else if (selected === optIdx) {
                                optStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
                              }
                            } else if (selected === optIdx) {
                              optStyle = 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                  }
                                }}
                                className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correctAnswer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                            <span className="font-bold text-amber-400 block">
                              {contentLang === 'ar' ? 'التفسير والتحليل العلمي:' : 'Scientific Explanation:'}
                            </span>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(userAnswers).length === 0}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        {contentLang === 'ar' ? 'إرسال وتصحيح الإجابات' : 'Submit Answers'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUserAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                      >
                        {contentLang === 'ar' ? 'إعادة الاختبار' : 'Retake Quiz'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYLLABUS & LAB PRACTICAL TRAINING & SECTIONS */}
            {activeTab === 'notes' && (
              <div
                className={`space-y-4 font-sans ${contentLang === 'ar' ? 'text-right' : 'text-left'}`}
                dir={contentLang === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      {contentLang === 'ar' ? 'توصيف المحاضرة والسكاشن العملية' : 'Lecture Overview & Practical Sections'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{contentLang === 'ar' ? '🇬🇧 English Notes' : '🇸🇦 ترجمة الشرح والسكاشن'}</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>{contentLang === 'ar' ? 'نظرة عامة على المحاضرة وتوصيف المنهج' : 'Lecture Overview & Syllabus Description'}</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {contentLang === 'ar'
                      ? (activeLecture?.description && /[\u0600-\u06FF]/.test(activeLecture.description)
                          ? activeLecture.description
                          : 'دراسة هندسية وبتروفيزيائية معمقة وشاملة للمفاهيم الأساسية، والتقييم الرياضي لسلوك الخزان وتطبيقات تسجيلات الآبار.')
                      : (activeLecture?.description || 'Comprehensive theoretical evaluation and geological mechanisms.')}
                  </p>
                </div>

                {/* Render Attached Sections if available */}
                {activeLecture?.sections && activeLecture.sections.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Practical Sections & Lab Materials ({activeLecture.sections.length})</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        السكاشن والتطبيقات العملية الخاصة بهذه المحاضرة
                      </span>
                    </div>

                    {activeLecture.sections.map((sec, secIdx) => {
                      const isSecVideoPlaying = activePlayingSectionId === sec.id;
                      return (
                        <div
                          key={sec.id}
                          className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  Section {secIdx + 1}
                                </span>
                                <h5 className="font-bold text-slate-100 text-sm">{sec.title}</h5>
                                {sec.instructor && (
                                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium">
                                    Teaching Assistant: {sec.instructor}
                                  </span>
                                )}
                              </div>
                              {sec.description && (
                                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                                  {sec.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Section Video Player */}
                          {sec.videoUrl && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                                  <Play className="w-3.5 h-3.5 fill-cyan-400" />
                                  <span>Practical Section Video</span>
                                </span>
                                {sec.videoFileSize && (
                                  <span className="text-[11px] text-cyan-300/80">({sec.videoFileSize})</span>
                                )}
                              </div>

                              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                                {isSecVideoPlaying ? (
                                  isDirectVideo(sec.videoUrl) ? (
                                    <video
                                      src={sec.videoUrl}
                                      controls
                                      autoPlay
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <iframe
                                      src={getEmbedUrl(sec.videoUrl)}
                                      title={sec.title}
                                      className="w-full h-full border-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  )
                                ) : (
                                  <div
                                    onClick={() => setActivePlayingSectionId(sec.id)}
                                    className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 cursor-pointer group hover:border-purple-500/50 transition-all"
                                  >
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-slate-950 transition-all shadow-lg shadow-purple-500/20">
                                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                                      Click to Play Section Video (تشغيل فيديو السكشن)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Section Images Gallery */}
                          {sec.images && sec.images.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Core Samples & Microscopic Thin Sections ({sec.images.length})</span>
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-emerald-500 cursor-pointer transition-all shadow-xs"
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.caption || 'Sample'}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Maximize2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    {img.caption && (
                                      <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-0.5 text-[10px] text-slate-200 truncate">
                                        {img.caption}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section PDF Sheet / Notes */}
                          {sec.pdfUrl && (
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-xs flex items-center justify-center">
                                  PDF
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-200">
                                    {sec.pdfFileName || `${sec.title} - شيت ومذكرة السكشن العملي`}
                                  </p>
                                  {sec.pdfFileSize && (
                                    <p className="text-[10px] text-rose-400">{sec.pdfFileSize}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivePdfModal({
                                      url: sec.pdfUrl!,
                                      title: sec.pdfFileName || `${sec.title} - مذكرة السكشن العملي`,
                                      fileSize: sec.pdfFileSize,
                                    })
                                  }
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>فتح الـ PDF بالمنصة</span>
                                </button>
                                {user.role === 'admin' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadPdfFile(
                                        sec.pdfUrl!,
                                        sec.pdfFileName || `${sec.title} - مذكرة السكشن.pdf`,
                                        true
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                                    title="تحميل ملف الـ PDF على جهازك (أدمن فقط)"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>تحميل</span>
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>محمي بالمنصة 🛡️</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/30 space-y-3">
                    <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      <span>{contentLang === 'ar' ? 'السكاشن والتطبيقات المعملية والتكليفات' : 'Practical Laboratory Section & Assignments'}</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {contentLang === 'ar'
                        ? (activeLecture?.sectionNotes || 'التدريب العملي على قياس خواص عينات اللباب في المعمل وحساب منحنيات تسجيلات الآبار الرقمية.')
                        : (activeLecture?.sectionNotes || 'Practical laboratory core measurement and digital wireline curve calculation.')}
                    </p>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                      {contentLang === 'ar'
                        ? 'الأدوات المعملية المطلوبة: ورق رسم بياني نصف لوغاريتمي (Semi-log)، آلة حاسبة علمية، مسطرة مقياس اللوجات، وكتالوج عينات اللباب الصخري.'
                        : 'Required Equipment: Semi-log graph paper, scientific calculator, log scale ruler, and core sample catalog.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PDF DOWNLOADS & VIEWER */}
            {activeTab === 'pdf' && (
              <div className="space-y-4 text-left font-sans" dir="ltr">
                {activeLecture?.pdfUrl ? (
                  <PdfViewer
                    url={activeLecture.pdfUrl}
                    fileName={activeLecture.pdfFileName || `${activeLecture.title} - Official Slides.pdf`}
                    fileSize={activeLecture.pdfFileSize}
                    allowDownload={user.role === 'admin' && platformSettings?.protectPdfsFromDownload === false}
                    user={user}
                  />
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">No PDF Document Attached Yet</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      You can add and attach PDF slides directly from your device through the Admin Panel for this lecture.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Direct AI Help Banner */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {contentLang === 'ar' ? 'محتاج شرح فوري أو توضيح لأي مسألة؟' : 'Need immediate geological tutoring?'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {contentLang === 'ar' ? 'اسأل المعلم الذكي لـ PETROGEO يشرحلك أي قانون أو منحنى لوج بلدي وببساطة' : 'Ask the PETROGEO AI mentor to break down any formula or well log'}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  onAskAi(contentLang === 'ar' ? `اشرحلي ببساطة أهم مفاهيم وقوانين محاضرة: ${activeLecture?.title}` : `Explain the core petrophysical concepts of: ${activeLecture?.title}`)
                }
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {contentLang === 'ar' ? 'اسأل المساعد الذكي 🤖' : 'Ask Assistant'}
              </button>
            </div>
          </div>
        </div>

        {/* Right in RTL (Course Lectures Playlist) - Width 4/12 */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Course Playlist ({lectures.length})</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {course.code}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {lectures.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No lectures enrolled yet.</p>
            ) : (
              lectures.map((lec, index) => {
                const lecCompleted = progress.completedLectureIds?.includes(lec.id);
                const isCurrent = lec.id === activeLecture?.id;
                const isLecFirst = index === 0 || lec.order === 1;
                const isThisLecFree = Boolean(
                  lec.isFree === true ||
                    (platformSettings?.allowFirstLectureFree !== false && isLecFirst && lec.isFree !== false)
                );
                const isThisLecLocked = Boolean(
                  platformSettings?.isPaidMode && user.role !== 'admin' && user.subscriptionStatus !== 'active' && !isThisLecFree
                );

                return (
                  <div
                    key={lec.id}
                    onClick={() => onSelectLecture(lec.id)}
                    className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex items-start justify-between gap-3 group ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="pt-0.5 shrink-0">
                      {lecCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : isThisLecFree ? (
                        <Gift className="w-4 h-4 text-emerald-400" />
                      ) : isThisLecLocked ? (
                        <Lock className="w-3.5 h-3.5 text-purple-400/80" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-600 block text-[10px] text-center text-slate-500 leading-3.5">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Lecture info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold line-clamp-2 transition-colors ${
                          isCurrent ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {lec.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 justify-end flex-wrap">
                        {isThisLecFree && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            تجريبية مجانية 🎁
                          </span>
                        )}
                        {isThisLecLocked && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> مدفوعة
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{lec.duration}</span>
                        </span>
                      </div>
                    </div>

                    {/* Admin quick toggle or delete button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/admin/courses/${course.id}/lectures/${lec.id}/toggle-free`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isFree: !isThisLecFree }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.lecture) lec.isFree = data.lecture.isFree;
                                setPlatformSettings((p) => (p ? { ...p } : p));
                              }
                            } catch {}
                          }}
                          className={`p-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            isThisLecFree
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                          title={isThisLecFree ? 'المحاضرة مجانية تجريبية (اضغط للقفل)' : 'المحاضرة مدفوعة (اضغط لفتحها تجريبياً)'}
                        >
                          {isThisLecFree ? '🎁' : '🔒'}
                        </button>
                      )}

                      {onDeleteLecture && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLectureToDelete(lec);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                          title="حذف المحاضرة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Section Image Lightbox Modal */}
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

      {/* Interactive In-Platform PDF Modal */}
      {activePdfModal && (
        <PdfModalViewer
          isOpen={!!activePdfModal}
          onClose={() => setActivePdfModal(null)}
          url={activePdfModal.url}
          title={activePdfModal.title}
          fileSize={activePdfModal.fileSize}
          allowDownload={user.role === 'admin' && platformSettings?.protectPdfsFromDownload === false}
          user={user}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!lectureToDelete}
        title="Delete Lecture"
        message={`Are you sure you want to permanently delete "${lectureToDelete?.title || ''}" from this course?`}
        confirmText="Delete Lecture"
        variant="danger"
        onConfirm={handleConfirmDeleteLecture}
        onCancel={() => setLectureToDelete(null)}
      />

      {/* InstaPay Subscription Modal */}
      <InstaPayModal
        isOpen={showInstaPayModal}
        onClose={() => setShowInstaPayModal(false)}
        user={user}
        onPaymentSuccess={() => {
          // Re-fetch platform settings / status
          fetch('/api/student/payment-status', {
            headers: { 'x-user-id': user.id, 'x-user-email': user.email },
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.settings) setPlatformSettings(data.settings);
            })
            .catch(() => {});
        }}
      />
    </div>
  );
};
