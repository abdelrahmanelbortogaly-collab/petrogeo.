-- =========================================================================
-- PETROGEO Academic Platform - Complete Supabase Database Schema & RLS Setup
-- =========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_
-- 2. Go to the "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Students, Doctors, Admins)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  year INT NOT NULL CHECK (year IN (1, 2, 3, 4)) DEFAULT 1,
  department TEXT NOT NULL DEFAULT 'قسم الجيولوجيا والبترول',
  role TEXT NOT NULL CHECK (role IN ('student', 'doctor', 'admin')) DEFAULT 'student',
  avatar TEXT,
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('none', 'pending', 'active', 'rejected')) DEFAULT 'none',
  subscription_expires_at TIMESTAMPTZ,
  bound_device_id TEXT,
  bound_device_name TEXT,
  bound_at TIMESTAMPTZ,
  active_session_token TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -------------------------------------------------------------------------
-- 2. COURSES (Academic Curriculum across 4 Years)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  year INT NOT NULL CHECK (year IN (1, 2, 3, 4)),
  category TEXT NOT NULL DEFAULT 'تخصصي',
  thumbnail TEXT NOT NULL,
  instructor TEXT NOT NULL,
  total_lectures INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_year ON public.courses(year);

-- -------------------------------------------------------------------------
-- 3. LECTURES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lectures (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '45 دقيقة',
  description TEXT,
  video_url TEXT NOT NULL,
  pdf_url TEXT,
  pdf_file_name TEXT,
  pdf_file_size TEXT,
  section_notes TEXT,
  order_index INT NOT NULL DEFAULT 1,
  source_type TEXT NOT NULL DEFAULT 'link' CHECK (source_type IN ('link', 'upload')),
  file_name TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lectures_course_id ON public.lectures(course_id);

-- -------------------------------------------------------------------------
-- 4. LECTURE SECTIONS (Lab & Practical Sections)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lecture_sections (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructor TEXT,
  description TEXT,
  video_url TEXT,
  video_file_name TEXT,
  video_file_size TEXT,
  video_source_type TEXT DEFAULT 'upload',
  pdf_url TEXT,
  pdf_file_name TEXT,
  pdf_file_size TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lecture_sections_lecture_id ON public.lecture_sections(lecture_id);

-- -------------------------------------------------------------------------
-- 5. EXAMS (Quizzes, Midterms, Finals)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  year INT NOT NULL CHECK (year IN (1, 2, 3, 4)),
  type TEXT NOT NULL CHECK (type IN ('quiz', 'midterm', 'final')) DEFAULT 'quiz',
  duration_minutes INT NOT NULL DEFAULT 15,
  total_marks INT NOT NULL DEFAULT 20,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  due_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_year ON public.exams(year);

-- -------------------------------------------------------------------------
-- 6. QUESTIONS (Multi-Question Builder)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INT NOT NULL DEFAULT 0,
  explanation TEXT,
  order_index INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);

-- -------------------------------------------------------------------------
-- 7. EXAM RESULTS (Student Submissions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_title TEXT NOT NULL,
  course_title TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  total_marks NUMERIC NOT NULL DEFAULT 20,
  percentage NUMERIC NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_results_student ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON public.exam_results(exam_id);

-- -------------------------------------------------------------------------
-- 8. STUDENT PROGRESS (Lectures watched & Course completion)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_progress (
  student_id TEXT PRIMARY KEY,
  completed_lecture_ids JSONB DEFAULT '[]'::jsonb,
  course_progress JSONB DEFAULT '{}'::jsonb,
  overall_percentage NUMERIC DEFAULT 0,
  last_active_lecture_id TEXT,
  last_active_course_id TEXT,
  last_active_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 9. ANNOUNCEMENTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_year TEXT NOT NULL DEFAULT 'all',
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
  author TEXT NOT NULL DEFAULT 'إدارة المنصة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 10. SCHEDULES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  year INT NOT NULL CHECK (year IN (1, 2, 3, 4)),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'محاضرة',
  location TEXT NOT NULL DEFAULT 'مدرج 1',
  instructor TEXT NOT NULL DEFAULT 'د. هيئة التدريس'
);

CREATE INDEX IF NOT EXISTS idx_schedules_year ON public.schedules(year);

-- -------------------------------------------------------------------------
-- 11. PAYMENTS (InstaPay Subscriptions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_year INT NOT NULL DEFAULT 1,
  student_department TEXT NOT NULL DEFAULT 'قسم الجيولوجيا والبترول',
  amount NUMERIC NOT NULL DEFAULT 150,
  sender_phone TEXT NOT NULL,
  reference_number TEXT,
  receipt_image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- -------------------------------------------------------------------------
-- 12. PLATFORM SETTINGS (Free vs Paid mode, InstaPay number, Single device)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  is_paid_mode BOOLEAN NOT NULL DEFAULT FALSE,
  strict_single_device BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_price NUMERIC NOT NULL DEFAULT 150,
  instapay_number TEXT NOT NULL DEFAULT '01007821389',
  instapay_account_name TEXT NOT NULL DEFAULT 'م. عبدالرحمن محمد',
  instapay_username TEXT DEFAULT 'abdelrahman@instapay',
  subscription_duration TEXT NOT NULL DEFAULT 'فصل دراسي كامل',
  payment_instructions TEXT NOT NULL DEFAULT 'حول مبلغ الاشتراك عبر تطبيق InstaPay إلى رقم الموبايل أعلاه، ثم ارفع لقطة شاشة لإيصال التحويل لتفعيل اشتراكك فوراً.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default platform settings if not exists
INSERT INTO public.platform_settings (id, is_paid_mode, strict_single_device, subscription_price, instapay_number, instapay_account_name, instapay_username, subscription_duration)
VALUES ('main', FALSE, TRUE, 150, '01007821389', 'م. عبدالرحمن محمد', 'abdelrahman@instapay', 'فصل دراسي كامل')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to get current user academic year
CREATE OR REPLACE FUNCTION public.get_current_user_year()
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT year FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- Helper function to check if current user is doctor or admin
CREATE OR REPLACE FUNCTION public.is_doctor_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role IN ('admin', 'doctor') FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- 1. Profiles RLS
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin());

-- 2. Courses RLS (Students see their year; doctors/admins see all)
CREATE POLICY "Students see courses for their academic year"
  ON public.courses FOR SELECT TO authenticated
  USING (
    public.is_doctor_or_admin() OR
    year = public.get_current_user_year()
  );

CREATE POLICY "Admins and doctors manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (public.is_doctor_or_admin());

-- 3. Lectures RLS
CREATE POLICY "Lectures viewable if student can view course"
  ON public.lectures FOR SELECT TO authenticated
  USING (
    public.is_doctor_or_admin() OR
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lectures.course_id
      AND c.year = public.get_current_user_year()
    )
  );

CREATE POLICY "Admins and doctors manage lectures"
  ON public.lectures FOR ALL TO authenticated
  USING (public.is_doctor_or_admin());

-- 4. Lecture Sections RLS
CREATE POLICY "Sections viewable by students of the course"
  ON public.lecture_sections FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admins and doctors manage sections"
  ON public.lecture_sections FOR ALL TO authenticated
  USING (public.is_doctor_or_admin());

-- 5. Exams RLS
CREATE POLICY "Students see published exams for their year"
  ON public.exams FOR SELECT TO authenticated
  USING (
    public.is_doctor_or_admin() OR
    (is_published = TRUE AND year = public.get_current_user_year())
  );

CREATE POLICY "Admins and doctors manage exams"
  ON public.exams FOR ALL TO authenticated
  USING (public.is_doctor_or_admin());

-- 6. Questions RLS
CREATE POLICY "Questions viewable for accessible exams"
  ON public.questions FOR SELECT TO authenticated
  USING (
    public.is_doctor_or_admin() OR
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = questions.exam_id
      AND e.is_published = TRUE
      AND e.year = public.get_current_user_year()
    )
  );

CREATE POLICY "Admins and doctors manage questions"
  ON public.questions FOR ALL TO authenticated
  USING (public.is_doctor_or_admin());

-- 7. Exam Results RLS
CREATE POLICY "Students view own exam results"
  ON public.exam_results FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()::text OR
    public.is_doctor_or_admin()
  );

CREATE POLICY "Students insert own exam result"
  ON public.exam_results FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()::text OR public.is_doctor_or_admin());

-- 8. Student Progress RLS
CREATE POLICY "Students view and update own progress"
  ON public.student_progress FOR ALL TO authenticated
  USING (
    student_id = auth.uid()::text OR
    public.is_doctor_or_admin()
  );

-- 9. Announcements & Schedules RLS
CREATE POLICY "Announcements viewable by target year or all"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    target_year = 'all' OR
    target_year = public.get_current_user_year()::text OR
    public.is_doctor_or_admin()
  );

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Schedules viewable by student year"
  ON public.schedules FOR SELECT TO authenticated
  USING (
    year = public.get_current_user_year() OR
    public.is_doctor_or_admin()
  );

CREATE POLICY "Admins manage schedules"
  ON public.schedules FOR ALL TO authenticated
  USING (public.is_admin());

-- 10. Payments RLS
CREATE POLICY "Students view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()::text OR
    public.is_admin()
  );

CREATE POLICY "Students create payment request"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Admins manage payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.is_admin());

-- 11. Platform Settings RLS
CREATE POLICY "Anyone authenticated can read platform settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admins update platform settings"
  ON public.platform_settings FOR ALL TO authenticated
  USING (public.is_admin());

-- -------------------------------------------------------------------------
-- AUTH TRIGGER: Automatically create profile row when user signs up
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    year,
    department,
    role,
    avatar,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'year')::int, 1),
    COALESCE(NEW.raw_user_meta_data->>'department', 'قسم الجيولوجيا والبترول'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- STORAGE BUCKETS (for PDFs, Videos, Receipts)
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('course-materials', 'course-materials', true),
  ('receipts', 'receipts', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies: Public read for course materials
CREATE POLICY "Public read course-materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users upload course materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Public read receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');

-- -------------------------------------------------------------------------
-- INITIAL REAL SEED DATA (Curriculum across 4 Years)
-- -------------------------------------------------------------------------
INSERT INTO public.courses (id, title, code, description, year, category, thumbnail, instructor, total_lectures)
VALUES
  ('c-petrophysics', 'البتروفيزياء وتسجيلات الآبار (Petrophysics & Well Logging)', 'PETRO-301', 'دراسة تفصيلية لخواص صخور الخزان البترولي (المسامية، النفاذية، التشبع بالسوائل) وتفسير منحنيات تسجيلات الآبار المفتوحة (Gamma Ray, Resistivity, Neutron-Density) لحساب الهيدروكربون المخزون.', 3, 'تخصصي بترول', 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&q=80&w=800', 'د. عبدالرحمن محمد', 4),
  ('c-structural-geo', 'الجيولوجيا التركيبية المتقدمة (Structural Geology)', 'GEO-201', 'تحليل التشوهات التكتونية، الفوالق العادية والعكسية، الطيات، وعلاقتها بالمصائد البترولية في خليج السويس والصحراء الغربية بمصر.', 2, 'تخصصي جيولوجيا', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800', 'د. محمود سليم', 3),
  ('c-sedimentology', 'علم الرسوبيات والطبقات (Sedimentology & Stratigraphy)', 'GEO-202', 'دراسة البيئات الترسيبية القارية والبحرية، تتابع الصخور الرسوبية، وتوزيع صخور المصدر وصخور الخزان في الأحواض الترسيبية المصرية.', 2, 'تخصصي جيولوجيا', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800', 'د. سارة عادل', 2),
  ('c-general-geology', 'مبادئ الجيولوجيا العامة والبلورات (Physical Geology)', 'GEO-101', 'المدخل الأساسي لعلوم الأرض، المعادن المكونة للصخور، دورة الصخور، والتراكيب الجيولوجية الأولية.', 1, 'علوم أساسية', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800', 'أ.د. حامد النجار', 3),
  ('c-reservoir-eng', 'هندسة المكامن البترولية وحساب الاحتياطي (Reservoir Engineering)', 'PETRO-401', 'طرق حساب المخزون الهيدروكربوني الأولي في المكان (STOIIP)، معادلة التوازن المادي (Material Balance)، وآليات دفع المكمن الطبيعية.', 4, 'متقدم بترول', 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=800', 'د. طارق فاروق', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Lectures
INSERT INTO public.lectures (id, course_id, title, duration, description, video_url, pdf_url, pdf_file_name, pdf_file_size, section_notes, order_index, source_type)
VALUES
  ('lec-1', 'c-petrophysics', 'المحاضرة 1: مدخل البتروفيزياء ومسامية الصخور (Porosity Analysis)', '52 دقيقة', 'شرح أنواع المسامية الأولية والثانوية وقوانين أرشي (Archie Equations) لحساب التشبع المائي.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '/uploads/petrophysics_porosity_notes.pdf', 'petrophysics_porosity_notes.pdf', '4.2 MB', 'سكشن قياس الكثافة والمسامية باستخدام عينات اللباب (Core Plugs) في المعمل.', 1, 'link'),
  ('lec-2', 'c-petrophysics', 'المحاضرة 2: تسجيلات أشعة جاما وتحديد الطفلة (Gamma Ray Logging)', '48 دقيقة', 'كيفية استخدام منحنى أشعة جاما لتمييز الصخور الرملية عن الطينية وحساب حجم الطفلة (Vshale).', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', '/uploads/gamma_ray_interpretation.pdf', 'gamma_ray_interpretation.pdf', '3.8 MB', 'سكشن عملي على قراءة لوج جاما راي لحقل غرب الدلتا العميق.', 2, 'link'),
  ('lec-struct-1', 'c-structural-geo', 'المحاضرة 1: التراكيب الجيولوجية الأولية والفوالق التكتونية (Fault Systems)', '45 دقيقة', 'تصنيف الفوالق ودور الصدوع في تكوين المصائد البترولية المصمتة والنافذة.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '/uploads/structural_geology_faults.pdf', 'structural_geology_faults.pdf', '5.1 MB', 'سكشن تدريب على رسم المقاطع الجيولوجية المتعامدة وحساب رمية الفالق (Throw).', 1, 'link'),
  ('lec-gen-1', 'c-general-geology', 'المحاضرة 1: مقدمة كوكب الأرض ودورة الصخور (Earth Materials & Rock Cycle)', '40 دقيقة', 'الفرق بين الصخور النارية والرسوبية والمتحولة وخصائص كل منها في الحقل.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', '/uploads/physical_geology_intro.pdf', 'physical_geology_intro.pdf', '2.9 MB', 'التعرف الميكروسكوبي على المعادن الأكثر شيوعاً.', 1, 'link')
ON CONFLICT (id) DO NOTHING;

-- Seed Exams
INSERT INTO public.exams (id, title, course_id, course_title, year, type, duration_minutes, total_marks, is_published)
VALUES
  ('exam-petro-quiz1', 'كويز البتروفيزياء الشامل: قياسات المسامية والتشبع (Quiz 1)', 'c-petrophysics', 'البتروفيزياء وتسجيلات الآبار', 3, 'quiz', 15, 20, TRUE),
  ('exam-struct-quiz1', 'كويز الجيولوجيا التركيبية: تحليل الفوالق والمصائد (Quiz 1)', 'c-structural-geo', 'الجيولوجيا التركيبية المتقدمة', 2, 'quiz', 20, 20, TRUE),
  ('exam-gen-quiz1', 'كويز الجيولوجيا العامة: دورة الصخور والمعادن', 'c-general-geology', 'مبادئ الجيولوجيا العامة والبلورات', 1, 'quiz', 15, 15, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Questions
INSERT INTO public.questions (id, exam_id, text, options, correct_answer, explanation, order_index)
VALUES
  ('q-petro-1', 'exam-petro-quiz1', 'ما هي العلاقة الرياضية الصحيحة لمعادلة أرشي لحساب معامل التكوين الصخري (Formation Factor F)؟', '["F = a / (Phi ^ m)", "F = Phi * Rw", "F = Rt / Rw", "F = Vsh * 100"]'::jsonb, 0, 'وفقاً لمعادلة أرشي الأولى: F = a / (phi^m) حيث a هو معامل التلاصق و m هو أس الإسمنتية التكوينية.', 1),
  ('q-petro-2', 'exam-petro-quiz1', 'أي تسجيل من التسجيلات التالية هو الأنسب لتمييز صخور الخزان الرملية النظيفة عن طبقات الطفلة (Shale)؟', '["تسجيل أشعة جاما (Gamma Ray)", "تسجيل الصوتيات (Sonic Log)", "تسجيل المقاومية العميقة فقط", "تسجيل درجة الحرارة"]'::jsonb, 0, 'تسجيل أشعة جاما يقيس النشاط الإشعاعي الطبيعي للبوتاسيوم واليورانيوم والثوريوم المتواجد بكثرة في معادن الطين داخل صخور الطفلة.', 2),
  ('q-petro-3', 'exam-petro-quiz1', 'المسامية الفعالة (Effective Porosity) تعبر عن:', '["حجم الفراغات المتصلة فقط القابلة لتدفق السوائل", "إجمالي حجم الفراغات الكلية سواء متصلة أو مغلقة", "نسبة حجم حبيبات الصخر إلى الحجم الكلي", "حجم الماء المتبقي غير القابل للإنتاج"]'::jsonb, 0, 'المسامية الفعالة هي نسبة الفراغات البينية المتصلة ببعضها والتي تسمح للبترول والغاز بالتدفق نحو البئر.', 3),
  ('q-struct-1', 'exam-struct-quiz1', 'في الفالق العادي (Normal Fault)، تتحرك صخور الحائط المعلق (Hanging Wall):', '["إلى الأسفل بالنسبة للحائط السفلي (Footwall)", "إلى الأعلى نتيجة قوى الضغط التكتوني", "حركة أفقية بحتة دون إزاحة رأسية", "لا تتحرك صخور الحائط المعلق"]'::jsonb, 0, 'الفالق العادي ينتج عن قوى الشد التكتونية (Extensional Forces) وتتحرك فيه صخور الحائط المعلق لأسفل.', 1),
  ('q-gen-1', 'exam-gen-quiz1', 'أي من الصخور التالية يصنف كصخر رسوبي كيميائي المنشأ؟', '["الحجر الجيري والجبس (Evaporites)", "الجرانيت الناري", "الرخام المتحول", "البازلت البركاني"]'::jsonb, 0, 'الجبس والملح والحجر الجيري تتكون نتيجة الترسيب الكيميائي المباشر من المحاليل المائية فوق المشبعة.', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Schedules
INSERT INTO public.schedules (id, year, day, time, subject, type, location, instructor)
VALUES
  ('sch-1', 3, 'الأحد', '09:00 ص - 11:00 ص', 'البتروفيزياء وتسجيلات الآبار', 'محاضرة', 'مدرج د. مصطفى خليل (مبنى التعدين)', 'د. عبدالرحمن محمد'),
  ('sch-2', 3, 'الأحد', '11:30 ص - 01:30 م', 'سكشن تسجيلات الآبار العملي', 'سكشن', 'معمل البتروفيزياء واللباب الصخري', 'م. سيف الدين'),
  ('sch-3', 2, 'الإثنين', '10:00 ص - 12:00 م', 'الجيولوجيا التركيبية المتقدمة', 'محاضرة', 'مدرج 2 جيولوجيا', 'د. محمود سليم'),
  ('sch-4', 1, 'الثلاثاء', '08:30 ص - 10:30 ص', 'مبادئ الجيولوجيا العامة', 'محاضرة', 'المدرج الرئيسي للفرقة الأولى', 'أ.د. حامد النجار')
ON CONFLICT (id) DO NOTHING;

-- Seed Announcements
INSERT INTO public.announcements (id, title, content, target_year, priority, author)
VALUES
  ('ann-1', 'بدء التسجيل وفتح محاضرات الفصل الدراسي الجديد', 'أهلاً بكم في منصة PETROGEO الأكاديمية. تم رفع محاضرات البتروفيزياء وتسجيلات الآبار والجيولوجيا التركيبية، يرجى متابعة المذكرات المرفقة PDF.', 'all', 'important', 'إدارة قسم البترول والجيولوجيا'),
  ('ann-2', 'موعد كويز البتروفيزياء الشامل لطلاب الفرقة الثالثة', 'سيتم فتح كويز قياسات المسامية ومعادلات أرشي إلكترونياً على المنصة لجميع الطلاب يوم الخميس القادم.', '3', 'urgent', 'د. عبدالرحمن محمد')
ON CONFLICT (id) DO NOTHING;
