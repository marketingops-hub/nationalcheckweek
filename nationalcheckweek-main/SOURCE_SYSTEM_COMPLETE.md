# Complete Source Management System

**Date:** April 2, 2026  
**Status:** ✅ READY TO USE

---

## What Was Built

A complete 3-part system for managing and displaying data sources:

1. ✅ **Display sources on pages** (areas, states, issues)
2. ✅ **Admin UI** to manage sources and links
3. ✅ **Ready for AI integration** to cite sources when generating content

---

## Part 1: Display Sources on Pages

### **Component Created**
`src/components/SourcesList.tsx`

**Usage:**
```typescript
<SourcesList entityType="area" entitySlug="melbourne" />
<SourcesList entityType="state" entitySlug="victoria" />
<SourcesList entityType="issue" entitySlug="cyberbullying" />
```

**Features:**
- Automatically fetches sources from database
- Groups by relevance (Primary, Secondary, Reference)
- Shows title, description, URL, domain
- Only displays if sources exist
- Styled to match your design system

### **Already Integrated**
✅ Area pages (`/areas/[slug]`) - Shows sources at bottom of page

**Next Steps:**
- Add to state pages
- Add to issue pages
- Add to any other entity pages

---

## Part 2: Admin UI

### **Location**
`/admin/sources`

### **Features**

**Sources Tab:**
- View all sources in vault_sources
- Add new sources (URL, title, description, category)
- See how many entities each source is linked to
- Click to open source URLs

**Links Tab:**
- View all source-to-entity links
- Create new links (select source, entity type, entity slug, relevance)
- Delete links
- See notes about why sources are linked

**Entity Types Supported:**
- Area (cities/regions)
- State
- Issue
- Content
- Research Theme
- Any custom type you define

---

## Part 3: AI Integration (Next Step)

### **How It Will Work**

When AI generates content for an area/state/issue, it should:

1. **Fetch available sources** for that entity
2. **Include source citations** in generated content
3. **Reference specific data points** to sources

### **Example Prompt Enhancement**

**Before:**
```
Generate content about Melbourne's youth mental health issues.
```

**After:**
```
Generate content about Melbourne's youth mental health issues.

Available sources:
- National Check-In Week - Melbourne (https://nationalcheckinweek.com/areas/melbourne)
- AIHW Youth Self-Harm Atlas
- Mission Australia Youth Survey 2024

When citing statistics or data, reference these sources using [Source: Name] format.
```

### **Implementation**

Update your AI generation functions to:

```typescript
// Example: AI content generation with sources
async function generateAreaContent(areaSlug: string) {
  // 1. Fetch sources for this area
  const sources = await getAreaSources(areaSlug);
  
  // 2. Format sources for AI prompt
  const sourcesText = sources.map(s => 
    `- ${s.title} (${s.url}): ${s.description}`
  ).join('\n');
  
  // 3. Include in prompt
  const prompt = `
    Generate content about ${areaSlug}.
    
    Available data sources:
    ${sourcesText}
    
    When citing statistics, reference these sources.
  `;
  
  // 4. Call AI with enhanced prompt
  const content = await generateWithAI(prompt);
  
  return content;
}
```

---

## Database Schema

### **vault_sources** (Existing)
```sql
- id (uuid)
- url (text, unique)
- title (text)
- description (text)
- domain (text, auto-generated)
- category (text)
- is_approved (boolean)
- created_at, updated_at
```

### **source_links** (New)
```sql
- id (uuid)
- source_id (uuid) → vault_sources
- entity_type (text) - 'area', 'state', 'issue', etc.
- entity_slug (text) - 'melbourne', 'victoria', etc.
- relevance (text) - 'primary', 'secondary', 'reference'
- notes (text)
- created_at, updated_at
```

### **entity_sources** (View)
Joins source_links + vault_sources for easy querying

---

## Current Data

✅ **Victoria State:**
- Source: National Check-In Week - Victoria
- URL: https://nationalcheckinweek.com/states/victoria
- Linked to: `entity_type='state'`, `entity_slug='victoria'`

✅ **Melbourne Area:**
- Source: National Check-In Week - Melbourne
- URL: https://nationalcheckinweek.com/areas/melbourne
- Linked to: `entity_type='area'`, `entity_slug='melbourne'`

---

## How to Use

### **1. Add a New Source**

**Via Admin UI:**
1. Go to `/admin/sources`
2. Click "Add New Source"
3. Enter URL, title, description, category
4. Click "Add Source"

**Via SQL:**
```sql
INSERT INTO vault_sources (url, title, description, category)
VALUES (
  'https://aihw.gov.au/reports/youth-2024',
  'AIHW Youth Mental Health Report 2024',
  'Comprehensive national data on youth mental health',
  'research'
);
```

### **2. Link Source to Entity**

**Via Admin UI:**
1. Go to `/admin/sources` → Links tab
2. Click "Link Source to Entity"
3. Select source, entity type, entity slug, relevance
4. Click "Create Link"

**Via SQL:**
```sql
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance)
SELECT id, 'area', 'sydney', 'primary'
FROM vault_sources 
WHERE url = 'https://nationalcheckinweek.com/areas/sydney';
```

### **3. Display Sources on a Page**

```typescript
import { SourcesList } from '@/components/SourcesList';

<SourcesList entityType="area" entitySlug="melbourne" />
```

### **4. Fetch Sources in Code**

```typescript
import { getAreaSources } from '@/lib/sources';

const sources = await getAreaSources('melbourne');
// Use in AI prompts, display logic, etc.
```

---

## Files Created/Modified

### **Created:**
- ✅ `supabase/source_links.sql` - Database schema
- ✅ `src/lib/sources.ts` - Helper functions
- ✅ `src/components/SourcesList.tsx` - Display component
- ✅ `src/app/admin/sources/page.tsx` - Admin UI
- ✅ `src/app/test-sources/page.tsx` - Test page

### **Modified:**
- ✅ `src/app/(inner)/areas/[slug]/page.tsx` - Added SourcesList component

---

## Next Steps

### **Immediate:**
1. ✅ Run `source_links.sql` in Supabase (if not done)
2. ✅ Visit `/admin/sources` to verify admin UI works
3. ✅ Visit `/areas/melbourne` to see sources displayed
4. ✅ Visit `/test-sources` to verify data is loading

### **Add More Sources:**
1. Add National Check-In Week URLs for all states/areas
2. Add AIHW sources
3. Add Mission Australia sources
4. Add government department sources

### **AI Integration:**
1. Update AI content generation prompts to include sources
2. Format sources for AI context
3. Instruct AI to cite sources in generated content
4. Parse AI output to ensure source citations are included

### **Expand Display:**
1. Add SourcesList to state pages
2. Add SourcesList to issue pages
3. Add SourcesList to research theme pages
4. Customize styling per page type

---

## Example Workflows

### **Workflow 1: Add National Check-In Week for All States**

```typescript
const states = [
  'victoria', 'new-south-wales', 'queensland', 
  'south-australia', 'western-australia', 'tasmania',
  'northern-territory', 'australian-capital-territory'
];

for (const state of states) {
  await addAndLinkSource(
    `https://nationalcheckinweek.com/states/${state}`,
    `National Check-In Week - ${state}`,
    `State-level youth mental health data for ${state}`,
    'state',
    state,
    'mental_health',
    'primary'
  );
}
```

### **Workflow 2: Link AIHW Report to Multiple Issues**

```sql
-- Add source once
INSERT INTO vault_sources (url, title, description, category)
VALUES (
  'https://aihw.gov.au/reports/youth-self-harm-2024',
  'AIHW Youth Self-Harm Atlas 2024',
  'National data on youth self-harm and suicidality',
  'research'
);

-- Link to multiple issues
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance)
SELECT 
  (SELECT id FROM vault_sources WHERE url = 'https://aihw.gov.au/reports/youth-self-harm-2024'),
  'issue',
  unnest(ARRAY['self-harm', 'depression', 'anxiety', 'loneliness']),
  'primary';
```

### **Workflow 3: AI Content Generation with Sources**

```typescript
async function generateAreaContent(areaSlug: string) {
  // Fetch sources
  const sources = await getAreaSources(areaSlug);
  
  // Build prompt
  const prompt = `
    Generate content about ${areaSlug} youth mental health.
    
    Use these verified sources:
    ${sources.map(s => `- ${s.title}: ${s.description}`).join('\n')}
    
    Cite sources when mentioning statistics.
  `;
  
  // Generate with AI
  const content = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return content;
}
```

---

## Summary

You now have a **complete, scalable source management system** that:

✅ Stores sources centrally in `vault_sources`  
✅ Links sources to any entity type via `source_links`  
✅ Displays sources automatically on pages via `SourcesList`  
✅ Provides admin UI at `/admin/sources` to manage everything  
✅ Ready to integrate with AI content generation  

**The system scales infinitely** - add sources for any entity type, link one source to unlimited entities, and display sources anywhere in your app.
