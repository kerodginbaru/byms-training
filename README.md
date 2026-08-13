# ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ — Registration & Training Management System

A production-oriented online registration platform for Bete-Yared Spiritual
Instruments Training Center, built for deployment on Vercel.

> **Read this before you deploy.** This codebase was generated in an
> environment without internet access, so `npm install` and `npm run build`
> have **not** been executed or verified here. Follow the steps below on a
> machine with network access, fix anything the build surfaces (dependency
> version drift is the most likely source of errors), and only then deploy.

---

## 1. Features

**Public site**
- Amharic-first responsive site (Noto Serif Ethiopic font) — Home, About,
  Training, Register, Contact, Registration confirmation
- Multi-step registration wizard (Personal → Student/Employee → Schedule →
  Payment → Review → Success) with in-session state persistence
- Conditional logic: Department is required only for Student Year 2–6;
  hidden and not required for Remedial/Year 1; hidden entirely for Employees
- Live schedule capacity display; full schedules are removed from selection
- Secure receipt upload (JPG/PNG/PDF, configurable max size)
- Unique sequential registration numbers (`BYMS-2026-000001`), QR code,
  print/download confirmation

**Admin**
- Cookie-based JWT session auth (`jose`), bcrypt password hashing, RBAC with
  `SUPER_ADMIN` / `REGISTRATION_ADMIN` / `VIEWER`
- Dashboard with live stats
- Registration list: search, filter, pagination, CSV export
- Registration detail: approve/reject registration, verify/reject payment
  independently, audit-logged
- Authenticated-only receipt download (never a public URL)
- Schedule management (days, session, time, capacity, active/inactive)
- Settings (fees, hero text, morning/afternoon times, registration
  open/closed, logo upload)
- Admin user management (create/deactivate, role assignment)
- Reports by type/year/schedule/payment status

**Backend guarantees**
- Schedule capacity is enforced **inside a serializable Postgres transaction**
  with a `SELECT ... FOR UPDATE` row lock on the schedule — two simultaneous
  submissions for the last seat cannot both succeed
  (`lib/services/registration.ts`)
- Registration numbers are generated atomically via a per-year counter row
  inside the same transaction
- Zod validation runs server-side on every mutation; client-side validation
  is a UX convenience only
- All admin routes are protected in `middleware.ts` (session required) *and*
  `lib/auth/rbac.ts` (permission required) — never just hidden UI

---

## 2. Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma ·
Zod · Framer Motion · Vercel Blob (file storage) · jose (JWT sessions) ·
bcryptjs

---

## 3. Project structure

```
app/
  page.tsx                    Home
  about/ training/ contact/   Public info pages
  register/                   Multi-step registration wizard page
  registration/[id]/          Confirmation page
  admin/
    login/ page.tsx           Admin login
    page.tsx                  Dashboard
    registrations/            List + [id] detail
    schedules/ payments/ settings/ users/ reports/
  api/
    registrations/            POST create registration (capacity-safe)
    schedules/                GET availability
    uploads/receipt/          POST receipt upload
    admin/login, logout/
    admin/registrations/export/  CSV export
    admin/receipts/[fileId]/  Authenticated receipt download

components/
  registration/                Wizard steps, types, QR code
  admin/                       Dashboard cards, logout button
  layout/                      Header, footer, hero animation

lib/
  db.ts                        Prisma client singleton
  auth/                        session.ts (JWT), rbac.ts (permissions)
  validation/                  Zod schemas (registration.ts, admin.ts)
  services/                    registration.ts (capacity-safe core),
                                admin-actions.ts (approve/verify/stats)
  storage/blob.ts               Vercel Blob upload/download helpers
  utils/                       labels.ts, cn.ts

prisma/
  schema.prisma
  seed.ts

middleware.ts                  Server-side admin route protection
tests/                         Vitest unit tests + concurrency test (opt-in)
```

---

## 4. Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local with a local/dev Postgres URL and a random AUTH_SECRET

npx prisma migrate dev --name init
npm run db:seed

npm run dev
```

Visit `http://localhost:3000`. Admin login: `http://localhost:3000/admin/login`
with the seeded super admin (see §7).

For local file uploads you still need a **real** `BLOB_READ_WRITE_TOKEN`
(Vercel Blob works from local dev too — create a store in the Vercel
dashboard and copy the token into `.env.local`). There is no local-disk
fallback, by design, because Vercel's filesystem is ephemeral in production.

---

## 5. Environment variables

See `.env.example`. Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string |
| `DIRECT_URL` | Direct (non-pooled) connection string, used for migrations |
| `AUTH_SECRET` | Random secret ≥32 bytes for signing admin session JWTs (`openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `NEXT_PUBLIC_APP_URL` | Public base URL, used for metadata/sitemap |

Never commit `.env.local`. `.gitignore` already excludes it.

---

## 6. Database setup

Any Vercel-compatible Postgres works: Vercel Postgres, Neon, Supabase, or
Railway.

```bash
# Development
npx prisma migrate dev --name init

# Production (run once per deploy, e.g. in a Vercel build/deploy hook or manually)
npx prisma migrate deploy
```

`npm run build` already runs `prisma generate` first (see `package.json`),
so the Prisma client is always in sync with `schema.prisma` on Vercel.

---

## 7. Admin account setup

The seed script creates one Super Admin:

- Email: `admin@byms-training.example.org`
- Password: `ChangeMe123!`

**Change this password immediately** — either add a "change password" flow
before going live, or delete the seeded admin and create a real one via
`/admin/users` (SUPER_ADMIN only) once you're logged in with a temporary
account, then deactivate the seeded one.

---

## 8. File storage setup (Vercel Blob)

1. Vercel dashboard → your project → Storage → Create → Blob.
2. Copy the generated `BLOB_READ_WRITE_TOKEN` into your environment
   variables (both locally and in Vercel Project Settings → Environment
   Variables).
3. Receipts are uploaded with a random filename under `receipts/` and are
   **never** linked directly from any public page. Admins access them only
   through `/api/admin/receipts/[fileId]`, which checks the session and
   permission before streaming the file back.

---

## 9. Deployment to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Add all environment variables from `.env.example` in Project Settings.
4. Set the Build Command to `npm run build` (default) — this runs
   `prisma generate && next build`.
5. After the first deploy, run `npx prisma migrate deploy` against your
   production database (via Vercel CLI locally with production env vars, or
   a one-off deploy hook).
6. Run `npm run db:seed` once against production (or create your first
   super admin manually) — then rotate/delete the seeded password.

**Before declaring the deployment "done," verify locally:**
```bash
npm install
npm run build
```
Fix every TypeScript/ESLint error the build reports. Do not skip this step —
a build that hasn't actually been run should not be assumed to pass.

---

## 10. Testing

```bash
npm test
```

`tests/registration.test.ts` covers phone normalization and the
Student/Employee/Department conditional Zod logic (no DB needed).

`tests/capacity.test.ts` contains a real concurrency test that fires 10
simultaneous registrations at a schedule with capacity 5 and asserts exactly
5 succeed. It's `describe.skip`ped by default because it needs a disposable
Postgres database — point `DATABASE_URL` at a throwaway test DB, remove
`.skip`, and run it before trusting the capacity guarantee in production.

---

## 11. Production security checklist

- [ ] Changed/removed the seeded admin password
- [ ] `AUTH_SECRET` is a strong random value, not the placeholder
- [ ] `DATABASE_URL` uses `sslmode=require` (or provider default) in production
- [ ] Ran the concurrency test (`tests/capacity.test.ts`) against a real DB
- [ ] Confirmed receipts are not reachable via any public URL — only through
      `/api/admin/receipts/[fileId]`
- [ ] Reviewed rate limiting on `/api/admin/login` (`lib/services` note: the
      current implementation is in-memory per server instance — for a
      multi-region/multi-instance Vercel deployment, replace with a shared
      store such as Upstash Redis before relying on it under real attack
      traffic)
- [ ] Confirmed `npm run build` passes with zero TypeScript errors
- [ ] Confirmed `/admin/*` redirects to `/admin/login` when signed out
      (test in an incognito window)
- [ ] Rotated the seeded `BLOB_READ_WRITE_TOKEN` if it was ever shared

---

## 12. Known gaps / what to build next

Being transparent about what's intentionally out of scope in this initial
build so nothing here is mistaken for "done":

- **PDF export** for reports is not implemented (CSV export is). Adding it
  is straightforward with a library like `@react-pdf/renderer` if needed.
- **English UI toggle**: the schema and copy support bilingual content, but
  the language switcher itself isn't wired up yet — currently Amharic-first
  with English sub-labels throughout.
- **Password reset flow** for admins isn't built; use `/admin/users` (Super
  Admin) to deactivate/recreate accounts in the meantime.
- **Distributed rate limiting**: see the checklist item above.
- Gallery images (beyond logo/hero) have a `FileKind` enum ready in the
  schema but no dedicated upload UI yet — the pattern in
  `app/admin/settings/page.tsx`'s `uploadLogo` action is directly reusable.

None of these affect the core guarantees the spec emphasized most: capacity
is enforced transactionally in the database, receipts are private, and admin
routes are protected server-side.
