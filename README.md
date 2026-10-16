# OrbitLMS

A student-only SaaS LMS built around a focused learning journey: discover courses, enroll, track learning progress, and maintain a private student profile.

## Product experience

OrbitLMS uses a clean learning-platform visual language inspired by modern education SaaS products: white space, strong blue navigation and actions, orange learning CTAs, restrained borders, clear typography, real empty/loading/error states, and responsive course/profile flows. It is not a pixel-copy of any third-party product.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth + PostgreSQL
- `@supabase/ssr` cookie-aware SSR authentication
- CSS designed in-project; no UI-kit dependency added just for styling

## Application architecture

```text
Presentation
├── app/                        Pages, layouts and route handlers
├── components/                Reusable UI with clear responsibilities
└── app/globals.css            Product-specific design system

Application / domain
└── lib/lms.ts                 Progress, completion and course recommendation rules

Data access
└── lib/supabase/              Browser/server clients and auth session refresh

Persistence / security
└── supabase/schema.sql        Tables, constraints, triggers, grants and RLS policies

Quality
└── scripts_test_lms.mjs       Dependency-free behavior tests for domain rules
```

## Student functionality

- Registration and email verification
- Login and logout
- Password recovery and reset
- Course catalog with client-side search, level and category filters
- Course detail page with enrollment state
- One-click enrollment
- Student dashboard with real enrollment/progress metrics
- Recommendations based on unenrolled catalog courses
- Student profile editing
- Profile completion indicator
- Enrolled-course list inside the profile
- Responsive navigation and mobile menu
- Loading skeletons, empty states and a safe error boundary

## Security decisions

- No service-role key is used by the browser.
- `profiles` are readable/updatable only by the authenticated owner.
- `enrollments` are readable/creatable only when `auth.uid() = user_id`.
- Duplicate enrollment is blocked with a database unique constraint.
- Enrollment `progress_percent` is deliberately not client-writable. A future lesson-completion implementation should update progress through a trusted server-side/domain path.
- Authentication redirects are restricted to local paths by `safeNextPath`.
- Production-facing headers disable clickjacking, MIME sniffing and unnecessary browser capabilities, and enable HSTS.
- Production error UI does not expose exception details.

No application can honestly be promised “bugless” or “vulnerability-free.” This project is engineered to reduce common failure and security classes, but production confidence still requires running the full dependency-backed checks in the target environment and reviewing the exact deployment configuration.

## Backend setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in the project URL and publishable key.
5. Configure Supabase Authentication URLs for local and production domains.

Example `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

## Local development

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Or run the intended CI-style sequence:

```bash
npm run validate
```

`npm test` is dependency-free and tests the application's core progress/recommendation rules. Typecheck/lint/build require the project's npm dependencies to be installed.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.
4. Deploy.
5. Update Supabase Authentication -> URL Configuration with the production HTTPS site URL and `/auth/callback` redirect URL.

See `DEPLOYMENT.md` for the full server connection procedure.

## Adding real courses

Replace or extend the starter entries in `supabase/schema.sql`, or add course rows from Supabase Table Editor. The student application does not include an admin dashboard by design.

## Engineering notes

The application intentionally avoids a generic repository/service/factory hierarchy. There are only a few layers because the current product has a small domain: profile, course and enrollment. When actual lessons, assessments and completion rules are added, the domain layer can grow around those real concepts instead of adding abstractions in advance.
