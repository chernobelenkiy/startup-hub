# Design System: Startup Hub

## Overview
Dark-mode-first design system with vibrant green accents, optimized for developer/startup audiences. Built on Tailwind CSS with shadcn/ui primitives.

## Design Principles
- **Dark-first**: Deep green-tinted backgrounds reduce eye strain for tech users
- **Action clarity**: Green accent exclusively for primary actions and success states
- **Information density**: Maximize content without clutter using cards and tables

## Color Tokens

### Brand Colors
```css
--primary: #22C55E;           /* Green - CTAs, links, success */
--primary-hover: #16A34A;     /* Darker green on hover */
--primary-foreground: #000000; /* Black text on green buttons */
```

### Background Colors
```css
--background: #0A0F0A;        /* Page background - deep green-black */
--surface: #111611;           /* Cards, modals */
--surface-elevated: #1A1F1A;  /* Nested elements, inputs */
--sidebar: #0D120D;           /* Sidebar background */
--overlay: rgba(0,0,0,0.8);   /* Modal backdrop */
```

### Text Colors
```css
--foreground: #FFFFFF;        /* Primary text */
--muted: #9CA3AF;             /* Secondary text, labels */
--muted-foreground: #6B7280;  /* Placeholders, disabled */
```

### Border Colors
```css
--border: #1F2A1F;            /* Default borders */
--border-focus: #22C55E;      /* Focus state - green ring */
--border-muted: #161B16;      /* Subtle separators */
```

### Semantic Colors
```css
--success: #22C55E;           /* Active, success states */
--warning: #F59E0B;           /* Warnings */
--error: #EF4444;             /* Errors, revoked */
--info: #3B82F6;              /* Information */
```

## Typography

### Font Family
```css
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| h1 | 2.25rem (36px) | 700 | 1.2 | Page titles |
| h2 | 1.5rem (24px) | 600 | 1.3 | Section headers |
| h3 | 1.125rem (18px) | 600 | 1.4 | Card titles |
| body | 0.875rem (14px) | 400 | 1.5 | Default text |
| small | 0.75rem (12px) | 400 | 1.5 | Labels, captions |
| code | 0.8125rem (13px) | 400 | 1.6 | Code blocks, tokens |

## Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

## Border Radius
```css
--radius-sm: 0.375rem;  /* 6px - buttons, inputs */
--radius-md: 0.5rem;    /* 8px - cards */
--radius-lg: 0.75rem;   /* 12px - modals */
--radius-full: 9999px;  /* Pills, avatars, badges */
```

## Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.4);
--shadow-lg: 0 10px 25px rgba(0,0,0,0.5);  /* Modals */
```

## Core Components

### Buttons
| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| Primary | `--primary` | Black | None | Main CTAs (Save, Submit) |
| Secondary | Transparent | White | `--border` | Secondary actions |
| Ghost | Transparent | `--muted` | None | Tertiary, icons |
| Destructive | `--error` | White | None | Delete actions |

### Inputs
- Background: `--surface-elevated`
- Border: `--border` → `--border-focus` on focus
- Placeholder: `--muted-foreground`
- Height: 40px (default), 48px (large)

### Cards
- Background: `--surface`
- Border: `--border`
- Radius: `--radius-md`
- Padding: `--space-4` to `--space-6`

### Badges
| Variant | Background | Text | Usage |
|---------|------------|------|-------|
| Success | `--success/20%` | `--success` | Active status |
| Warning | `--warning/20%` | `--warning` | Pending |
| Error | `--error/20%` | `--error` | Revoked, errors |
| Default | `--surface-elevated` | `--foreground` | Tags |
| Outline | Transparent | `--primary` | Category tags |

### Modal/Dialog
- Background: `--surface`
- Overlay: `--overlay`
- Radius: `--radius-lg`
- Max-width: 480px (forms), 640px (content)

### Sidebar
- Width: 256px
- Background: `--sidebar`
- Active item: Green left border + subtle green bg

### Tables
- Header: `--muted` text, uppercase, 12px
- Rows: `--surface` with `--border` separator
- Hover: Subtle lighten

### Code Blocks
- Background: `--surface-elevated`
- Font: `--font-mono`
- Syntax: Green for URLs/strings, white for commands
- Terminal dots: Red, yellow, green circles in header

### Alerts/Banners
| Variant | Background | Icon | Border | Usage |
|---------|------------|------|--------|-------|
| Success | `--success/10%` | ✓ circle | `--success` left | Token created, saved |
| Error | `--error/10%` | ✗ circle | `--error` left | Validation errors |
| Warning | `--warning/10%` | ⚠ triangle | `--warning` left | Warnings |
| Info | `--info/10%` | ℹ circle | `--info` left | Tips, notes |

### Tabs
- Background: Transparent
- Active: `--foreground` text + 2px `--primary` underline
- Inactive: `--muted` text
- Height: 40px with `--space-4` padding

### Social Auth Buttons
- Background: `--surface-elevated`
- Border: `--border`
- Text: `--foreground`
- Icon: Provider brand (Google, LinkedIn)
- Height: 48px, full-width in auth modal

### Avatar
- Sizes: 32px (small), 40px (default), 48px (large), 64px (profile)
- Shape: Circle (`--radius-full`)
- Fallback: Initials on `--surface-elevated`
- Border: Optional 2px `--border`

### Search Input
- Background: `--surface-elevated`
- Border: `--border`, green on focus
- Icon: Magnifying glass in `--muted`
- Placeholder: "Search startups...", "Search docs..."
- Height: 40px (header), 48px (hero)

### Breadcrumbs
- Separator: `>` chevron in `--muted`
- Links: `--muted` → `--foreground` on hover
- Current: `--foreground`, non-clickable

### Select/Dropdown
- Trigger: Same as Input + chevron icon
- Menu: `--surface` with `--border`, `--shadow-md`
- Item hover: `--surface-elevated`
- Selected: Green checkmark

### Tag Input
- Container: Same as Input
- Chips: `--primary/20%` bg, `--primary` text, × remove button
- Input: Inline after chips

### Progress Bar
- Track: `--surface-elevated`, 8px height
- Fill: `--primary` gradient
- Border-radius: `--radius-full`
- Label: Above bar, right-aligned percentage

### Quote/Blockquote
- Background: `--surface`
- Left border: 4px `--primary`
- Padding: `--space-6`
- Text: `--foreground`, italic, 1.125rem

### File Upload Zone
- Background: `--surface`
- Border: 2px dashed `--border`
- Border hover: `--primary` dashed
- Icon: Upload arrow in `--primary`
- Text: "Click to upload or drag and drop"
- Subtext: `--muted`, file types and size limits

### Like Button
- Default: Heart outline in `--muted`
- Liked: Heart filled in `--primary`
- Count: `--foreground` beside icon
- Animation: Scale pulse on toggle

### Links
- Default: `--primary`, underline on hover
- Muted: `--muted`, underline on hover
- Nav: `--muted` → `--foreground` on hover/active

### Locale Switcher
- Trigger: Globe icon + language code
- Dropdown: Standard select menu
- Position: Top-right header

## Responsive Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Wide desktop */
```

### Layout Behavior
- **< 768px**: Sidebar hidden, hamburger menu, single column
- **≥ 768px**: Sidebar visible, 2-column grid for cards
- **≥ 1024px**: Full sidebar, 3-column grid

## Accessibility (WCAG 2.1 AA)
- Color contrast: 4.5:1 minimum for text (green on dark passes)
- Focus indicators: 2px green ring on all interactive elements
- Touch targets: Minimum 44×44px
- Reduced motion: Respect `prefers-reduced-motion`
- Screen reader: Proper ARIA labels, semantic HTML
