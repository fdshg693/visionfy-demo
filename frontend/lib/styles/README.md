# Design System - CSS Foundation

This directory contains the CSS foundation files for the Visionfy Demo design system. These files define reusable CSS custom properties (CSS variables) and utility classes that ensure consistency across the application.

## File Structure

```
lib/styles/
├── index.css           # Main entry point (imports all files)
├── colors.css          # Color palette with light/dark mode
├── spacing.css         # Spacing scale (4px base unit)
├── shadows.css         # Box shadow elevation system
├── z-index.css         # Z-index layering system
├── typography.css      # Typography scale and utilities
├── animations.module.css  # Animation utilities (CSS Modules)
├── buttons.module.css     # Button component styles (CSS Modules)
├── forms.module.css       # Form component styles (CSS Modules)
├── images.module.css      # Image display utilities (CSS Modules)
└── README.md           # This file
```

## Usage

### Global Import

Import the entire design system in your global CSS file:

```css
/* app/globals.css */
@import '../lib/styles/index.css';
```

### Selective Import

Import only the files you need in specific components:

```css
/* component.module.css */
@import '../../lib/styles/colors.css';
@import '../../lib/styles/spacing.css';
```

### Using CSS Variables

```css
.my-component {
  color: var(--color-primary-500);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  z-index: var(--z-popover);
  font-size: var(--text-lg);
}
```

### Using Utility Classes

```html
<div class="bg-primary text-white p-4 shadow-lg">
  <h1 class="heading-2">Hello World</h1>
  <p class="body">This is a paragraph.</p>
</div>
```

## Design Tokens

### Colors (`colors.css`)

#### Color Scales
- **Primary (Blue)**: `--color-primary-50` to `--color-primary-950`
- **Neutral (Gray)**: `--color-neutral-50` to `--color-neutral-950`
- **Success (Green)**: `--color-success-50` to `--color-success-950`
- **Danger (Red)**: `--color-danger-50` to `--color-danger-950`
- **Warning (Yellow)**: `--color-warning-50` to `--color-warning-950`
- **Info (Blue)**: `--color-info-50` to `--color-info-950`

#### Semantic Colors
- `--color-background` - Main background color
- `--color-foreground` - Main text color
- `--color-surface` - Card/panel backgrounds
- `--color-border` - Border color
- `--color-divider` - Divider lines
- `--color-disabled` - Disabled state
- `--color-hover` - Hover background
- `--color-active` - Active state background

#### Canvas Colors
- `--color-canvas-background` - Flow canvas background
- `--color-canvas-grid` - Grid lines
- `--color-canvas-edge` - Connection edges
- `--color-canvas-node-border` - Node borders
- `--color-canvas-node-hover` - Node hover state
- `--color-canvas-node-selected` - Selected node

#### Status Colors
- `--color-status-pending` - Pending state
- `--color-status-running` - Running/processing
- `--color-status-success` - Success state
- `--color-status-error` - Error state
- `--color-status-warning` - Warning state

#### Utility Classes
```css
.bg-primary      /* background-color: var(--color-primary-500) */
.text-success    /* color: var(--color-success-500) */
.border-danger   /* border-color: var(--color-danger-500) */
```

### Spacing (`spacing.css`)

#### Spacing Scale (4px base unit)
- `--space-0`: 0
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px
- `--space-20`: 80px
- `--space-24`: 96px

#### Semantic Aliases
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 48px
- `--space-3xl`: 64px

#### Component Spacing
- `--space-button-padding-x`: 16px
- `--space-button-padding-y`: 8px
- `--space-input-padding-x`: 12px
- `--space-input-padding-y`: 8px
- `--space-card-padding`: 24px
- `--space-panel-padding`: 16px

#### Utility Classes
```css
.p-4      /* padding: var(--space-4) */
.mt-6     /* margin-top: var(--space-6) */
.gap-2    /* gap: var(--space-2) */
```

### Shadows (`shadows.css`)

#### Shadow Levels
- `--shadow-xs`: Very subtle shadow
- `--shadow-sm`: Small shadow (buttons, cards)
- `--shadow-md`: Medium shadow (dropdowns)
- `--shadow-lg`: Large shadow (modals, panels)
- `--shadow-xl`: Extra large shadow
- `--shadow-2xl`: Maximum shadow
- `--shadow-inner`: Inner shadow

#### Colored Shadows
- `--shadow-primary`: Blue-tinted shadow
- `--shadow-danger`: Red-tinted shadow
- `--shadow-success`: Green-tinted shadow

#### Component Shadows
- `--shadow-button`: Default button shadow
- `--shadow-button-hover`: Button hover shadow
- `--shadow-card`: Card shadow
- `--shadow-dropdown`: Dropdown shadow
- `--shadow-modal`: Modal shadow
- `--shadow-toast`: Toast notification shadow

#### Utility Classes
```css
.shadow-md              /* box-shadow: var(--shadow-md) */
.hover\:shadow-lg:hover /* box-shadow: var(--shadow-lg) on hover */
```

### Z-Index (`z-index.css`)

#### Layering System
- **Base (0-9)**: Base content, flow canvas, nodes
- **Overlays (10-39)**: Raised content, overlays
- **Fixed UI (40-99)**: Headers, sidebars, dropdowns
- **Popovers (100-299)**: Popovers, tooltips
- **Modals (300-499)**: Modal dialogs, backdrops
- **Temporary (500-699)**: Toasts, context menus
- **Critical (700-899)**: Loading screens, notifications
- **Debug (9999)**: Developer tools

#### Z-Index Values
- `--z-base`: 0
- `--z-raised`: 1
- `--z-dropdown`: 50
- `--z-popover`: 100
- `--z-tooltip`: 200
- `--z-modal-backdrop`: 300
- `--z-modal`: 400
- `--z-toast`: 500
- `--z-context-menu`: 600

#### Component Z-Index
- `--z-chat-panel`: Sidebar level
- `--z-inspector-panel`: Sidebar level
- `--z-process-node-popup`: Popover level
- `--z-snapshot-modal`: Modal level
- `--z-toast-container`: Toast level

#### Utility Classes
```css
.z-modal    /* z-index: var(--z-modal) */
.z-tooltip  /* z-index: var(--z-tooltip) */
```

### Typography (`typography.css`)

#### Font Sizes
- `--text-xs`: 12px
- `--text-sm`: 14px
- `--text-base`: 16px
- `--text-lg`: 18px
- `--text-xl`: 20px
- `--text-2xl`: 24px
- `--text-3xl`: 30px
- `--text-4xl`: 36px
- `--text-5xl`: 48px

#### Font Weights
- `--font-thin`: 100
- `--font-light`: 300
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700
- `--font-extrabold`: 800
- `--font-black`: 900

#### Line Heights
- `--leading-none`: 1
- `--leading-tight`: 1.25
- `--leading-snug`: 1.375
- `--leading-normal`: 1.5
- `--leading-relaxed`: 1.625
- `--leading-loose`: 2

#### Preset Text Styles
```css
.heading-1    /* Large heading (36px, bold) */
.heading-2    /* Medium heading (30px, bold) */
.heading-3    /* Small heading (24px, semibold) */
.body         /* Body text (16px, normal) */
.body-small   /* Small body (14px, normal) */
.caption      /* Caption text (12px, normal) */
.label        /* Form label (14px, medium) */
.code         /* Inline code */
.code-block   /* Code block */
```

## Dark Mode Support

All color variables automatically adjust for dark mode using the `prefers-color-scheme` media query. You don't need to do anything special - just use the CSS variables and they'll adapt.

```css
/* This will be blue in light mode and lighter blue in dark mode */
.my-element {
  color: var(--color-primary-500);
}
```

## Best Practices

1. **Always use CSS variables** instead of hardcoded values
2. **Use semantic color tokens** (e.g., `--color-border`) over specific shades when possible
3. **Follow the spacing scale** - avoid arbitrary padding/margin values
4. **Respect the z-index hierarchy** - never use arbitrary z-index values
5. **Use preset text styles** for consistent typography
6. **Prefer utility classes** for simple, one-off styling
7. **Use CSS Modules** for component-specific styles that need scoping

## Migration Guide

If you're updating existing code to use the design system:

### Before
```css
.button {
  background-color: #3b82f6;
  padding: 8px 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
  font-size: 14px;
}
```

### After
```css
.button {
  background-color: var(--color-primary-500);
  padding: var(--space-2) var(--space-4);
  box-shadow: var(--shadow-button);
  z-index: var(--z-popover);
  font-size: var(--text-sm);
}
```

Or using utility classes:
```html
<button class="bg-primary p-2 px-4 shadow-sm z-popover text-sm">
  Click me
</button>
```

## Contributing

When adding new design tokens:

1. Add the CSS variable to the appropriate file
2. Follow the existing naming convention
3. Add dark mode variant if applicable
4. Document the new token in this README
5. Create a utility class if it makes sense
6. Test in both light and dark modes

## Questions?

See `ai/overview/architecture.md` for more details about the overall design system architecture.
