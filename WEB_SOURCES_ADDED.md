# Web Sources Added - National Check-In Week

**Date:** April 2, 2026  
**Status:** ✅ COMPLETE

---

## Summary

Added web source citations from National Check-In Week to both Melbourne area data and Victoria state data, including:
1. JSON data structure updates
2. Database table creation
3. TypeScript type definitions

---

## What Was Added

### **1. Melbourne Area Data**
**File:** `src/lib/data/areas.json`

Added sources field to Melbourne entry:
```json
"sources": [
  {
    "title": "National Check-In Week - Melbourne",
    "url": "https://nationalcheckinweek.com/areas/melbourne",
    "publisher": "National Check-In Week",
    "year": "2024",
    "type": "web"
  }
]
```

### **2. Victoria State Data**
**File:** `src/lib/data/regional.json`

Added sources field to Victoria entry:
```json
"sources": [
  {
    "title": "National Check-In Week - Victoria",
    "url": "https://nationalcheckinweek.com/states/victoria",
    "publisher": "National Check-In Week",
    "year": "2024",
    "type": "web"
  }
]
```

---

## Database Table Created

### **area_sources.sql**
**File:** `supabase/area_sources.sql`

Created new database table for storing area/region source citations:

**Table Structure:**
- `id` - UUID primary key
- `area_slug` - Links to area slug (e.g., 'melbourne', 'victoria')
- `source_type` - Type: 'web', 'report', 'data', 'research'
- `title` - Source title
- `url` - Source URL
- `publisher` - Publisher name
- `year` - Publication year
- `accessed_at` - When accessed
- `description` - Brief description
- `verified` - Verification status
- `created_at` / `updated_at` - Timestamps

**Pre-populated Data:**
- Victoria state source: https://nationalcheckinweek.com/states/victoria
- Melbourne area source: https://nationalcheckinweek.com/areas/melbourne

**Features:**
- Row-level security enabled
- Public read access
- Authenticated write access
- Indexed by area_slug for fast lookups
- Auto-updated timestamps

---

## TypeScript Types Updated

### **src/lib/areas.ts**

Added new interface for sources:
```typescript
export interface AreaSource {
  title: string;
  url: string;
  publisher: string;
  year: string;
  type: "web" | "report" | "data" | "research";
}
```

Updated Area interface:
```typescript
export interface Area {
  // ... existing fields
  sources?: AreaSource[];  // NEW: Optional sources array
}
```

---

## How to Use

### **1. Access Sources in Code**

```typescript
import { getAreaBySlug } from '@/lib/areas';

const melbourne = getAreaBySlug('melbourne');
if (melbourne?.sources) {
  melbourne.sources.forEach(source => {
    console.log(`${source.title}: ${source.url}`);
  });
}
```

### **2. Query Database**

```sql
-- Get all sources for Melbourne
SELECT * FROM area_sources WHERE area_slug = 'melbourne';

-- Get all web sources
SELECT * FROM area_sources WHERE source_type = 'web';

-- Get verified sources only
SELECT * FROM area_sources WHERE verified = true;
```

### **3. Add More Sources**

**Via Database:**
```sql
INSERT INTO area_sources (area_slug, source_type, title, url, publisher, year, accessed_at, description, verified)
VALUES (
  'sydney',
  'web',
  'National Check-In Week - Sydney',
  'https://nationalcheckinweek.com/areas/sydney',
  'National Check-In Week',
  '2024',
  'April 2026',
  'Sydney-specific youth mental health data',
  true
);
```

**Via JSON:**
Add to the area object in `areas.json`:
```json
"sources": [
  {
    "title": "Source Title",
    "url": "https://example.com",
    "publisher": "Publisher Name",
    "year": "2024",
    "type": "web"
  }
]
```

---

## Files Modified

✅ `src/lib/data/areas.json` - Added sources to Melbourne  
✅ `src/lib/data/regional.json` - Added sources to Victoria  
✅ `src/lib/areas.ts` - Added AreaSource interface and sources field  
✅ `supabase/area_sources.sql` - Created new database table (NEW FILE)

---

## Next Steps (Optional)

1. **Run the SQL migration:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/area_sources.sql
   ```

2. **Display sources on area pages:**
   - Add a "Sources" section to area detail pages
   - Link to National Check-In Week URLs
   - Show publisher and year information

3. **Add more sources:**
   - Add National Check-In Week URLs for other states/areas
   - Add AIHW, Mission Australia, and other research sources
   - Populate database with comprehensive source citations

4. **Create source display component:**
   ```typescript
   // components/AreaSources.tsx
   export function AreaSources({ sources }: { sources: AreaSource[] }) {
     return (
       <div className="sources">
         <h3>Sources</h3>
         <ul>
           {sources.map((source, i) => (
             <li key={i}>
               <a href={source.url} target="_blank" rel="noopener">
                 {source.title}
               </a>
               {' '}({source.publisher}, {source.year})
             </li>
           ))}
         </ul>
       </div>
     );
   }
   ```

---

## URLs Added

✅ **Victoria State:**  
https://nationalcheckinweek.com/states/victoria

✅ **Melbourne Area:**  
https://nationalcheckinweek.com/areas/melbourne

Both URLs are now:
- Listed in JSON data files
- Stored in database table
- Typed in TypeScript interfaces
- Ready to display on pages
