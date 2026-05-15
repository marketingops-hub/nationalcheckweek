# Centralized Source Management System

**Date:** April 2, 2026  
**Status:** ✅ COMPLETE - Scalable Solution

---

## Problem Solved

Instead of embedding sources in every JSON file (areas.json, regional.json, etc.), we now have a **centralized database system** that can link sources to ANY entity type at scale.

---

## Architecture

### **3-Table System**

```
vault_sources (existing)
    ↓
source_links (NEW)
    ↓
entity_sources (VIEW)
```

1. **`vault_sources`** - Central repository of all sources (URLs, titles, descriptions)
2. **`source_links`** - Links sources to entities (areas, states, issues, etc.)
3. **`entity_sources`** - View that joins sources with their linked entities

---

## Database Tables

### **1. vault_sources** (Existing)
Stores all source URLs centrally:
- `id` - UUID
- `url` - Unique URL
- `title` - Source title
- `description` - What this source provides
- `domain` - Auto-extracted domain
- `category` - Source category
- `is_approved` - Verification status

### **2. source_links** (NEW)
Links sources to any entity:
- `source_id` - References vault_sources
- `entity_type` - 'area', 'state', 'issue', 'content', 'research_theme'
- `entity_slug` - Entity identifier (e.g., 'melbourne', 'victoria')
- `relevance` - 'primary', 'secondary', 'reference'
- `notes` - Context about the link

**Key Feature:** One source can link to multiple entities!

### **3. entity_sources** (VIEW)
Convenient view for querying:
```sql
SELECT * FROM entity_sources 
WHERE entity_type = 'area' AND entity_slug = 'melbourne';
```

---

## How It Works

### **Example: National Check-In Week**

**Step 1:** Add source to `vault_sources`
```sql
INSERT INTO vault_sources (url, title, description, category)
VALUES (
  'https://nationalcheckinweek.com/areas/melbourne',
  'National Check-In Week - Melbourne',
  'Melbourne youth mental health data',
  'mental_health'
);
```

**Step 2:** Link to Melbourne area
```sql
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance)
SELECT id, 'area', 'melbourne', 'primary'
FROM vault_sources 
WHERE url = 'https://nationalcheckinweek.com/areas/melbourne';
```

**Step 3:** Query sources for Melbourne
```sql
SELECT * FROM entity_sources 
WHERE entity_type = 'area' AND entity_slug = 'melbourne';
```

---

## Usage in Code

### **Fetch sources for any entity:**

```typescript
import { getAreaSources, getStateSources, getIssueSources } from '@/lib/sources';

// Get sources for Melbourne
const melbourneSources = await getAreaSources('melbourne');

// Get sources for Victoria state
const victoriaSources = await getStateSources('victoria');

// Get sources for cyberbullying issue
const cyberbullyingSources = await getIssueSources('cyberbullying');
```

### **Add and link a new source:**

```typescript
import { addAndLinkSource } from '@/lib/sources';

await addAndLinkSource(
  'https://nationalcheckinweek.com/areas/sydney',
  'National Check-In Week - Sydney',
  'Sydney youth mental health data',
  'area',
  'sydney',
  'mental_health',
  'primary',
  'Primary resource for Sydney area data'
);
```

---

## Scalability

### **One Source → Many Entities**

A single source can link to multiple entities:

```sql
-- Link AIHW report to multiple states
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance)
SELECT 
  (SELECT id FROM vault_sources WHERE url = 'https://aihw.gov.au/...'),
  'state',
  unnest(ARRAY['victoria', 'nsw', 'queensland']),
  'primary';
```

### **Many Sources → One Entity**

An entity can have multiple sources:

```sql
-- Melbourne has multiple sources
SELECT * FROM entity_sources 
WHERE entity_type = 'area' AND entity_slug = 'melbourne';

-- Returns:
-- - National Check-In Week
-- - AIHW Youth Self-Harm Atlas
-- - Mission Australia Survey
-- - etc.
```

---

## Pre-Populated Data

✅ **Victoria State:**
- URL: https://nationalcheckinweek.com/states/victoria
- Linked to: `entity_type='state'`, `entity_slug='victoria'`

✅ **Melbourne Area:**
- URL: https://nationalcheckinweek.com/areas/melbourne
- Linked to: `entity_type='area'`, `entity_slug='melbourne'`

---

## Files Created

✅ `supabase/source_links.sql` - Database schema + initial data  
✅ `src/lib/sources.ts` - TypeScript helper functions

---

## To Apply

Run in Supabase SQL Editor:
```bash
supabase/source_links.sql
```

This will:
1. Create `source_links` table
2. Create `entity_sources` view
3. Add National Check-In Week sources
4. Link them to Victoria and Melbourne

---

## Display Sources on Pages

### **Example Component:**

```typescript
// components/SourcesList.tsx
import { getAreaSources } from '@/lib/sources';

export async function SourcesList({ areaSlug }: { areaSlug: string }) {
  const sources = await getAreaSources(areaSlug);
  
  if (sources.length === 0) return null;
  
  return (
    <div className="sources">
      <h3>Sources & References</h3>
      <ul>
        {sources.map((source) => (
          <li key={source.source_id}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.title}
            </a>
            {source.description && (
              <p className="text-sm text-gray-600">{source.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### **Usage:**

```typescript
// app/areas/[slug]/page.tsx
import { SourcesList } from '@/components/SourcesList';

export default async function AreaPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      {/* Area content */}
      <SourcesList areaSlug={params.slug} />
    </div>
  );
}
```

---

## Benefits

✅ **Scalable** - Add sources for any entity type  
✅ **Centralized** - One source, many links  
✅ **Flexible** - Link sources to areas, states, issues, content, etc.  
✅ **Maintainable** - Update source once, reflects everywhere  
✅ **Queryable** - Easy SQL queries via view  
✅ **Type-safe** - TypeScript helpers with proper types  

---

## Next Steps

1. **Run the SQL migration** (`source_links.sql`)
2. **Add more National Check-In Week sources** for other states/areas
3. **Link existing sources** (AIHW, Mission Australia, etc.) to relevant entities
4. **Display sources** on area/state/issue pages
5. **Admin UI** to manage source links

---

## Query Examples

```sql
-- Get all sources for Melbourne
SELECT * FROM entity_sources 
WHERE entity_type = 'area' AND entity_slug = 'melbourne';

-- Get all primary sources for Victoria
SELECT * FROM entity_sources 
WHERE entity_type = 'state' 
  AND entity_slug = 'victoria' 
  AND relevance = 'primary';

-- Get all entities linked to a specific source
SELECT entity_type, entity_slug, relevance 
FROM source_links 
WHERE source_id = 'uuid-here';

-- Count sources by entity type
SELECT entity_type, COUNT(*) 
FROM source_links 
GROUP BY entity_type;
```

---

## Summary

**Old approach:** Embed sources in JSON files (doesn't scale)  
**New approach:** Centralized database with flexible linking (scales infinitely)

This system can now handle sources for:
- ✅ All areas/cities
- ✅ All states
- ✅ All issues
- ✅ All content blocks
- ✅ All research themes
- ✅ Any future entity types
