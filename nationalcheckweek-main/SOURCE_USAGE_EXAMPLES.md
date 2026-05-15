# Complete Source System Usage Examples

The centralized source system works for **ANY entity type** - not just the three examples shown. Here's the full scope:

---

## All Supported Entity Types

### **1. Areas (Cities/Regions)**
```typescript
// Melbourne
const sources = await getAreaSources('melbourne');

// Sydney
const sources = await getAreaSources('sydney');

// Brisbane
const sources = await getAreaSources('brisbane');

// Perth, Adelaide, Hobart, Darwin, Canberra
const sources = await getAreaSources('perth');
const sources = await getAreaSources('adelaide');
const sources = await getAreaSources('hobart');

// Regional areas
const sources = await getAreaSources('newcastle');
const sources = await getAreaSources('wollongong');
const sources = await getAreaSources('geelong');
const sources = await getAreaSources('gold-coast');
const sources = await getAreaSources('cairns');
```

### **2. States**
```typescript
// All Australian states
const sources = await getStateSources('victoria');
const sources = await getStateSources('new-south-wales');
const sources = await getStateSources('queensland');
const sources = await getStateSources('south-australia');
const sources = await getStateSources('western-australia');
const sources = await getStateSources('tasmania');
const sources = await getStateSources('northern-territory');
const sources = await getStateSources('australian-capital-territory');
```

### **3. Issues**
```typescript
// Mental health issues
const sources = await getIssueSources('cyberbullying');
const sources = await getIssueSources('anxiety');
const sources = await getIssueSources('depression');
const sources = await getIssueSources('school-refusal');
const sources = await getIssueSources('self-harm');
const sources = await getIssueSources('loneliness');
const sources = await getIssueSources('eating-disorders');
const sources = await getIssueSources('sleep-deprivation');
const sources = await getIssueSources('academic-pressure');
const sources = await getIssueSources('bullying');
const sources = await getIssueSources('substance-use');
const sources = await getIssueSources('social-media-harm');
```

### **4. Research Themes**
```typescript
const sources = await getResearchThemeSources('mental-health');
const sources = await getResearchThemeSources('wellbeing');
const sources = await getResearchThemeSources('attendance');
const sources = await getResearchThemeSources('belonging');
const sources = await getResearchThemeSources('trauma');
const sources = await getResearchThemeSources('disadvantage');
```

### **5. Content Blocks**
```typescript
const sources = await getContentSources('hero-stats');
const sources = await getContentSources('about-section');
const sources = await getContentSources('methodology');
const sources = await getContentSources('research-findings');
```

### **6. Custom Entity Types**
```typescript
// Schools
const sources = await getCustomEntitySources('school', 'melbourne-high');

// Programs
const sources = await getCustomEntitySources('program', 'check-in-week-2024');

// Events
const sources = await getCustomEntitySources('event', 'mental-health-summit');

// Organizations
const sources = await getCustomEntitySources('organization', 'headspace');

// Reports
const sources = await getCustomEntitySources('report', 'aihw-youth-2024');

// ANY entity type you define
const sources = await getCustomEntitySources('your-entity-type', 'your-slug');
```

---

## Real-World Examples

### **Example 1: Link National Check-In Week to ALL states**

```typescript
// Add the source once
const sourceId = await addSource(
  'https://nationalcheckinweek.com',
  'National Check-In Week',
  'National youth mental health awareness campaign',
  'mental_health'
);

// Link to all states
const states = [
  'victoria', 'new-south-wales', 'queensland', 
  'south-australia', 'western-australia', 'tasmania',
  'northern-territory', 'australian-capital-territory'
];

for (const state of states) {
  await linkSourceToEntity(sourceId, 'state', state, 'primary');
}
```

### **Example 2: Link AIHW report to multiple issues**

```typescript
const sourceId = await addSource(
  'https://aihw.gov.au/reports/youth-self-harm-2024',
  'AIHW Youth Self-Harm Atlas 2024',
  'Comprehensive data on youth self-harm across Australia',
  'research'
);

// Link to relevant issues
const issues = ['self-harm', 'depression', 'anxiety', 'loneliness'];

for (const issue of issues) {
  await linkSourceToEntity(sourceId, 'issue', issue, 'primary');
}
```

### **Example 3: Link Mission Australia survey to areas**

```typescript
const sourceId = await addSource(
  'https://missionaustralia.com.au/youth-survey-2024',
  'Mission Australia Youth Survey 2024',
  'Annual survey of Australian youth wellbeing',
  'research'
);

// Link to major cities
const cities = ['melbourne', 'sydney', 'brisbane', 'perth', 'adelaide'];

for (const city of cities) {
  await linkSourceToEntity(sourceId, 'area', city, 'secondary');
}
```

### **Example 4: Fetch all sources for a comprehensive page**

```typescript
// Area page showing all related sources
const areaSlug = 'melbourne';

const areaSources = await getAreaSources(areaSlug);
const stateSources = await getStateSources('victoria'); // Parent state
const issueSources = await getIssueSources('cyberbullying'); // Top issue

// Combine and deduplicate
const allSources = [...areaSources, ...stateSources, ...issueSources];
const uniqueSources = Array.from(
  new Map(allSources.map(s => [s.source_id, s])).values()
);
```

---

## SQL Examples

### **Link one source to multiple entities**

```sql
-- Link AIHW report to all major cities
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance)
SELECT 
  (SELECT id FROM vault_sources WHERE url = 'https://aihw.gov.au/...'),
  'area',
  unnest(ARRAY['melbourne', 'sydney', 'brisbane', 'perth', 'adelaide']),
  'primary';
```

### **Find all entities linked to a source**

```sql
SELECT entity_type, entity_slug, relevance, notes
FROM source_links
WHERE source_id = (
  SELECT id FROM vault_sources 
  WHERE url = 'https://nationalcheckinweek.com/states/victoria'
);
```

### **Find sources shared across multiple issues**

```sql
SELECT vs.title, vs.url, COUNT(DISTINCT sl.entity_slug) as issue_count
FROM vault_sources vs
JOIN source_links sl ON vs.id = sl.source_id
WHERE sl.entity_type = 'issue'
GROUP BY vs.id, vs.title, vs.url
HAVING COUNT(DISTINCT sl.entity_slug) > 3
ORDER BY issue_count DESC;
```

---

## Bulk Operations

### **Add National Check-In Week sources for all areas**

```typescript
const areas = [
  'melbourne', 'sydney', 'brisbane', 'perth', 'adelaide',
  'hobart', 'darwin', 'canberra', 'newcastle', 'wollongong',
  'geelong', 'gold-coast', 'cairns', 'ballarat', 'central-coast-nsw'
];

for (const area of areas) {
  await addAndLinkSource(
    `https://nationalcheckinweek.com/areas/${area}`,
    `National Check-In Week - ${area}`,
    `${area} youth mental health data and resources`,
    'area',
    area,
    'mental_health',
    'primary'
  );
}
```

### **Link existing source to all issues**

```typescript
const sourceId = 'existing-source-uuid';

const issues = [
  'cyberbullying', 'anxiety', 'depression', 'school-refusal',
  'self-harm', 'loneliness', 'eating-disorders', 'sleep-deprivation',
  'academic-pressure', 'bullying', 'substance-use'
];

for (const issue of issues) {
  await linkSourceToEntity(sourceId, 'issue', issue, 'secondary');
}
```

---

## The Key Point

**The system is NOT limited to just areas, states, and issues.**

You can:
- ✅ Link sources to **any entity type** you define
- ✅ Link **one source** to **unlimited entities**
- ✅ Link **unlimited sources** to **one entity**
- ✅ Use **any slug** for any entity
- ✅ Create **new entity types** anytime (schools, programs, events, etc.)

The `getSourcesForEntity(entityType, entitySlug)` function is the universal method that works for **everything**.
