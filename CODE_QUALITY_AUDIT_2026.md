# Code Quality Audit — National Check-in Week
**Date:** April 13, 2026  
**Auditor:** Cascade AI  
**Scope:** Full codebase review (src/, config, tests)

---

## Executive Summary

| Category | Grade | Notes |
|----------|-------|-------|
| **Type Safety** | B+ | Strict mode enabled, but `any` types persist in critical files |
| **Security** | B | Good auth patterns, but CSP missing & some XSS vectors |
| **Performance** | A- | Excellent caching, ISR, image optimization |
| **Error Handling** | A- | Comprehensive try/catch, but inconsistent error formats |
| **Testing** | B | Data integrity tests exist, but low coverage overall |
| **Architecture** | A | Well-organized, good separation of concerns |

---

## Critical Issues (P0)

### 1. CSP Header Missing
**Location:** `next.config.ts`  
**Risk:** XSS attacks via injected scripts  
**Current:** Only basic security headers (X-Frame-Options, etc.)  
**Fix:**
```typescript
{
  key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js-ap1.hsforms.net https://lsgo-resources.s3.ap-southeast-2.amazonaws.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-src https://player.vimeo.com;"
}
```

### 2. `dangerouslySetInnerHTML` Without Sanitization
**Location:** `src/app/layout.tsx:80`  
**Risk:** XSS if typography CSS source is compromised  
**Current:**
```tsx
<style dangerouslySetInnerHTML={{ __html: typographyCss }} />
```
**Fix:** Use DOMPurify or validate CSS is safe before injection

### 3. `any` Types in Security-Critical Code
**Location:** `src/lib/adminAuth.ts:69-70`, `src/tests/data-integrity.test.ts:15`  
**Risk:** Type safety bypassed in audit logging  
**Fix:** Define proper interfaces for audit log values

---

## High Priority Issues (P1)

### 4. No Rate Limiting on API Routes
**Location:** All `/api/admin/*` routes  
**Risk:** Brute force attacks, resource exhaustion  
**Recommendation:** Implement Upstash Redis rate limiting (already in deps):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
```

### 5. Inconsistent Error Response Formats
**Location:** Various API routes  
**Examples:**
- Some return `{ error: string }` 
- Some return `{ error: string, details?: unknown }`
- Some throw unhandled errors
**Fix:** Standardize error format:
```typescript
interface ApiError {
  error: string;
  code: string;
  timestamp: string;
  requestId?: string;
}
```

### 6. Zod `.passthrough()` Bypasses Validation
**Location:** `src/lib/adminSchemas.ts:35` (SpeakerSchema)  
**Risk:** Unknown properties accepted without validation  
**Fix:** Remove `.passthrough()` or explicitly define all allowed fields

### 7. Console Logging in Production
**Location:** Multiple files use `console.error`  
**Risk:** Information leakage via logs  
**Fix:** Use Sentry logger instead (already configured):
```typescript
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

---

## Medium Priority Issues (P2)

### 8. Missing Input Sanitization
**Location:** API routes accepting HTML content  
**Risk:** Stored XSS via rich text fields  
**Fix:** Apply `sanitize-html` (already in deps) to all HTML inputs

### 9. No Request ID Tracing
**Location:** All API routes  
**Impact:** Difficult to debug production issues  
**Fix:** Add correlation IDs:
```typescript
const requestId = crypto.randomUUID();
// Include in all logs and error responses
```

### 10. Test Coverage Gaps
**Location:** Component tests, API route tests  
**Current:** Only data integrity tests exist  
**Recommendation:** Add:
- Component unit tests with React Testing Library
- API route integration tests
- Authentication flow tests

### 11. Environment Variable Validation
**Location:** `src/lib/supabase/*`  
**Current:** No validation at startup  
**Fix:** Use Zod to validate env vars on app init:
```typescript
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});
```

---

## Low Priority (P3)

### 12. Inline Styles in ErrorBoundary
**Location:** `src/components/admin/ErrorBoundary.tsx:59-88`  
**Issue:** Not using CSS variables consistently  
**Impact:** Minor styling inconsistency

### 13. Missing E2E Tests
**Location:** `src/tests/e2e/` exists but empty  
**Recommendation:** Add Playwright tests for critical paths

### 14. Unused Dependencies
**Check:** `@anthropic-ai/sdk`, `@mendable/firecrawl-js`  
**Action:** Audit if these are actively used or can be removed

---

## Strengths & Best Practices

| Practice | Implementation | Grade |
|----------|----------------|-------|
| **TypeScript Strict Mode** | `tsconfig.json:7` | A |
| **Zod Schema Validation** | `src/lib/adminSchemas.ts` | A |
| **RBAC Implementation** | `src/lib/adminAuth.ts` | A |
| **Audit Logging** | `logAudit()` function | A |
| **Error Boundaries** | `ErrorBoundary.tsx` | A |
| **Edge Runtime** | `route.ts` files | A |
| **Caching Strategy** | ISR + Cache-Control headers | A |
| **Security Headers** | X-Frame-Options, etc. | B+ |
| **Image Optimization** | `next.config.ts` | A |
| **Sentry Integration** | Error tracking | A |

---

## Recommended Actions

### Immediate (This Week)
1. Add CSP header to `next.config.ts`
2. Sanitize `typographyCss` before injection
3. Replace `any` types in `adminAuth.ts`

### Short Term (Next 2 Weeks)
4. Implement rate limiting on admin APIs
5. Standardize error response format
6. Add request ID tracing
7. Validate environment variables at startup

### Medium Term (Next Month)
8. Increase test coverage (components + APIs)
9. Add E2E tests with Playwright
10. Remove or justify unused dependencies

---

## Appendix: File-by-File Quick Reference

| File | Issues | Priority |
|------|--------|----------|
| `next.config.ts` | Missing CSP | P0 |
| `src/app/layout.tsx` | XSS via dangerouslySetInnerHTML | P0 |
| `src/lib/adminAuth.ts` | `any` types | P0 |
| `src/lib/adminSchemas.ts` | `.passthrough()` usage | P1 |
| `src/app/api/admin/*/route.ts` | No rate limiting | P1 |
| `src/tests/data-integrity.test.ts` | `any` type | P2 |
| `src/components/admin/ErrorBoundary.tsx` | Inline styles | P3 |

---

**Overall Grade: B+** — Solid foundation with enterprise-grade patterns, but security hardening and type safety improvements needed before production scale.
