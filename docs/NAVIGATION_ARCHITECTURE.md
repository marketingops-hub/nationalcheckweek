# 🧭 Navigation Architecture

**Last Updated:** March 30, 2026

---

## Overview

The navigation system is database-driven and managed through the admin panel. This document explains how navigation works and critical rules to prevent bugs.

---

## Architecture

### Data Flow

```
Database (menu_items table)
    ↓
Header.tsx (Server Component - fetches data)
    ↓
HeaderClient.tsx (Client Component - renders UI)
    ↓
User sees navigation menu
```

### Components

1. **`Header.tsx`** (Server Component)
   - Fetches navigation links from `menu_items` table
   - Fetches logo/CTA settings from `home_hero_settings` table
   - Merges with pinned links (Home, Register NOW)
   - Passes data to `HeaderClient`

2. **`HeaderClient.tsx`** (Client Component)
   - Receives `links` array as prop
   - Renders desktop navigation
   - Renders mobile hamburger menu
   - Handles open/close state

3. **`Nav.tsx` + `NavClient.tsx`** (Alternative navigation)
   - Similar pattern for inner pages
   - Uses same database structure

---

## ⚠️ CRITICAL RULES

### Rule #1: Never Limit Links in the Render Layer

**❌ WRONG:**
```typescript
<nav className="nav-links">
  {links.slice(0, 4).map((link) => (  // DON'T DO THIS!
    <Link>{link.label}</Link>
  ))}
</nav>
```

**✅ CORRECT:**
```typescript
<nav className="nav-links">
  {links.map((link) => (  // Render ALL links
    <Link>{link.label}</Link>
  ))}
</nav>
```

**Why?** 
- Navigation links are managed in the database
- Limiting in the render layer creates bugs
- If you need fewer links, manage it in the database or data fetching layer

### Rule #2: Manage Link Count in Database

To control how many links appear:

1. **Via Admin Panel:**
   - Go to Admin → CMS → Menu Items
   - Set `is_active = false` for links you want to hide
   - Adjust `position` field to reorder links

2. **Via Database:**
   ```sql
   -- Hide a link
   UPDATE menu_items SET is_active = false WHERE label = 'Resources';
   
   -- Reorder links
   UPDATE menu_items SET position = 5 WHERE label = 'Partners';
   ```

### Rule #3: Test Navigation Changes

Before deploying navigation changes:

1. Run tests: `npm test src/components/__tests__/HeaderClient.test.ts`
2. Check all links render: Inspect with browser DevTools
3. Test mobile menu: Verify hamburger menu shows all links
4. Test button styling: Ensure "Register NOW" has correct styling

---

## Database Schema

### `menu_items` Table

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY,
  label TEXT NOT NULL,           -- Display text
  href TEXT NOT NULL,            -- Link URL
  target TEXT DEFAULT '_self',   -- '_self' or '_blank'
  is_active BOOLEAN DEFAULT true,
  position INTEGER,              -- Sort order
  parent_id UUID,                -- For nested menus (future)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Pinned Links

Some links are always included regardless of database:

**`PINNED_START`:**
- Home (`/`)

**`PINNED_END`:**
- Register NOW (`/register`) - styled as button

These are defined in `Header.tsx` and merged with database links.

---

## Common Issues & Solutions

### Issue: Menu shows only 4 links

**Cause:** Someone added `.slice(0, 4)` in the render layer

**Solution:** Remove the `.slice()` call and render all links

**Prevention:** 
- Read the warning comments in `HeaderClient.tsx`
- Run the test suite before deploying
- Review PRs carefully for navigation changes

### Issue: Links appear in wrong order

**Cause:** `position` field in database is incorrect

**Solution:** Update `position` values in `menu_items` table

```sql
-- Reorder links
UPDATE menu_items SET position = 1 WHERE label = 'Home';
UPDATE menu_items SET position = 2 WHERE label = 'About';
UPDATE menu_items SET position = 3 WHERE label = 'Events';
```

### Issue: Register button not styled correctly

**Cause:** Missing `isButton: true` flag or CSS class

**Solution:** 
1. Ensure link has `isButton: true` in the data
2. Check CSS class `nav-btn-register` is applied
3. Verify CSS file `nav.css` is imported

---

## Testing

### Manual Testing Checklist

- [ ] All links visible on desktop
- [ ] All links visible in mobile menu
- [ ] "Register NOW" button styled correctly
- [ ] Links navigate to correct pages
- [ ] External links open in new tab (if `target="_blank"`)
- [ ] Mobile menu opens/closes correctly
- [ ] No console errors

### Automated Tests

Run: `npm test src/components/__tests__/HeaderClient.test.ts`

Tests verify:
- All links are rendered (no `.slice()` bugs)
- Button links are handled correctly
- Link order is maintained
- Empty arrays are handled gracefully

---

## Making Changes

### To Add a New Link

1. **Via Admin Panel:**
   - Admin → CMS → Menu Items → Add New
   - Fill in label, href, position
   - Set `is_active = true`

2. **Via Database:**
   ```sql
   INSERT INTO menu_items (label, href, target, position, is_active)
   VALUES ('New Page', '/new-page', '_self', 10, true);
   ```

### To Remove a Link

**Don't delete!** Set `is_active = false` to preserve history:

```sql
UPDATE menu_items SET is_active = false WHERE label = 'Old Page';
```

### To Reorder Links

Update the `position` field:

```sql
UPDATE menu_items SET position = 5 WHERE label = 'Partners';
UPDATE menu_items SET position = 6 WHERE label = 'Resources';
```

---

## Best Practices

1. **Always render all links** - Never use `.slice()`, `.filter()`, or limits in render layer
2. **Manage visibility in database** - Use `is_active` flag to hide links
3. **Test before deploying** - Run automated tests and manual checks
4. **Document changes** - Update this file if architecture changes
5. **Review PRs carefully** - Navigation bugs can break the entire site

---

## Related Files

- `src/components/Header.tsx` - Server component (data fetching)
- `src/components/HeaderClient.tsx` - Client component (rendering)
- `src/components/Nav.tsx` - Alternative navigation for inner pages
- `src/components/NavClient.tsx` - Alternative client component
- `src/app/css/nav.css` - Navigation styles
- `src/components/__tests__/HeaderClient.test.ts` - Navigation tests

---

## Questions?

If you're unsure about navigation changes, ask:
1. Should this be managed in the database or code?
2. Will this affect all pages or just some?
3. Have I tested on mobile and desktop?
4. Have I run the test suite?

**When in doubt, don't limit links in the render layer!**
