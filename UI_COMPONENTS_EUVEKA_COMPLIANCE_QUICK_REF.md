# EUVEKA UI Components Compliance - Quick Reference

## Approved Color Palette (Monochrome Only)

### Primary Colors
```tsx
'#fefefc'  // White (primary)
'#191610'  // Dark (primary background)
'#b2987d'  // Warm accent
'#e5dac7'  // Light border
'#544a36'  // Dark border
```

### Focus Ring Patterns

#### Pattern 1: White Focus (Primary Interactive)
```tsx
className={cn(
  'focus-visible:ring-[#fefefc]/50',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#191610]'
)}
```
**Use for**: Buttons (default, primary, link), cards, icons

#### Pattern 2: Warm Accent Focus (Forms & Dialogs)
```tsx
className={cn(
  'focus-visible:ring-[#b2987d]/50',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]'
)}
```
**Use for**: Inputs, selects, textareas, dialogs, tabs

#### Pattern 3: Badge Focus (Compact Elements)
```tsx
className={cn(
  'focus-visible:ring-[3px]',
  'focus-visible:ring-[#b2987d]/30'
)}
```
**Use for**: Badges, checkboxes, small interactive elements

## Prohibited Colors

### ❌ NEVER USE
```tsx
// Blue colors
'blue-500', 'blue-600', 'blue-700', 'blue-*'
'bg-blue-*', 'text-blue-*', 'border-blue-*'
'#0099ff', '#007acc', '#3b82f6'

// Default Tailwind focus rings
'ring-blue-500'
'focus:ring-blue-600'
```

## Component-Specific Patterns

### Buttons
```tsx
// Default variant
'focus-visible:ring-[#fefefc]/50'

// Secondary variant
'focus-visible:ring-[#b2987d]/40'

// Destructive variant
'focus-visible:ring-[#ef4444]/50'
```

### Inputs & Forms
```tsx
// Standard input
'focus:border-[#b2987d]'
'focus:ring-[3px]'
'focus:ring-[#b2987d]/15'

// Error state
'border-red-400 focus:border-red-500'

// Success state
'border-green-400 focus:border-green-500'
```

### Cards
```tsx
// Interactive card
'focus-visible:ring-[3px]'
'focus-visible:ring-[#fefefc]/30'
'focus-visible:ring-offset-[#191610]'

// Hover glow
'hover:border-[#fefefc]/30'
```

### Dialogs
```tsx
// Dialog content
'focus-visible:ring-[#b2987d]/50'
'focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]'

// Close button
'hover:text-[#191610] dark:hover:text-[#fefefc]'
```

## Status Colors (Approved Exceptions)

### Success
```tsx
'bg-green-500'    // Success states
'text-green-400'  // Success messages
```

### Warning
```tsx
'bg-amber-500'    // Warning states
'text-yellow-400' // Warning messages
```

### Error
```tsx
'bg-red-500'      // Error states
'text-red-400'    // Error messages
'border-red-400'  // Error borders
```

### Info (MONOCHROME ONLY)
```tsx
'bg-[#fefefc]'         // Use white instead of blue
'text-[#fefefc]'       // Use white instead of blue
'border-[#fefefc]/30'  // Use white instead of blue
```

## Migration Checklist

When creating new components:

- [ ] No `blue-*` Tailwind classes
- [ ] No `#0099ff` or similar blue hex codes
- [ ] Focus rings use `#fefefc` or `#b2987d`
- [ ] Ring offsets use `#191610` (dark) or `#fefefc` (light)
- [ ] Info states use white, not blue
- [ ] Status colors limited to green (success), red (error), amber (warning)
- [ ] All interactive elements have proper focus states
- [ ] Dark mode variants use approved colors

## Common Mistakes to Avoid

### ❌ Wrong
```tsx
'focus:ring-blue-500'           // Blue focus ring
'bg-blue-100 text-blue-700'     // Blue background
'info: "bg-blue-500"'           // Blue info color
'border-blue-400'               // Blue border
```

### ✅ Correct
```tsx
'focus:ring-[#fefefc]/50'       // White focus ring
'bg-[#fefefc]/10 text-[#fefefc]' // White background
'info: "bg-[#fefefc]"'          // White info color
'border-[#fefefc]/30'           // White border
```

## Verification Commands

### Check for blue violations
```bash
grep -r "blue-|#0099ff|bg-blue|text-blue|border-blue" components/ui --include="*.tsx"
```
**Expected**: No matches

### Check focus ring implementations
```bash
grep -r "focus-visible:ring-" components/ui --include="*.tsx" -A 1
```
**Expected**: Only #fefefc or #b2987d colors

## Quick Reference Table

| Element Type | Focus Ring Color | Opacity | Offset Color |
|--------------|------------------|---------|--------------|
| Button (default) | #fefefc | 50% | #191610 |
| Button (secondary) | #b2987d | 40% | #191610 |
| Input/Textarea | #b2987d | 15% | - |
| Dialog | #b2987d | 50% | #fefefc/#191610 |
| Card | #fefefc | 30% | #191610 |
| Badge | #b2987d | 30% | - |
| Checkbox | #b2987d | 30% | - |
| Select | #b2987d | 15% | - |
| Switch | #b2987d | 30% | - |
| Tabs | #b2987d | 50% | #fefefc/#191610 |

## Resources

- Full audit report: `TASK_3_BASE_UI_COMPONENTS_AUDIT_COMPLETE.md`
- EUVEKA design system: `CLAUDE.md`
- Component examples: `components/ui/`

## Support

If you need to add a new UI component:
1. Review this quick reference
2. Use approved color patterns
3. Test focus states in dark mode
4. Run verification commands
5. Document any new patterns

**Last Updated**: 2026-01-31
**Status**: All 43 base components EUVEKA-compliant ✓
