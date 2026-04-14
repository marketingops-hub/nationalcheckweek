# 🔧 PENDING DATABASE MIGRATIONS

**Last Updated:** March 31, 2026

---

## ⚠️ CRITICAL: Apply These Migrations to Fix Issues

You have **2 pending migrations** that need to be applied to your Supabase database:

---

### 1️⃣ Migration 034: Fix Partner RLS Policy (CRITICAL)

**File:** `supabase/migrations/034_fix_partner_rls_final.sql`

**Issue:** Partners page showing empty despite data existing  
**Cause:** RLS policy using `TO public` instead of `TO anon, authenticated`

**What it fixes:**
- Allows anonymous users to view active partners
- Fixes empty `/partners` page
- Uses correct Supabase role syntax

**Status:** ⚠️ **MUST BE APPLIED** - Partners page won't work without this

---

### 2️⃣ Migration 035: Create Resources Table (CRITICAL)

**File:** `supabase/migrations/035_create_resources.sql`

**Issue:** `/admin/resources` page fails to load  
**Cause:** Resource table doesn't exist in database

**What it creates:**
- Resource table with full schema
- RLS policies for public access
- Indexes for performance
- 4 seed resources

**Status:** ⚠️ **MUST BE APPLIED** - Resources feature won't work without this

---

## 📝 HOW TO APPLY MIGRATIONS

### Option 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

**Run Migration 034 first:**
```sql
-- Copy entire contents of:
-- supabase/migrations/034_fix_partner_rls_final.sql
-- Paste and click "Run"
```

**Then run Migration 035:**
```sql
-- Copy entire contents of:
-- supabase/migrations/035_create_resources.sql
-- Paste and click "Run"
```

### Option 2: Supabase CLI

```bash
cd C:\2026school
supabase db push
```

This will automatically apply all pending migrations.

---

## ✅ AFTER APPLYING MIGRATIONS

### Migration 034 (Partners RLS):
- Visit: https://2026schools.vercel.app/partners
- Should see 15 partners displayed
- No more "Partners will appear here once added" message

### Migration 035 (Resources):
- Visit: https://2026schools.vercel.app/admin/resources
- Should load successfully with admin interface
- Visit: https://2026schools.vercel.app/resources
- Should show 4 seed resources

---

## 🎯 CURRENT STATUS

| Migration | File | Status | Blocks Feature |
|-----------|------|--------|----------------|
| 031 | Fix State Links | Optional | State navigation links |
| 032 | Partner RLS (old) | Superseded | N/A (use 034 instead) |
| 033 | Partner Data | Applied ✅ | N/A |
| **034** | **Partner RLS Fix** | **⚠️ PENDING** | **/partners page** |
| **035** | **Create Resources** | **⚠️ PENDING** | **/admin/resources** |

---

## 🚨 TROUBLESHOOTING

### If Partners page still empty after migration 034:
1. Check Supabase logs for RLS errors
2. Verify policy was created: Go to **Authentication → Policies → Partner table**
3. Should see policy: "Public can view active partners" with `TO anon, authenticated`

### If Resources page still fails after migration 035:
1. Check Supabase Table Editor - Resource table should exist
2. Verify 4 seed resources were inserted
3. Check browser console for specific error messages

---

## 📞 NEED HELP?

If migrations fail or issues persist:
1. Check Supabase SQL Editor for error messages
2. Verify you're running migrations on the correct database
3. Check that migrations haven't already been applied (they're idempotent)

---

**Priority:** 🔴 HIGH - Apply these migrations ASAP to restore full functionality
