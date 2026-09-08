# Patient Tracking and Reporting System — backend

Built from the DSD AHF Contribution Monthly Report + Clinicians' Index
Testing Referral List forms (Heidelberg PHC / Ext 23 PHC).

NestJS + Prisma + PostgreSQL API. The Flutter client lives in
`../frontend` — see the root `README.md` for how the two fit together.

## Structure

```
prisma/schema.prisma        Full data model (see ERD)
src/
  prisma.service.ts         Prisma client wrapper, injected everywhere
  app.module.ts              Wires feature modules together
  auth/
    jwt-auth.guard.ts        Validates JWT, attaches req.user
    roles.guard.ts            Enforces @Roles() per-route RBAC
    roles.decorator.ts        @Roles('CAPTURER', 'ADMIN') etc.
  monthly-reports/            Fully scaffolded reference module — copy this
                               pattern for facilities/, indicators/,
                               index-testing/
    dto.ts
    monthly-reports.service.ts
    monthly-reports.controller.ts
    monthly-reports.module.ts
```

## What's implemented

- `MonthlyReportsService.upsert` — captures one facility/cycle/month grid
  (replaces the paper row), idempotent so re-submitting a correction is safe.
- `WeeklyReportsService` — captures one facility/cycle/month/week grid.
  Every indicator gets a row, even if left blank on the client — blanks are
  stored as an explicit `0`, never skipped. Saving automatically syncs into
  the matching `MonthlyReport`'s entries: it compares the new values against
  what the week previously held and applies only the *difference* to the
  monthly totals (via Prisma's `increment`), so re-saving a week to correct
  a number adjusts the total rather than double-counting. No separate
  "upload" step — every save is live.
  Note: directly editing a `MonthlyReport` via `MonthlyReportsService.upsert`
  *replaces* its entries — mixing direct monthly edits with weekly captures
  for the same month will overwrite the weekly-built totals, so pick one
  workflow per month.
- Draft → Submitted → Verified status flow, matching the "Verified by /
  Signature / Date" fields on the paper forms.
- `indicatorTrend` — pulls one indicator's values across a cycle for the
  dashboard charts.
- `findByFacilityCycleMonth` — the lookup the mobile capture screen uses to
  load and display whatever's already saved for a given facility/cycle/month
  (including totals synced in from weekly reports), instead of always
  showing blank fields regardless of stored data. Its controller route uses
  `@Res()` + explicit `res.json(report)` rather than a plain return — Nest's
  default handling sends **no response body at all** for a null/undefined
  return value (not a literal `"null"`), which breaks any client whose JSON
  parser expects a real body for every response. This is the only endpoint
  in the backend designed to legitimately return `null` on success (every
  other `findOne` throws `NotFoundException` instead) — worth remembering
  if a similar "returns null on purpose" endpoint gets added later.
- `GET /monthly-reports/:id/export` and `GET /weekly-reports/:id/export` —
  CSV download for either report type (facility/period metadata header,
  then one row per indicator). Uses `@Res()` to set
  `Content-Disposition: attachment` directly rather than Nest's default
  JSON response.
- `GET /monthly-reports/all` and `GET /weekly-reports/all` — every saved
  report for a facility/cycle, across all months, for the "all reports"
  browsing screen. Placed before `:id` in each controller (Nest matches
  routes in declaration order, and `:id` would otherwise swallow the
  literal `"all"` as an id).
- `src/auth/facility-access.util.ts` — `assertFacilityAccess(user, facilityId)`,
  used across monthly-reports, weekly-reports, and index-testing-referrals'
  read routes. CAPTURER/VERIFIER can only view their own facility's reports
  (the facility set on their account at registration, carried in their JWT);
  PROGRAM_MANAGER/ADMIN can view any facility. Login was already required
  everywhere via `JwtAuthGuard` — this adds the missing per-facility
  restriction on top of "logged in."
- Editing (the `POST`/`:id/submit` routes on monthly-reports and
  weekly-reports) is `@Roles('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN')` —
  VERIFIER can view but not edit; everyone else who can view can also edit.
- RBAC via `@Roles()` + `RolesGuard`, matching the four roles: CAPTURER,
  VERIFIER, PROGRAM_MANAGER, ADMIN.
- `auth/` — full `AuthModule`: bcrypt password hashing, JWT issuing
  (`POST /auth/register`, `POST /auth/login`), and a `JwtStrategy` that
  populates `req.user = { id, role, facilityId }` for every guarded route.
  `POST /auth/register` is ADMIN-only (`@Roles('ADMIN')`) — it needs a
  caller who's already an admin, which is where `prisma/seed-admin.ts`
  comes in (see below).
- `POST /auth/register-admin` — public, no guard. Creates the ADMIN and
  only ever succeeds once: rejects with 409 if any ADMIN already exists.
  This is what the login screen's "Register" link calls.
- `POST /auth/appoint-admin` (ADMIN-only, `{ userId }`) — promotes an
  existing user to ADMIN and demotes the caller to the new `VIEWER` role
  (read-only, unrestricted facility visibility) in one transaction. Doesn't
  revoke the old admin's already-issued JWT — it's stateless and keeps
  working with the old role claim until it expires (8h); a production
  system wanting instant revocation would need a token blacklist.
- `GET /auth/users` (ADMIN-only) — id/name/email/role/facilityId for every
  user, no password hashes. What the appoint-admin picker lists from.
- `RegisterUserDto` (the ADMIN-only "Add user" form) now rejects `role:
  'ADMIN'` and `role: 'VIEWER'` outright — ADMIN only ever moves via the
  appoint-admin handoff, and VIEWER only ever results from being demoted
  by it, neither is directly choosable.
- `prisma/seed.ts` — inserts all 16 indicators from the paper form (with
  their targets), three performance cycles (2025/2026 through 2027/2028),
  and Heidelberg PHC + Ext 23 PHC as facilities. Deliberately does **not**
  create any user — the first person to use the login screen's "Register"
  link (`POST /auth/register-admin`) becomes the admin. (Earlier versions
  of this file also seeded a built-in `admin@testclinic.co.za` account,
  which blocked that flow since it always rejects while any ADMIN exists;
  if your database already has that account from an earlier seed run, use
  `prisma/remove-seeded-admin.ts` below to clear it.)
- `prisma/remove-seeded-admin.ts` — one-off cleanup for a database that
  already has the old built-in admin from a previous `db seed` run. Run
  `npx tsx prisma/remove-seeded-admin.ts` once; it deletes
  `admin@testclinic.co.za` only if that account still has role ADMIN, then
  the public "Register" link works as intended. Safe to run if the account
  doesn't exist (no-op).

## Next steps to build out

1. ~~**facilities/, indicators/** modules~~ — done, plus a read-only
   `performance-cycles` endpoint for the picker.
2. ~~**index-testing/** module~~ — done: `POST /index-testing-referrals`
   (CAPTURER/VERIFIER/ADMIN) and `GET /index-testing-referrals?facilityId=&from=&to=`
   for the verify-and-total workflow from the paper form.
3. ~~**Lock down `/auth/register`**~~ — done: it's `@Roles('ADMIN')`-gated.
   Bootstrap your first admin with:
   ```bash
   ADMIN_EMAIL=admin@testclinic.co.za ADMIN_PASSWORD=changeme123 ADMIN_NAME="Your Name" \
     npx tsx prisma/seed-admin.ts
   ```
   Then `POST /auth/login` with those credentials, take the `accessToken`,
   and call `POST /auth/register` with `Authorization: Bearer <token>` to
   create everyone else. Rotate `ADMIN_PASSWORD` after first login.
4. **Audit logging** — a Prisma middleware (`prisma.$use`) or a NestJS
   interceptor that writes an `AuditLog` row (userId, action, entity,
   entityId, before/after JSON, timestamp) on every create/update to
   `MonthlyReport`, `MonthlyReportEntry`, and `IndexTestingReferral` —
   required for POPIA compliance.
5. **OCR import pipeline** — a separate `ImportsModule`: upload the scanned
   PDF, run OCR, land results in a staging table for a human to confirm
   before they become real `MonthlyReportEntry` rows.
6. ~~**Frontend polish**~~ — done: `FacilityPickerScreen` replaces the
   hardcoded IDs, `DashboardScreen` is built (still needs a menu link once
   you add navigation).
7. ~~**Enable CORS**~~ — done in `src/main.ts`, controlled by the
   `CORS_ORIGINS` env var (comma-separated). Set it to your real web
   domain(s) before deploying — the default `http://localhost:*` is dev-only.
8. ~~**Facility scoping**~~ — done: `assertFacilityAccess` enforces it
   server-side (403 for the wrong facility), and `FacilityPickerScreen`
   filters CAPTURER/VERIFIER down to their own facility so they never hit
   that 403 in normal use.
9. **Weekly report editing** — fully supported now: saving a week again
   recomputes the delta against its previous values and adjusts the
   monthly totals to match, so corrections are just a normal re-save, no
   separate reversal step needed.

## Run

```bash
# from backend/
npm install
npm install bcrypt
npm install -D @types/bcrypt
# .env (in backend/): DATABASE_URL, JWT_SECRET, CORS_ORIGINS (e.g. http://localhost:*)
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```
