# OrbitLMS engineering review

## 1. Discovery

The existing project is a small Next.js App Router + Supabase student LMS. The original architecture already had useful foundations: SSR-aware Supabase clients, cookie session refresh, RLS-backed profiles/enrollments, a course table, authentication routes and a student-only surface.

No full rewrite was necessary.

## 2. Architecture map

```text
Presentation
  app/* pages + layouts
  components/* UI/interaction
  app/globals.css design system

Application/domain
  lib/lms.ts progress/completion/recommendation rules
  lib/utils.ts small cross-cutting formatting/redirect helpers

Data access
  lib/supabase/server.ts
  lib/supabase/client.ts
  lib/supabase/proxy.ts

Persistence/security
  supabase/schema.sql

Quality
  scripts_test_lms.mjs
  loading/error/empty states
```

## 3. Significant changes actually made

### OLD -> NEW -> REASON

- Basic three-card catalog -> searchable/filterable catalog with enrollment state -> makes course discovery a real interaction rather than static presentation.
- Dashboard focused on raw counts -> dashboard centered on current learning + recommendations -> aligns UI with the LMS domain.
- Profile only edited name/username/bio -> profile also exposes enrolled learning and completion status -> matches the student's need to manage learning from the profile.
- Client could update enrollment rows -> client can only read/create enrollment rows -> prevents arbitrary progress manipulation through the browser.
- Progress values rendered directly -> domain helper clamps and interprets progress -> centralizes an important business rule.
- Static auth card -> split auth experience with product context, accessible labels and recovery states -> makes registration/login part of the product journey.
- No loading skeletons -> route-specific loading states -> avoids blank transitions and communicates system state.
- No global error UI -> safe Next.js error boundary -> provides recovery without leaking implementation details.
- Broad security headers -> expanded headers including HSTS -> reduces browser-side attack surface on HTTPS deployments.
- Client profile update included `updated_at` -> database trigger owns timestamp updates -> avoids trusting client timestamps.
- Enrollment duplicate error was treated as generic success -> explicit duplicate enrollment handling -> makes race/duplicate behavior understandable.

## 4. Dead/boilerplate review

No abandoned components were found among the current UI components. Each component has an active reference in the application.

No generic factory/repository/service hierarchy was introduced. The project is small enough that those abstractions would add complexity without a domain benefit.

The dependency list contains the framework/runtime/auth packages needed by the implementation; no new UI library was added just for aesthetics.

## 5. Placeholder review

The application contains no generic placeholder paragraphs, TODO/FIXME work markers, fake users or AI-detector/development-history manipulation code.

Starter courses remain intentionally identifiable as starter catalog content in the SQL/documentation because they are seed data, not fabricated production inventory.

## 6. Security review

Improved/verified:

- Authentication is delegated to Supabase Auth.
- Auth redirects are constrained to same-origin relative paths.
- Profile reads/updates are owner-scoped through RLS.
- Enrollment reads/inserts are owner-scoped through RLS.
- Duplicate enrollment is database-enforced.
- Browser-side service-role secrets are not used.
- Enrollment progress is no longer client-writable.
- Security headers include clickjacking, MIME-sniffing, referrer, permission and HSTS controls.
- Error UI avoids exposing exception details.

Still requiring deployment-specific review:

- Supabase email provider/domain configuration
- Vercel environment variables and custom domain
- Rate limiting/abuse controls for the exact production traffic pattern
- Monitoring and alerting
- Penetration testing for any sensitive or high-value dataset

## 7. Accessibility review

Implemented:

- Semantic headings and sections
- Labels associated with form controls
- `aria-label` / `role` where interaction needs extra context
- Keyboard-visible focus styling
- `prefers-reduced-motion` support
- Accessible loading/error/status messaging in key flows
- Mobile navigation remains keyboard/keyboard-reader addressable through native `details/summary`

## 8. Performance review

The app does not add a UI framework or data-cache library for a small domain. Server-side reads are grouped with `Promise.all` where they are independent. Course filters operate locally after a single catalog query. The implementation avoids client-side copies of the whole dashboard state.

A production bundle-size/Lighthouse measurement still needs a successful dependency-backed build in the target environment.

## 9. Test evidence

### Passed in the current environment

- `npm test` — 3/3 tests passed.
- TypeScript/TSX syntax/transpile check — 32/32 source files passed.
- Component/reference inventory — all local components have active references.
- Placeholder/deception scan — no targeted hits.
- Security review — enrollment progress write boundary tightened.

### Not fully runnable in the current environment

- `npm run typecheck` cannot complete because the project's npm dependencies are not installed locally and package registry access timed out.
- `npm run lint` cannot complete for the same reason; the local ESLint binary is unavailable without installed dependencies.
- `npm run build` cannot complete until the dependencies are installed.

No successful build/lint/typecheck result is claimed here.

## 10. Quality score

Architecture: 8/10

Code quality: 8/10

Security: 8/10

Performance: 7/10

Accessibility: 8/10

Testing: 6/10

Maintainability: 8/10

UX: 9/10

Documentation: 8/10

Dependency hygiene: 8/10

## 11. Remaining technical debt

- Add lesson/content entities before introducing progress mutation.
- Add server-side completion logic for lessons and assessments.
- Add integration/E2E tests for real Supabase auth/enrollment flows.
- Add production monitoring/error tracking.
- Run Lighthouse and bundle analysis after the first successful production build.
- Consider rate limiting around account-related workflows according to deployment traffic and Supabase capabilities.
