# 🚀 APPLY PHASE 1 & 2 MIGRATIONS

## 📋 Quick Start

You need to apply **ONE SQL file** in Supabase that contains all 3 migrations.

---

## ⚡ STEP-BY-STEP INSTRUCTIONS

### **Step 1: Update Your Email**

1. Open: `supabase/migrations/APPLY_ALL_PHASE_1_2_MIGRATIONS.sql`
2. Find line **265** (search for `your-email@example.com`)
3. Replace with your actual email address:

```sql
-- BEFORE:
WHERE email = 'your-email@example.com' -- ⚠️ CHANGE THIS TO YOUR EMAIL!

-- AFTER (example):
WHERE email = 'greg@2026schools.com' -- ⚠️ CHANGE THIS TO YOUR EMAIL!
```

### **Step 2: Apply in Supabase**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy the **entire contents** of `APPLY_ALL_PHASE_1_2_MIGRATIONS.sql`
5. Paste into the SQL Editor
6. Click: **Run** (or press Ctrl+Enter)

### **Step 3: Verify Success**

You should see:
```
Success. No rows returned
```

If you see errors, check:
- Did you update your email?
- Is your email registered in Supabase Auth?
- Are you logged in to your project?

---

## ✅ WHAT THIS MIGRATION DOES

### **Migration 019: Global Colors System**
- ✅ Creates `homepage_global_settings` table
- ✅ Inserts default color scheme (14 colors)
- ✅ Sets up RLS policies
- ✅ Enables public read, authenticated write

### **Migration 020: Per-Block Color Overrides**
- ✅ Documents color override feature
- ✅ No schema changes (uses existing JSONB)
- ✅ Adds table comments

### **Migration 021: Admin Roles & Audit Logging**
- ✅ Creates `user_profiles` table (user, admin, super_admin roles)
- ✅ Creates `audit_logs` table (tracks all changes)
- ✅ Creates helper functions: `is_admin()`, `log_audit()`
- ✅ Sets up RLS policies
- ✅ Makes YOU a super_admin

---

## 🎯 AFTER APPLYING

### **Test Your Access:**

1. Go to: https://2026schools.vercel.app/admin/homepage-builder
2. You should see two tabs:
   - **Content Blocks** - Manage homepage blocks
   - **Global Colors** - Manage color scheme
3. Click **Global Colors** tab
4. You should see 14 color pickers organized by category
5. Try changing a color and clicking **Save Global Colors**

### **Verify Audit Logging:**

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

You should see your color changes logged with:
- Your user ID and email
- Action: `update_global_colors`
- Old value and new value (JSONB)
- Timestamp

---

## 🔒 SECURITY FEATURES NOW ACTIVE

### **Before Migration:**
- ❌ Any authenticated user could edit homepage
- ❌ No audit trail
- ❌ No role verification

### **After Migration:**
- ✅ Only admins can edit homepage (403 Forbidden for others)
- ✅ Complete audit trail (who, what, when)
- ✅ Role-based access control (RBAC)
- ✅ Can track and rollback changes

---

## 🎨 HOW TO USE THE SYSTEM

### **Option 1: Global Colors (Recommended)**

1. Go to `/admin/homepage-builder` → **Global Colors** tab
2. Set your brand colors once:
   - Primary Button: `#29B8E8` (your brand blue)
   - Accent Color: `#29B8E8`
   - Heading: `#0f0e1a`
   - etc.
3. Click **Save Global Colors**
4. All blocks automatically use these colors

### **Option 2: Per-Block Color Overrides**

1. Go to `/admin/homepage-builder` → **Content Blocks** tab
2. Click **Edit** on any block
3. Scroll to **"Block Colors"** section
4. **Uncheck** "Use Global Colors"
5. Customize colors for that specific block
6. Click **Save Changes**
7. That block now uses custom colors (others still use global)

---

## 🆘 TROUBLESHOOTING

### **Error: "relation 'homepage_global_settings' already exists"**
- ✅ This is fine! It means the table already exists
- The migration uses `CREATE TABLE IF NOT EXISTS`
- Just continue with the rest of the migration

### **Error: "permission denied for table auth.users"**
- ❌ You need to be the project owner or have admin access
- Ask the project owner to run the migration
- Or add your account as a project admin in Supabase

### **Error: "No rows returned" but can't access admin panel**
- Check: Did you update your email correctly?
- Check: Is that email registered in Supabase Auth?
- Try: Log out and log back in
- Verify: Run `SELECT * FROM user_profiles WHERE role = 'super_admin';`

### **Build still failing?**
- Latest commit: `8fe658e` should fix TypeScript errors
- Vercel will auto-rebuild after push
- Check build logs for any new errors

---

## 📊 DATABASE SCHEMA OVERVIEW

```
homepage_global_settings
├── id (UUID)
├── setting_key (TEXT) - 'global_colors'
├── setting_value (JSONB) - { primaryButton: "#29B8E8", ... }
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

user_profiles
├── id (UUID) → auth.users(id)
├── email (TEXT)
├── role (TEXT) - 'user' | 'admin' | 'super_admin'
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

audit_logs
├── id (UUID)
├── user_id (UUID) → auth.users(id)
├── user_email (TEXT)
├── action (TEXT) - e.g., 'update_global_colors'
├── table_name (TEXT)
├── record_id (TEXT)
├── old_value (JSONB)
├── new_value (JSONB)
├── ip_address (TEXT)
├── user_agent (TEXT)
└── created_at (TIMESTAMPTZ)
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Updated email in migration file (line 265)
- [ ] Applied migration in Supabase SQL Editor
- [ ] Saw "Success. No rows returned" message
- [ ] Can access `/admin/homepage-builder`
- [ ] Can see "Global Colors" tab
- [ ] Can edit and save colors
- [ ] Changes appear in `audit_logs` table
- [ ] Homepage reflects color changes after refresh

---

## 🎉 YOU'RE DONE!

Your homepage system now has:
- ✅ Unified color management
- ✅ Global + per-block color control
- ✅ Admin role verification
- ✅ Complete audit trail
- ✅ Enterprise-grade security

**Next:** Customize your colors and enjoy your new system! 🎨
