# Components Directory

## 🚨 Critical Navigation Warning

**NEVER limit navigation links in the render layer!**

The navigation menu had a critical bug where `.slice(0, 4)` was used in `HeaderClient.tsx`, causing only 4 links to display instead of all 9. This created a confusing user experience where the menu appeared broken.

### ✅ Correct Pattern
```typescript
{links.map((link) => (
  <Link>{link.label}</Link>
))}
```

### ❌ NEVER Do This
```typescript
{links.slice(0, 4).map((link) => (  // DON'T LIMIT HERE!
  <Link>{link.label}</Link>
))}
```

**If you need to limit links:**
- Manage it in the database (`menu_items` table)
- Use the `is_active` flag to hide links
- Adjust the `position` field to reorder

**See:** `docs/NAVIGATION_ARCHITECTURE.md` for full details.

---

## Component Organization

- `Header.tsx` / `HeaderClient.tsx` - Main site navigation
- `Nav.tsx` / `NavClient.tsx` - Alternative navigation
- `FooterModern.tsx` - Site footer
- `admin/` - Admin panel components
- `homepage-blocks/` - Modular homepage blocks
- `ui/` - Reusable UI primitives

## Testing

Run component tests:
```bash
npm test src/components/__tests__/
```

## Documentation

- Navigation: `docs/NAVIGATION_ARCHITECTURE.md`
- Shared Components: `docs/SHARED_COMPONENTS_GUIDE.md`
- API Documentation: `docs/api/API_DOCUMENTATION.md`
