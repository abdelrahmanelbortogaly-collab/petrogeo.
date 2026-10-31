import React, { useState, useMemo } from 'react';
import {
  Network,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Languages,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Bookmark,
  Share2,
  Compass,
  Zap,
} from 'lucide-react';
import { MindMapBranch, KeyTakeawayPoint, getKeyTakeawaysForLecture } from '../utils/lectureTranslations';
import { Course, Lecture } from '../types';

interface InteractiveMindMapProps {
  course: Course;
  lecture?: Lecture;
  contentLang: 'ar' | 'en';
  onToggleLang: () => void;
  branches: MindMapBranch[];
}

export const InteractiveMindMap: React.FC<InteractiveMindMapProps> = ({
  course,
  lecture,
  contentLang,
  onToggleLang,
  branches,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeView, setActiveView] = useState<'visual' | 'matrix'>('visual');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    'branch-1': true,
    'branch-2': true,
    'branch-3': true,
    'branch-4': true,
  });
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  // Key takeaways for quick exam revision
  const takeaways = useMemo(() => {
    return getKeyTakeawaysForLecture(course.title, lecture?.title || '', contentLang);
  }, [course.title, lecture?.title, contentLang]);

  // Toggle a pillar expansion
  const togglePillar = (id: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    branches.forEach((b) => (allExpanded[b.id] = true));
    setExpandedPillars(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    branches.forEach((b) => (allCollapsed[b.id] = false));
    setExpandedPillars(allCollapsed);
  };

  // Classify point importance
  const getPointMeta = (text: string, idx: number) => {
    const lower = text.toLowerCase();
    if (lower.includes('=') || lower.includes('law') || lower.includes('قانون') || lower.includes('equation') || lower.includes('معادلة')) {
      return {
        tag: contentLang === 'ar' ? 'قانون محوري 📐' : 'Governing Law 📐',
        tagColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: '📐',
      };
    }
    if (lower.includes('cutoff') || lower.includes('well') || lower.includes('بئر') || lower.includes('حفر') || lower.includes('إنتاج') || lower.includes('contact')) {
      return {
        tag: contentLang === 'ar' ? 'تطبيق حقلي 🛢️' : 'Field Decision 🛢️',
        tagColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        icon: '🛢️',
      };
    }
    if (lower.includes('damage') || lower.includes('risk') || lower.includes('خطر') || lower.includes('swelling') || lower.includes('فخ')) {
      return {
        tag: contentLang === 'ar' ? 'تنبيه دقيق ⚠️' : 'Critical Warning ⚠️',
        tagColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        icon: '⚠️',
      };
    }
    return {
      tag: contentLang === 'ar' ? `نقطة هامة #${idx + 1} ⭐` : `Key Concept #${idx + 1} ⭐`,
      tagColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: '⭐',
    };
  };

  // Filtered branches based on search
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;
    const term = searchTerm.toLowerCase();
    return branches.map((b) => {
      const matchingItems = b.items.filter((item) => item.toLowerCase().includes(term));
      const titleMatches = b.title.toLowerCase().includes(term);
      return {
        ...b,
        items: titleMatches ? b.items : matchingItems,
      };
    }).filter((b) => b.items.length > 0 || b.title.toLowerCase().includes(term));
  }, [branches, searchTerm]);

  return (
    <div className="space-y-6" dir={contentLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mind Map Controls Header */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl backdrop-blur">
        {/* Left / Title info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20 shrink-0">
            <Network className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{contentLang === 'ar' ? 'الخريطة الذهنية البصرية التفاعلية' : 'Interactive Visual Knowledge Map'}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30">
                {contentLang === 'ar' ? '٤ ركائز معرفية رئيسية' : '4 Core Pillars'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {contentLang === 'ar'
                ? 'ربط هندسي وشجري بين المفاهيم والقوانين والقرارات الحقلية'
                : 'Hierarchical connection between theory, laws, and field decisions'}
            </p>
          </div>
        </div>

        {/* Right / Interactive tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('visual')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                activeView === 'visual'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{contentLang === 'ar' ? 'الخريطة البصرية' : 'Visual Map'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                activeView === 'matrix'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{contentLang === 'ar' ? 'مصفوفة النقاط' : 'Key Matrix'}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={contentLang === 'ar' ? 'بحث في نقاط الخريطة...' : 'Filter map points...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Expand / Collapse All */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-slate-400">
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title={contentLang === 'ar' ? 'توسيع كافة الفروع' : 'Expand All'}
            >
              {contentLang === 'ar' ? 'توسيع الكل' : 'Expand'}
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title={contentLang === 'ar' ? 'طي كافة الفروع' : 'Collapse All'}
            >
              {contentLang === 'ar' ? 'طي الكل' : 'Collapse'}
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="تصغير الخريطة"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold w-9 text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="تكبير الخريطة"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                title="إعادة ضبط الحجم"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lang toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>{contentLang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: INTERACTIVE VISUAL TREE MAP ================= */}
      {activeView === 'visual' && (
        <div className="overflow-x-auto pb-4">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 min-w-[760px] p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#090e17] via-[#0f172a] to-[#090e17] border border-cyan-500/20 relative shadow-2xl space-y-8"
          >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none rounded-3xl" />

            {/* ================= CENTRAL CORE NODE ================= */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold mb-2 shadow-sm animate-pulse">
                <Compass className="w-3.5 h-3.5" />
                <span>{contentLang === 'ar' ? 'الموضوع الرئيسي والمركز الأكاديمي للخريطة' : 'Central Lecture Core Hub'}</span>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-cyan-500/20 border-2 border-cyan-400/60 max-w-xl w-full shadow-2xl shadow-cyan-500/10 relative group hover:border-cyan-300 transition-all">
                <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950 border border-amber-500/50 text-[10px] font-mono font-bold text-amber-400">
                  {course.code || 'GEO'} · UNIT CORE
                </div>

                <div className="space-y-1.5 pt-1">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    {lecture?.title || 'المحاضرة الأكاديمية'}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    {course.title}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-around text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{contentLang === 'ar' ? '٤ ركائز استراتيجية' : '4 Main Pillars'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{filteredBranches.reduce((acc, b) => acc + b.items.length, 0)} {contentLang === 'ar' ? 'نقطة معرفية' : 'Key Nodes'}</span>
                  </span>
                </div>
              </div>

              {/* Central Trunk Connecting Down */}
              <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-slate-700 my-1" />
              <div className="w-4 h-4 rounded-full bg-cyan-400/30 border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>

            {/* ================= 4 PRIMARY PILLAR BRANCHES ================= */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {filteredBranches.map((branch, bIdx) => {
                const isExpanded = expandedPillars[branch.id] !== false;
                const pillarThemes = [
                  {
                    border: 'border-amber-500/40 hover:border-amber-400',
                    headerBg: 'bg-amber-500/15 text-amber-300',
                    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    glow: 'shadow-amber-500/5',
                    connector: 'bg-amber-500',
                  },
                  {
                    border: 'border-cyan-500/40 hover:border-cyan-400',
                    headerBg: 'bg-cyan-500/15 text-cyan-300',
                    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                    glow: 'shadow-cyan-500/5',
                    connector: 'bg-cyan-500',
                  },
                  {
                    border: 'border-emerald-500/40 hover:border-emerald-400',
                    headerBg: 'bg-emerald-500/15 text-emerald-300',
                    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    glow: 'shadow-emerald-500/5',
                    connector: 'bg-emerald-500',
                  },
                  {
                    border: 'border-purple-500/40 hover:border-purple-400',
                    headerBg: 'bg-purple-500/15 text-purple-300',
                    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                    glow: 'shadow-purple-500/5',
                    connector: 'bg-purple-500',
                  },
                ];
                const theme = pillarThemes[bIdx % pillarThemes.length];

                return (
                  <div
                    key={branch.id}
                    className={`rounded-2xl bg-slate-900/90 border-2 transition-all p-5 shadow-xl flex flex-col justify-between ${theme.border} ${theme.glow}`}
                  >
                    {/* Branch Header Node */}
                    <div>
                      <div
                        onClick={() => togglePillar(branch.id)}
                        className="flex items-center justify-between pb-3.5 border-b border-slate-800 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${theme.headerBg}`}>
                            {bIdx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-100 hover:text-cyan-300 transition-colors">
                              {branch.title}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              {branch.items.length} {contentLang === 'ar' ? 'نقاط ومفاهيم تفصيلية' : 'Key points'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${theme.badgeBg}`}>
                            {branch.badge}
                          </span>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Branch Key Points (النقاط المهمة المتفرعة) */}
                      {isExpanded && (
                        <div className="space-y-3 pt-4">
                          {branch.items.map((item, iIdx) => {
                            const meta = getPointMeta(item, iIdx);
                            const isSelected = selectedPoint === `${branch.id}-${iIdx}`;

                            return (
                              <div
                                key={iIdx}
                                onClick={() => setSelectedPoint(isSelected ? null : `${branch.id}-${iIdx}`)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                                  isSelected
                                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                                }`}
                              >
                                {/* Left visual connector dot */}
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    {iIdx + 1}
                                  </div>

                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.tagColor}`}>
                                        {meta.tag}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        NODE {bIdx + 1}.{iIdx + 1}
                                      </span>
                                    </div>

                                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                                      {item}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom pillar status */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{contentLang === 'ar' ? 'جاهز للمراجعة الأكاديمية' : 'Review Ready'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">PILLAR-0{bIdx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: KEY POINTS MATRIX (مصفوفة النقاط المهمة) ================= */}
      {activeView === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-100">
                {contentLang === 'ar' ? 'جدول ومصفوفة النقاط الجوهرية للامتحانات' : 'Exam Key Points Matrix'}
              </h4>
              <p className="text-xs text-slate-400">
                {contentLang === 'ar' ? 'استعراض مكثف لجميع نقاط الخريطة مقسمة حسب الأهمية' : 'Intensive overview for fast revision'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {filteredBranches.reduce((acc, b) => acc + b.items.length, 0)} {contentLang === 'ar' ? 'نقطة امتحانية' : 'Points'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBranches.flatMap((b, bIdx) =>
              b.items.map((item, iIdx) => {
                const meta = getPointMeta(item, iIdx);
                return (
                  <div
                    key={`${b.id}-${iIdx}`}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.tagColor}`}>
                          {meta.tag}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {b.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                        {item}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{b.title}</span>
                      <span className="font-mono">#{bIdx + 1}.{iIdx + 1}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= BOTTOM KEY TAKEAWAYS BANNER (أهم النقاط الجوهرية) ================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-100">
                {contentLang === 'ar' ? 'أبرز الركائز والنقاط الجوهرية للخريطة (Exam Takeaways)' : 'Core Map Takeaways & Exam Tips'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {contentLang === 'ar' ? 'الخلاصات الجوهرية المستخلصة مباشرة من الخريطة الذهنية' : 'Distilled essentials for high scoring'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {takeaways.length} {contentLang === 'ar' ? 'خلاصات' : 'Pillars'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {takeaways.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-100">{item.title}</h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
