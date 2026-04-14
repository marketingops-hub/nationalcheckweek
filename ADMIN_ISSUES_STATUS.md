# 🎯 Admin Issues - Status Report

**Date:** March 29, 2026  
**Last Update:** 3:57 PM UTC+11  
**Deployed:** `464b432`

---

## 📊 ISSUE SUMMARY

| Issue | Status | Action Required |
|-------|--------|-----------------|
| FAQ page - no data | 🔄 **Needs Migration** | Apply migration 014 |
| Blog save → 404 error | ✅ **FIXED** | None - deployed |
| Blog edit → 404 error | ✅ **FIXED** | None - deployed |
| CMS Menu UI | 🔄 **In Progress** | Will improve |

---

## 1️⃣ FAQ PAGE - NO DATA

**Issue:** https://2026schools.vercel.app/admin/faq shows no data

**Root Cause:** `Faq` table doesn't exist in database

**Is it Edge?** ✅ Yes - confirmed Edge function

**Solution:** Apply migration 014

### 🎯 ACTION REQUIRED - Apply Migration 014

Run this in **Supabase SQL Editor**:

```sql
-- ═══════════════════════════════════════════════════════════════════
-- FAQ TABLE
-- Frequently Asked Questions management
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Faq" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active FAQs ordered by sortOrder
CREATE INDEX IF NOT EXISTS idx_faq_active_sort ON "Faq"(active, "sortOrder") WHERE active = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_faq_category ON "Faq"(category) WHERE category IS NOT NULL;

-- RLS Policies
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Public can view active FAQs"
  ON "Faq"
  FOR SELECT
  USING (active = true);

-- Seed some example FAQs
INSERT INTO "Faq" (question, answer, category, "sortOrder", active) VALUES
('What is Schools Wellbeing Australia?', 'Schools Wellbeing Australia is a national initiative dedicated to improving student mental health and wellbeing across Australian schools. We provide resources, support, and events to help schools create healthier learning environments.', 'General', 1, true),
('How can my school participate?', 'Schools can participate by registering for our events, accessing our free resources, and joining our network of wellbeing-focused educators. Visit our events page to see upcoming opportunities.', 'General', 2, true),
('What resources are available?', 'We offer a comprehensive library of evidence-based resources including mental health toolkits, classroom activities, parent guides, and professional development materials. All resources are free and aligned with Australian curriculum standards.', 'Resources', 3, true),
('Is there a cost to participate?', 'Most of our resources and programs are completely free for Australian schools. Some specialized workshops or events may have a nominal fee to cover costs, but we strive to keep everything accessible.', 'General', 4, true),
('How do I contact support?', 'You can reach our support team via email at support@schoolswellbeing.org.au or call our helpline during business hours. We typically respond within 24 hours.', 'Support', 5, true)
ON CONFLICT DO NOTHING;

-- Comment
COMMENT ON TABLE "Faq" IS 'Frequently Asked Questions displayed on the website';
```

**After Migration:** Refresh `/admin/faq` - you'll see 5 FAQs ✅

---

## 2️⃣ BLOG SAVE → 404 ERROR

**Issue:** When saving a new blog post, redirects to `/admin/blog/[id]` which didn't exist

**Status:** ✅ **FIXED - Deployed**

**Solution:** Created `/admin/blog/[id]/page.tsx` with full edit interface

### What Was Fixed:
- ✅ Created blog edit page at `/admin/blog/[id]/page.tsx`
- ✅ Full edit interface (title, slug, excerpt, content, author, published)
- ✅ Delete post button with confirmation
- ✅ Loads existing post data from API
- ✅ Saves changes and redirects to blog list
- ✅ Shows last updated timestamp
- ✅ Proper loading and error states

**Test:** 
1. Go to `/admin/blog`
2. Click "New Post"
3. Fill in details and save
4. Should redirect to edit page (not 404) ✅
5. Make changes and save
6. Should redirect back to blog list ✅

---

## 3️⃣ BLOG EDIT → 404 ERROR

**Issue:** Clicking edit on existing blog post showed 404

**Status:** ✅ **FIXED - Deployed** (same fix as #2)

**Test:**
1. Go to `/admin/blog`
2. Click edit icon on any post
3. Should load edit page (not 404) ✅

---

## 4️⃣ CMS MENU UI IMPROVEMENT

**Issue:** Menu UI needs improvement

**Status:** 🔄 **In Progress**

**Current State:**
- Basic functionality works
- UI is functional but could be more polished

**Planned Improvements:**
- Better visual hierarchy
- Drag-and-drop reordering
- Improved form layout
- Better visual feedback
- Icons for menu items
- Preview of menu structure

**Will implement next...**

---

## 📋 MIGRATIONS STILL NEEDED

You still need to apply these 3 migrations from earlier:

### Migration 011 - Logo URLs
```sql
ALTER TABLE home_trusted_logos 
ADD COLUMN IF NOT EXISTS link_url TEXT;
```

### Migration 013 - Partner Table
```sql
-- See MIGRATIONS_TO_APPLY.md for full SQL
-- Fixes Partner table RLS and seeds 4 partners
```

### Migration 014 - FAQ Table
```sql
-- See above for full SQL
-- Creates Faq table and seeds 5 FAQs
```

---

## ✅ COMPLETED FIXES (Earlier Today)

1. ✅ Homepage-builder not saving blocks
2. ✅ Hero image upload missing
3. ✅ Logo URL field missing
4. ✅ Calendar view for events page
5. ✅ Blog save/edit 404 errors

---

## 🎯 NEXT ACTIONS

### Immediate (You):
1. **Apply migration 014** for FAQ table
2. **Apply migrations 011 and 013** if not done yet
3. Test blog save/edit (should work now)

### In Progress (Me):
4. Improve CMS menu UI

---

**Files Modified:**
- `src/app/admin/blog/[id]/page.tsx` (created)

**Deployed:** `464b432`

---

**End of Status Report**
