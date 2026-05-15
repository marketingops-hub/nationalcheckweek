# Issues Database Migration Guide

## Overview
This migration moves hardcoded issue data from `src/lib/issues.ts` (37KB) into the Supabase database, eliminating the need for code deploys when content changes.

## What Changed

### 1. Database Migrations Created
- `supabase/migrations/001_seed_issues.sql` - Issues 1-3
- `supabase/migrations/002_seed_issues_batch2.sql` - Issues 4-8
- `supabase/migrations/003_seed_issues_batch3.sql` - Issues 9-12
- `supabase/migrations/004_seed_issues_batch4.sql` - Issues 13-15

### 2. New API Endpoint
- `src/app/api/issues/route.ts` - Fetches issues from database with 1-hour cache

### 3. Updated Library
- `src/lib/issues.ts` - Now exports `getIssues()` async function with in-memory caching
- Legacy `ISSUES` array kept for backwards compatibility (will be deprecated)

## Deployment Steps

### Step 1: Run Database Migrations
```bash
# Navigate to Supabase dashboard SQL Editor
# Run each migration file in order:
# 1. 001_seed_issues.sql
# 2. 002_seed_issues_batch2.sql
# 3. 003_seed_issues_batch3.sql
# 4. 004_seed_issues_batch4.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify Data
```sql
-- Check all 15 issues were inserted
SELECT rank, slug, title FROM issues ORDER BY rank;

-- Should return 15 rows
SELECT COUNT(*) FROM issues;
```

### Step 3: Update Components (Gradual Migration)

**Before:**
```typescript
import { ISSUES } from "@/lib/issues";

export default function IssuesPage() {
  return <div>{ISSUES.map(issue => ...)}</div>;
}
```

**After:**
```typescript
import { getIssues } from "@/lib/issues";

export default async function IssuesPage() {
  const issues = await getIssues();
  return <div>{issues.map(issue => ...)}</div>;
}
```

### Step 4: Deploy
```bash
npm run build
git add .
git commit -m "feat: migrate issues to database"
git push origin main
```

## Benefits

✅ **No code deploys for content updates** - Edit issues via Supabase dashboard or admin panel  
✅ **Consistent data source** - Single source of truth in database  
✅ **Better performance** - API caching + in-memory cache  
✅ **Backwards compatible** - Legacy `ISSUES` export still works  
✅ **Graceful degradation** - Falls back to stale cache if API fails  

## Next Steps

1. Build admin UI to manage issues (CRUD operations)
2. Migrate all components from `ISSUES` to `getIssues()`
3. Remove hardcoded `ISSUES` array after full migration
4. Add versioning/audit trail for content changes

## Rollback Plan

If issues occur:
```sql
-- Clear all issues
DELETE FROM issues;

-- Re-run migrations
-- Or restore from backup
```

The legacy `ISSUES` array is still in the codebase as a fallback.
