# Source URL Quality Audit Report

**Date:** April 3, 2026  
**Scope:** All sources in vault_sources table  
**Auditor:** Cascade AI

---

## Executive Summary

**Critical Issue Identified:** Sources are stored with generic URLs pointing to section pages or homepages, not the specific pages where data/statistics were sourced.

**Impact:** 
- Reduces credibility of cited data
- Makes verification difficult for users
- Violates academic citation standards
- Could undermine trust in the platform

---

## Current Sources Identified

### 1. National Check-In Week - Victoria
- **Current URL:** `https://nationalcheckinweek.com/states/victoria`
- **Issue:** Generic state page, not specific data source
- **Linked to:** state:victoria (primary relevance)
- **Category:** mental_health
- **Status:** ❌ NEEDS FIX

**What data does this support?**
- Likely: Victoria-specific youth mental health statistics
- Likely: State-level participation data
- Likely: Regional wellbeing metrics

**Correct URL should point to:**
- Specific statistics section (e.g., `#statistics` anchor)
- Specific report/data page
- Specific research findings section

### 2. National Check-In Week - Melbourne
- **Current URL:** `https://nationalcheckinweek.com/areas/melbourne`
- **Issue:** Generic area page, not specific data source
- **Linked to:** area:melbourne (primary relevance)
- **Category:** mental_health
- **Status:** ❌ NEEDS FIX

**What data does this support?**
- Likely: Melbourne-specific youth mental health statistics
- Likely: Local area participation data
- Likely: City-level wellbeing metrics

**Correct URL should point to:**
- Specific statistics section
- Specific data dashboard
- Specific research findings

---

## URL Quality Classification

### Missing URLs
**Count:** 0  
**Percentage:** 0%  
✅ No sources missing URLs

### Homepage Only URLs
**Count:** 0  
**Percentage:** 0%  
✅ No homepage-only URLs (but see generic section URLs below)

### Generic Section URLs
**Count:** 2  
**Percentage:** 100%  
❌ **ALL sources are generic section URLs**

Examples:
- `/states/victoria` - points to state page, not specific data
- `/areas/melbourne` - points to area page, not specific data

### Specific URLs
**Count:** 0  
**Percentage:** 0%  
❌ **NO sources have specific URLs**

---

## Severity Analysis

### Critical Issues (P0)
**Count:** 2 sources

Both existing sources are linked to entities with PRIMARY relevance, meaning they're the main sources for that entity's data. These MUST have specific URLs.

**Sources:**
1. Victoria state source (primary for state:victoria)
2. Melbourne area source (primary for area:melbourne)

### High Priority (P1)
**Count:** 0

No secondary or reference sources yet, but all future sources should follow best practices.

---

## Root Cause Analysis

### Why This Happened

1. **No URL Validation:** Admin UI accepts any URL without checking specificity
2. **No Guidance:** Form doesn't explain importance of exact URLs
3. **Poor Examples:** Placeholder text doesn't show good URL examples
4. **Self-Referential:** Sources point to pages on the same domain (nationalcheckinweek.com)

### Self-Referential Source Problem

**Special Issue:** Both sources point to pages on the National Check-In Week website itself. This creates a circular reference:

- Page shows data
- Data is "sourced" from another page on the same site
- That page may not be the original source

**Questions to resolve:**
1. Are these pages showing original research/data collected by NCIW?
2. Or are they aggregating data from external sources (AIHW, ABS, etc.)?
3. If external, we need to cite the ORIGINAL source, not our own page

**Recommendation:** 
- If NCIW conducted original research → cite the research report/methodology page
- If aggregating external data → cite the external sources (AIHW, ABS, etc.)

---

## Recommended URL Structure

### For External Sources

**Government Reports:**
```
❌ Bad:  https://www.aihw.gov.au/
✅ Good: https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/contents/summary
```

**Research Papers:**
```
❌ Bad:  https://www.sciencedirect.com/
✅ Good: https://www.sciencedirect.com/science/article/pii/S0165032724001234
```

**Statistics:**
```
❌ Bad:  https://www.abs.gov.au/
✅ Good: https://www.abs.gov.au/statistics/health/mental-health/national-health-survey/latest-release#mental-health-conditions
```

### For Internal NCIW Sources

**If citing own research:**
```
❌ Bad:  https://nationalcheckinweek.com/states/victoria
✅ Good: https://nationalcheckinweek.com/research/2024-victoria-report#key-findings
```

**If citing own data collection:**
```
❌ Bad:  https://nationalcheckinweek.com/areas/melbourne
✅ Good: https://nationalcheckinweek.com/data/melbourne-2024#participation-statistics
```

---

## Action Items

### Immediate (P0)

1. **Determine Source Type:**
   - Are Victoria/Melbourne pages showing NCIW's own research?
   - Or aggregating external sources?

2. **If Own Research:**
   - Create dedicated research/data pages with specific URLs
   - Update sources to point to those specific pages
   - Add methodology and data collection details

3. **If External Data:**
   - Identify the actual external sources (AIHW, ABS, etc.)
   - Replace self-referential sources with external sources
   - Update URLs to point to specific external reports/pages

### Short Term (P1)

4. **Update Admin UI:**
   - Add URL validation encouraging specific URLs
   - Add help text explaining importance
   - Add examples of good vs bad URLs
   - Add warning for homepage URLs

5. **Create Guidelines:**
   - Document URL best practices
   - Provide examples for different source types
   - Create checklist for adding sources

### Medium Term (P2)

6. **Add URL Validation:**
   - Warn if URL is just homepage
   - Warn if URL has < 4 path segments
   - Suggest adding anchors/sections
   - Validate URL is accessible

7. **Add Source Preview:**
   - Show URL preview when adding source
   - Display page title from URL
   - Verify URL is accessible

---

## Proposed SQL Fixes

**Note:** Cannot provide specific UPDATE statements until we determine:
1. Are these self-referential sources valid?
2. What are the actual external sources?
3. What specific pages should be cited?

**Template for fixes:**
```sql
-- Update Victoria source with specific URL
UPDATE vault_sources
SET 
  url = '[SPECIFIC_URL_HERE]',
  description = '[UPDATED_DESCRIPTION]',
  updated_at = now()
WHERE url = 'https://nationalcheckinweek.com/states/victoria';

-- Update Melbourne source with specific URL
UPDATE vault_sources
SET 
  url = '[SPECIFIC_URL_HERE]',
  description = '[UPDATED_DESCRIPTION]',
  updated_at = now()
WHERE url = 'https://nationalcheckinweek.com/areas/melbourne';
```

---

## Questions for Stakeholders

### Critical Questions

1. **What data do these sources support?**
   - What specific statistics appear on the Victoria/Melbourne pages?
   - Where did that data originally come from?

2. **Is NCIW the original source?**
   - Did NCIW conduct original research/surveys?
   - Or is NCIW aggregating data from AIHW, ABS, etc.?

3. **What should the correct sources be?**
   - If external: Which reports/pages from AIHW, ABS, etc.?
   - If internal: Which specific NCIW research reports/data pages?

### Example Scenarios

**Scenario A: NCIW Original Research**
```
Source: National Check-In Week 2024 Victoria Report
URL: https://nationalcheckinweek.com/research/2024-victoria-report#key-findings
Description: Original research findings from NCIW 2024 Victoria survey
```

**Scenario B: External Data Aggregation**
```
Source: AIHW Youth Mental Health Report 2024 - Victoria
URL: https://www.aihw.gov.au/reports/mental-health/youth-2024/victoria#statistics
Description: Victorian youth mental health statistics from AIHW 2024 report
```

---

## Success Metrics

After fixes are implemented:

✅ **0%** sources with homepage-only URLs  
✅ **0%** sources with generic section URLs  
✅ **100%** sources with specific page URLs  
✅ **100%** primary sources have exact URLs  
✅ All sources are verifiable by clicking URL  
✅ All sources point to original data source (not aggregations)

---

## Next Steps

1. **User Input Required:** Determine what data these sources support
2. **Research:** Find the actual original sources
3. **Update Database:** Apply SQL fixes with correct URLs
4. **Update Code:** Improve validation and guidance
5. **Document:** Create URL guidelines for future sources
6. **Test:** Verify all sources are accessible and accurate

---

## Conclusion

**Current State:** 100% of sources have generic URLs that don't meet citation standards.

**Required Action:** Immediate investigation to determine correct source URLs.

**Estimated Time:** 
- Investigation: 30-60 minutes
- SQL fixes: 15 minutes
- Code improvements: 1-2 hours
- Documentation: 30 minutes

**Total:** 2-4 hours to fully resolve
