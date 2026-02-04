# Design Tokens Quick Reference Card

Quick lookup for all Tallow design system tokens. Use these CSS custom properties in your components.

## 🎨 Colors

### Backgrounds
```css
--color-background-primary     #0a0a0a   /* Near black */
--color-background-secondary   #111111   /* Dark gray */
--color-background-tertiary    #171717   /* Medium dark */
--color-background-elevated    #1a1a1a   /* Elevated surfaces */
--color-background-overlay     rgba(0, 0, 0, 0.8)
```

### Foregrounds (Text)
```css
--color-foreground-primary     #ffffff   /* White */
--color-foreground-secondary   #a1a1a1   /* Light gray */
--color-foreground-tertiary    #666666   /* Medium gray */
--color-foreground-muted       #404040   /* Dark gray */
```

### Accents (Purple-Blue Gradient)
```css
--color-accent-primary         #7c3aed   /* Purple */
--color-accent-secondary       #6366f1   /* Indigo */
--color-accent-tertiary        #3b82f6   /* Blue */
--color-accent-hover           #8b5cf6   /* Light purple */
--color-accent-active          #6d28d9   /* Dark purple */
```

### Semantic
```css
--color-success                #10b981   /* Green */
--color-success-bg             rgba(16, 185, 129, 0.1)
--color-success-border         rgba(16, 185, 129, 0.2)

--color-warning                #f59e0b   /* Orange */
--color-warning-bg             rgba(245, 158, 11, 0.1)
--color-warning-border         rgba(245, 158, 11, 0.2)

--color-error                  #ef4444   /* Red */
--color-error-bg               rgba(239, 68, 68, 0.1)
--color-error-border           rgba(239, 68, 68, 0.2)

--color-info                   #3b82f6   /* Blue */
--color-info-bg                rgba(59, 130, 246, 0.1)
--color-info-border            rgba(59, 130, 246, 0.2)
```

### Borders
```css
--color-border-primary         #222222
--color-border-secondary       #333333
--color-border-tertiary        #404040
--color-border-accent          var(--color-accent-primary)
```

### Gradients
```css
--gradient-accent              linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)
--gradient-accent-reverse      linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%)
--gradient-subtle              linear-gradient(180deg, #0a0a0a 0%, #111111 100%)
--gradient-glow                radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)
```

## 📝 Typography

### Font Families
```css
--font-family-sans             'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-family-mono             'Geist Mono', ui-monospace, SFMono-Regular, monospace
--font-family-display          'Geist', var(--font-family-sans)
```

### Font Sizes
```css
--font-size-xs                 0.75rem    /* 12px */
--font-size-sm                 0.875rem   /* 14px */
--font-size-base               1rem       /* 16px */
--font-size-lg                 1.125rem   /* 18px */
--font-size-xl                 1.25rem    /* 20px */
--font-size-2xl                1.5rem     /* 24px */
--font-size-3xl                1.875rem   /* 30px */
--font-size-4xl                2.25rem    /* 36px */
--font-size-5xl                3rem       /* 48px */
--font-size-6xl                3.75rem    /* 60px */
--font-size-7xl                4.5rem     /* 72px */
```

### Font Weights
```css
--font-weight-normal           400
--font-weight-medium           500
--font-weight-semibold         600
--font-weight-bold             700
```

### Line Heights
```css
--line-height-tight            1.2
--line-height-snug             1.4
--line-height-normal           1.5
--line-height-relaxed          1.6
```

## 📏 Spacing

```css
--spacing-1                    0.25rem    /* 4px */
--spacing-2                    0.5rem     /* 8px */
--spacing-3                    0.75rem    /* 12px */
--spacing-4                    1rem       /* 16px */
--spacing-5                    1.25rem    /* 20px */
--spacing-6                    1.5rem     /* 24px */
--spacing-8                    2rem       /* 32px */
--spacing-10                   2.5rem     /* 40px */
--spacing-12                   3rem       /* 48px */
--spacing-16                   4rem       /* 64px */
--spacing-20                   5rem       /* 80px */
--spacing-24                   6rem       /* 96px */
--spacing-32                   8rem       /* 128px */
```

## 🔲 Border Radius

```css
--radius-sm                    0.25rem    /* 4px */
--radius-base                  0.375rem   /* 6px */
--radius-md                    0.5rem     /* 8px */
--radius-lg                    0.75rem    /* 12px */
--radius-xl                    1rem       /* 16px */
--radius-2xl                   1.5rem     /* 24px */
--radius-full                  9999px     /* Fully rounded */
```

## 🌑 Shadows

```css
--shadow-sm                    0 1px 2px 0 rgba(0, 0, 0, 0.5)
--shadow-base                  0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.6)
--shadow-md                    0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.6)
--shadow-lg                    0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -4px rgba(0, 0, 0, 0.7)
--shadow-xl                    0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)
--shadow-2xl                   0 25px 50px -12px rgba(0, 0, 0, 0.8)
```

## ✨ Glows

```css
--glow-sm                      0 0 10px rgba(124, 58, 237, 0.3)
--glow-base                    0 0 20px rgba(124, 58, 237, 0.4)
--glow-md                      0 0 30px rgba(124, 58, 237, 0.5)
--glow-lg                      0 0 40px rgba(124, 58, 237, 0.6)
```

## ⏱️ Transitions

```css
--transition-fast              150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base              200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow              300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-spring            300ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

## 📐 Easing

```css
--ease-out                     cubic-bezier(0, 0, 0.2, 1)
--ease-in                      cubic-bezier(0.4, 0, 1, 1)
--ease-in-out                  cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring                  cubic-bezier(0.34, 1.56, 0.64, 1)
```

## 🔢 Z-Index

```css
--z-base                       1
--z-dropdown                   1000
--z-sticky                     1020
--z-fixed                      1030
--z-modal-backdrop             1040
--z-modal                      1050
--z-popover                    1060
--z-tooltip                    1070
```

## 📱 Breakpoints

```css
--breakpoint-sm                640px
--breakpoint-md                768px
--breakpoint-lg                1024px
--breakpoint-xl                1280px
--breakpoint-2xl               1536px
```

## 📦 Containers

```css
--container-sm                 640px
--container-md                 768px
--container-lg                 1024px
--container-xl                 1280px
--container-2xl                1536px
```

---

## 🎯 Common Utility Classes

### Layout
```
.flex .grid .block .inline-block .hidden .sr-only
.container .relative .absolute .fixed .sticky
```

### Flexbox
```
.flex-row .flex-col .flex-wrap
.items-center .items-start .items-end .items-stretch
.justify-center .justify-between .justify-around
.gap-1 .gap-2 .gap-3 .gap-4 .gap-6 .gap-8
```

### Text
```
.text-center .text-left .text-right
.text-primary .text-secondary .text-tertiary .text-accent
.uppercase .lowercase .capitalize
.font-normal .font-medium .font-semibold .font-bold
```

### Background
```
.bg-primary .bg-secondary .bg-tertiary .bg-elevated .bg-accent
```

### Border Radius
```
.rounded-sm .rounded .rounded-md .rounded-lg .rounded-xl .rounded-2xl .rounded-full
```

### Shadows
```
.shadow-sm .shadow .shadow-md .shadow-lg .shadow-xl .shadow-none
.glow .glow-lg
```

### Special Effects
```
.gradient-text
.backdrop-blur .backdrop-blur-sm .backdrop-blur-lg
```

### Animations
```
.animate-fadeIn .animate-fadeOut
.animate-slideInUp .animate-slideInDown
.animate-slideInLeft .animate-slideInRight
.animate-scaleIn .animate-scaleOut
.animate-spin .animate-pulse .animate-bounce .animate-glow
```

---

## 📋 Usage Examples

### Using CSS Variables
```tsx
<div style={{
  backgroundColor: 'var(--color-background-secondary)',
  padding: 'var(--spacing-6)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'var(--transition-base)',
}}>
  Content
</div>
```

### Using Utility Classes
```tsx
<div className="bg-secondary rounded-lg shadow-md p-6">
  <h2 className="h2 gradient-text mb-4">Title</h2>
  <p className="body text-secondary">Description</p>
  <button className="bg-accent text-primary font-semibold rounded-lg px-6 py-3 glow">
    Action
  </button>
</div>
```

### Combining Both
```tsx
<div
  className="flex items-center gap-4 rounded-xl shadow-lg"
  style={{
    background: 'var(--gradient-accent)',
    padding: 'var(--spacing-8)',
  }}
>
  Content
</div>
```

---

## 🎨 Common Color Combinations

### Primary Card
```
Background: var(--color-background-secondary)
Border: var(--color-border-primary)
Text: var(--color-foreground-primary)
Shadow: var(--shadow-md)
```

### Accent Button
```
Background: var(--gradient-accent)
Text: white
Shadow: var(--glow-base)
Radius: var(--radius-lg)
```

### Success Alert
```
Background: var(--color-success-bg)
Border: var(--color-success-border)
Text: var(--color-success)
Icon: var(--color-success)
```

### Input Field
```
Background: var(--color-background-secondary)
Border: var(--color-border-primary)
Focus Border: var(--color-accent-primary)
Text: var(--color-foreground-primary)
Placeholder: var(--color-foreground-tertiary)
```

---

## 💡 Pro Tips

1. **Use CSS Variables for Dynamic Values**
   ```tsx
   style={{ padding: 'var(--spacing-6)' }}
   ```

2. **Combine Utility Classes**
   ```tsx
   className="flex items-center gap-4 bg-secondary rounded-lg p-6"
   ```

3. **Leverage Gradients**
   ```tsx
   className="gradient-text"  // For text
   style={{ background: 'var(--gradient-accent)' }}  // For backgrounds
   ```

4. **Use Semantic Colors**
   ```tsx
   className="text-success"  // Instead of text-green
   ```

5. **Apply Consistent Spacing**
   ```tsx
   gap-4  // 16px gap
   p-6    // 24px padding
   mb-8   // 32px margin-bottom
   ```

---

**Quick Reference Card**
**Version:** 1.0.0
**Last Updated:** February 3, 2026
**Location:** C:\Users\aamir\Documents\Apps\Tallow\app\globals.css
