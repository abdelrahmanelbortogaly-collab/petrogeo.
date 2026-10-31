// Comprehensive Academic Translation Engine for PetroGeo Lectures, Summaries, Mindmaps, and Quizzes

export interface MindMapBranch {
  id: string;
  title: string;
  badge: string;
  color: string;
  items: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface KeyTakeawayPoint {
  id: string;
  type: 'concept' | 'equation' | 'field' | 'trap' | 'summary';
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
}

// Memory cache for AI translations so toggles are instantaneous
const translationCache = new Map<string, string>();

export async function translateTextWithAI(
  text: string,
  targetLang: 'ar' | 'en' = 'ar'
): Promise<string> {
  const cacheKey = `${targetLang}:${text.slice(0, 100)}:${text.length}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translatedText) {
        translationCache.set(cacheKey, data.translatedText);
        return data.translatedText;
      }
    }
  } catch (err) {
    console.warn('AI translation fetch error:', err);
  }

  return targetLang === 'ar' ? getFallbackArabicTranslation(text) : text;
}

// Academic Arabic translation for default lecture summaries
export function getDefaultArabicLectureSummary(
  cTitle: string,
  lecTitle: string,
  _desc?: string
): string {
  const titleLower = `${cTitle} ${lecTitle}`.toLowerCase();

  if (titleLower.includes('mineral') || titleLower.includes('crystal') || titleLower.includes('بلور') || titleLower.includes('معادن')) {
    return `### 📑 الملخص الأكاديمي الشامل: علم البلورات والمعادن
يقدم هذا الفصل دراسة تفصيلية وبتروفيزيائية معمقة لـ **${lecTitle || 'علم البلورات والمعادن الصخرية'}** ضمن متطلبات مقرر **${cTitle || 'الجيولوجيا البترولية'}**. يتمحور الهدف الأساسي حول فهم التماثل الهندسي للبلورات، والخصائص التشخيصية للمعادن الرديفة، وتأثيراتها الحاسمة على سلوك الخزانات الهيدروكربونية وأعمال الحفر.

---

### 🔬 المبادئ والآليات الفيزيائية الأساسية:
- **التماثل البلوري والأنظمة البلورية السبعة (Crystal Symmetry & 7 Systems)**: تتطابق الذرات في الشبكة الفراغية وتتكرر وفق عناصر تماثل محددة (محاور دوران، مستويات تماثل، ومركز انقلاب). يتصدر النظام المكعبي (Isometric) أعلى درجات التماثل بمحاوره الثلاثة المتساوية والمتعامدة (مثل: الهاليت، البيريت، والجارنت).
- **الخواص الفيزيائية والتشخيص اليدوي (Diagnostic Physical Properties)**: تحديد المعادن يعتمد على مقياس موس للصلادة (Mohs Scale من التلك 1 إلى الماس 10)، والانفصام البلوري (Cleavage) مقابل المكسر المحاري (Conchoidal Fracture) المميز للكوارتز، وخط المخدش (Streak) والكثافة النوعية.
- **كيمياء السيليكات وسلسلة تفاعلات بوين (Silicate Polymerization & Bowen's Series)**: الترتيب الهندسي لرباعي الأوجه [SiO4]4- يحدد مقاومة المعدن للتجوية ونمط تحلله؛ من النيزوسيليكات المنفردة (الأوليفين) إلى التكتوسيليكات ثلاثية الأبعاد (الكوارتز والفلسبارات).
- **معادن الطفلة وأضرار التكوين (Clay Minerals & Formation Damage)**: معادن السمكتيت (Smectite) تنتفخ بشدة عند ملامسة الماء العذب أثناء الحفر مما يسبب تهدم جدار البئر وغلق خانقات المسام، بينما يتسبب الإليت (Illite) الليفي في تدمير النفاذية دون تقليل المسامية الكلية بشكل ملحوظ.

---

### 📐 المعادلات والقوانين الحاكمة:
1. **قانون براج للحيود البلوري (Bragg's Law for XRD)**:
   $$n\\lambda = 2d \\sin(\\theta)$$
   *(حيث $\\lambda$ هو الطول الموجي للأشعة السينية، $d$ المسافة بين المستويات الذرية، و$\\theta$ زاوية السقوط والحيود)*

2. **معادلة مقياس الكثافة النوعية والمعادن (Specific Gravity)**:
   $$SG = \\frac{W_{air}}{W_{air} - W_{water}}$$
   *(حيث $W_{air}$ وزن العينة في الهواء، و$W_{water}$ وزنها مغمورة في الماء)*

3. **نسبة السيليكا إلى الأكسجين في السيليكات**:
   $$Si : O \\text{ Ratio}$$
   *(تتدرج من $1:4$ في النيزوسيليكات إلى $1:2$ في الكوارتز النقي)*

---

### 🛠️ التطبيقات الحقلية وهندسة الخزانات البترولية:
- **تقييم صخور الغطاء العازل (Caprock Seals)**: طبقات الأنهيدريت والملح الصخري (Evaporites) تمثل أختاماً كتيمة فائقة الكفاءة تمنع هروب الزيت والغاز عمودياً.
- **تجنب مشاكل سوائل الحفر (Drilling Mud Compatibility)**: ضبط ملوحة طفلة الحفر واستخدام أملاح البوتاسيوم (KCl) لحماية طبقات الطمي من الانتفاخ والتشتت.
- **التشخيص الميكروسكوبي للقطاعات الرقيقة (Thin Section Petrology)**: استخدام المجهر المستقطب لتحديد التوأمة البلورية في البلاجيوكليز والظلال المتموجة في الكوارتز المضغوط.

---

### 🎯 أهم نقاط الامتحانات وأسئلة الفاينال المؤكدة:
1. **التمييز الدقيق بين الانفصام والمكسر**: المايكا تمتلك انفصاماً قاعدياً كاملاً في اتجاه واحد، بينما الكوارتز عديم الانفصام تماماً وله مكسر محاري.
2. **سلوك معدن السمكتيت في الحفر**: التورم الشديد لطبقاته البلورية المتبادلة $2:1$ يمثل أكبر مسبب لالتصاق مواسير الحفر وضياع النفاذية.
3. **تماثل النظام المكعبي**: تذكر دائماً: $a = b = c$ والزوايا $\\alpha = \\beta = \\gamma = 90^\\circ$.`;
  }

  // General Petrophysics & Reservoir Arabic Summary
  return `### 📑 الملخص الأكاديمي التنفيذي للمحاضرة
تقدم هذه المحاضرة دراسة هندسية وبتروفيزيائية معمقة لموضوع **${lecTitle || 'التقييم البتروفيزيائي وحسابات الخزانات'}** ضمن مقرر **${cTitle || 'هندسة وجيولوجيا البترول'}**. يكمن الهدف الجوهري في تأسيس العلاقات الرياضية والفيزيائية الكمية التي تحكم سعة تخزين الهيدروكربونات، وحركة الموائع داخل صخور المكمن، وتفسير تسجيلات الآبار الرقمية (Wireline Logs).

---

### 🔬 المبادئ والآليات الفيزيائية الأساسية:
- **البنية المسامية وعدم التجانس البتروفيزيائي (Pore Structure & Heterogeneity)**: تمثل المسامية الكلية ($\\phi_t$) إجمالي الفراغات الحجمية في الصخر، بينما تقتصر المسامية الفعالة ($\\phi_e$) على الفراغات المتصلة فقط القابلة لتخزين وجريان الهيدروكربونات نحو قاع البئر تجارياً.
- **التشبع بالموائع والتبللية (Fluid Saturation & Wettability)**: تتوزع الموائع داخل شبكة المسام وفق توازن دقيق بين الضغط الشعيري، والشد السطحي، وتبللية الصخر، مما يحدد نسبة التشبع بالماء غير القابل للحركة ($S_{wirr}$).
- **التوصيل الكهربائي وفيزياء قانون آرتشي (Archie's Rock Physics)**: الهيدروكربونات مواد عازلة للتيار الكهربائي فترفع قراءات المقاومية الحقيقية للتكوين ($R_t$) بشكل حاد، على العكس تماماً من المياه الطبقية المالحة عالية التوصيل ($R_w$).
- **الاستجابات الإشعاعية والكتلية (Radiometric & Density Responses)**: تتميز صخور الطفلة (Shales) بقراءات إشعاعية عالية على لوج الجاما راي (GR) لاحتوائها على نظائر البوتاسيوم المشع والثوريوم واليورانيوم المتركزة في صفائح الطين.

---

### 📐 المعادلات والقوانين الحاكمة:
1. **المسامية الفعالة من لوج الكثافة (Effective Porosity)**:
   $$\\phi = \\frac{V_p}{V_b} = \\frac{\\rho_{ma} - \\rho_b}{\\rho_{ma} - \\rho_f}$$
   *(حيث $\\rho_{ma}$ كثافة مصفوفة الصخر، $\\rho_b$ الكثافة الكلية من لوج RHOB، و$\\rho_f$ كثافة مائع المسام)*

2. **قانون دارسي للجريان الخطي الطباقي (Darcy's Law)**:
   $$q = \\frac{k \\cdot A}{\\mu} \\cdot \\frac{\\Delta P}{L}$$
   *(حيث $q$ معدل التدفق، $k$ النفاذية المطلقة بوحدة الدارسي، $A$ مساحة المقطع، $\\mu$ اللزوجة الديناميكية، و$\\Delta P/L$ انحدار الضغط)*

3. **معادلة آرتشي لحساب التشبع بالماء (Archie's Equation)**:
   $$S_w = \\left(\\frac{a \\cdot R_w}{\\phi^m \\cdot R_t}\\right)^{1/n}$$
   *(حيث $a$ معامل التعقد الصخري، $m$ معامل السمنة والتماسك، $n$ معامل التشبع، و$R_t$ المقاومية الحقيقية للطبقة)*

---

### 🛠️ التطبيقات الحقلية وهندسة المكامن:
- **تحديد النطاقات المنتجة الصافية (Net Pay Cutoffs)**: دمج حدود القطع: حجم الطفلة ($V_{sh} < 30\\%$)، والمسامية الفعالة ($\\phi > 12\\%$)، والتشبع المائي ($S_w < 50\\%$) لتحديد أفضل أعماق تثقيب مواسير الإنتاج.
- **رصد تداخل الغاز الطبيعي (Gas Crossover)**: الاستدلال على قباب الغاز عبر التقاطع الواضح بين منحنى لوج النيوترون (انخفاض ظاهري) ومنحنى لوج الكثافة (ارتفاع ظاهري).
- **معايرة تسجيلات الآبار بعينات اللباب (Core-to-Log Calibration)**: ربط تسجيلات المجسات المستمرة بنتائج الفحص المعملي لعينات اللباب الدورية (RCA) لضمان أعلى دقة للحسابات.

---

### 🎯 أهم نقاط الامتحانات المؤكدة:
1. **المسامية الكلية مقابل الفعالة**: المسامية الكلية تشمل مساماً معزولة لا تسهم إطلاقاً في تدفق الزيت والغاز تجارياً.
2. **شروط تطبيق معادلة آرتشي**: تنطبق فقط على صخور الحجر الرملي النظيفة الخالية من الطين؛ وفي وجود الطفلة يجب استخدام نماذج الشالي ساند مثل Simandoux أو Waxman-Smits.
3. **النفاذية كمية اتجاهية**: النفاذية الأفقية ($k_h$) تكون دائماً أعلى بكثير من النفاذية الرأسية ($k_v$) نتيجة ترسيب الطبقات وتضاغطها.`;
}

// Arabic translation for Mind Map Branches
export function getArabicMindMapBranchesForLecture(
  cTitle: string,
  lTitle: string
): MindMapBranch[] {
  const text = `${cTitle} ${lTitle}`.toLowerCase();

  if (text.includes('mineral') || text.includes('crystal') || text.includes('silicate') || text.includes('clay') || text.includes('بلور') || text.includes('معادن')) {
    return [
      {
        id: 'branch-1',
        title: '1. التماثل البلوري والأنظمة البلورية السبعة',
        badge: 'علم البلورات',
        color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
        items: [
          'عناصر التماثل: محاور الدوران (1, 2, 3, 4, 6 أضعاف)، مستويات المرآة (m)، ومركز الانقلاب (i)',
          'النظام المكعبي (Isometric): أطوال المحاور متساوية a = b = c، وزوايا قائمة 90° (الهاليت، الجالينة، البيريت)',
          'النظام الرباعي والسداسي (Tetragonal & Hexagonal): تميز المحور الرأسي c بطول مختلف مع تماثل موشوري 90° أو 120°',
          'الأنظمة منخفضة التماثل: المعيني القائم، وأحادي الميل (الجبس والأوجيت)، وثلاثي الميل (البلاجيوكليز)',
        ],
      },
      {
        id: 'branch-2',
        title: '2. الخصائص الفيزيائية والتشخيصية للمعادن',
        badge: 'الفحص اليدوي',
        color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
        items: [
          'صلادة موس التراتبية: التلك (1) ← الكالسيت (3) ← الأباتيت (5) ← الكوارتز (7) ← الماس (10)',
          'الانفصام والمكسر: انفصام قاعدي تام في المايكا مقابل مكسر محاري مميز في عينات الكوارتز',
          'اختبار لوح المخدش (Streak): استخلاص مسحوق المعدن الحقيقي بغض النظر عن الشوائب السطحية',
          'الكثافة النوعية والانكسار المزدوج: التكرار البصري المضاعف في كالسيت الآيسلندي تحت الضوء المستقطب',
        ],
      },
      {
        id: 'branch-3',
        title: '3. كيمياء بلمرة السيليكات وتفاعلات بوين',
        badge: 'كيمياء السيليكات',
        color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        items: [
          'النيزوسيليكات: رباعيات أوجه [SiO4]4- منفصلة ترتبط بكاتيونات Fe/Mg (مجموعة الأوليفين)',
          'الإينوسيليكات: سلاسل أحادية في البيروكسين (انفصام 90°) وسلاسل مزدوجة في الأمفيبول (انفصام 124°)',
          'الفيلوسيليكات: صفائح مستمرة ثنائية الأبعاد في الطين والمايكا (المسكوفيت والبيوتيت والكاولينيت)',
          'التكتوسيليكات: شبكة بنائية ثلاثية الأبعاد لا نهائية في الكوارتز والفلسبارات البوتاسية والبلاجيوكليز',
        ],
      },
      {
        id: 'branch-4',
        title: '4. معادن الطين وصخور الغطاء الكتيمة',
        badge: 'التطبيقات البترولية',
        color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
        items: [
          'انتفاخ السمكتيت المائي: بنية طبقية قابلة للتمدد 2:1 تسبب تهدم جدار البئر وتلف تكوين الخزان',
          'تجسير الإليت الليفي للمسام: تدمير كارثي للنفاذية مع الحفاظ النسبي على المسامية الكلية',
          'التطفر الملحي والتبخيري (Evaporites): ترسيب الهاليت والأنهيدريت في الأحواض التبخيرية المغلقة',
          'صخور الغطاء الكتيمة فائقة الإحكام: طبقات الأنهيدريت اللدنة التي تمنع تماماً هروب الزيت والغاز',
        ],
      },
    ];
  }

  // Default Petrophysics & Logging Arabic Mindmap
  return [
    {
      id: 'branch-1',
      title: '1. الأسس النظرية وسعة تخزين المكمن',
      badge: 'النظرية الأساسية',
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
      items: [
        'المسامية الكلية مقابل الفعالة: الفراغات المتصلة φe المتاحة لتدفق الهيدروكربونات وإنتاجها تجارياً',
        'هندسة خانقات المسام والضغط الشعيري: منحنيات حقن الزئبق (MICP) وضغوط الإدخال للموائع',
        'التشبع المائي والنفطي (Sw, So, Sg): الشد السطحي، مناطق الانتقال الشعيرية، ومعامل التبللية الصخرية',
        'فرز الحبيبات والنسيج: الاستدارة، ونمط التراص (مكعبي 47.6% مقابل معيني 25.9%) والمواد اللاحمة',
      ],
    },
    {
      id: 'branch-2',
      title: '2. القوانين والمعادلات الحسابية الحاكمة',
      badge: 'المعادلات الرياضية',
      color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
      items: [
        'قانون دارسي للجريان الطباقي: q = (k·A/μ)·(ΔP/L) [يحكم حركة الموائع في الأوساط المسامية]',
        'معادلة آرتشي الكهربائية: Sw = ((a·Rw)/(φ^m · Rt))^(1/n) [حساب التشبع بالماء من المقاومية الكهربائية]',
        'معامل التكوين الصخري: F = a / φ^m (معامل السمنتة m ≈ 2.0 في الأحجار الرملية النظيفة المتماسكة)',
        'مسامية الكثافة: φ_density = (ρ_matrix - ρ_bulk) / (ρ_matrix - ρ_fluid)',
      ],
    },
    {
      id: 'branch-3',
      title: '3. مجسات تسجيل الآبار والتقاطعات البيانية',
      badge: 'تسجيلات الآبار',
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
      items: [
        'الجاما راي (GR): قراءات API عالية في طبقات الطفلة المشعة (K, U, Th)، وقراءات منخفضة في الرمال النظيفة',
        'الحث العميق والمقاومية (ILd/Rt): المقاومية العالية تشير مباشرة لوجود نفط أو غاز عازل للكهرباء',
        'النيوترون والكثافة (RHOB-NPHI): تداخل الغاز ينتج تقاطعاً بارزاً ومؤشراً مباشراً لوجود الغاز الطبيعي',
        'المجس الصوتي وسرعة الموجات (Sonic DT): معادلة ويلي Wyllie لاستنتاج المسامية الصوتية الأولية',
      ],
    },
    {
      id: 'branch-4',
      title: '4. القرارات الحقلية وحدود النطاق المنتج الصافي',
      badge: 'تقييم الحقل والمكمن',
      color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
      items: [
        'أسطح تلامس الموائع: منسوب المياه الحرة (FWL)، والتلامس النفطي-المائي (OWC)، والغازي-النفطي (GOC)',
        'حدود القطع للطبقات المنتجة (Net Pay Cutoffs): حجم طين Vsh < 30%، مسامية φ > 12%، تشبع مائي Sw < 50%',
        'الحسابات الحجمية للزيت الأصلي في المكمن: OOIP = 7758 · A · h · φ · (1 - Sw) / Boi [برميل قياسي]',
        'معالجة تلف التكوين: مطابقة ملوحة طين الحفر المائي لحماية طبقات السمكتيت من التورم وغلق المسام',
      ],
    },
  ];
}

// Arabic translation for Quiz Questions
export function getArabicQuizForLecture(
  cTitle: string,
  lTitle: string
): QuizQuestion[] {
  const t = `${cTitle} ${lTitle}`.toLowerCase();

  if (t.includes('mineral') || t.includes('crystal') || t.includes('silicate') || t.includes('clay') || t.includes('بلور') || t.includes('معادن')) {
    return [
      {
        id: 'lq1',
        question: 'أي من الأنظمة البلورية التالية يتميز بثلاثة محاور متعامدة ومتساوية تماماً في الطول (a = b = c والزوايا α = β = γ = 90°)؟',
        options: ['النظام المكعبي (Isometric / Cubic)', 'النظام الرباعي (Tetragonal)', 'النظام المعيني القائم (Orthorhombic)', 'نظام أحادي الميل (Monoclinic)'],
        correctAnswer: 0,
        explanation: 'النظام المكعبي يمتلك أعلى درجة تماثل بلوري بين جميع الأنظمة مع تماثل محاوره الثلاثة المتعامدة بزوايا 90 درجة.',
      },
      {
        id: 'lq2',
        question: 'ما هي الخاصية التشخيصية الحاسمة للانفصام التي تميز عينات المايكا (البيوتيت والمسكوفيت) عن عينات الكوارتز في العينات اليدوية؟',
        options: [
          'المايكا تمتلك انفصاماً قاعدياً كاملاً في اتجاه واحد؛ بينما الكوارتز عديم الانفصام وله مكسر محاري.',
          'المايكا تبلغ صلادتها 10 على مقياس موس.',
          'المايكا لها اتجاهان للانفصام بزاوية 90 درجة.',
          'المايكا تذوب مباشرة في الماء العذب.',
        ],
        correctAnswer: 0,
        explanation: 'معادن الفيلوسيليكات (المايكا) تنفصل في صفائح متوازية على مستوى قاعدي واحد، بينما شبكة الكوارتز ثلاثية الأبعاد لا تنفصم إطلاقاً وتنكسر بشكل محاري.',
      },
      {
        id: 'lq3',
        question: 'لماذا تسبب معادن طين السمكتيت (Smectite) تلفاً حاداً لتكوين الخزان البترولي عند ملامستها للماء العذب أثناء الحفر؟',
        options: [
          'لأن السمكتيت ينكمش ويسقط في قاع البئر.',
          'لأن بنيتها الشبكية القابلة للتمدد (2:1) تمتص جزيئات الماء وتنتفخ بشدة فتسد خانقات المسام.',
          'لأنها تذوب وتتحول إلى قطران أسفلتي.',
          'لأنها تصدر إشعاعات جاما قوية تتلف دقاق الحفر.',
        ],
        correctAnswer: 1,
        explanation: 'الطبقات البينية القابلة للتمدد في السمكتيت تتشرب بالماء وتتضاعف أحجامها لعدة مرات، مما يسبب انسداد المسام وتهدم جدران الآبار وخسارة النفاذية.',
      },
    ];
  }

  return [
    {
      id: 'lq1',
      question: `في التقييم البتروفيزيائي لـ ${lTitle || 'المكمن البترولي'}، ما هو الفارق الجوهري بين المسامية الكلية (Total Porosity) والمسامية الفعالة (Effective Porosity)؟`,
      options: [
        'المسامية الكلية تقيس إجمالي الفراغات؛ بينما المسامية الفعالة تقيس فقط المسام المتصلة القابلة لحركة الموائع وإنتاجها.',
        'المسامية الفعالة تكون دائماً أكبر حجماً من المسامية الكلية.',
        'المسامية الكلية تستبعد المياه المحتبسة في الطين.',
        'لا يوجد أي فرق بينهما في الحسابات الهندسية.',
      ],
      correctAnswer: 0,
      explanation: 'المسامية الفعالة تمثل شبكة الفراغات المترابطة التي يمكن للموائع الهيدروكربونية أن تتدفق من خلالها تجارياً نحو قاع بئر الإنتاج.',
    },
    {
      id: 'lq2',
      question: 'وفقاً لمعادلة آرتشي التجريبية، ماذا يحدث للمقاومية الكهربائية الحقيقية (Rt) للتكوين عندما يشغل الزيت أو الغاز الفراغات المسامية؟',
      options: [
        'ترتفع المقاومية بشكل ملحوظ لأن الهيدروكربونات مواد عازلة غير موصلة للكهرباء.',
        'تنخفض المقاومية لتصل إلى ما يقارب الصفر.',
        'تبقى المقاومية مطابقة تماماً لمقاومية الماء المالح النقي.',
        'يصبح معامل التكوين الصخري F سالباً.',
      ],
      correctAnswer: 0,
      explanation: 'الهيدروكربونات بطبيعتها عازلة لا توصل التيار، واستبدال الماء الملحي عالي التوصيل بالزيت والغاز يرفع قيمة المقاومية Rt بنسب هائلة.',
    },
    {
      id: 'lq3',
      question: 'في قانون دارسي للجريان الطباقي (q = k·A·ΔP / μ·L)، كيف يؤثر مضاعفة لزوجة النفط الخام (μ) على معدل الإنتاج الحجمي (q)؟',
      options: [
        'ينخفض معدل التدفق إلى النصف (علاقة عكسية).',
        'يتضاعف معدل التدفق إلى الضعف.',
        'تتضاعف النفاذية أربعة أضعاف.',
        'لا يحدث أي تغيير على معدل التدفق.',
      ],
      correctAnswer: 0,
      explanation: 'في معادلة دارسي، معدل التدفق q يتناسب عكسياً مع لزوجة المائع μ، فمضاعفة اللزوجة تقلل التدفق إلى 50%.',
    },
  ];
}

// Fallback dictionary-based translation
function getFallbackArabicTranslation(text: string): string {
  let translated = text;

  const dict: [RegExp, string][] = [
    [/Executive Summary/gi, 'الملخص التنفيذي'],
    [/Key Takeaways/gi, 'أهم النقاط المستفادة'],
    [/Hierarchical Knowledge Mind Map/gi, 'الخريطة الذهنية المعرفية الهرمية'],
    [/Central Topic/gi, 'الموضوع المركزي'],
    [/Core Pillars/gi, 'الركائز الأساسية'],
    [/Practice Exam & MCQs/gi, 'الامتحان والأسئلة التدريبية'],
    [/Lecture Assessment/gi, 'تقييم المحاضرة والأسئلة'],
    [/Syllabus & Lab/gi, 'المحاضرة والسكشن العملي'],
    [/Lecture Overview & Syllabus Description/gi, 'نظرة عامة على المحاضرة وتوصيف المنهج'],
    [/Practical Sections & Lab Materials/gi, 'السكاشن والتطبيقات المعملية العملية'],
    [/Practical Section Video/gi, 'فيديو السكشن العملي'],
    [/Teaching Assistant/gi, 'المعيد المشرف'],
    [/Section/gi, 'السكشن'],
    [/Total Porosity/gi, 'المسامية الكلية'],
    [/Effective Porosity/gi, 'المسامية الفعالة'],
    [/Permeability/gi, 'النفاذية'],
    [/Water Saturation/gi, 'التشبع بالماء'],
    [/Resistivity/gi, 'المقاومية الكهربائية'],
    [/Gamma Ray/gi, 'أشعة جاما'],
    [/Darcy's Law/gi, 'قانون دارسي'],
    [/Archie's Equation/gi, 'معادلة آرتشي'],
    [/Net Pay/gi, 'النطاق المنتج الصافي'],
    [/Crystallography/gi, 'علم البلورات'],
    [/Mineralogy/gi, 'علم المعادن'],
    [/Rock Cycle/gi, 'دورة الصخور'],
    [/Sedimentary/gi, 'رسوبي'],
    [/Petrophysics/gi, 'البتروفيزياء'],
  ];

  for (const [re, rep] of dict) {
    translated = translated.replace(re, rep);
  }

  return translated;
}

// Key Takeaway Points Generator for Mind Maps and Revision
export function getKeyTakeawaysForLecture(
  courseTitle: string,
  lectureTitle: string,
  lang: 'ar' | 'en' = 'ar'
): KeyTakeawayPoint[] {
  const query = `${courseTitle} ${lectureTitle}`.toLowerCase();

  if (query.includes('mineral') || query.includes('crystal') || query.includes('بلور') || query.includes('معادن')) {
    if (lang === 'en') {
      return [
        {
          id: 'kt-1',
          type: 'concept',
          badge: 'Core Concept',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          title: 'Crystal Symmetry & 7 Systems',
          description: 'Isometric (Cubic) system exhibits the highest symmetry (a=b=c, α=β=γ=90°), governing primary mineral lattice stability.',
        },
        {
          id: 'kt-2',
          type: 'equation',
          badge: 'Governing Law',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          title: "Bragg's Law for XRD",
          description: 'nλ = 2d·sin(θ) enables precise identification of sub-microscopic clay crystal lattice spacing and mineral species.',
        },
        {
          id: 'kt-3',
          type: 'field',
          badge: 'Field Application',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          title: 'Wellsite Logging & Cleavage vs Fracture',
          description: 'Quartz shows diagnostic conchoidal fracture with zero cleavage, whereas calcite displays perfect rhombohedral 3-directional cleavage.',
        },
        {
          id: 'kt-4',
          type: 'trap',
          badge: 'Common Exam Trap',
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          title: 'Smectite Swelling Risk',
          description: 'Never use untreated freshwater muds in smectite-rich shale zones; severe hydration swelling causes stuck pipe and formation damage.',
        },
        {
          id: 'kt-5',
          type: 'summary',
          badge: 'Reservoir Seal',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          title: 'Evaporite Caprocks',
          description: 'Anhydrite and halite beds provide plastic, impermeable caprock seals essential for trapping large hydrocarbon columns.',
        },
      ];
    }

    return [
      {
        id: 'kt-1',
        type: 'concept',
        badge: 'المفهوم الجوهري',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        title: 'التماثل والأنظمة البلورية السبعة',
        description: 'النظام المكعبي (Isometric) يمثل قمة التماثل البلوري بمحاوره المتساوية والمتعامدة (a=b=c والزوايا 90°)، وهو الحاكم لمعادن مثل البيريت والهاليت.',
      },
      {
        id: 'kt-2',
        type: 'equation',
        badge: 'القانون الحاسم',
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        title: 'قانون براج لحيود الأشعة السينية (XRD)',
        description: 'المعادلة nλ = 2d·sin(θ) هي المرجع العلمي المعملي لتحديد المسافات البينية للشبكة البلورية وتشخيص معادن الطين المجهرية بدقة.',
      },
      {
        id: 'kt-3',
        type: 'field',
        badge: 'التطبيق الحقلي',
        badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        title: 'التفرقة الحقلية بين الانفصام والمكسر',
        description: 'الكوارتز يتميز بمكسر محاري صلب دون أي انفصام، بينما الكالسيت يمتلك انفصاماً معينياً مثالياً في 3 اتجاهات ويتفاعل فوراً مع حمض HCl المخفف.',
      },
      {
        id: 'kt-4',
        type: 'trap',
        badge: 'فخ الامتحانات المتكرر',
        badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        title: 'انتفاخ السمكتيت وضياع النفاذية',
        description: 'احذر: الطفلة الحاوية للسمكتيت تنتفخ وتغلق المسام عند ملامسة الماء العذب، بينما الإليت يدمر النفاذية دون المساس بالمسامية الكلية.',
      },
      {
        id: 'kt-5',
        type: 'summary',
        badge: 'صخور الغطاء والختم',
        badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        title: 'صخور المتبخرات (الأنهيدريت والهاليت)',
        description: 'طبقات الأنهيدريت والملح الصخري تمثل أفضل صخور غطاء (Caprock Seal) في مصائد البترول نتيجة لدونتها وعدم نفاذيتها المطلقة للهيدروكربونات.',
      },
    ];
  }

  // General Petrophysics & Reservoir Engineering Takeaways
  if (lang === 'en') {
    return [
      {
        id: 'kt-1',
        type: 'concept',
        badge: 'Core Concept',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        title: 'Effective vs Total Porosity',
        description: 'Only Effective Porosity (φe) contributes to commercial hydrocarbon storage and Darcy flow; isolated non-connected pores must be excluded.',
      },
      {
        id: 'kt-2',
        type: 'equation',
        badge: 'Governing Formula',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        title: "Archie's Water Saturation",
        description: 'Sw = [(a·Rw) / (φ^m · Rt)]^(1/n). Hydrocarbon volume fraction in pore space is strictly given by (1 - Sw).',
      },
      {
        id: 'kt-3',
        type: 'field',
        badge: 'Wireline Log Signature',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        title: 'Density-Neutron Gas Crossover',
        description: 'Gas presence dramatically decreases apparent neutron porosity while decreasing formation bulk density, causing clear curve balloon crossover.',
      },
      {
        id: 'kt-4',
        type: 'trap',
        badge: 'Common Exam Trap',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        title: 'Archie Shaly-Sand Limitations',
        description: 'Standard Archie equation assumes non-conductive rock matrix; applying it in shaly sands causes severely overestimated water saturation!',
      },
      {
        id: 'kt-5',
        type: 'summary',
        badge: 'Net Pay Cutoffs',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        title: 'Perforation Criteria',
        description: 'Commercial production interval selection requires simultaneous compliance with Vshale < 30%, φ > 12%, and Sw < 50%.',
      },
    ];
  }

  return [
    {
      id: 'kt-1',
      type: 'concept',
      badge: 'المفهوم الجوهري',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      title: 'المسامية الفعالة مقابل المسامية الكلية',
      description: 'المسامية الفعالة (Effective Porosity) هي الأساس الوحيد لحساب حجم الزيت والغاز القابل للإنتاج، حيث تستبعد المسام المعزولة غير المتصلة.',
    },
    {
      id: 'kt-2',
      type: 'equation',
      badge: 'القانون الحاسم',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      title: 'معادلة آرتشي للتشبع المائي (Archie Law)',
      description: 'المعادلة Sw = [(a·Rw) / (φ^m · Rt)]^(1/n)؛ نسبة تشبع المكمن بالهيدروكربونات تساوي تماماً (1 - Sw)، وأس التماسك m ≈ 2 للحجر الرملي النظيف.',
    },
    {
      id: 'kt-3',
      type: 'field',
      badge: 'الاستجابة الحقلية في الآبار',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      title: 'تراكب لوج الكثافة والنيوترون (Gas Crossover)',
      description: 'تباعد منحنى الكثافة (RHOB) جهة اليسار ومنحنى النيوترون (NPHI) جهة اليمين دليل مؤكد وقاطع على وجود الغاز الطبيعي الحر في الطبقة.',
    },
    {
      id: 'kt-4',
      type: 'trap',
      badge: 'فخ الامتحانات المتكرر',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      title: 'خطأ تطبيق آرتشي في وجود الطين',
      description: 'احذر: معادلة آرتشي تفترض مصفوفة عازلة تماماً؛ تطبيقها في صخور الطين يعطي تشبع ماء كاذب مرتفعاً بسبب التوصيل الكهربائي لصفائح الطفلة.',
    },
    {
      id: 'kt-5',
      type: 'summary',
      badge: 'حدود النطاق المنتج (Net Pay)',
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      title: 'معايير اختيار أعماق التثقيب',
      description: 'لتثقيب البئر بنجاح يجب تحقق الشروط الثلاثة معاً: حجم الطين Vsh < 30%، والمسامية φ > 12%، والتشبع بالماء Sw < 50%.',
    },
  ];
}
