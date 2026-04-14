# Critical Security Vulnerabilities - Fix Plan

## Status: IN PROGRESS

### CRITICAL (Immediate Fix Required)

#### 1. ✅ Missing Auth on Admin Endpoints
**Affected Files:**
- `/api/admin/ambassadors/*` - FIXED
- `/api/admin/events/*` - PENDING
- `/api/admin/users/*` - PENDING
- `/api/admin/upload` - PENDING
- `/api/admin/schools/*` - PENDING
- `/api/admin/cms/*` - PENDING
- All other `/api/admin/*` endpoints - PENDING

**Fix:** Created `requireAdmin()` middleware in `src/lib/auth.ts`
**Action:** Apply to all admin endpoints

---

#### 2. ⏳ XSS via dangerouslySetInnerHTML
**Affected Files:**
- `src/app/pages/[slug]/page.tsx` - CMS page renderer
- `src/components/EventBodyRenderer.tsx`

**Risk:** Raw HTML from DB rendered without sanitization
**Fix:** Use DOMPurify or sanitize-html library
**Action:** Install sanitizer and wrap all innerHTML

---

#### 3. ⏳ File Upload Extension Bypass
**Affected File:** `src/app/api/admin/upload/route.ts`

**Risk:** `.jpg.php` → stored as `.php`, executable upload
**Fix:** Created `sanitizeFilename()` in `src/lib/auth.ts`
**Action:** Apply to upload endpoint, validate extension properly

---

#### 4. ⏳ SSRF in Firecrawl Proxy
**Affected File:** `src/app/api/admin/firecrawl/crawl/route.ts`

**Risk:** Can scrape localhost, internal Supabase, private IPs
**Fix:** Created `validateUrl()` in `src/lib/auth.ts`
**Action:** Apply URL validation before fetch

---

### HIGH

#### 5. ⏳ Open Redirect
**Affected File:** `src/app/api/proxy/route.ts`

**Risk:** Reads redirect from DB with no domain whitelist
**Fix:** Created `validateRedirectUrl()` in `src/lib/auth.ts`
**Action:** Whitelist allowed domains

---

#### 6. ⏳ RichText Editor XSS
**Affected File:** `src/components/RichTextEditor.tsx`

**Risk:** `el.innerHTML = value` executes pasted event handlers
**Fix:** Use `textContent` or sanitize before setting
**Action:** Replace innerHTML with safe alternative

---

### MEDIUM

#### 7. ⏳ Weak Password Validation
**Affected File:** User creation endpoints

**Risk:** Accepts single-character passwords
**Fix:** Created `validatePassword()` in `src/lib/auth.ts`
**Action:** Enforce 8+ chars, uppercase, lowercase, number

---

#### 8. ⏳ No Error Boundaries
**Affected:** All pages

**Risk:** DB failure crashes entire page
**Fix:** Create global error.tsx files
**Action:** Add error boundaries at app and route levels

---

#### 9. ⏳ Silent Error Handlers
**Affected Files:**
- `src/components/VoteFeedback.tsx`
- `src/components/PartnersCarousel.tsx`
- Others with `.catch(() => {})`

**Risk:** Failures hidden from users and logs
**Fix:** Log errors and show user feedback
**Action:** Replace silent catches with proper error handling

---

## Implementation Order

1. **Auth middleware** (CRITICAL) - Block unauthorized admin access
2. **File upload** (CRITICAL) - Prevent code execution
3. **SSRF** (CRITICAL) - Prevent internal network scanning
4. **XSS sanitization** (CRITICAL) - Prevent script injection
5. **Open redirect** (HIGH) - Prevent phishing
6. **Password validation** (MEDIUM) - Improve account security
7. **Error boundaries** (MEDIUM) - Better UX
8. **Error logging** (MEDIUM) - Better debugging

## Dependencies Needed

```bash
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify
```
