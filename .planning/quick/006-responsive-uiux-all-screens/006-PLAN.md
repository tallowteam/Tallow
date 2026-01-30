---
phase: quick
plan: 006
type: execute
wave: 1
depends_on: []
files_modified:
  - tailwind.config.ts
  - app/globals.css
  - app/page.tsx
  - components/site-nav.tsx
autonomous: true

must_haves:
  truths:
    - "Layout works correctly from 320px to 4K (3840px) without horizontal overflow"
    - "Typography scales appropriately at all breakpoints including TV"
    - "Navigation adapts to TV-sized screens with larger touch targets"
    - "Bento grid uses more columns on large desktop and TV screens"
  artifacts:
    - path: "tailwind.config.ts"
      provides: "TV and 4K breakpoint definitions"
      contains: "4xl"
    - path: "app/globals.css"
      provides: "TV-specific responsive styles"
      contains: "@media.*2560px"
  key_links:
    - from: "tailwind.config.ts"
      to: "all components"
      via: "Tailwind breakpoint classes"
      pattern: "3xl:|4xl:"
---

<objective>
Complete responsive optimization for all screen sizes including TV (1920px-4K+)

Purpose: Ensure excellent UX across all device types - mobile, tablet, laptop, desktop, and TV/large displays
Output: Updated CSS and config with comprehensive breakpoint support and TV-optimized layouts
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/003-multi-device-responsive-ux/003-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add TV/4K breakpoints and extend responsive foundation</name>
  <files>tailwind.config.ts, app/globals.css</files>
  <action>
1. In tailwind.config.ts, add missing large screen breakpoints:
   - Keep existing: xs (375px), sm (480px), md (768px), lg (1024px), xl (1280px), 2xl (1536px), 3xl (1920px)
   - Add: "4xl": "2560px" (4K/Ultra-wide)
   - Add: "5xl": "3840px" (True 4K)

2. In app/globals.css, enhance the existing TV media queries:
   - Consolidate and organize TV-specific styles
   - Add @media (min-width: 2560px) block for 4K:
     * html { font-size: 22px; } (base font scaling)
     * .container { max-width: 2400px; }
     * Touch targets: min-height 64px, min-width 64px
   - Add @media (min-width: 3840px) block for true 4K:
     * html { font-size: 26px; }
     * .container { max-width: 3200px; }
   - Ensure smooth scaling between breakpoints using CSS clamp() where appropriate

3. Add TV-specific grid utilities in globals.css:
   ```css
   @media (min-width: 1920px) {
     .bento-grid { grid-template-columns: repeat(4, 1fr); }
     .bento-grid-3 { grid-template-columns: repeat(4, 1fr); }
   }
   @media (min-width: 2560px) {
     .bento-grid { grid-template-columns: repeat(5, 1fr); }
     .bento-grid-3 { grid-template-columns: repeat(5, 1fr); }
     .bento-grid-4 { grid-template-columns: repeat(6, 1fr); }
   }
   ```
  </action>
  <verify>
    - `npm run build` completes without errors
    - Inspect tailwind.config.ts to confirm 4xl and 5xl breakpoints exist
    - Grep globals.css for "2560px" and "3840px" media queries
  </verify>
  <done>
    - Tailwind config includes 4xl (2560px) and 5xl (3840px) breakpoints
    - CSS has organized TV-specific media queries for 1920px, 2560px, 3840px
    - Grid utilities scale columns appropriately on large screens
  </done>
</task>

<task type="auto">
  <name>Task 2: Optimize navigation and landing page for TV screens</name>
  <files>components/site-nav.tsx, app/page.tsx</files>
  <action>
1. In components/site-nav.tsx:
   - Add responsive classes for TV: logo scales up `3xl:w-14 3xl:h-14`
   - Nav links get larger: `3xl:text-base 3xl:gap-14`
   - CTA button scales: `3xl:px-8 3xl:py-3 3xl:text-base`
   - Nav container max-width increases: `3xl:max-w-[1800px] 4xl:max-w-[2200px]`

2. In app/page.tsx:
   - Hero section: Add TV-specific padding and spacing
     * `3xl:py-48 3xl:px-16`
     * Hero text already uses clamp(), verify it scales well to 7rem+ on TV
   - Bento cards: Add responsive padding `3xl:p-12 4xl:p-14`
   - Stats section: Add `3xl:gap-8` for better spacing
   - Footer: Add `3xl:py-24 3xl:gap-14` for TV-friendly spacing
   - Container widths: `3xl:max-w-[1800px] 4xl:max-w-[2400px]`

3. Verify hero image/decoration scales:
   - Floating elements should have `3xl:` size variants
   - Subtle glow effects should scale: `3xl:w-[1200px] 3xl:h-[800px]`
  </action>
  <verify>
    - `npm run build` completes without errors
    - Use browser devtools to simulate 1920x1080, 2560x1440, and 3840x2160
    - Verify no horizontal scrollbar appears at any resolution
    - Elements should have comfortable spacing on large screens (not cramped or too spread)
  </verify>
  <done>
    - Navigation scales appropriately on TV screens (larger logo, links, CTA)
    - Landing page hero, features, and footer have TV-optimized spacing
    - No layout issues at 1920px, 2560px, or 3840px widths
  </done>
</task>

<task type="auto">
  <name>Task 3: Add responsive container query utilities and test verification</name>
  <files>app/globals.css</files>
  <action>
1. Add container query utilities to globals.css for component-level responsiveness:
   ```css
   /* Container Query Support */
   .container-query {
     container-type: inline-size;
   }

   /* Container query breakpoints for cards */
   @container (min-width: 400px) {
     .cq-card { padding: 2rem; }
   }
   @container (min-width: 600px) {
     .cq-card { padding: 2.5rem; }
   }
   ```

2. Add smooth transition utilities for responsive changes:
   ```css
   .responsive-transition {
     transition: padding 0.3s ease, font-size 0.3s ease, gap 0.3s ease;
   }
   ```

3. Add a responsive debug utility (dev only):
   ```css
   /* Dev-only breakpoint indicator - remove in production */
   .debug-breakpoint::after {
     content: 'xs';
     position: fixed;
     bottom: 8px;
     right: 8px;
     background: #0a0a08;
     color: #fefefc;
     padding: 4px 8px;
     font-size: 10px;
     border-radius: 4px;
     z-index: 9999;
     font-family: monospace;
   }
   @media (min-width: 480px) { .debug-breakpoint::after { content: 'sm 480px'; } }
   @media (min-width: 768px) { .debug-breakpoint::after { content: 'md 768px'; } }
   @media (min-width: 1024px) { .debug-breakpoint::after { content: 'lg 1024px'; } }
   @media (min-width: 1280px) { .debug-breakpoint::after { content: 'xl 1280px'; } }
   @media (min-width: 1536px) { .debug-breakpoint::after { content: '2xl 1536px'; } }
   @media (min-width: 1920px) { .debug-breakpoint::after { content: '3xl 1920px'; } }
   @media (min-width: 2560px) { .debug-breakpoint::after { content: '4xl 2560px'; } }
   @media (min-width: 3840px) { .debug-breakpoint::after { content: '5xl 3840px'; } }
   ```

4. Verify all responsive CSS is well-organized with clear section comments
  </action>
  <verify>
    - `npm run build` completes without errors
    - CSS is valid and parses correctly
    - Container query syntax is correct (check browser support)
  </verify>
  <done>
    - Container query utilities added for component-level responsiveness
    - Smooth transition utilities added for better visual experience during resize
    - Debug breakpoint indicator available for development testing
    - All responsive CSS is organized with clear section comments
  </done>
</task>

</tasks>

<verification>
1. Build verification:
   - `npm run build` completes without errors or warnings

2. Visual verification (manual):
   - Open site in browser
   - Use DevTools responsive mode to test:
     - 375px (mobile)
     - 768px (tablet)
     - 1024px (laptop)
     - 1280px (desktop)
     - 1920px (large desktop/TV)
     - 2560px (4K)
   - Verify no horizontal overflow at any size
   - Verify text is readable and touch targets are accessible

3. Code verification:
   - Grep for new breakpoint usage: 3xl, 4xl, 5xl
   - Verify media queries are properly ordered (mobile-first)
</verification>

<success_criteria>
- Tailwind config includes TV/4K breakpoints (4xl: 2560px, 5xl: 3840px)
- CSS has comprehensive TV-specific styles for 1920px, 2560px, 3840px
- Navigation and landing page scale well on TV screens
- No layout breaks from 320px to 3840px
- Container query utilities available for future component use
- Build completes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/006-responsive-uiux-all-screens/006-SUMMARY.md`
</output>
