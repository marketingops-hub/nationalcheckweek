# SOURCE MANAGEMENT SYSTEM - CODE QUALITY AUDIT

**Date:** April 2, 2026  
**Auditor:** AI Code Review  
**Standard:** Production-Grade Enterprise Quality

---

## EXECUTIVE SUMMARY

**Overall Grade: B+ (85/100)**

The source management system is **functional and well-architected**, but has several areas requiring improvement before production deployment. Key issues: error handling, type safety, server/client component separation, and inline styles.

---

## COMPONENT-BY-COMPONENT GRADING

### 1. **Database Schema** (`supabase/source_links.sql`)
**Grade: A- (90/100)**

#### ✅ Strengths:
- Proper foreign key constraints with cascade delete
- Unique constraint prevents duplicate links
- Indexes on frequently queried columns
- Row-level security policies
- Auto-generated domain field
- Proper timestamp triggers
- View for easy querying

#### ❌ Issues:
1. **No validation constraints** - `entity_type` and `relevance` should use CHECK constraints
2. **Missing comments** - No SQL comments explaining table purpose
3. **No migration versioning** - Should be numbered migration file

#### 🔧 Fixes Needed:

```sql
-- Add CHECK constraints
ALTER TABLE source_links 
ADD CONSTRAINT check_entity_type 
CHECK (entity_type IN ('area', 'state', 'issue', 'content', 'research_theme'));

ALTER TABLE source_links 
ADD CONSTRAINT check_relevance 
CHECK (relevance IN ('primary', 'secondary', 'reference'));

-- Add table comments
COMMENT ON TABLE source_links IS 'Links vault_sources to entities (areas, states, issues, etc.)';
COMMENT ON COLUMN source_links.entity_type IS 'Type of entity: area, state, issue, content, research_theme';
COMMENT ON COLUMN source_links.relevance IS 'Source relevance: primary, secondary, reference';
```

---

### 2. **Helper Functions** (`src/lib/sources.ts`)
**Grade: C+ (75/100)**

#### ✅ Strengths:
- Clean API with specific helper functions
- Good TypeScript documentation
- Consistent naming conventions
- Proper async/await usage

#### ❌ Critical Issues:

1. **WRONG SUPABASE CLIENT** - Using client-side `createClient()` in server components
2. **Poor error handling** - Just console.error and return empty/null
3. **No input validation** - No checks for empty strings, invalid formats
4. **No retry logic** - Network failures = instant failure
5. **Hardcoded values** - `added_by: 'admin'` should be dynamic
6. **No caching** - Repeated queries for same data

#### 🔧 Required Fixes:

```typescript
// CRITICAL: Support both server and client contexts
import { createClient as createClientClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Detect context
function getSupabaseClient() {
  // Check if we're in server context
  if (typeof window === 'undefined') {
    return createServerClient();
  }
  return createClientClient();
}

// Add proper error handling
export async function getSourcesForEntity(
  entityType: string,
  entitySlug: string
): Promise<{ data: Source[]; error: string | null }> {
  // Validate inputs
  if (!entityType?.trim()) {
    return { data: [], error: 'Entity type is required' };
  }
  if (!entitySlug?.trim()) {
    return { data: [], error: 'Entity slug is required' };
  }
  
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('entity_sources')
    .select('*')
    .eq('entity_type', entityType.toLowerCase().trim())
    .eq('entity_slug', entitySlug.toLowerCase().trim())
    .order('relevance', { ascending: true });
  
  if (error) {
    console.error('[getSourcesForEntity] Database error:', error);
    return { 
      data: [], 
      error: `Failed to fetch sources: ${error.message}` 
    };
  }
  
  return { data: data || [], error: null };
}

// Add validation helper
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Improve addSource with validation
export async function addSource(
  url: string,
  title: string,
  description: string,
  category: string = 'general',
  addedBy: string = 'system'
): Promise<{ id: string | null; error: string | null }> {
  // Validate inputs
  if (!url?.trim()) {
    return { id: null, error: 'URL is required' };
  }
  if (!validateUrl(url)) {
    return { id: null, error: 'Invalid URL format' };
  }
  if (!title?.trim()) {
    return { id: null, error: 'Title is required' };
  }
  
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('vault_sources')
    .insert({
      url: url.trim(),
      title: title.trim(),
      description: description?.trim() || '',
      category: category.trim(),
      is_approved: true,
      added_by: addedBy
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('[addSource] Database error:', error);
    return { 
      id: null, 
      error: error.code === '23505' 
        ? 'Source URL already exists' 
        : `Failed to add source: ${error.message}` 
    };
  }
  
  return { id: data?.id || null, error: null };
}
```

---

### 3. **Display Component** (`src/components/SourcesList.tsx`)
**Grade: D+ (65/100)**

#### ✅ Strengths:
- Clean grouping by relevance
- Conditional rendering
- Accessible external links

#### ❌ Critical Issues:

1. **INLINE STYLES EVERYWHERE** - Violates separation of concerns
2. **No error handling** - What if getSourcesForEntity fails?
3. **No loading state** - Server component but no Suspense boundary
4. **Repeated style objects** - Massive duplication
5. **No TypeScript for props** - Missing proper interface
6. **Hardcoded event handlers** - onMouseEnter/Leave in server component (will cause hydration issues)

#### 🔧 Required Fixes:

```typescript
// Create proper CSS module
// src/components/SourcesList.module.css
.sourcesSection {
  margin-top: 48px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sourceLink {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sourceLink:hover {
  text-decoration: underline;
}

// Refactored component
import styles from './SourcesList.module.css';
import { getSourcesForEntity } from '@/lib/sources';

interface SourcesListProps {
  entityType: string;
  entitySlug: string;
  title?: string;
}

export async function SourcesList({ 
  entityType, 
  entitySlug, 
  title = "Data Sources & References" 
}: SourcesListProps) {
  const { data: sources, error } = await getSourcesForEntity(entityType, entitySlug);
  
  // Handle errors
  if (error) {
    console.error('[SourcesList] Error:', error);
    return null; // Or show error UI
  }
  
  if (sources.length === 0) return null;
  
  const primarySources = sources.filter(s => s.relevance === 'primary');
  const secondarySources = sources.filter(s => s.relevance === 'secondary');
  const referenceSources = sources.filter(s => s.relevance === 'reference');
  
  return (
    <div className={styles.sourcesSection}>
      <h3 className={styles.title}>{title}</h3>
      
      {primarySources.length > 0 && (
        <SourceGroup 
          title="Primary Sources" 
          sources={primarySources} 
          variant="primary"
        />
      )}
      
      {secondarySources.length > 0 && (
        <SourceGroup 
          title="Additional Sources" 
          sources={secondarySources} 
          variant="secondary"
        />
      )}
      
      {referenceSources.length > 0 && (
        <SourceGroup 
          title="References" 
          sources={referenceSources} 
          variant="reference"
        />
      )}
    </div>
  );
}

// Extract to separate component for reusability
function SourceGroup({ title, sources, variant }: {
  title: string;
  sources: Source[];
  variant: 'primary' | 'secondary' | 'reference';
}) {
  return (
    <div className={styles.sourceGroup}>
      <h4 className={styles.groupTitle}>{title}</h4>
      <ul className={styles.sourceList}>
        {sources.map((source) => (
          <SourceItem key={source.source_id} source={source} variant={variant} />
        ))}
      </ul>
    </div>
  );
}

// Client component for interactive link
'use client';
function SourceItem({ source, variant }: { source: Source; variant: string }) {
  return (
    <li>
      <a 
        href={source.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${styles.sourceLink} ${styles[variant]}`}
      >
        {source.title}
        <span className={styles.externalIcon}>↗</span>
      </a>
      {source.description && (
        <p className={styles.description}>{source.description}</p>
      )}
      <p className={styles.domain}>{source.domain}</p>
    </li>
  );
}
```

---

### 4. **Admin UI** (`src/app/admin/sources/page.tsx`)
**Grade: C (70/100)**

#### ✅ Strengths:
- Comprehensive CRUD operations
- Tab-based interface
- Form validation (required fields)

#### ❌ Critical Issues:

1. **NO ERROR MESSAGES TO USER** - Errors only in console
2. **NO LOADING STATES** - Forms submit with no feedback
3. **NO SUCCESS MESSAGES** - User doesn't know if action worked
4. **INLINE STYLES** - Same issue as SourcesList
5. **NO OPTIMISTIC UPDATES** - Full reload after every action
6. **NO PAGINATION** - Will break with 1000+ sources
7. **NO SEARCH/FILTER** - Can't find sources easily
8. **SECURITY ISSUE** - No authentication check
9. **TYPE SAFETY** - Missing proper TypeScript for Supabase responses

#### 🔧 Required Fixes:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Add toast notifications
import { toast } from 'sonner'; // or your toast library

export default function AdminSourcesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... existing state
  
  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('vault_sources')
        .insert([{
          ...newSource,
          is_approved: true,
          added_by: 'admin' // TODO: Get from auth context
        }]);
      
      if (insertError) throw insertError;
      
      // Success feedback
      toast.success('Source added successfully');
      
      // Reset form
      setNewSource({ url: '', title: '', description: '', category: 'mental_health' });
      setShowNewSource(false);
      
      // Reload data
      await loadData();
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add source';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }
  
  // Add authentication check
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      loadData();
    }
    
    checkAuth();
  }, [router]);
  
  // ... rest of component with proper error handling
}
```

---

## CRITICAL ISSUES SUMMARY

### 🚨 **MUST FIX BEFORE PRODUCTION:**

1. **Server/Client Component Confusion**
   - `sources.ts` uses client Supabase in server contexts
   - Will cause hydration errors and auth issues

2. **No Error Handling**
   - Silent failures everywhere
   - Users see nothing when operations fail

3. **Inline Styles**
   - Violates best practices
   - Hard to maintain
   - No dark mode support

4. **No Input Validation**
   - SQL injection risk (mitigated by Supabase, but still bad practice)
   - No URL validation
   - No sanitization

5. **No Authentication**
   - Admin UI has no auth check
   - Anyone can access `/admin/sources`

---

## TECHNOLOGY STACK REVIEW

### ✅ **Good Choices:**
- Supabase for database (PostgreSQL + RLS)
- TypeScript for type safety
- Server components for performance
- View for query optimization

### ❌ **Missing/Wrong:**
- No error boundary components
- No toast/notification system
- No form validation library (Zod/Yup)
- No state management (for complex admin UI)
- Using client Supabase in server contexts

---

## REUSABILITY SCORE: C (70/100)

### ✅ **Reusable:**
- `getSourcesForEntity()` - Generic function
- Database schema - Flexible entity types
- Component props - Customizable

### ❌ **Not Reusable:**
- Inline styles - Can't theme
- Hardcoded strings - No i18n
- No component library integration

---

## EDGE CASES & BUGS

### 🐛 **Bugs Found:**

1. **Race Condition** - Multiple rapid clicks on "Add Source" creates duplicates
2. **Memory Leak** - Admin page doesn't cleanup on unmount
3. **Hydration Mismatch** - onMouseEnter in server component
4. **Type Mismatch** - `Source` interface doesn't match database schema exactly
5. **Null Handling** - `source.description &&` will fail for empty string

### 🎯 **Edge Cases Not Handled:**

1. What if entity_sources view doesn't exist?
2. What if user has no internet connection?
3. What if URL is valid but site is down?
4. What if source has 10,000 links?
5. What if entity_slug contains special characters?
6. What if two users edit same source simultaneously?

---

## FINAL GRADES BY CATEGORY

| Category | Grade | Score |
|----------|-------|-------|
| **Database Schema** | A- | 90/100 |
| **Helper Functions** | C+ | 75/100 |
| **Display Component** | D+ | 65/100 |
| **Admin UI** | C | 70/100 |
| **Error Handling** | F | 30/100 |
| **Type Safety** | B | 80/100 |
| **Documentation** | B+ | 85/100 |
| **Reusability** | C | 70/100 |
| **Security** | D | 60/100 |
| **Performance** | B- | 78/100 |

**OVERALL: B+ (75/100)**

---

## PRIORITY FIXES (In Order)

### 🔴 **P0 - Critical (Must fix immediately):**
1. Fix server/client Supabase usage
2. Add authentication to admin UI
3. Add proper error handling with user feedback
4. Remove inline styles, use CSS modules

### 🟡 **P1 - High (Fix before production):**
5. Add input validation
6. Add loading states
7. Handle edge cases
8. Add success/error toasts
9. Fix hydration issues

### 🟢 **P2 - Medium (Fix soon):**
10. Add pagination to admin UI
11. Add search/filter
12. Add optimistic updates
13. Add retry logic
14. Add caching

### 🔵 **P3 - Low (Nice to have):**
15. Add bulk operations
16. Add export functionality
17. Add audit log
18. Add source preview
19. Add i18n support

---

## RECOMMENDED REFACTOR

Create proper structure:
```
src/
  lib/
    sources/
      client.ts       # Client-side operations
      server.ts       # Server-side operations
      types.ts        # Shared types
      validation.ts   # Input validation
      constants.ts    # Entity types, etc.
  components/
    sources/
      SourcesList.tsx
      SourcesList.module.css
      SourceItem.tsx
      SourceGroup.tsx
  app/
    admin/
      sources/
        page.tsx
        SourcesTable.tsx
        SourceForm.tsx
        LinkForm.tsx
        sources.module.css
```

---

## CONCLUSION

The system is **architecturally sound** but has **implementation issues** that prevent production deployment. With the P0 and P1 fixes, this would be **A-grade production code**.

**Estimated fix time:** 4-6 hours for P0+P1 fixes.
