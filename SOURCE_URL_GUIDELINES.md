# Source URL Guidelines

**Purpose:** Ensure all sources cite the **exact page** where data was found, not generic homepages or section pages.

---

## Why Exact URLs Matter

### Credibility
- Specific URLs show you've done thorough research
- Readers can verify claims by clicking directly to the data
- Builds trust in your platform

### Verification
- Reviewers can quickly check your sources
- Reduces time spent hunting for the actual data
- Makes fact-checking straightforward

### Academic Standards
- Proper citation requires specific page references
- Generic URLs don't meet academic standards
- Specific URLs are more professional

---

## Good vs Bad Examples

### ❌ BAD: Homepage URLs

**Don't do this:**
```
https://www.aihw.gov.au/
https://www.abs.gov.au/
https://headspace.org.au/
```

**Why it's bad:**
- Points to homepage, not the actual data
- Reader has to search the entire site
- Data might be buried 5 clicks deep
- Link might break if site is redesigned

### ❌ BAD: Generic Section URLs

**Don't do this:**
```
https://nationalcheckinweek.com/states/victoria
https://www.aihw.gov.au/reports/mental-health
https://headspace.org.au/research
```

**Why it's bad:**
- Points to a section page, not specific data
- Multiple reports/studies on that page
- Unclear which data you're citing
- Reader has to guess which report

### ✅ GOOD: Specific Page URLs

**Do this:**
```
https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/contents/summary
https://www.abs.gov.au/statistics/health/mental-health/national-health-survey/2023#data-downloads
https://headspace.org.au/research/youth-mental-health-report-2024#key-findings
```

**Why it's good:**
- Points directly to the data
- Includes specific report/page
- Uses anchor links (#) to exact section
- One click to verify

---

## How to Find Exact URLs

### Step 1: Navigate to the Data
1. Go to the source website
2. Find the specific report/page with your data
3. Scroll to the exact section with the statistic

### Step 2: Get the Specific URL
1. Copy the URL from your browser
2. If there's a section heading, right-click it and "Copy link address" (if it has an anchor)
3. Or manually add `#section-name` to the URL

### Step 3: Verify the URL
1. Open a new incognito/private window
2. Paste the URL
3. Confirm it takes you directly to the data
4. If not, adjust the URL

---

## URL Structure Best Practices

### Include Path Segments
```
✅ /reports/mental-health/youth-2024/summary
❌ /reports
```

### Use Anchor Links
```
✅ #key-findings
✅ #statistics
✅ #data-downloads
❌ (no anchor)
```

### Use Query Parameters (if needed)
```
✅ ?year=2024&state=victoria
✅ ?report=youth-mental-health
```

### Minimum URL Depth
- At least 3-4 path segments: `/category/subcategory/specific-page`
- Or 2 segments + anchor: `/reports/2024#statistics`
- Or 2 segments + query: `/data?report=youth-2024`

---

## Source Type Examples

### Government Reports

**Australian Institute of Health and Welfare (AIHW)**
```
✅ https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/contents/summary
✅ https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/data#table-1
```

**Australian Bureau of Statistics (ABS)**
```
✅ https://www.abs.gov.au/statistics/health/mental-health/national-health-survey/latest-release#mental-health-conditions
✅ https://www.abs.gov.au/statistics/health/mental-health/national-health-survey/2023/data-downloads
```

**State Government**
```
✅ https://www.health.vic.gov.au/mental-health/youth-mental-health-strategy-2024#key-statistics
✅ https://www.health.nsw.gov.au/mentalhealth/youth/Pages/statistics.aspx
```

### Research Papers

**Journal Articles**
```
✅ https://www.sciencedirect.com/science/article/pii/S0165032724001234
✅ https://journals.sagepub.com/doi/10.1177/12345678901234567
```

**Research Institutions**
```
✅ https://www.blackdoginstitute.org.au/research/youth-mental-health-study-2024#findings
✅ https://www.orygen.org.au/research/research-areas/youth-mental-health/2024-report#data
```

### Non-Profit Organizations

**Headspace**
```
✅ https://headspace.org.au/research/youth-mental-health-report-2024#key-findings
✅ https://headspace.org.au/assets/research/youth-report-2024.pdf
```

**Beyond Blue**
```
✅ https://www.beyondblue.org.au/research/research-projects/youth-mental-health-2024#statistics
```

### News Articles

**Major News Outlets**
```
✅ https://www.abc.net.au/news/2024-03-15/youth-mental-health-crisis-statistics/103456789
✅ https://www.theguardian.com/australia-news/2024/mar/15/youth-mental-health-data-reveals-crisis
```

---

## Self-Referential Sources

### When to Use Internal URLs

**✅ Use internal URLs when:**
- Citing NCIW's own original research
- Referencing NCIW's own data collection
- Pointing to NCIW's methodology pages

**Example:**
```
Source: National Check-In Week 2024 Victoria Report
URL: https://nationalcheckinweek.com/research/2024-victoria-report#methodology
Description: Original research methodology and findings from NCIW 2024 Victoria survey
```

### When NOT to Use Internal URLs

**❌ Don't use internal URLs when:**
- The data originally came from an external source (AIHW, ABS, etc.)
- You're aggregating data from other organizations
- The page is just summarizing external research

**Instead, cite the original source:**
```
❌ Bad: https://nationalcheckinweek.com/states/victoria
✅ Good: https://www.aihw.gov.au/reports/mental-health/youth-2024/victoria#statistics
```

---

## Special Cases

### PDF Documents
```
✅ https://www.aihw.gov.au/getmedia/abc123/youth-mental-health-2024.pdf
✅ https://headspace.org.au/assets/research/youth-report-2024.pdf
```

### Data Dashboards
```
✅ https://www.aihw.gov.au/reports-data/myhospitals/mental-health-data?state=VIC&year=2024
✅ https://www.abs.gov.au/statistics/health/mental-health/data-explorer?indicator=youth-mh
```

### Archived Pages
```
✅ https://web.archive.org/web/20240315120000/https://example.com/report
```

### DOI Links (for academic papers)
```
✅ https://doi.org/10.1234/example.2024.001
```

---

## Validation Checklist

Before adding a source, verify:

- [ ] URL is not just the homepage
- [ ] URL has at least 3-4 path segments OR uses anchors/query params
- [ ] URL points directly to the data/statistic
- [ ] URL works in an incognito/private window
- [ ] URL is the original source (not an aggregation)
- [ ] URL includes specific report/page name
- [ ] URL includes section anchor if possible
- [ ] URL is publicly accessible (not behind paywall if possible)

---

## Common Mistakes to Avoid

### 1. Using Homepage Instead of Report Page
```
❌ https://www.aihw.gov.au/
✅ https://www.aihw.gov.au/reports/mental-health/youth-2024/summary
```

### 2. Missing Section Anchors
```
❌ https://www.aihw.gov.au/reports/mental-health/youth-2024
✅ https://www.aihw.gov.au/reports/mental-health/youth-2024#key-findings
```

### 3. Using Generic Section Pages
```
❌ https://nationalcheckinweek.com/states/victoria
✅ https://nationalcheckinweek.com/research/victoria-2024-report#statistics
```

### 4. Citing Aggregations Instead of Original Sources
```
❌ https://nationalcheckinweek.com/areas/melbourne (aggregates external data)
✅ https://www.aihw.gov.au/reports/mental-health/melbourne-2024#data (original data)
```

### 5. Broken or Temporary URLs
```
❌ https://example.com/temp/draft-report-v3.pdf
✅ https://example.com/reports/final-report-2024.pdf
```

---

## Admin UI Features

### Automatic Validation

The admin UI will warn you if:
- URL is just a homepage
- URL has too few path segments
- URL appears to be a generic section page
- URL is missing anchors/specificity

### Warning Messages

**Homepage Warning:**
```
⚠️ Warning: This URL points to the homepage. Please provide the exact page 
where the data was found (e.g., /reports/2024/summary#statistics)
```

**Generic Section Warning:**
```
⚠️ Warning: This appears to be a section page. Please link to the specific 
data/statistics section (e.g., #statistics or #data)
```

**Too Generic Warning:**
```
⚠️ Warning: This URL may be too generic. Consider adding the specific section 
or page (e.g., #key-findings or /full-report)
```

---

## Quick Reference

### URL Quality Scoring

| Quality | Example | Score |
|---------|---------|-------|
| **Excellent** | `/reports/youth-2024/summary#key-findings` | ⭐⭐⭐⭐⭐ |
| **Good** | `/reports/youth-2024/summary` | ⭐⭐⭐⭐ |
| **Acceptable** | `/reports/youth-2024` | ⭐⭐⭐ |
| **Poor** | `/reports` | ⭐⭐ |
| **Unacceptable** | `/` (homepage) | ⭐ |

### Minimum Standards

**For Primary Sources:**
- Must be Excellent (⭐⭐⭐⭐⭐) or Good (⭐⭐⭐⭐)
- Must point to specific data/report
- Must be verifiable with one click

**For Secondary Sources:**
- Should be Good (⭐⭐⭐⭐) or Acceptable (⭐⭐⭐)
- Should point to relevant section
- Should be reasonably specific

**For Reference Sources:**
- Minimum Acceptable (⭐⭐⭐)
- Can be broader context
- Should still be relevant

---

## Need Help?

If you're unsure about a URL:
1. Check if it passes the validation warnings
2. Test it in an incognito window
3. Ask: "Does this URL take me directly to the data?"
4. When in doubt, be more specific rather than less

**Remember:** Better to have a very specific URL than a generic one!
