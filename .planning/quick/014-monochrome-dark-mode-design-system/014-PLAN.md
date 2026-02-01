---
phase: quick
plan: 014
type: execute
wave: 1
depends_on: []
files_modified:
  - tailwind.config.ts
  - app/globals.css
  - lib/design-system/tokens.ts
  - components/ui/button.tsx
  - components/ui/card.tsx
autonomous: true

must_haves:
  truths:
    - 'All accent colors are white (#fefefc) not blue (#0099ff)'
    - 'Only dark mode exists - no light mode variables or classes'
    - 'White glow effects replace blue glow effects throughout'
  artifacts:
    - path: 'tailwind.config.ts'
      provides: 'Monochrome color palette with white accent'
      contains: 'accent: "#fefefc"'
    - path: 'app/globals.css'
      provides: 'Dark-only CSS variables'
      contains: '--accent: #fefefc'
    - path: 'lib/design-system/tokens.ts'
      provides: 'Monochrome theme tokens'
      contains: "accent: '#fefefc'"
  key_links:
    - from: 'tailwind.config.ts'
      to: 'components/ui/button.tsx'
      via: 'Tailwind classes use white accent'
      pattern: '#fefefc'
---

<objective>
Convert Tallow UI from EUVEKA blue-accent theme to pure monochrome (black #191610 / white #fefefc) dark-mode-only design system.

Purpose: User wants minimal black/white aesthetic with no blue accent, dark mode
only. Light mode and other themes will be added later by user.

Output: Updated design system files with monochrome palette, white accent
colors, white glow effects, and dark-mode-only CSS. </objective>

<execution_context> @./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md </execution_context>

<context>
@.planning/STATE.md
@tailwind.config.ts
@app/globals.css
@lib/design-system/tokens.ts
@components/ui/button.tsx
@components/ui/card.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update Core Design System Files</name>
  <files>
    - tailwind.config.ts
    - app/globals.css
    - lib/design-system/tokens.ts
  </files>
  <action>
Update the core design system to pure monochrome:

**tailwind.config.ts:**

1. Change `accent: "#0099ff"` to `accent: "#fefefc"` in DESIGN_TOKENS
2. Update `primary` color from `#0099ff` to `#fefefc` with foreground `#191610`
3. Update `accent` color scale - replace blue scale with white/grayscale:
   - DEFAULT: "#fefefc"
   - 50-500: white/light gray tones
   - 600-950: dark gray tones
   - foreground: "#191610"
4. Update box shadows: Replace all `rgba(0, 153, 255, X)` (blue glow) with
   `rgba(254, 254, 252, X)` (white glow)
5. Update keyframes: Replace blue glow animations with white glow
6. Update `ring` and `sidebar-ring` from `#0099ff` to `#fefefc`

**app/globals.css:**

1. Remove `.light` class and all light mode variables
2. Update `:root, .dark` block:
   - `--accent: #fefefc` (not #0099ff)
   - `--accent-hover: #e5e5e3` (slightly darker white)
   - `--accent-subtle: rgba(254, 254, 252, 0.15)`
   - `--accent-muted: rgba(254, 254, 252, 0.08)`
   - `--primary: #fefefc`
   - `--primary-foreground: #191610`
   - `--ring: #fefefc`
   - `--border-focus: #fefefc`
   - `--input-focus: #fefefc`
3. Update all glow CSS variables from blue to white:
   - `--glow-xs` through `--glow-xl`: use `rgba(254, 254, 252, X)`
4. Remove `.euveka` class block (consolidate into :root)
5. Remove `.euveka-light` if exists
6. Update status colors `--chart-1` from `#0099ff` to `#fefefc`
7. Update sidebar colors to use white accent

**lib/design-system/tokens.ts:**

1. Change `euvekaColors.accent` from `#0099ff` to `#fefefc`
2. Update `euvekaColors.border.*.focus` from `#0099ff` to `#fefefc`
3. Update `euvekaColors.status.info` from `#0099ff` to `#fefefc`
4. Update `themes.default` to use white accent:
   - accent: '#fefefc'
   - accentForeground: '#191610'
   - ring: '#fefefc'
5. Remove `themes.euveka` (blue accent theme)
6. Remove `themes['euveka-light']`
7. Keep `themes['high-contrast']` as-is (accessibility)
8. Remove `themes.light`, `themes.ocean`, `themes.forest` (user will add later)
9. Update ThemeName type to only include: 'default' | 'high-contrast' </action>
   <verify> Run: `npx tsc --noEmit` - No TypeScript errors Run:
   `grep -r "#0099ff" tailwind.config.ts app/globals.css lib/design-system/tokens.ts` -
   Should return nothing Run:
   `grep -r "rgba(0, 153, 255" tailwind.config.ts app/globals.css` - Should
   return nothing </verify> <done> All three core files updated with monochrome
   palette. No blue (#0099ff) colors remain. White (#fefefc) is the only accent
   color. </done> </task>

<task type="auto">
  <name>Task 2: Update UI Components for Monochrome</name>
  <files>
    - components/ui/button.tsx
    - components/ui/card.tsx
  </files>
  <action>
Update button and card components for monochrome dark-mode-only:

**components/ui/button.tsx:**

1. Remove all light mode classes (remove lines with non-dark: prefixes for
   colors)
2. Simplify to dark-mode-only styling:
   - default variant: `border-[#fefefc] bg-transparent text-[#fefefc]`
   - hover: `bg-[#fefefc] text-[#191610]`
   - Remove all `dark:` prefixes (we're dark-only now)
3. Update primary variant: filled white on dark
   - `border-[#fefefc] bg-[#fefefc] text-[#191610]`
   - hover: `bg-[#e5e5e3] border-[#e5e5e3]`
4. Update secondary variant to use warm neutrals (no blue)
5. Update ghost and outline variants for dark-only
6. Update destructive to keep red (no change needed)
7. Update focus-visible rings from any blue to `#fefefc`
8. Update getGlowColor() function to return white-based glows, not blue

**components/ui/card.tsx:**

1. Remove all light mode classes (non-dark: color prefixes)
2. Simplify variants to dark-mode-only:
   - default: `bg-[#191610] border-[#544a36]`
   - Remove all `dark:` prefixes
3. Update shadowConfigs to use white glow instead of blue:
   - Replace `rgba(178,152,125,X)` with `rgba(254,254,252,X)` for glow effects
4. Update hover border class from warm muted to white:
   - `hover:border-[#fefefc]/30`
5. Update BentoCard icon container to dark-only
6. Keep focus ring using `#fefefc` (already using #b2987d, update to white)
   </action> <verify> Run: `npx tsc --noEmit` - No TypeScript errors Run:
   `grep -c "dark:" components/ui/button.tsx components/ui/card.tsx` - Should
   return 0 for each Run:
   `grep -r "#0099ff" components/ui/button.tsx components/ui/card.tsx` - Should
   return nothing </verify> <done> Button and card components are dark-mode-only
   with white accent. No dark: prefixes remain. No blue colors. </done> </task>

<task type="auto">
  <name>Task 3: Verify Build and Visual Consistency</name>
  <files>
    - package.json (no changes, just run commands)
  </files>
  <action>
1. Run full build to catch any compilation errors:
   `npm run build`

2. If build fails, fix any TypeScript or CSS errors

3. Scan for any remaining blue accent colors across the codebase:
   `grep -r "#0099ff" --include="*.tsx" --include="*.ts" --include="*.css" components/ lib/ app/`

4. Scan for any light mode remnants in globals.css:
   `grep -n "\.light" app/globals.css`

5. Verify the dark class is still properly set up:
   `grep -n ":root" app/globals.css`

6. If any blue colors found in other components (dialog, input, etc.), update
   them to use white accent via CSS variables (--accent) </action> <verify> Run:
   `npm run build` - Build succeeds with no errors Run:
   `grep -r "#0099ff" --include="*.tsx" --include="*.ts" --include="*.css" components/ lib/ app/` -
   Returns nothing Run: `grep "\.light\s*{" app/globals.css` - Returns nothing
   (no light mode) </verify> <done> Build passes. No blue accent colors remain
   in components. Application is dark-mode-only with white (#fefefc) accent
   throughout. </done> </task>

</tasks>

<verification>
- [ ] `npm run build` passes with no errors
- [ ] No `#0099ff` or `rgba(0, 153, 255` in modified files
- [ ] No `.light` class definitions in globals.css
- [ ] All accent colors are `#fefefc` or CSS variable `var(--accent)`
- [ ] Button and card components have no `dark:` prefixes
- [ ] TypeScript compilation succeeds
</verification>

<success_criteria>

1. Pure monochrome design system: black (#191610) background, white (#fefefc)
   accent
2. Dark mode only - no light mode variables or class definitions
3. All glow effects use white (rgba(254,254,252,X)) not blue
4. Button and card components simplified to dark-only styling
5. Build passes with no errors
6. EUVEKA design patterns preserved: 84px blur, 60px pill buttons, 24-32px card
   radius, Cormorant Garamond + Inter fonts </success_criteria>

<output>
After completion, create `.planning/quick/014-monochrome-dark-mode-design-system/014-SUMMARY.md`
</output>
