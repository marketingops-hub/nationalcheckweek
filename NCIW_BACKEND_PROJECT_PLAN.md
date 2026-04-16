# NCIW Backend — Next Set of Work

## ✅ Completed (this session)

### Event Image Bug Fix
**Root cause**: `event_date` sent as `""` from the admin form passes Zod validation but fails PostgreSQL date parsing, causing the **entire INSERT/UPDATE to fail silently**. The `feature_image` URL is never persisted.

**Fix applied**:
- Added `emptyToNull` Zod transformer — empty strings → `null` before DB write
- Changed `feature_image` schema from `optStr` to `optNullStr` (accepts null from DB)
- POST handler now uses `EventPutSchema` validation (was raw passthrough)

---

## 🔴 P0 — Critical / High Priority

### 1. Consolidate Auth Pattern
Two competing auth modules exist: `@/lib/auth.ts` (40 routes) and `@/lib/adminAuth.ts` (15 routes). They use different patterns:
- `auth.ts` → `requireAdmin()` HOF wrapper (edge-compatible, uses Bearer token)
- `adminAuth.ts` → `requireAdmin()` returns `AdminUser | null` (cookie-based, uses `await createClient()`)

**Action**: Pick one pattern and migrate all routes. Recommend keeping the HOF wrapper from `auth.ts` since it's used by the majority and works on edge runtime.

### 2. Duplicate Validation Systems
Two schema/validation systems coexist:
- `@/lib/adminSchemas.ts` (289 lines, Zod, `parseBody()`)
- `@/lib/validation/schemas.ts` (172 lines, Zod, `safeValidate()`)

Blog routes use `validation/schemas.ts`; most other admin routes use `adminSchemas.ts`.

**Action**: Merge into a single `adminSchemas.ts` with one `parseBody()` helper. Migrate blog routes.

### 3. Empty-String-to-Null for All Date/Nullable Fields
The `event_date` fix only covers events. Other entities (blog `published_at`, etc.) likely have the same empty-string problem with date/nullable DB columns.

**Action**: Audit all schemas for fields mapped to DB `date`/`timestamp` columns. Apply `emptyToNull` transformer where needed.

---

## 🟡 P1 — Important / Medium Priority

### 4. Public API Rate Limiting
Public-facing endpoints (`/api/events`, `/api/issues`, `/api/votes`, `/api/ambassador/apply`, `/api/ambassador/nominate`, `/api/hubspot-zoom-register`) have **zero rate limiting**.

**Action**: Add lightweight rate limiting (e.g., Vercel Edge middleware IP-based or a simple in-memory counter).

### 5. Remove Debug Endpoint
`/api/debug-admin` exposes environment variable status and table connectivity. Even behind auth, this is an unnecessary attack surface in production.

**Action**: Delete or move behind a feature flag / dev-only check.

### 6. Input Validation on Public Endpoints
Public endpoints like `/api/ambassador/apply`, `/api/ambassador/nominate`, `/api/votes` need schema validation to prevent junk data insertion.

**Action**: Add Zod schemas for all public POST endpoints.

### 7. Missing `event_end` in EventListItem Type
`EventListItem` includes `event_end` in the type but the events listing query also fetches it. Verify this is actually used on the card and consider whether the list query is fetching more fields than needed.

**Action**: Audit `EventListItem` vs actual usage on `EventCard`. Trim unused fields from the SELECT.

### 8. ISR / Cache Strategy Audit
Event pages use `revalidate = 60`. After an admin saves a change, it takes up to 60s for the frontend to update. This creates a confusing UX for admins.

**Action**: Add on-demand revalidation (`revalidatePath`/`revalidateTag`) in admin PUT/POST handlers so changes appear instantly on the frontend.

---

## 🟢 P2 — Nice to Have / Tech Debt

### 9. Standardize `runtime = "edge"` Across All Admin Routes
Some routes declare `export const runtime = "edge"`, others don't (defaulting to Node.js serverless). This inconsistency affects cold-start times and behavior.

**Action**: Decide on edge vs Node.js for admin API. If edge, ensure all routes are edge-compatible (no `cookies()` from `next/headers`, no Node.js APIs).

### 10. Test Coverage
Only 16 test files exist (mix of unit + e2e). No API route tests. No integration tests for the admin CRUD flows.

**Action**: Add integration tests for critical admin flows:
- Event CRUD (especially image upload + save)
- Blog CRUD
- Ambassador CRUD
- Public submission endpoints

### 11. Dead Code Cleanup
- `homepage-blocks/route.old.ts` — stale file
- Dozens of `.md` audit/progress files in project root (40+)
- `/api/debug-admin` — debug-only route
- Potential unused admin pages (prompts, vault/sources, api)

**Action**: Remove dead files and old audit docs. Archive if needed.

### 12. Consistent Error Response Shape
Admin routes use varied error response formats. Some return `{ error: string }`, others include `{ issues: [] }` from Zod.

**Action**: Standardize on `{ error: string, details?: unknown }` across all routes.

### 13. Supabase Storage Bucket Naming
Uploads go to a bucket called `avatars` even for event images and blog feature images. The naming is confusing.

**Action**: Consider renaming or adding dedicated buckets (or at minimum, document the convention).

---

## Suggested Sprint Order

| Sprint | Items | Effort |
|--------|-------|--------|
| **Sprint 1** (now) | #1 Auth consolidation, #2 Schema merge, #3 Empty-to-null audit | 1–2 days |
| **Sprint 2** | #8 ISR revalidation, #6 Public input validation, #5 Remove debug endpoint | 1 day |
| **Sprint 3** | #4 Rate limiting, #9 Edge runtime standardization | 1 day |
| **Sprint 4** | #10 Test coverage, #11 Dead code cleanup, #12 Error shapes, #13 Bucket naming | 2 days |
