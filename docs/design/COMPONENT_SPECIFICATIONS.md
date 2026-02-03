# Component Specifications

Complete specifications for all Tallow Design System components with usage examples, variants, and implementation guidelines.

## Table of Contents

- [Buttons](#buttons)
- [Cards](#cards)
- [Inputs](#inputs)
- [Navigation](#navigation)
- [Modals & Dialogs](#modals--dialogs)
- [Hero Sections](#hero-sections)
- [Badges](#badges)
- [Toasts & Notifications](#toasts--notifications)
- [Tooltips](#tooltips)
- [Progress Indicators](#progress-indicators)
- [Form Components](#form-components)

---

## Buttons

Buttons are the primary interactive elements. Use them for actions, navigation, and form submissions.

### Anatomy

```
┌─────────────────────────┐
│  [Icon] Label [Icon]    │
└─────────────────────────┘
```

### Variants

#### Primary Button
**Use for**: Main actions, primary CTAs, form submissions

```tsx
import { getButtonClasses } from '@/lib/design/components';

<button className={getButtonClasses('primary', 'base')}>
  Continue
</button>
```

**Visual**: Purple gradient with shadow, scales on hover

**States**:
- Default: `bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700`
- Hover: Increased shadow, 2% scale
- Active: 98% scale
- Disabled: 50% opacity
- Focus: Purple ring with offset

#### Secondary Button
**Use for**: Alternative actions, cancel buttons

```tsx
<button className={getButtonClasses('secondary', 'base')}>
  Cancel
</button>
```

**Visual**: Dark background with subtle border

**States**:
- Default: `bg-neutral-800 border-neutral-700`
- Hover: Lighter background
- Active: Darker background
- Focus: Purple ring

#### Ghost Button
**Use for**: Toolbar actions, navigation, subtle actions

```tsx
<button className={getButtonClasses('ghost', 'base')}>
  <IconSettings />
  Settings
</button>
```

**Visual**: Transparent background, visible on hover

**States**:
- Default: Transparent
- Hover: `bg-neutral-800`
- Active: Darker background

#### Danger Button
**Use for**: Destructive actions (delete, remove, cancel)

```tsx
<button className={getButtonClasses('danger', 'base')}>
  <IconTrash />
  Delete
</button>
```

**Visual**: Red gradient, white text

**Warning**: Always confirm destructive actions

#### Outline Button
**Use for**: Secondary emphasis, alternative style

```tsx
<button className={getButtonClasses('outline', 'base')}>
  Learn More
</button>
```

**Visual**: Purple border, transparent background

#### Glass Button
**Use for**: Actions on overlays, hero sections

```tsx
<button className={getButtonClasses('glass', 'base')}>
  Get Started
</button>
```

**Visual**: Frosted glass effect with backdrop blur

#### Gradient Button
**Use for**: Premium features, special promotions

```tsx
<button className={getButtonClasses('gradient', 'base')}>
  <IconStar />
  Upgrade to Pro
</button>
```

**Visual**: Animated gradient with shimmer effect

### Sizes

```tsx
// Extra Small
<button className={getButtonClasses('primary', 'xs')}>Tiny</button>
// h-7 px-2.5 text-xs

// Small
<button className={getButtonClasses('primary', 'sm')}>Small</button>
// h-8 px-3 text-sm

// Base (Default)
<button className={getButtonClasses('primary', 'base')}>Base</button>
// h-10 px-4 text-base

// Large
<button className={getButtonClasses('primary', 'lg')}>Large</button>
// h-12 px-6 text-lg

// Extra Large
<button className={getButtonClasses('primary', 'xl')}>Extra Large</button>
// h-14 px-8 text-xl
```

### Icon Buttons

```tsx
<button className="h-10 w-10 rounded-lg bg-neutral-800 hover:bg-neutral-700
                   flex items-center justify-center transition-colors">
  <IconSearch className="w-5 h-5" />
</button>
```

### With Icons

```tsx
// Leading icon
<button className={getButtonClasses('primary', 'base')}>
  <IconPlus className="w-5 h-5" />
  Add File
</button>

// Trailing icon
<button className={getButtonClasses('primary', 'base')}>
  Continue
  <IconArrowRight className="w-5 h-5" />
</button>

// Both
<button className={getButtonClasses('primary', 'base')}>
  <IconDownload className="w-5 h-5" />
  Download
  <IconCheck className="w-5 h-5" />
</button>
```

### Loading State

```tsx
<button className={getButtonClasses('primary', 'base')} disabled>
  <IconSpinner className="w-5 h-5 animate-spin" />
  Loading...
</button>
```

### Button Groups

```tsx
<div className="inline-flex rounded-lg shadow-sm" role="group">
  <button className="px-4 py-2 bg-neutral-800 border border-neutral-700
                     rounded-l-lg hover:bg-neutral-700">
    Left
  </button>
  <button className="px-4 py-2 bg-neutral-800 border-t border-b border-neutral-700
                     hover:bg-neutral-700">
    Middle
  </button>
  <button className="px-4 py-2 bg-neutral-800 border border-neutral-700
                     rounded-r-lg hover:bg-neutral-700">
    Right
  </button>
</div>
```

---

## Cards

Cards are containers for content. Use them to group related information and make it scannable.

### Variants

#### Default Card

```tsx
import { getCardClasses } from '@/lib/design/components';

<div className={getCardClasses('default', 'base')}>
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-neutral-400">Card content goes here.</p>
</div>
```

#### Elevated Card
**Use for**: Important information, featured content

```tsx
<div className={getCardClasses('elevated', 'lg')}>
  <h3>Featured Content</h3>
  <p>This card has more visual weight.</p>
</div>
```

**Visual**: Higher shadow, border changes on hover

#### Glass Card
**Use for**: Overlays, hero sections, modern aesthetic

```tsx
<div className={getCardClasses('glass', 'base')}>
  <h3>Glass Morphism</h3>
  <p>Frosted glass effect with backdrop blur.</p>
</div>
```

#### Gradient Card
**Use for**: Premium features, special highlights

```tsx
<div className={getCardClasses('gradient', 'lg')}>
  <h3>Premium Feature</h3>
  <p>Gradient background with brand colors.</p>
</div>
```

#### Interactive Card
**Use for**: Clickable cards, navigation

```tsx
<div
  className={getCardClasses('interactive', 'base')}
  onClick={() => console.log('Card clicked')}
>
  <h3>Click me</h3>
  <p>This card is interactive.</p>
</div>
```

**Visual**: Scales on hover, cursor pointer

#### Outlined Card
**Use for**: Minimal style, less visual weight

```tsx
<div className={getCardClasses('outlined', 'base')}>
  <h3>Outlined Style</h3>
  <p>Minimal card with just a border.</p>
</div>
```

### Padding Sizes

```tsx
// No padding (custom content)
<div className={getCardClasses('default', 'none')}>...</div>

// Small padding
<div className={getCardClasses('default', 'sm')}>...</div> // p-4

// Base padding (default)
<div className={getCardClasses('default', 'base')}>...</div> // p-6

// Large padding
<div className={getCardClasses('default', 'lg')}>...</div> // p-8

// Extra large padding
<div className={getCardClasses('default', 'xl')}>...</div> // p-10
```

### Card with Header and Footer

```tsx
<div className={getCardClasses('default', 'none')}>
  {/* Header */}
  <div className="px-6 py-4 border-b border-neutral-800">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-sm text-neutral-400">Subtitle or description</p>
  </div>

  {/* Body */}
  <div className="px-6 py-4">
    <p>Main card content goes here.</p>
  </div>

  {/* Footer */}
  <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3">
    <button className={getButtonClasses('ghost', 'sm')}>Cancel</button>
    <button className={getButtonClasses('primary', 'sm')}>Save</button>
  </div>
</div>
```

---

## Inputs

Form inputs for user data entry.

### Text Input

```tsx
import { getInputClasses } from '@/lib/design/components';

<input
  type="text"
  className={getInputClasses('default', 'base')}
  placeholder="Enter text..."
/>
```

### Variants

```tsx
// Default
<input className={getInputClasses('default', 'base')} />

// Filled
<input className={getInputClasses('filled', 'base')} />

// Glass
<input className={getInputClasses('glass', 'base')} />

// Error state
<input className={getInputClasses('error', 'base')} />

// Success state
<input className={getInputClasses('success', 'base')} />
```

### With Label

```tsx
<div className="space-y-2">
  <label
    htmlFor="email"
    className="block text-sm font-medium text-neutral-300"
  >
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className={getInputClasses('default', 'base')}
    placeholder="you@example.com"
  />
</div>
```

### With Error Message

```tsx
<div className="space-y-2">
  <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
    Password
  </label>
  <input
    id="password"
    type="password"
    className={getInputClasses('error', 'base')}
    aria-invalid="true"
    aria-describedby="password-error"
  />
  <p id="password-error" className="text-sm text-red-400">
    Password must be at least 8 characters
  </p>
</div>
```

### With Icon

```tsx
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <IconSearch className="h-5 w-5 text-neutral-400" />
  </div>
  <input
    type="text"
    className={`${getInputClasses('default', 'base')} pl-10`}
    placeholder="Search..."
  />
</div>
```

### Textarea

```tsx
<textarea
  className={`${getInputClasses('default', 'base')} min-h-[120px] resize-y`}
  placeholder="Enter message..."
/>
```

### Select

```tsx
<select className={getInputClasses('default', 'base')}>
  <option>Choose an option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
```

### Checkbox

```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 rounded border-neutral-700 bg-neutral-900
               text-purple-500 focus:ring-2 focus:ring-purple-500
               focus:ring-offset-2 focus:ring-offset-neutral-950"
  />
  <span className="text-sm text-neutral-300">
    I agree to the terms and conditions
  </span>
</label>
```

### Radio Button

```tsx
<div className="space-y-3">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="plan"
      value="free"
      className="w-5 h-5 border-neutral-700 bg-neutral-900
                 text-purple-500 focus:ring-2 focus:ring-purple-500"
    />
    <span className="text-sm text-neutral-300">Free Plan</span>
  </label>
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="plan"
      value="pro"
      className="w-5 h-5 border-neutral-700 bg-neutral-900
                 text-purple-500 focus:ring-2 focus:ring-purple-500"
    />
    <span className="text-sm text-neutral-300">Pro Plan</span>
  </label>
</div>
```

---

## Navigation

Navigation components for site structure and wayfinding.

### Header (Fixed)

```tsx
<header className="fixed top-0 left-0 right-0 z-sticky
                   bg-neutral-950/80 backdrop-blur-xl
                   border-b border-white/10">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <IconLogo className="w-8 h-8" />
        <span className="text-xl font-bold">Tallow</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        <a href="#" className="px-3 py-2 rounded-lg text-neutral-400
                               hover:text-neutral-50 hover:bg-neutral-800
                               transition-colors">
          Features
        </a>
        <a href="#" className="px-3 py-2 rounded-lg text-neutral-400
                               hover:text-neutral-50 hover:bg-neutral-800
                               transition-colors">
          Pricing
        </a>
        <a href="#" className="px-3 py-2 rounded-lg text-neutral-50
                               bg-neutral-800">
          Docs
        </a>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className={getButtonClasses('ghost', 'sm')}>
          Sign In
        </button>
        <button className={getButtonClasses('primary', 'sm')}>
          Get Started
        </button>
      </div>
    </div>
  </div>
</header>
```

### Sidebar

```tsx
<aside className="fixed left-0 top-0 bottom-0 w-64
                  bg-neutral-950 border-r border-neutral-900
                  overflow-y-auto z-fixed">
  {/* Logo */}
  <div className="p-6 border-b border-neutral-900">
    <div className="flex items-center gap-2">
      <IconLogo className="w-8 h-8" />
      <span className="text-xl font-bold">Tallow</span>
    </div>
  </div>

  {/* Navigation */}
  <nav className="p-4 space-y-1">
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg
                           bg-neutral-800 text-neutral-50">
      <IconHome className="w-5 h-5" />
      Dashboard
    </a>
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg
                           text-neutral-400 hover:text-neutral-50
                           hover:bg-neutral-800 transition-colors">
      <IconFiles className="w-5 h-5" />
      Files
    </a>
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg
                           text-neutral-400 hover:text-neutral-50
                           hover:bg-neutral-800 transition-colors">
      <IconSettings className="w-5 h-5" />
      Settings
    </a>
  </nav>
</aside>
```

### Tabs

```tsx
<div className="border-b border-neutral-800">
  <nav className="flex gap-4 px-4" aria-label="Tabs">
    <button className="px-3 py-2 border-b-2 border-purple-500
                       text-purple-400 font-medium">
      Overview
    </button>
    <button className="px-3 py-2 border-b-2 border-transparent
                       text-neutral-400 hover:text-neutral-50
                       hover:border-neutral-700">
      Analytics
    </button>
    <button className="px-3 py-2 border-b-2 border-transparent
                       text-neutral-400 hover:text-neutral-50
                       hover:border-neutral-700">
      Settings
    </button>
  </nav>
</div>
```

### Breadcrumbs

```tsx
<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
  <a href="#" className="text-neutral-400 hover:text-neutral-50">
    Home
  </a>
  <IconChevronRight className="w-4 h-4 text-neutral-600" />
  <a href="#" className="text-neutral-400 hover:text-neutral-50">
    Files
  </a>
  <IconChevronRight className="w-4 h-4 text-neutral-600" />
  <span className="text-neutral-50">
    Document.pdf
  </span>
</nav>
```

---

## Modals & Dialogs

Modal windows for focused tasks and confirmations.

### Basic Modal

```tsx
<div className="fixed inset-0 z-overlay bg-black/80 backdrop-blur-sm
                flex items-center justify-center p-4">
  <div className="relative w-full max-w-md bg-neutral-900
                  border border-neutral-800 rounded-2xl shadow-2xl
                  animate-scale-in">
    {/* Header */}
    <div className="px-6 py-4 border-b border-neutral-800">
      <h2 className="text-xl font-semibold">Modal Title</h2>
    </div>

    {/* Body */}
    <div className="px-6 py-4">
      <p className="text-neutral-400">
        Modal content goes here.
      </p>
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-neutral-800
                    flex justify-end gap-3">
      <button className={getButtonClasses('ghost', 'base')}>
        Cancel
      </button>
      <button className={getButtonClasses('primary', 'base')}>
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Confirmation Dialog

```tsx
<div className="fixed inset-0 z-overlay bg-black/80 backdrop-blur-sm
                flex items-center justify-center p-4">
  <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800
                  rounded-2xl shadow-2xl p-6">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full
                      bg-red-500/10 flex items-center justify-center">
        <IconWarning className="w-6 h-6 text-red-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">
          Delete file?
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          This action cannot be undone. The file will be permanently deleted.
        </p>
        <div className="flex justify-end gap-3">
          <button className={getButtonClasses('ghost', 'sm')}>
            Cancel
          </button>
          <button className={getButtonClasses('danger', 'sm')}>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Hero Sections

Large, prominent sections typically used on landing pages.

### Hero with Gradient Background

```tsx
<section className="relative min-h-screen flex items-center justify-center
                    overflow-hidden bg-neutral-950">
  {/* Background Effects */}
  <div className="absolute inset-0 bg-gradient-to-br
                  from-purple-500/10 via-transparent to-fuchsia-500/10
                  opacity-50" />
  <div className="absolute inset-0
                  bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]
                  bg-[size:4rem_4rem]
                  [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[800px] h-[800px] bg-purple-500/20 rounded-full
                  blur-[120px] animate-pulse" />

  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                  text-center">
    <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl
                   font-bold tracking-tight mb-6">
      <span className="block">Secure File</span>
      <span className="block gradient-text">Transfer</span>
    </h1>
    <p className="text-lg sm:text-xl lg:text-2xl text-neutral-400
                  max-w-3xl mx-auto mb-8">
      Privacy-first, post-quantum encrypted file sharing with zero knowledge architecture.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button className={getButtonClasses('primary', 'lg')}>
        Get Started
        <IconArrowRight className="w-5 h-5" />
      </button>
      <button className={getButtonClasses('glass', 'lg')}>
        Learn More
      </button>
    </div>
  </div>
</section>
```

---

## Badges

Small status indicators and labels.

```tsx
// Default
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                 text-xs font-medium bg-neutral-800 text-neutral-300
                 border border-neutral-700">
  Default
</span>

// Primary
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                 text-xs font-medium bg-purple-500/10 text-purple-400
                 border border-purple-500/20">
  New
</span>

// Success
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                 text-xs font-medium bg-green-500/10 text-green-400
                 border border-green-500/20">
  Active
</span>

// Warning
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                 text-xs font-medium bg-yellow-500/10 text-yellow-400
                 border border-yellow-500/20">
  Pending
</span>

// Error
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                 text-xs font-medium bg-red-500/10 text-red-400
                 border border-red-500/20">
  Error
</span>
```

---

## Toasts & Notifications

Temporary messages for user feedback.

```tsx
// Success Toast
<div className="fixed bottom-4 right-4 z-toast">
  <div className="flex items-start gap-3 min-w-[300px] max-w-md p-4
                  rounded-xl shadow-xl bg-green-950 border border-green-800
                  text-green-50 animate-slide-in-up">
    <IconCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-medium">Success!</p>
      <p className="text-sm opacity-90">File uploaded successfully.</p>
    </div>
    <button className="text-green-300 hover:text-green-50">
      <IconX className="w-5 h-5" />
    </button>
  </div>
</div>
```

---

## Tooltips

Contextual help and additional information.

```tsx
<div className="relative group">
  <button className={getButtonClasses('ghost', 'base')}>
    <IconHelp className="w-5 h-5" />
  </button>

  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  px-3 py-2 text-sm font-medium bg-neutral-900
                  border border-neutral-800 text-neutral-50 rounded-lg
                  shadow-lg opacity-0 group-hover:opacity-100
                  pointer-events-none transition-opacity whitespace-nowrap">
    Help tooltip
    <div className="absolute top-full left-1/2 -translate-x-1/2
                    w-2 h-2 rotate-45 bg-neutral-900 border-neutral-800
                    border-r border-b -mt-1" />
  </div>
</div>
```

---

## Progress Indicators

Show task completion or loading states.

### Progress Bar

```tsx
<div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
  <div className="h-full bg-purple-500 rounded-full transition-all duration-300"
       style={{ width: '65%' }} />
</div>
```

### Circular Progress

```tsx
<div className="relative w-16 h-16">
  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
    <circle
      cx="32"
      cy="32"
      r="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      className="text-neutral-800"
    />
    <circle
      cx="32"
      cy="32"
      r="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeDasharray={`${2 * Math.PI * 28}`}
      strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.65)}`}
      className="text-purple-500 transition-all duration-300"
      strokeLinecap="round"
    />
  </svg>
  <div className="absolute inset-0 flex items-center justify-center
                  text-sm font-medium">
    65%
  </div>
</div>
```

---

**For implementation details and additional examples, see the component source files in `/lib/design/components.ts`.**
