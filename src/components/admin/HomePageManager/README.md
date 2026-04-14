# HomePageManager

Admin interface for managing homepage content with a tabbed interface.

## Overview

The HomePageManager provides a comprehensive admin panel for editing all homepage content including hero sections, organization logos, CTA banners, and footer settings.

## Features

- ✅ **Modular Architecture** - Separated into focused tab components
- ✅ **Custom Hooks** - Reusable data fetching and save logic
- ✅ **Accessible** - ARIA labels, keyboard navigation, screen reader support
- ✅ **Error Handling** - Comprehensive error messages with auto-dismiss
- ✅ **Optimistic Updates** - Instant UI feedback with rollback on error
- ✅ **Type Safe** - Full TypeScript coverage with strict types
- ✅ **Testable** - data-testid attributes on all interactive elements

## Structure

```
HomePageManager/
├── index.tsx              # Main component with tab orchestration
├── types.ts               # TypeScript interfaces
├── HeroTab.tsx           # Hero section editor
├── LogosTab.tsx          # Logo management
├── CTATab.tsx            # CTA banner editor
├── FooterTab.tsx         # Footer editor
├── components/
│   ├── ConfirmDialog.tsx # Accessible confirmation modal
│   └── InputDialog.tsx   # Accessible input modal
├── hooks/
│   ├── useSaveSettings.ts    # Reusable save hook
│   └── useHomePageData.ts    # Data fetching hook
└── README.md             # This file
```

## Usage

```tsx
import HomePageManager from '@/components/admin/HomePageManager';

export default function HomePage() {
  return <HomePageManager />;
}
```

## Components

### HomePageManager (Main)

The main orchestrator component that manages tab state and coordinates between child components.

**Features:**
- Tab navigation with ARIA support
- Aggregated error/success messages
- Modal dialogs for add/delete operations
- Optimistic UI updates

### HeroTab

Edit hero section including:
- Logo image and height
- Event badge (emoji, date, location)
- Main headings and subheading
- Primary and secondary CTAs
- Hero background image
- Countdown timer
- Color customization

### LogosTab

Manage trusted organization logos:
- Add new logos
- Update logo images and links
- Toggle visibility
- Delete logos with confirmation

### CTATab

Edit call-to-action banner:
- Eyebrow text
- Heading and description
- Primary and secondary buttons
- Color scheme

### FooterTab

Edit footer content:
- Footer logo
- Brand description
- Contact information
- Copyright text
- Color customization

## Custom Hooks

### useSaveSettings

Reusable hook for saving settings with loading, error, and success states.

```tsx
const { save, saving, error, success, clearMessages } = useSaveSettings(
  '/api/admin/home-page/hero',
  'Hero settings saved successfully!'
);

await save(heroSettings);
```

**Features:**
- Auto-dismiss success messages (5s)
- Auto-dismiss error messages (10s)
- Detailed error messages with HTTP status
- Returns boolean success indicator

### useHomePageData

Fetches all homepage data with loading and error handling.

```tsx
const { 
  data, 
  loading, 
  error, 
  refresh,
  setHeroSettings,
  setLogos,
  setCTASettings,
  setFooterSettings 
} = useHomePageData();
```

**Features:**
- Parallel data fetching
- Abort controller for cleanup
- Response validation
- Setter functions for optimistic updates

## Accessibility

- ✅ ARIA roles on tabs and panels
- ✅ aria-selected, aria-controls, aria-labelledby
- ✅ aria-live regions for errors and success messages
- ✅ Keyboard navigation support
- ✅ Focus management in dialogs
- ✅ Escape key to close dialogs
- ✅ No prompt() or confirm() - uses accessible modals

## Testing

All interactive elements have `data-testid` attributes:

```tsx
// Example test
const { getByTestId } = render(<HomePageManager />);
const heroTab = getByTestId('tab-hero');
fireEvent.click(heroTab);
expect(getByTestId('hero-tab')).toBeInTheDocument();
```

**Test IDs:**
- `homepage-manager` - Main container
- `homepage-manager-loading` - Loading state
- `tab-{id}` - Tab buttons (hero, logos, cta, footer)
- `hero-tab` - Hero tab panel
- `logo-height-input` - Logo height input
- `save-hero-button` - Save button
- `confirm-dialog-confirm` - Confirm button in dialogs
- `confirm-dialog-cancel` - Cancel button in dialogs
- `input-dialog-input` - Input field in dialogs

## Error Handling

All operations include comprehensive error handling:

1. **Network Errors** - Caught and displayed with specific messages
2. **HTTP Errors** - Status codes included in error messages
3. **Validation Errors** - Server validation errors shown to user
4. **Optimistic Updates** - Reverted on error with user notification
5. **Auto-dismiss** - Errors clear after 10s, success after 5s

## API Integration

Communicates with the following endpoints:

- `GET /api/admin/home-page/hero` - Fetch hero settings
- `PATCH /api/admin/home-page/hero` - Update hero settings
- `GET /api/admin/home-page/logos` - Fetch logos
- `POST /api/admin/home-page/logos` - Add logo
- `PATCH /api/admin/home-page/logos/:id` - Update logo
- `DELETE /api/admin/home-page/logos/:id` - Delete logo
- `GET /api/admin/home-page/cta` - Fetch CTA settings
- `PATCH /api/admin/home-page/cta` - Update CTA settings
- `GET /api/admin/home-page/footer` - Fetch footer settings
- `PATCH /api/admin/home-page/footer` - Update footer settings

## Performance

- ✅ Parallel data fetching with Promise.all
- ✅ Conditional rendering of tab panels
- ✅ useCallback for stable function references
- ✅ Optimistic updates for instant feedback
- ✅ Abort controllers prevent memory leaks

## Future Improvements

- [ ] Add form validation with Zod schemas
- [ ] Add undo/redo functionality
- [ ] Add preview mode
- [ ] Add autosave
- [ ] Add change tracking
- [ ] Add keyboard shortcuts
- [ ] Add drag-and-drop for logo reordering
- [ ] Add image cropping/resizing
- [ ] Add color palette presets
- [ ] Add A/B testing support

## Contributing

When modifying this component:

1. Maintain TypeScript strict mode compliance
2. Add JSDoc comments to all public functions
3. Include data-testid attributes for new elements
4. Follow existing error handling patterns
5. Update this README with any new features
6. Ensure accessibility standards are maintained
