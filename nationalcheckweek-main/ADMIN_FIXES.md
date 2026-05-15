# Admin Section Critical Fixes

## Issues Identified

1. ❌ Homepage-builder blocks not saving
2. ❌ FAQ page not loading
3. ❌ Slow loading across admin pages
4. ❌ Missing image upload for hero section
5. ❌ Missing URL field for trusted logos
6. ❌ Slow typography page loading

## Root Causes & Solutions

### 1. Homepage-builder Not Saving
**Cause:** API route params issue with Next.js 15 - params is now a Promise
**Fix:** Await params in API route

### 2. FAQ Page Not Loading
**Status:** ✅ Already using edge runtime (line 5 of route.ts)
**Issue:** Likely database table name case sensitivity

### 3. Slow Admin Loading
**Causes:**
- Multiple sequential API calls
- No caching
- Large data fetches
- No loading states optimization

**Solutions:**
- Add parallel fetching
- Implement caching
- Add pagination
- Optimize queries

### 4. Missing Hero Image Upload
**Fix:** Replace text input with ImageUpload component (line 424-432)

### 5. Missing Logo URL Field
**Fix:** Add link_url field to logos table and UI

### 6. Slow Typography Loading
**Cause:** Fetching all fonts + settings sequentially
**Fix:** Parallel fetching + caching
