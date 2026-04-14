# 🔍 HOMEPAGE SYSTEM AUDIT
**Date:** March 29, 2026  
**Status:** Comprehensive Analysis

---

## 📊 EXECUTIVE SUMMARY

Your homepage management system has **TWO SEPARATE SYSTEMS** that are currently **PARTIALLY INTEGRATED**:

1. **Site Settings** (`/admin/home-page`) - Legacy system for Hero, Logos, CTA, Footer
2. **Homepage Builder** (`/admin/homepage-builder`) - New modular blocks system

### Current State: 🟡 PARTIALLY WORKING
- ✅ Both systems exist and function independently
- ⚠️ Integration is incomplete - blocks pull SOME colors from Site Settings
- ❌ Duplicate functionality and confusion about which system controls what

---

## 🏗️ ARCHITECTURE BREAKDOWN

### 1. SITE SETTINGS SYSTEM (`/admin/home-page`)

**Purpose:** Manage global site-wide settings and specific sections

**Database Tables:**
- `home_hero_settings` - Hero section content & colors
- `home_trusted_logos` - Partner logos
- `home_cta_settings` - CTA banner content & colors  
- `home_footer_settings` - Footer content & colors

**What It Controls:**
- ✅ Global color scheme (primary button, heading, subheading, etc.)
- ✅ Hero section content (heading, subheading, CTAs)
- ✅ Trusted logos section
- ✅ CTA banner content
- ✅ Footer content

**Color Picker Implementation:**
- Uses `ColorPicker` component
- Stores colors in database columns (e.g., `primary_button_bg`, `heading_color`)
- **Currently:** 6 color pickers in Hero tab, 6 in CTA tab, 5 in Footer tab

**Issues:**
- ❌ Only controls OLD homepage structure (not currently used)
- ❌ Colors are fetched but only partially applied to new blocks
- ❌ No visual preview of color changes
- ❌ Confusing for users - unclear what this affects

---

### 2. HOMEPAGE BUILDER SYSTEM (`/admin/homepage-builder`)

**Purpose:** Modular drag-and-drop homepage content management

**Database Table:**
- `homepage_blocks` - All homepage content blocks

**What It Controls:**
- ✅ All 8 homepage blocks (hero, stats, features, logos, cta, testimonials, schools_navigating_data, wellbeing_across_australia)
- ✅ Block order (drag-and-drop)
- ✅ Block visibility (show/hide)
- ✅ Block content (JSON stored in `content` column)

**Current Blocks:**
1. Hero - Main hero section
2. Stats - Impact statistics
3. Features - Why it matters
4. Logos - Trusted partners
5. CTA - Call to action
6. Testimonials - What schools say
7. Schools Navigating Data - NEW (6 key issues)
8. Wellbeing Across Australia - NEW (8 states)

**Block Content Storage:**
- Each block stores its own content in JSONB format
- Includes text, images, colors, CTAs, etc.
- **Problem:** Some blocks have `accentColor` in their content, others don't

**Issues:**
- ❌ No color picker UI in block editor
- ❌ Blocks have hardcoded colors in their components
- ❌ No way to edit colors per block in admin
- ❌ Unclear relationship with Site Settings colors

---

## 🎨 COLOR SYSTEM ANALYSIS

### Current Color Flow:

```
/admin/home-page (Site Settings)
  ↓
  Saves to: home_hero_settings.primary_button_bg (#29B8E8)
  ↓
  Homepage fetches: globalColors.primaryButton
  ↓
  BlockRenderer receives: globalColors prop
  ↓
  Passes to blocks: accentColor={globalColors.primaryButton}
  ↓
  Blocks use: const accentColor = globalAccent || content.accentColor || '#29B8E8'
```

### Problems Identified:

1. **THREE SOURCES OF TRUTH FOR COLORS:**
   - Site Settings database (`home_hero_settings`)
   - Block content JSON (`content.accentColor`)
   - Component defaults (hardcoded `#29B8E8`)

2. **INCONSISTENT FALLBACK CHAIN:**
   - Some blocks: `globalAccent || content.accentColor || default`
   - Some blocks: Just use global color
   - Some blocks: Hardcoded colors

3. **NO COLOR EDITING IN HOMEPAGE BUILDER:**
   - Users can't change block colors from `/admin/homepage-builder`
   - Must go to `/admin/home-page` to change global colors
   - Can't override colors per block

4. **CONFUSING USER EXPERIENCE:**
   - "Where do I change the button color?" - Two possible places
   - "Why did changing the color in Site Settings not update my block?" - Caching/fallbacks
   - "Can I have different colors per block?" - Not currently

---

## 📋 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    HOMEPAGE RENDERING                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  src/app/page.tsx - Homepage Server Component                │
│  • Fetches homepage_blocks (visible, ordered)                │
│  • Fetches home_hero_settings (for global colors)            │
│  • Fetches home_cta_settings (for CTA colors)                │
│  • Extracts globalColors object                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  BlockRenderer Component                                      │
│  • Receives: blocks[] + globalColors                          │
│  • Maps block_type to component                               │
│  • Passes globalColors to each block                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Individual Block Components                                  │
│  • HeroBlock - Uses globalColors for buttons                  │
│  • StatsBlock - Uses globalColors.primaryButton               │
│  • FeaturesBlock - Uses globalColors.primaryButton            │
│  • CTABlock - Uses globalColors for background & buttons      │
│  • TestimonialsBlock - Uses globalColors.primaryButton        │
│  • SchoolsNavigatingDataBlock - Uses globalColors OR content  │
│  • WellbeingAcrossAustraliaBlock - Uses globalColors OR content│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 CURRENT INTEGRATION STATUS

### What's Working ✅

1. **Global Colors Fetched:**
   - Homepage fetches colors from `home_hero_settings` and `home_cta_settings`
   - Colors passed to BlockRenderer
   - Blocks receive global colors

2. **Blocks Render:**
   - All 8 blocks display correctly
   - Content from `homepage_blocks` table
   - Drag-and-drop reordering works

3. **Admin Panels Function:**
   - `/admin/home-page` - Can edit colors and save
   - `/admin/homepage-builder` - Can reorder, toggle visibility

### What's Broken ❌

1. **No Color Editing in Homepage Builder:**
   - Can't change block colors from builder
   - No color picker UI in block editors

2. **Inconsistent Color Application:**
   - Some blocks use global colors
   - Some blocks have colors in content JSON
   - Some blocks have hardcoded fallbacks

3. **No Visual Feedback:**
   - Changing colors in Site Settings doesn't show immediate preview
   - No indication which blocks use which colors

4. **Duplicate Content:**
   - Hero block exists in BOTH systems
   - CTA block exists in BOTH systems
   - Logos exist in BOTH systems
   - Confusing which one is "active"

---

## 💡 RECOMMENDATIONS

### Option A: UNIFIED SYSTEM (Recommended)

**Consolidate everything into Homepage Builder**

**Changes:**
1. **Migrate Site Settings to Homepage Builder:**
   - Convert Hero settings to Hero block content
   - Convert CTA settings to CTA block content
   - Keep Footer separate (not a homepage block)

2. **Add Global Color Settings Tab:**
   - New tab in `/admin/homepage-builder`: "Global Colors"
   - Color pickers for: Primary, Secondary, Heading, Subheading, etc.
   - Saves to new table: `homepage_global_settings`

3. **Per-Block Color Overrides:**
   - Each block editor has "Use Global Colors" toggle
   - If toggled off, show color pickers for that block
   - Saves to block's `content.colors` object

4. **Remove `/admin/home-page`:**
   - Deprecate old system
   - Redirect to `/admin/homepage-builder`
   - Keep only Footer settings

**Benefits:**
- ✅ Single source of truth
- ✅ Clear user experience
- ✅ Flexible (global + per-block colors)
- ✅ No confusion

**Effort:** Medium (2-3 hours)

---

### Option B: CLEAR SEPARATION (Simpler)

**Keep both systems but make roles crystal clear**

**Changes:**
1. **Site Settings = Global Theme:**
   - Rename to "Theme Settings"
   - Only controls global colors (no content)
   - All blocks inherit these colors

2. **Homepage Builder = Content Only:**
   - No color editing
   - Only content, order, visibility
   - Always uses global theme colors

3. **Add Clear Documentation:**
   - Banner in Homepage Builder: "Colors managed in Theme Settings"
   - Link to Theme Settings from builder

**Benefits:**
- ✅ Simpler to implement
- ✅ Clear separation of concerns
- ✅ Less code changes

**Drawbacks:**
- ❌ Can't have per-block colors
- ❌ Still have duplicate Hero/CTA content

**Effort:** Low (30 minutes)

---

### Option C: BLOCKS ONLY (Most Radical)

**Remove Site Settings entirely, everything in blocks**

**Changes:**
1. **Each Block Manages Own Colors:**
   - Add color pickers to each block editor
   - Remove global color system
   - Each block fully independent

2. **Create "Theme Block":**
   - Special block type that sets CSS variables
   - Other blocks can reference these variables
   - Drag to top to apply globally

3. **Migrate All Content:**
   - Move Hero settings to Hero block
   - Move CTA settings to CTA block
   - Delete old tables

**Benefits:**
- ✅ Maximum flexibility
- ✅ True modular system
- ✅ No global dependencies

**Drawbacks:**
- ❌ More work to maintain consistency
- ❌ Users must set colors per block
- ❌ No enforced brand consistency

**Effort:** High (4-5 hours)

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Quick Fix (Do This Now)

1. **Add Banner to Homepage Builder:**
   ```tsx
   <div className="swa-alert swa-alert--info">
     <strong>Color Settings:</strong> Block colors are managed in 
     <a href="/admin/home-page">Site Settings → Colors & Styling</a>
   </div>
   ```

2. **Update Site Settings Title:**
   - Change "Site Settings" to "Global Theme Settings"
   - Add description: "These colors apply to all homepage blocks"

3. **Document Color Flow:**
   - Add tooltip to color pickers: "Applies to all blocks using primary color"

**Effort:** 15 minutes  
**Impact:** Immediate clarity for users

---

### Phase 2: Proper Integration (Do This Next)

**Choose Option A (Unified System)**

1. **Create Global Colors Tab in Homepage Builder:**
   - New component: `GlobalColorsEditor.tsx`
   - Color pickers for all global colors
   - Save to `homepage_global_settings` table

2. **Add Color Overrides to Block Editors:**
   - Each block editor gets "Colors" section
   - Toggle: "Use global colors" (default: on)
   - When off, show color pickers specific to that block

3. **Update Block Components:**
   - Check `content.useGlobalColors` flag
   - If true, use globalColors prop
   - If false, use `content.colors` object

4. **Migration Script:**
   - Copy colors from `home_hero_settings` to `homepage_global_settings`
   - Update all blocks to use global colors by default

5. **Deprecate `/admin/home-page`:**
   - Keep only Footer tab
   - Redirect Hero/CTA/Logos tabs to Homepage Builder

**Effort:** 2-3 hours  
**Impact:** Clean, unified system

---

## 📊 CURRENT ISSUES SUMMARY

| Issue | Severity | Impact | Fix Effort |
|-------|----------|--------|------------|
| Two separate systems | 🔴 High | User confusion | Medium |
| No color editing in builder | 🟡 Medium | Limited flexibility | Low |
| Inconsistent color fallbacks | 🟡 Medium | Unpredictable behavior | Low |
| Duplicate content (Hero/CTA) | 🟡 Medium | Data inconsistency | Medium |
| No visual preview | 🟢 Low | Poor UX | High |
| Hardcoded colors in components | 🟢 Low | Maintenance burden | Low |

---

## 🔍 TECHNICAL DEBT

1. **Database Schema:**
   - `home_hero_settings` - Legacy, should migrate to blocks
   - `home_cta_settings` - Legacy, should migrate to blocks
   - `homepage_blocks` - Current, but missing color fields

2. **Component Architecture:**
   - Block components have hardcoded colors
   - Inconsistent prop interfaces
   - No shared color management hook

3. **Admin UI:**
   - Two separate admin pages for homepage
   - No unified color management
   - No live preview

---

## ✅ NEXT STEPS

### Immediate (Today):
1. Add banner to Homepage Builder explaining color management
2. Update Site Settings page title and description
3. Test current color flow end-to-end

### Short-term (This Week):
1. Decide on Option A, B, or C
2. Create implementation plan
3. Build Global Colors Editor component

### Long-term (Next Sprint):
1. Implement chosen option
2. Migrate existing data
3. Deprecate old system
4. Add documentation

---

## 📝 CONCLUSION

Your homepage system is **functional but fragmented**. The main issue is having two separate systems that partially overlap:

- **Site Settings** controls global colors but not content
- **Homepage Builder** controls content but not colors (well)

**Best Path Forward:** Option A (Unified System)
- Consolidate everything into Homepage Builder
- Add Global Colors tab
- Allow per-block color overrides
- Deprecate old Site Settings (except Footer)

This gives you:
- ✅ Single source of truth
- ✅ Maximum flexibility
- ✅ Clear user experience
- ✅ Future-proof architecture

**Estimated Total Effort:** 3-4 hours for complete implementation
