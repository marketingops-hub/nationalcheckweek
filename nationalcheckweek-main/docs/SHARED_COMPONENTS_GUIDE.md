# Shared Components & Hooks - Usage Guide

**Last Updated:** March 30, 2026  
**Phase 2 Refactoring Complete** - All 12 block editors refactored

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Form Components](#form-components)
3. [Hooks](#hooks)
4. [CSS Utilities](#css-utilities)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

---

## Overview

This guide documents the shared components and hooks created during Phase 2 refactoring. These components eliminate code duplication, ensure consistency, and improve maintainability across the admin panel.

**Benefits:**
- ✅ **711 lines** of duplicate code eliminated
- ✅ **30% average** code reduction per editor
- ✅ **Consistent UI** across all block editors
- ✅ **Type-safe** with full TypeScript support
- ✅ **Easy to maintain** - changes propagate to all editors

---

## Form Components

All form components are located in `src/components/admin/forms/` and can be imported from the index:

```typescript
import { TextInput, TextArea, ColorPicker, ArrayField, FormGroup } from '@/components/admin/forms';
```

### FormGroup

**Purpose:** Reusable wrapper for form fields with labels, help text, and error display.

**Props:**
```typescript
interface FormGroupProps {
  label: string;           // Field label
  children: React.ReactNode; // Input element
  required?: boolean;      // Shows asterisk if true
  helpText?: string;       // Helper text below input
  error?: string;          // Error message
}
```

**Example:**
```tsx
<FormGroup label="Email Address" required helpText="We'll never share your email">
  <input type="email" className="swa-input" />
</FormGroup>
```

---

### TextInput

**Purpose:** Standard text input with validation and various input types.

**Props:**
```typescript
interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  type?: 'text' | 'email' | 'url' | 'number';
  maxLength?: number;
}
```

**Example:**
```tsx
<TextInput
  label="Page Title"
  value={content.title || ""}
  onChange={(value) => onChange("title", value)}
  placeholder="Enter page title..."
  required
  maxLength={100}
/>
```

**Use Cases:**
- Single-line text fields
- Email addresses
- URLs
- Numbers
- Short text with character limits

---

### TextArea

**Purpose:** Multi-line text input for longer content.

**Props:**
```typescript
interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  rows?: number;  // Default: 4
}
```

**Example:**
```tsx
<TextArea
  label="Description"
  value={content.description || ""}
  onChange={(value) => onChange("description", value)}
  placeholder="Enter description..."
  rows={6}
/>
```

**Use Cases:**
- Descriptions
- Long-form content
- Multi-paragraph text
- Bios

---

### ColorPicker

**Purpose:** Visual color picker with hex input for color selection.

**Props:**
```typescript
interface ColorPickerProps {
  label: string;
  value: string;          // Hex color value
  onChange: (value: string) => void;
  helpText?: string;
}
```

**Example:**
```tsx
<ColorPicker
  label="Primary Color"
  value={colors.primary || '#29B8E8'}
  onChange={(value) => handleColorChange('primary', value)}
/>
```

**Features:**
- Visual color picker (native browser input)
- Hex text input for precise values
- Supports all CSS color formats
- Consistent styling

**Use Cases:**
- Theme colors
- Text colors
- Background colors
- Button colors

---

### ArrayField

**Purpose:** Dynamic array management with add/remove/update operations.

**Props:**
```typescript
interface ArrayFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addButtonText?: string;  // Default: "+ Add Item"
  helpText?: string;
}
```

**Example:**
```tsx
<ArrayField
  label="Features List"
  items={content.features || []}
  onChange={(items) => onChange("features", items)}
  placeholder="Enter feature..."
  addButtonText="+ Add Feature"
/>
```

**Features:**
- Add new items
- Remove items
- Update existing items
- Minimum 1 item enforced
- Clean, consistent UI

**Use Cases:**
- Lists of features
- Tags
- Bullet points
- Any array of strings

---

## Hooks

All hooks are located in `src/hooks/admin/`.

### useBlockColors

**Purpose:** Manages block color changes and automatically disables global colors when a custom color is set.

**Signature:**
```typescript
function useBlockColors(
  colors: Record<string, string>,
  onChange: (key: string, value: unknown) => void
): {
  handleColorChange: (colorKey: string, value: string) => void;
}
```

**Example:**
```tsx
export const MyBlockEditor = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  return (
    <ColorPicker
      label="Primary Color"
      value={colors.primary || '#29B8E8'}
      onChange={(value) => handleColorChange('primary', value)}
    />
  );
};
```

**Behavior:**
- Automatically sets `useGlobalColors: false` when any color is changed
- Merges new color with existing colors
- Ensures color customization overrides global settings

**Use Cases:**
- All block editors with color customization
- Any component that needs to manage multiple colors

---

### useArrayField

**Purpose:** Provides array operations (add, remove, update) for managing lists.

**Signature:**
```typescript
function useArrayField(
  items: string[],
  onChange: (items: string[]) => void
): {
  handleAdd: () => void;
  handleRemove: (index: number) => void;
  handleUpdate: (index: number, value: string) => void;
}
```

**Example:**
```tsx
export const MyBlockEditor = ({ content, onChange }) => {
  const { handleAdd, handleRemove, handleUpdate } = useArrayField(
    content.items || [],
    (items) => onChange("items", items)
  );

  return (
    <div>
      {content.items?.map((item, index) => (
        <div key={index}>
          <input
            value={item}
            onChange={(e) => handleUpdate(index, e.target.value)}
          />
          <button onClick={() => handleRemove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={handleAdd}>Add Item</button>
    </div>
  );
};
```

**Use Cases:**
- Managing lists of strings
- Dynamic form fields
- Tag management
- Feature lists

---

## CSS Utilities

New utility classes are available in `src/app/css/utilities.css` to reduce CSS duplication.

### Layout Utilities

```css
/* Flexbox */
.flex                 /* display: flex */
.flex-col             /* flex-direction: column */
.flex-center          /* center items both axes */
.flex-between         /* space-between with center align */
.items-center         /* align-items: center */
.justify-center       /* justify-content: center */

/* Grid */
.grid                 /* display: grid */
.grid-cols-2          /* 2 column grid */
.grid-cols-3          /* 3 column grid */
```

### Spacing Utilities

```css
/* Gap */
.gap-8, .gap-12, .gap-16, .gap-20, .gap-24, .gap-32

/* Margin */
.mb-8, .mb-12, .mb-16, .mb-24, .mb-32, .mb-56
.mt-24, .mt-32
.mx-auto              /* margin: 0 auto */
```

### Typography Utilities

```css
/* Font Family */
.font-display         /* Montserrat */
.font-body            /* Poppins */

/* Font Weight */
.font-bold            /* 700 */
.font-semibold        /* 600 */
.font-extrabold       /* 800 */
.font-black           /* 900 */

/* Text Color */
.text-primary         /* --primary color */
.text-accent          /* --accent color */
.text-dark            /* --dark color */
.text-mid             /* --text-mid color */

/* Text Align */
.text-center, .text-left, .text-right
```

### Common Patterns

```css
/* Eyebrow/Tag */
.eyebrow              /* Small uppercase label */
.eyebrow-badge        /* With background */

/* Pill Badge */
.pill-badge           /* Rounded pill with border */

/* Stat Number */
.stat-number          /* Large accent number */

/* Buttons */
.btn-base             /* Base button styles */
```

### Example Usage

```tsx
// Before
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Title</h2>
</div>

// After
<div className="flex items-center gap-16">
  <h2 className="font-display font-extrabold">Title</h2>
</div>
```

---

## Usage Examples

### Complete Block Editor Example

```tsx
import React from "react";
import type { MyBlockContent } from "@/types/homepage-blocks";
import { TextInput, TextArea, ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface MyBlockEditorProps {
  content: MyBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const MyBlockEditor: React.FC<MyBlockEditorProps> = ({ content, onChange }) => {
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  return (
    <>
      <TextInput
        label="Heading"
        value={content.heading || ""}
        onChange={(value) => onChange("heading", value)}
        placeholder="Enter heading..."
        required
      />

      <TextArea
        label="Description"
        value={content.description || ""}
        onChange={(value) => onChange("description", value)}
        placeholder="Enter description..."
        rows={4}
      />

      {/* Color Customization */}
      <div className="mt-32" style={{ paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 className="flex items-center gap-8 mb-16">
          <span className="material-symbols-outlined">palette</span>
          Colors
        </h3>

        <div className="grid gap-16">
          <ColorPicker
            label="Primary Color"
            value={colors.primary || '#29B8E8'}
            onChange={(value) => handleColorChange('primary', value)}
          />

          <ColorPicker
            label="Text Color"
            value={colors.textColor || '#3D3D3D'}
            onChange={(value) => handleColorChange('textColor', value)}
          />
        </div>
      </div>
    </>
  );
};
```

---

## Best Practices

### 1. Always Use Shared Components

❌ **Don't:**
```tsx
<div className="swa-form-group">
  <label className="swa-label">Title</label>
  <input
    type="text"
    value={content.title || ""}
    onChange={(e) => onChange("title", e.target.value)}
    className="swa-input"
  />
</div>
```

✅ **Do:**
```tsx
<TextInput
  label="Title"
  value={content.title || ""}
  onChange={(value) => onChange("title", value)}
/>
```

### 2. Use useBlockColors for Color Management

❌ **Don't:**
```tsx
const handleColorChange = (colorKey: string, value: string) => {
  onChange("colors", {
    ...colors,
    useGlobalColors: false,
    [colorKey]: value,
  });
};
```

✅ **Do:**
```tsx
const { handleColorChange } = useBlockColors(colors, onChange);
```

### 3. Leverage CSS Utilities

❌ **Don't:**
```tsx
<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
```

✅ **Do:**
```tsx
<div className="flex gap-16 items-center">
```

### 4. Provide Helpful Placeholders

✅ **Do:**
```tsx
<TextInput
  label="Email"
  placeholder="user@example.com"
  helpText="We'll never share your email"
/>
```

### 5. Use Appropriate Input Types

✅ **Do:**
```tsx
<TextInput type="email" label="Email" />
<TextInput type="url" label="Website" />
<TextInput type="number" label="Age" />
```

### 6. Keep Components Focused

Each component should have a single responsibility:
- `TextInput` - Single-line text
- `TextArea` - Multi-line text
- `ColorPicker` - Color selection
- `ArrayField` - List management

### 7. Consistent Error Handling

```tsx
<TextInput
  label="Email"
  value={email}
  onChange={setEmail}
  required
  helpText={error ? undefined : "Enter your email"}
  error={error}
/>
```

---

## Migration Checklist

When refactoring a new block editor:

- [ ] Import shared components from `@/components/admin/forms`
- [ ] Import `useBlockColors` if editor has color customization
- [ ] Replace manual form groups with `TextInput`/`TextArea`
- [ ] Replace color inputs with `ColorPicker`
- [ ] Use `useBlockColors` for color change handling
- [ ] Replace inline styles with CSS utility classes where appropriate
- [ ] Test all fields work correctly
- [ ] Verify color changes disable global colors
- [ ] Check TypeScript types are correct

---

## Support & Maintenance

**Location of Components:**
- Form Components: `src/components/admin/forms/`
- Hooks: `src/hooks/admin/`
- CSS Utilities: `src/app/css/utilities.css`
- Type Definitions: `src/types/homepage-blocks.ts`

**Adding New Shared Components:**

1. Create component in `src/components/admin/forms/`
2. Add TypeScript interface
3. Export from `index.ts`
4. Document in this guide
5. Update existing editors to use it

**Questions or Issues:**
- Check this guide first
- Review existing editor implementations
- Check TypeScript types for prop definitions

---

## Changelog

### Phase 2 (March 2026)
- ✅ Created 5 shared form components
- ✅ Created 2 shared hooks
- ✅ Refactored all 12 block editors
- ✅ Eliminated 711 lines of duplicate code
- ✅ Added CSS utilities library
- ✅ Created comprehensive documentation

---

**End of Guide** - For questions or improvements, update this document and commit changes.
