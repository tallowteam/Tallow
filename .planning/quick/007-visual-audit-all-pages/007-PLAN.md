---
phase: quick
plan: 007
type: execute
wave: 1
depends_on: []
files_modified:
  - app/features/page.tsx
  - app/how-it-works/page.tsx
  - app/security/page.tsx
  - app/privacy/page.tsx
  - app/terms/page.tsx
autonomous: true

must_haves:
  truths:
    - "All pages use consistent #0a0a08 background (not #050505)"
    - "No blue (#0066FF) accent colors - pure black/white/gray design"
    - "All pages use SiteNav component for navigation"
    - "Typography follows Cormorant Garamond (display) + Inter (body) pattern"
    - "Buttons have 60px border radius where appropriate"
  artifacts:
    - path: "app/features/page.tsx"
      provides: "Consistent euveka design"
    - path: "app/how-it-works/page.tsx"
      provides: "Consistent euveka design"
    - path: "app/security/page.tsx"
      provides: "Consistent euveka design"
    - path: "app/privacy/page.tsx"
      provides: "Consistent euveka design"
    - path: "app/terms/page.tsx"
      provides: "Consistent euveka design"
  key_links:
    - from: "All pages"
      to: "globals.css design system"
      via: "CSS custom properties"
---

<objective>
Comprehensive visual audit and fix visual bugs across all pages to ensure consistent black/white euveka-style design.

Purpose: The landing page (app/page.tsx) correctly implements the euveka design system with #0a0a08 background and #fefefc text. However, features, how-it-works, security, privacy, and terms pages use inconsistent styling including blue (#0066FF) accents, #050505 backgrounds, and colored gradients that deviate from the pure black/white design.

Output: All pages will follow the consistent euveka design system defined in globals.css with proper dark mode default, no colored accents, and uniform typography.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@app/page.tsx (reference implementation - correct euveka design)
@app/globals.css (design system definition)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Features and How-It-Works Pages</name>
  <files>app/features/page.tsx, app/how-it-works/page.tsx</files>
  <action>
Update both pages to match the euveka black/white design system:

**app/features/page.tsx:**
1. Change background from bg-[#050505] to bg-[#0a0a08]
2. Remove ALL blue (#0066FF) color references - replace with white/gray variants:
   - Blue text -> text-[#fefefc] or text-white
   - Blue borders -> border-[#262626] or border-white/10
   - Blue gradients -> grayscale gradients (from-white/5 to-transparent)
   - Blue hover states -> white/gray hover states
3. Remove colored feature icons (emerald, purple, amber) - use white/gray only
4. Ensure SiteNav component is used (or add if missing)
5. Update footer to match landing page footer style

**app/how-it-works/page.tsx:**
1. Change background from bg-[#050505] to bg-[#0a0a08]
2. Remove ALL blue (#0066FF) color references - same replacements as above
3. Remove custom navigation, use SiteNav component instead
4. Remove colored status indicators (green, purple, orange) - use white/gray
5. Update step numbers and process indicators to white/gray
6. Ensure footer matches landing page style

Design tokens to use:
- Background: #0a0a08 (or bg-black)
- Text: #fefefc (or text-white)
- Borders: #262626 (or border-white/10)
- Muted text: text-white/60 or text-gray-400
- Cards: bg-white/5 backdrop-blur-xl border border-white/10
  </action>
  <verify>
- grep -r "0066FF" app/features/page.tsx returns no results
- grep -r "0066FF" app/how-it-works/page.tsx returns no results
- grep -r "#050505" app/features/page.tsx returns no results
- grep -r "#050505" app/how-it-works/page.tsx returns no results
- Visual inspection shows black/white design
  </verify>
  <done>Features and How-It-Works pages use pure black/white euveka design with no blue accents</done>
</task>

<task type="auto">
  <name>Task 2: Fix Security, Privacy, and Terms Pages</name>
  <files>app/security/page.tsx, app/privacy/page.tsx, app/terms/page.tsx</files>
  <action>
Update all three pages to match the euveka black/white design system:

**app/security/page.tsx:**
1. Remove light mode support - dark mode only (remove bg-[#fafafa] and all light: prefixes)
2. Change dark:bg-[#050505] to bg-[#0a0a08]
3. Remove ALL blue (#0066FF) color references - replace with white/gray
4. Remove colored security indicators - use white/gray badges
5. Ensure consistent card styling: bg-white/5 backdrop-blur-xl border-white/10
6. Keep SiteNav component (already present)
7. Update footer to match landing page

**app/privacy/page.tsx:**
1. Change bg-[#050505] to bg-[#0a0a08]
2. Remove ALL blue (#0066FF) color references
3. Remove custom navigation, use SiteNav component
4. Remove colored privacy mode cards (blue, green, orange, red) - use white/gray variants
5. Update card hover states to white/gray
6. Update footer to match landing page

**app/terms/page.tsx:**
1. Ensure using correct CSS variables from globals.css
2. Replace any colored elements with black/white variants
3. Verify SiteNav is used (already present)
4. Ensure section backgrounds use #0a0a08
5. Update any remaining colored elements to grayscale

Common pattern for all pages:
- Hero sections: bg-[#0a0a08] with text-[#fefefc]
- Cards: bg-white/5 border border-white/10 rounded-2xl
- Buttons: bg-white text-black or bg-white/10 text-white
- Links: text-white hover:text-white/80 (no blue)
  </action>
  <verify>
- grep -r "0066FF" app/security/page.tsx returns no results
- grep -r "0066FF" app/privacy/page.tsx returns no results
- grep -r "#050505" app/security/page.tsx returns no results
- grep -r "#050505" app/privacy/page.tsx returns no results
- No light mode specific styles remain in security page
- Visual inspection shows consistent black/white design
  </verify>
  <done>Security, Privacy, and Terms pages use pure black/white euveka design with dark mode default</done>
</task>

</tasks>

<verification>
1. Run `grep -r "0066FF" app/features app/how-it-works app/security app/privacy app/terms` - should return no results
2. Run `grep -r "#050505" app/features app/how-it-works app/security app/privacy app/terms` - should return no results
3. Run `npm run build` - no errors
4. Visual spot check: All pages have consistent dark background (#0a0a08) and white text
</verification>

<success_criteria>
- All 5 pages (features, how-it-works, security, privacy, terms) use #0a0a08 background
- No blue (#0066FF) accent colors anywhere in these pages
- No colored gradients or badges - only black/white/gray
- Consistent card styling across all pages
- All pages use SiteNav component for navigation
- Footer styling consistent with landing page
- Build passes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/007-visual-audit-all-pages/007-SUMMARY.md`
</output>
