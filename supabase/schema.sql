-- ====================================================================
-- Sams Edutech Enterprise Database Bootstrap Schema
-- Compatible with Supabase Free Tier (PostgreSQL 15+)
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

create extension if not exists pgcrypto;

-- ── 1. COURSES CATALOG TABLE ──
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced', 'All levels')),
  duration_hours numeric(6,1) not null default 1 check (duration_hours > 0),
  lessons_count integer not null default 1 check (lessons_count > 0),
  duration_months integer not null default 3 check (duration_months in (3, 4)),
  training_plan text not null default '3-Month Accelerator Track',
  price numeric(8,2) not null default 499 check (price >= 0),
  original_price numeric(8,2) not null default 799 check (original_price >= 0),
  discount_percent integer not null default 35 check (discount_percent between 0 and 100),
  accent text not null default 'blue' check (accent in ('blue', 'orange', 'dark', 'green', 'purple')),
  highlights text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist if table was already created in earlier versions
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'duration_months') then
    alter table public.courses add column duration_months integer not null default 3 check (duration_months in (3, 4));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'training_plan') then
    alter table public.courses add column training_plan text not null default '3-Month Accelerator Track';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'price') then
    alter table public.courses add column price numeric(8,2) not null default 499 check (price >= 0);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'original_price') then
    alter table public.courses add column original_price numeric(8,2) not null default 799 check (original_price >= 0);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'discount_percent') then
    alter table public.courses add column discount_percent integer not null default 35 check (discount_percent between 0 and 100);
  end if;
end $$;

-- ── 2. DYNAMIC COURSE PRICING OVERRIDE TABLE ──
create table if not exists public.course_pricing (
  slug text primary key references public.courses(slug) on delete cascade,
  price numeric(8,2) not null default 499 check (price >= 0),
  original_price numeric(8,2) not null default 799 check (original_price >= 0),
  discount_percent integer not null default 35 check (discount_percent between 0 and 100),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── 3. STUDENT PROFILES TABLE ──
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  phone_number text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) between 2 and 80),
  constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_.-]{3,30}$'),
  constraint profiles_phone_format check (phone_number is null or phone_number ~ '^(\+91[\s\-]?)?[6-9]\d{9}$'),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 400)
);

-- Ensure profile columns exist if table was already created in earlier migrations
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_number') then
    alter table public.profiles add column phone_number text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- ── 4. STUDENT ENROLLMENTS TABLE ──
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_activity_at timestamptz,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_id_idx on public.enrollments(user_id);
create index if not exists enrollments_course_id_idx on public.enrollments(course_id);

-- ── 5. WEEKLY ASSESSMENTS TABLE (3-Month & 4-Month Cohorts) ──
create table if not exists public.weekly_assessments (
  id text primary key,
  week_number integer not null check (week_number > 0),
  course_id text not null default 'all',
  course_title text not null default 'Universal Cohort Track',
  title text not null,
  slug text not null,
  description text not null,
  objectives text[] not null default '{}',
  deliverables text[] not null default '{}',
  due_date timestamptz not null,
  max_points integer not null default 100 check (max_points > 0),
  passing_points integer not null default 60,
  difficulty text not null default 'Intermediate' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  status text not null default 'published' check (status in ('published', 'draft', 'closed')),
  starter_repo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 6. ASSESSMENT SUBMISSIONS & INSTANT GRADES TABLE ──
create table if not exists public.assessment_submissions (
  id text primary key,
  assessment_id text not null references public.weekly_assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  github_url text not null,
  demo_url text,
  notes text,
  submission_content text,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'graded', 'needs_revision')),
  score numeric(5,2) check (score is null or score >= 0),
  grade text,
  feedback text,
  feedback_encrypted text,
  graded_by text,
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, user_id)
);

create index if not exists submissions_user_idx on public.assessment_submissions(user_id);
create index if not exists submissions_assessment_idx on public.assessment_submissions(assessment_id);

-- ── 7. TRIGGERS: AUTO PROFILE CREATION & UPDATED_AT ──
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_number, avatar_url)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone_number'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone_number = coalesce(excluded.phone_number, profiles.phone_number),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.touch_profile_updated_at();

-- ── 8. ROW LEVEL SECURITY (RLS) POLICIES ──
alter table public.courses enable row level security;
alter table public.course_pricing enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.weekly_assessments enable row level security;
alter table public.assessment_submissions enable row level security;

-- Revoke broad permissions
revoke all on table public.courses from anon, authenticated;
revoke all on table public.course_pricing from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.enrollments from anon, authenticated;
revoke all on table public.weekly_assessments from anon, authenticated;
revoke all on table public.assessment_submissions from anon, authenticated;

-- Grant minimal safe access
grant select on table public.courses to anon, authenticated;
grant select on table public.course_pricing to anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert on table public.enrollments to authenticated;
grant select on table public.weekly_assessments to anon, authenticated;
grant select, insert, update on table public.assessment_submissions to authenticated;

-- Courses RLS
drop policy if exists "courses_are_publicly_readable" on public.courses;
create policy "courses_are_publicly_readable"
on public.courses for select
to anon, authenticated
using (true);

-- Course Pricing RLS
drop policy if exists "course_pricing_publicly_readable" on public.course_pricing;
create policy "course_pricing_publicly_readable"
on public.course_pricing for select
to anon, authenticated
using (true);

-- Profiles RLS
drop policy if exists "students_can_view_own_profile" on public.profiles;
create policy "students_can_view_own_profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "students_can_update_own_profile" on public.profiles;
create policy "students_can_update_own_profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Enrollments RLS
drop policy if exists "students_can_view_own_enrollments" on public.enrollments;
create policy "students_can_view_own_enrollments"
on public.enrollments for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students_can_create_own_enrollments" on public.enrollments;
create policy "students_can_create_own_enrollments"
on public.enrollments for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Weekly Assessments RLS
drop policy if exists "assessments_are_publicly_readable" on public.weekly_assessments;
create policy "assessments_are_publicly_readable"
on public.weekly_assessments for select
to anon, authenticated
using (status = 'published');

-- Assessment Submissions RLS
drop policy if exists "students_view_own_submissions" on public.assessment_submissions;
create policy "students_view_own_submissions"
on public.assessment_submissions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students_submit_own_assignment" on public.assessment_submissions;
create policy "students_submit_own_assignment"
on public.assessment_submissions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "students_update_own_submission" on public.assessment_submissions;
create policy "students_update_own_submission"
on public.assessment_submissions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ── 9. REAL STUDENT DIRECTORY RPC FUNCTION (Admin Definer) ──
create or replace function public.get_admin_student_directory()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  select json_agg(
    json_build_object(
      'id', p.id,
      'full_name', coalesce(p.full_name, 'Learner ' || substring(p.id::text, 1, 6)),
      'email', coalesce(u.email, 'student@gmail.com'),
      'phone_number', p.phone_number,
      'username', p.username,
      'bio', p.bio,
      'avatar_url', p.avatar_url,
      'role', 'student',
      'created_at', p.created_at,
      'enrollments_count', coalesce(e_stats.enrollments_count, 0),
      'enrolled_courses', coalesce(e_stats.enrolled_courses, '[]'::json),
      'submissions_count', coalesce(s_stats.submissions_count, 0),
      'graded_count', coalesce(s_stats.graded_count, 0),
      'average_score', s_stats.average_score,
      'mentor_notes', null
    )
  ) into result
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join (
    select
      e.user_id,
      count(e.id) as enrollments_count,
      json_agg(json_build_object('id', c.id, 'title', c.title, 'progress', e.progress_percent)) as enrolled_courses
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    group by e.user_id
  ) e_stats on e_stats.user_id = p.id
  left join (
    select
      sub.user_id,
      count(sub.id) as submissions_count,
      count(case when sub.status = 'graded' then 1 end) as graded_count,
      round(avg(case when sub.status = 'graded' then sub.score end), 1) as average_score
    from public.assessment_submissions sub
    group by sub.user_id
  ) s_stats on s_stats.user_id = p.id
  order by p.created_at desc;

  return coalesce(result, '[]'::json);
end;
$$;

revoke all on function public.get_admin_student_directory() from public, anon, authenticated;

-- ── 10. SEED DATA: 4-MONTH & 3-MONTH INDUSTRY ACCELERATOR PROGRAMS ──
insert into public.courses (
  id, title, slug, description, category, level,
  duration_hours, lessons_count, duration_months, training_plan,
  price, original_price, discount_percent, accent, highlights
)
values
(
  '11111111-1111-4111-8111-111111111111',
  'Cybersecurity & SOC Operations (Level 1/2 Analyst)',
  'cybersecurity-soc-operations',
  'Master enterprise Security Operations Center (SOC) workflows, SIEM engineering (Splunk, Elastic, Microsoft Sentinel), live threat hunting, packet forensics with Wireshark, incident response protocols, and MITRE ATT&CK detection frameworks.',
  'Cybersecurity',
  'Intermediate',
  64.0, 48, 4, '4-Month Comprehensive Track',
  499.00, 799.00, 38,
  'blue',
  array[
    'Enterprise SIEM Architecture (Splunk, Elastic & Microsoft Sentinel)',
    'Real-Time Network Packet Inspection & PCAP Forensics with Wireshark',
    'MITRE ATT&CK Mapping & Custom Detection Rule Engineering (Sigma/YARA)',
    'Live Ransomware Containment & Incident Response Protocols (NIST SP 800-61)'
  ]
),
(
  '22222222-2222-4222-8222-222222222222',
  'Applied Data Science & Advanced Analytics',
  'applied-data-science',
  'End-to-end data science pipeline from exploratory data analysis (EDA), NumPy/Pandas data wrangling, statistical hypothesis testing, and automated SQL pipelines to interactive data visualization with Plotly, Seaborn, and Streamlit dashboards.',
  'Data Science',
  'Beginner',
  58.0, 44, 3, '3-Month Accelerator Track',
  449.00, 699.00, 36,
  'green',
  array[
    'Vectorized Data Manipulation with Advanced NumPy & Pandas',
    'Statistical Hypothesis Testing, A/B Test Frameworks & Inference',
    'Interactive Analytical Dashboards with Plotly, Streamlit & PowerBI',
    'Automated SQL ETL Data Pipelines & Cloud Data Warehousing'
  ]
),
(
  '33333333-3333-4333-8333-333333333333',
  'Generative AI, Large Language Models & Autonomous Agents',
  'generative-ai-and-agents',
  'Architect state-of-the-art Generative AI applications. Build Retrieval-Augmented Generation (RAG) engines, fine-tune open-weight models, implement autonomous multi-agent systems with LangChain/LangGraph, and deploy production vector search pipelines.',
  'Artificial Intelligence',
  'Advanced',
  72.0, 52, 4, '4-Month Comprehensive Track',
  599.00, 899.00, 33,
  'purple',
  array[
    'Enterprise Retrieval-Augmented Generation (RAG) with Hybrid Search & Rerankers',
    'Multi-Agent Orchestration & Stateful Workflows with LangGraph & CrewAI',
    'Parameter-Efficient Fine-Tuning (LoRA & QLoRA) on Open-Weights Models',
    'Production Prompt Engineering, Safety Guardrails & LLM Observability'
  ]
),
(
  '44444444-4444-4444-8444-444444444444',
  'Machine Learning Engineering & MLOps Pipelines',
  'machine-learning-engineering',
  'Master predictive modeling, deep neural networks with PyTorch, supervised & unsupervised algorithms, feature stores, and end-to-end MLOps deployment with Docker, FastAPI, MLflow, and Kubernetes inference pipelines.',
  'Machine Learning',
  'Intermediate',
  68.0, 50, 3, '3-Month Accelerator Track',
  499.00, 749.00, 33,
  'orange',
  array[
    'Supervised & Unsupervised Machine Learning with Scikit-Learn & XGBoost',
    'Deep Neural Networks, Convolutions & Transformers in PyTorch',
    'End-to-End MLOps: Experiment Tracking with MLflow & Model Versioning',
    'High-Performance Model Serving with FastAPI, Docker & ONNX Runtime'
  ]
),
(
  '55555555-5555-4555-8555-555555555555',
  'Full Stack Web & Cloud Engineering (Next.js, Node & Cloud)',
  'fullstack-web-cloud-development',
  'Build modern, production-grade web applications from scratch with Next.js App Router, TypeScript, React Server Components, Node.js REST/GraphQL APIs, PostgreSQL with Prisma ORM, Redis caching, Docker, and AWS/Vercel CI/CD pipelines.',
  'Full Stack Development',
  'All levels',
  80.0, 64, 4, '4-Month Comprehensive Track',
  549.00, 849.00, 35,
  'dark',
  array[
    'Modern React 19, Next.js App Router & Server Components Architecture',
    'Robust Node.js / TypeScript Backends with Express, Prisma ORM & PostgreSQL',
    'Stateful Authentication (OAuth, JWT, RBAC), Session Security & Rate Limiting',
    'Cloud Containerization with Docker, Redis Microcaching & Automated CI/CD'
  ]
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  level = excluded.level,
  duration_hours = excluded.duration_hours,
  lessons_count = excluded.lessons_count,
  duration_months = excluded.duration_months,
  training_plan = excluded.training_plan,
  price = excluded.price,
  original_price = excluded.original_price,
  discount_percent = excluded.discount_percent,
  accent = excluded.accent,
  highlights = excluded.highlights;

-- ── 11. SEED DATA: DYNAMIC PRICING OVERRIDES ──
insert into public.course_pricing (slug, price, original_price, discount_percent, active)
values
('cybersecurity-soc-operations', 499.00, 799.00, 38, true),
('applied-data-science', 449.00, 699.00, 36, true),
('generative-ai-and-agents', 599.00, 899.00, 33, true),
('machine-learning-engineering', 499.00, 749.00, 33, true),
('fullstack-web-cloud-development', 549.00, 849.00, 35, true)
on conflict (slug) do update set
  price = excluded.price,
  original_price = excluded.original_price,
  discount_percent = excluded.discount_percent,
  active = excluded.active,
  updated_at = now();

-- ── 12. SEED DATA: WEEKLY ASSESSMENTS (3-Month & 4-Month Timelines) ──
insert into public.weekly_assessments (
  id, week_number, course_id, course_title, title, slug,
  description, objectives, deliverables, due_date, max_points, passing_points, difficulty, status, starter_repo_url
)
values
(
  'week-1-cybersecurity', 1, 'cybersecurity-soc-operations',
  'Cybersecurity & SOC Operations (Level 1/2 Analyst)',
  'Network Forensics & Wireshark PCAP Traffic Analysis',
  'week-1-wireshark-pcap-analysis',
  'Analyze a captured enterprise network PCAP file from a live compromised endpoint. Identify lateral movement attempts, C2 beaconing signatures, DNS exfiltration channels, and infected hosts.',
  array['Reconstruct TCP streams and extract malicious payloads', 'Filter IOCs using display filters and flow graphs', 'Map adversary behaviors to MITRE ATT&CK T1071 & T1048'],
  array['Documented Incident Report (PDF/Markdown)', 'List of extracted IOCs (IPs, hashes, domains)', 'Custom Wireshark display filter cheat sheet'],
  now() + interval '7 days', 100, 60, 'Intermediate', 'published',
  'https://github.com/hackk413/sams-edutech'
),
(
  'week-2-cybersecurity', 2, 'cybersecurity-soc-operations',
  'Cybersecurity & SOC Operations (Level 1/2 Analyst)',
  'SIEM Detection Engineering with Splunk & Sigma Rules',
  'week-2-splunk-sigma-detection',
  'Ingest Windows Event Logs into Splunk. Author production Sigma rules to detect pass-the-hash and Kerberoasting attacks. Validate alerting thresholds and reduce false-positive rates.',
  array['Craft custom Splunk SPL correlation searches', 'Translate Sigma detection YAML into Splunk alerts', 'Test alerting rules against synthetic adversary logs'],
  array['GitHub repository with 5 verified Sigma YAML rules', 'Splunk SPL detection search queries', 'Validation run log and false positive assessment report'],
  now() + interval '14 days', 100, 60, 'Intermediate', 'published',
  'https://github.com/hackk413/sams-edutech'
),
(
  'week-1-data-science', 1, 'applied-data-science',
  'Applied Data Science & Advanced Analytics',
  'Exploratory Data Analysis & Vectorized Pandas Pipeline',
  'week-1-eda-pandas-pipeline',
  'Conduct exploratory data analysis on a raw 1.2M row transactional dataset. Implement vectorized data cleaning, missing value imputation, distribution profiling, and outlier mitigation.',
  array['Clean and structure messy real-world datasets with Pandas', 'Calculate statistical moments and correlation matrices', 'Generate reproducible EDA report using Seaborn and Matplotlib'],
  array['Jupyter Notebook with documented data cleaning steps', 'Exported clean parquet file', 'Executive summary presentation of top 5 business insights'],
  now() + interval '7 days', 100, 60, 'Beginner', 'published',
  'https://github.com/hackk413/sams-edutech'
),
(
  'week-1-genai', 1, 'generative-ai-and-agents',
  'Generative AI, Large Language Models & Autonomous Agents',
  'Enterprise RAG Architecture with Hybrid Vector Search',
  'week-1-enterprise-rag-vector-search',
  'Build a production-ready Retrieval-Augmented Generation (RAG) system with hybrid dense-sparse vector search, Reciprocal Rank Fusion (RRF), cross-encoder reranking, and citation provenance.',
  array['Implement semantic chunking and dense vector embedding with pgvector', 'Deploy BM25 sparse keyword index alongside dense vector embeddings', 'Construct contextual hallucination guardrails and evaluation metrics'],
  array['Working FastAPI or Next.js repository with streaming RAG endpoint', 'RAGAS benchmark evaluation results', 'Documentation of chunking strategy and embedding latency metrics'],
  now() + interval '7 days', 100, 60, 'Advanced', 'published',
  'https://github.com/hackk413/sams-edutech'
),
(
  'week-1-fullstack', 1, 'fullstack-web-cloud-development',
  'Full Stack Web & Cloud Engineering (Next.js, Node & Cloud)',
  'Secure Full-Stack Architecture with Next.js & PostgreSQL',
  'week-1-nextjs-secure-architecture',
  'Develop a modern web application featuring Next.js 16 App Router, React Server Components, server actions, cookie-based session management, and PostgreSQL with Row Level Security (RLS).',
  array['Implement strict RBAC with server-side authentication tokens', 'Structure high-performance PostgreSQL tables with foreign key integrity', 'Enforce OWASP security standards: CSP headers, CSRF tokens, input validation'],
  array['GitHub repository link with passing automated test suite', 'Live deployed application URL on VPS or cloud provider', 'Architecture diagram and database schema file'],
  now() + interval '7 days', 100, 60, 'Intermediate', 'published',
  'https://github.com/hackk413/sams-edutech'
)
on conflict (id) do update set
  title = excluded.title,
  course_id = excluded.course_id,
  course_title = excluded.course_title,
  description = excluded.description,
  objectives = excluded.objectives,
  deliverables = excluded.deliverables,
  due_date = excluded.due_date,
  max_points = excluded.max_points,
  passing_points = excluded.passing_points,
  difficulty = excluded.difficulty,
  status = excluded.status,
  starter_repo_url = excluded.starter_repo_url,
  updated_at = now();
