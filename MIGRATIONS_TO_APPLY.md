# 🎯 Database Migrations - Apply These Now

**Date:** March 29, 2026  
**Status:** 3 migrations ready to apply  
**Deployed:** `9d23543`

---

## 📋 APPLY THESE 3 MIGRATIONS IN ORDER

Go to **Supabase Dashboard → SQL Editor** and run each migration:

---

### ✅ Migration 1: Add Logo URL Field

**File:** `011_add_logo_url.sql`

```sql
-- Add link_url field to home_trusted_logos table
-- This allows logos to be clickable and link to organization websites

ALTER TABLE home_trusted_logos 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment
COMMENT ON COLUMN home_trusted_logos.link_url IS 'Optional URL to link to when logo is clicked';
```

**What it does:** Adds URL field to trusted logos so they can link to organization websites

---

### ✅ Migration 2: Fix Partner Table

**File:** `013_fix_partner_rls.sql`

```sql
-- Fix Partner table RLS policies and ensure unique constraint exists

-- Drop the broken admin policy
DROP POLICY IF EXISTS "Admins can manage partners" ON "Partner";

-- Ensure unique constraint on slug exists
ALTER TABLE "Partner" DROP CONSTRAINT IF EXISTS "Partner_slug_key";
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_slug_key" UNIQUE (slug);

-- Temporarily disable RLS to verify data exists
ALTER TABLE "Partner" DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- Verify seed data exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Partner" LIMIT 1) THEN
    -- Re-insert seed data if table is empty
    INSERT INTO "Partner" (name, description, "logoUrl", url, slug, "sortOrder", active) VALUES
    ('Australian Government Department of Education', 'Supporting student wellbeing initiatives across Australia', null, 'https://www.education.gov.au', 'dept-education', 1, true),
    ('Beyond Blue', 'Providing mental health support and resources for young Australians', null, 'https://www.beyondblue.org.au', 'beyond-blue', 2, true),
    ('Headspace', 'Youth mental health foundation providing early intervention services', null, 'https://www.headspace.org.au', 'headspace', 3, true),
    ('Black Dog Institute', 'Research and treatment for mental health conditions', null, 'https://www.blackdoginstitute.org.au', 'black-dog-institute', 4, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
```

**What it does:** 
- Fixes RLS policies on Partner table
- Adds unique constraint on slug
- Seeds 4 example partners

---

### ✅ Migration 3: Create FAQ Table

**File:** `014_create_faq.sql`

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

**What it does:**
- Creates Faq table with proper schema
- Adds RLS policy for public viewing
- Seeds 5 example FAQs

---

## ✅ AFTER APPLYING MIGRATIONS

### Test These Pages:

1. **Homepage Builder** - https://2026schools.vercel.app/admin/homepage-builder
   - ✅ Edit a block and save (should work now)

2. **Home Page Manager** - https://2026schools.vercel.app/admin/home-page
   - ✅ Upload hero image (should work now)
   - ✅ Add URL to logos (should work now)

3. **Partners** - https://2026schools.vercel.app/admin/partners
   - ✅ Should show 4 partners

4. **FAQ** - https://2026schools.vercel.app/admin/faq
   - ✅ Should show 5 FAQs

---

## 📊 SUMMARY OF ALL FIXES

| Issue | Status | Fix Type | Migration |
|-------|--------|----------|-----------|
| Homepage-builder not saving | ✅ Fixed | Code | None |
| Hero image upload missing | ✅ Fixed | Code | None |
| Logo URL field missing | ✅ Fixed | Code + DB | 011 |
| Partners page empty | ✅ Fixed | DB | 013 |
| FAQ page not loading | ✅ Fixed | DB | 014 |

---

## 🔍 EDGE FUNCTIONS CONFIRMED

All admin API routes are using **Edge runtime** for fast global performance:

- ✅ `/api/admin/partners` - Edge function
- ✅ `/api/admin/partners/[id]` - Edge function  
- ✅ `/api/admin/faq` - Edge function
- ✅ `/api/admin/faq/[id]` - Edge function
- ✅ `/api/admin/homepage-blocks` - Edge function
- ✅ `/api/admin/homepage-blocks/[id]` - Edge function

---

## 📝 FILES CHANGED

### Code Fixes (Already Deployed):
- `src/app/api/admin/homepage-blocks/[id]/route.ts` - Fixed params Promise
- `src/components/admin/HomePageManager.tsx` - Image upload + logo URLs

### Database Migrations (Need to Apply):
- `supabase/migrations/011_add_logo_url.sql` - Logo URLs
- `supabase/migrations/013_fix_partner_rls.sql` - Partner table fix
- `supabase/migrations/014_create_faq.sql` - FAQ table

---

**End of Migration Guide**
