-- Sams Edutech database bootstrap
-- Run this in Supabase Dashboard -> SQL Editor.
-- This creates only the student-facing data model: courses, private profiles and enrollments.

create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  duration_hours numeric(6,1) not null default 1 check (duration_hours > 0),
  lessons_count integer not null default 1 check (lessons_count > 0),
  accent text not null default 'blue' check (accent in ('blue', 'orange', 'dark')),
  highlights text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) between 2 and 80),
  constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_.-]{3,30}$'),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 400)
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
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

alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;

-- Revoke broad table grants, then add only what this application needs.
revoke all on table public.courses from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.enrollments from anon, authenticated;

grant select on table public.courses to anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert on table public.enrollments to authenticated;

drop policy if exists "courses_are_publicly_readable" on public.courses;
create policy "courses_are_publicly_readable"
on public.courses for select
to anon, authenticated
using (true);

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

-- Enrollment progress is intentionally server-owned. The student client can create and read enrollments, but cannot arbitrarily edit progress.

-- Starter catalog: 5 core Sams Edutech industry-aligned programs
insert into public.courses (id, title, slug, description, category, level, duration_hours, lessons_count, accent, highlights)
values
('11111111-1111-4111-8111-111111111111', 'Cybersecurity & SOC Operations (Level 1/2 Analyst)', 'cybersecurity-soc-operations', 'Master enterprise Security Operations Center (SOC) workflows, SIEM engineering (Splunk, Elastic, Microsoft Sentinel), live threat hunting, packet forensics with Wireshark, incident response protocols, and MITRE ATT&CK detection frameworks.', 'Cybersecurity', 'Intermediate', 64.0, 48, 'blue', array['Enterprise SIEM Architecture (Splunk, Elastic & Microsoft Sentinel)', 'Real-Time Network Packet Inspection & PCAP Forensics with Wireshark', 'MITRE ATT&CK Mapping & Custom Detection Rule Engineering (Sigma/YARA)', 'Live Ransomware Containment & Incident Response Protocols (NIST SP 800-61)']),
('22222222-2222-4222-8222-222222222222', 'Applied Data Science & Advanced Analytics', 'applied-data-science', 'End-to-end data science pipeline from exploratory data analysis (EDA), NumPy/Pandas data wrangling, statistical hypothesis testing, and automated SQL pipelines to interactive data visualization with Plotly, Seaborn, and Streamlit dashboards.', 'Data Science', 'Beginner', 58.0, 44, 'green', array['Vectorized Data Manipulation with Advanced NumPy & Pandas', 'Statistical Hypothesis Testing, A/B Test Frameworks & Inference', 'Interactive Analytical Dashboards with Plotly, Streamlit & PowerBI', 'Automated SQL ETL Data Pipelines & Cloud Data Warehousing']),
('33333333-3333-4333-8333-333333333333', 'Generative AI, Large Language Models & Autonomous Agents', 'generative-ai-and-agents', 'Architect state-of-the-art Generative AI applications. Build Retrieval-Augmented Generation (RAG) engines, fine-tune open-weight models, implement autonomous multi-agent systems with LangChain/LangGraph, and deploy production vector search pipelines.', 'Artificial Intelligence', 'Advanced', 72.0, 52, 'purple', array['Enterprise Retrieval-Augmented Generation (RAG) with Hybrid Search & Rerankers', 'Multi-Agent Orchestration & Stateful Workflows with LangGraph & CrewAI', 'Parameter-Efficient Fine-Tuning (LoRA & QLoRA) on Open-Weights Models', 'Production Prompt Engineering, Safety Guardrails & LLM Observability']),
('44444444-4444-4444-8444-444444444444', 'Machine Learning Engineering & MLOps Pipelines', 'machine-learning-engineering', 'Master predictive modeling, deep neural networks with PyTorch, supervised & unsupervised algorithms, feature stores, and end-to-end MLOps deployment with Docker, FastAPI, MLflow, and Kubernetes inference pipelines.', 'Machine Learning', 'Intermediate', 68.0, 50, 'orange', array['Supervised & Unsupervised Machine Learning with Scikit-Learn & XGBoost', 'Deep Neural Networks, Convolutions & Transformers in PyTorch', 'End-to-End MLOps: Experiment Tracking with MLflow & Model Versioning', 'High-Performance Model Serving with FastAPI, Docker & ONNX Runtime']),
('55555555-5555-4555-8555-555555555555', 'Full Stack Web & Cloud Engineering (Next.js, Node & Cloud)', 'fullstack-web-cloud-development', 'Build modern, production-grade web applications from scratch with Next.js App Router, TypeScript, React Server Components, Node.js REST/GraphQL APIs, PostgreSQL with Prisma ORM, Redis caching, Docker, and AWS/Vercel CI/CD pipelines.', 'Full Stack Development', 'All levels', 80.0, 64, 'dark', array['Modern React 19, Next.js App Router & Server Components Architecture', 'Robust Node.js / TypeScript Backends with Express, Prisma ORM & PostgreSQL', 'Stateful Authentication (OAuth, JWT, RBAC), Session Security & Rate Limiting', 'Cloud Containerization with Docker, Redis Microcaching & Automated CI/CD'])
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  level = excluded.level,
  duration_hours = excluded.duration_hours,
  lessons_count = excluded.lessons_count,
  accent = excluded.accent,
  highlights = excluded.highlights;

-- ── SAMS EDUTECH WEEKLY ASSESSMENTS & SUBMISSIONS ──
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

alter table public.weekly_assessments enable row level security;
alter table public.assessment_submissions enable row level security;

-- Weekly assessments are readable by all authenticated students and anon
drop policy if exists "assessments_are_publicly_readable" on public.weekly_assessments;
create policy "assessments_are_publicly_readable"
on public.weekly_assessments for select
to anon, authenticated
using (status = 'published');

-- Students can view their own submissions
drop policy if exists "students_view_own_submissions" on public.assessment_submissions;
create policy "students_view_own_submissions"
on public.assessment_submissions for select
to authenticated
using ((select auth.uid()) = user_id);

-- Students can submit and update their own submissions
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
