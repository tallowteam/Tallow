---
phase: quick
plan: 008
type: execute
wave: 1
depends_on: []
files_modified:
  - app/app/page.tsx
  - app/app/settings/page.tsx
  - app/app/history/page.tsx
  - components/transfer/transfer-card.tsx
  - components/devices/device-list.tsx
autonomous: true

must_haves:
  truths:
    - "App pages (transfer, settings, history) have no horizontal overflow at any viewport"
    - "Transfer card and device list components scale properly from mobile to TV"
    - "Touch targets are minimum 44px on mobile, 56px on TV"
    - "Typography is readable at all breakpoints without manual zooming"
  artifacts:
    - path: "app/app/page.tsx"
      provides: "Responsive transfer interface"
    - path: "app/app/settings/page.tsx"
      provides: "Responsive settings layout"
    - path: "app/app/history/page.tsx"
      provides: "Responsive history list"
  key_links:
    - from: "app/app/page.tsx"
      to: "tailwind breakpoints"
      via: "responsive classes"
      pattern: "sm:|md:|lg:|xl:|2xl:|3xl:|4xl:"
---

<objective>
Polish responsive design for app pages (transfer interface, settings, history) ensuring proper behavior across all screen sizes from mobile (320px) to TV (4K).

Purpose: Previous quick tasks (003, 005, 006, 007) addressed landing pages, global CSS, and design consistency. This task focuses on the actual application pages where users perform file transfers.

Output: App pages with proper responsive classes, no layout overflow, and TV-optimized spacing.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/003-multi-device-responsive-ux/003-PLAN.md
@.planning/quick/006-responsive-uiux-all-screens/006-PLAN.md
@tailwind.config.ts (breakpoints: xs 375px, sm 480px, md 768px, lg 1024px, xl 1280px, 2xl 1536px, 3xl 1920px, 4xl 2560px, 5xl 3840px)
@app/globals.css (responsive CSS already implemented)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit and fix responsive issues in app pages</name>
  <files>app/app/page.tsx, app/app/settings/page.tsx, app/app/history/page.tsx</files>
  <action>
1. **Audit each page for responsive issues:**
   - Check for hardcoded widths that could cause overflow
   - Find any missing responsive classes (e.g., `w-full` without `max-w-*`)
   - Identify spacing that doesn't scale (e.g., `gap-8` should be `gap-4 sm:gap-6 lg:gap-8`)

2. **app/app/page.tsx (main transfer interface):**
   - Ensure the main layout uses proper responsive padding: `px-4 sm:px-6 lg:px-8 3xl:px-12`
   - File selector area should scale: `max-w-full sm:max-w-2xl lg:max-w-4xl 3xl:max-w-5xl`
   - Device list grid should be responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4`
   - Transfer progress cards should use responsive width
   - Ensure buttons have minimum touch target sizes (already in globals.css, verify in use)

3. **app/app/settings/page.tsx:**
   - Settings form should have responsive max-width: `max-w-full sm:max-w-lg lg:max-w-2xl`
   - Toggle switches and inputs should have proper spacing
   - Add 3xl/4xl padding for TV viewing comfort

4. **app/app/history/page.tsx:**
   - History list should use responsive text sizing
   - Table or list layout should collapse gracefully on mobile
   - Add proper padding scaling for large screens

5. **Use existing design tokens from globals.css:**
   - Use `.container` class where appropriate
   - Leverage `.bento-grid` classes for grid layouts
   - Apply `.responsive-transition` for smooth resizing
  </action>
  <verify>
    - `npm run build` completes without errors
    - Open in browser DevTools, test at 375px, 768px, 1024px, 1920px, 2560px widths
    - No horizontal scrollbar appears at any width
    - Content is readable and usable at all sizes
  </verify>
  <done>
    - App pages have responsive padding that scales from mobile to TV
    - Grid layouts adapt to screen size
    - No hardcoded widths cause overflow
  </done>
</task>

<task type="auto">
  <name>Task 2: Enhance transfer and device components for all screen sizes</name>
  <files>components/transfer/transfer-card.tsx, components/devices/device-list.tsx</files>
  <action>
1. **components/transfer/transfer-card.tsx:**
   - Add responsive padding: `p-4 sm:p-5 lg:p-6 3xl:p-8`
   - Progress bar text should scale: `text-xs sm:text-sm 3xl:text-base`
   - File name truncation should be responsive
   - Cancel/action buttons should have proper touch targets
   - Add 3xl/4xl variants for TV-friendly sizing

2. **components/devices/device-list.tsx:**
   - Device cards should scale: padding, icon sizes, text
   - Grid should use responsive columns (already specified, verify implementation)
   - Connection status indicators should be visible at all sizes
   - Device names should truncate properly on small screens
   - Add 3xl/4xl spacing for comfortable TV viewing

3. **General component patterns:**
   - Icons: `h-4 w-4 sm:h-5 sm:w-5 3xl:h-6 3xl:w-6`
   - Text: `text-sm sm:text-base 3xl:text-lg`
   - Padding: `p-3 sm:p-4 lg:p-5 3xl:p-6`
   - Gaps: `gap-2 sm:gap-3 lg:gap-4 3xl:gap-6`
  </action>
  <verify>
    - Components render correctly at all breakpoints
    - No text overflow or clipping
    - Touch targets are accessible on mobile
    - Components look good on large TV screens
  </verify>
  <done>
    - Transfer card scales properly from mobile to TV
    - Device list uses responsive grid and spacing
    - All components follow consistent responsive patterns
  </done>
</task>

<task type="auto">
  <name>Task 3: Final verification and cleanup</name>
  <files>app/app/page.tsx, components/transfer/transfer-card.tsx</files>
  <action>
1. **Run visual verification:**
   - Test at 375px (mobile), 768px (tablet), 1024px (laptop), 1920px (desktop), 2560px (4K)
   - Check for any remaining horizontal overflow
   - Verify text is readable without zooming
   - Confirm touch targets are adequate on mobile

2. **Remove any debug utilities:**
   - Remove `debug-breakpoint` class if added during testing
   - Remove any temporary console.logs

3. **Verify build succeeds:**
   - `npm run build` completes without errors
   - No TypeScript errors introduced

4. **Document any remaining known issues:**
   - If any edge cases exist that can't be fixed in this task, note them
  </action>
  <verify>
    - `npm run build` passes
    - Manual visual check at key breakpoints
    - No console errors or warnings related to layout
  </verify>
  <done>
    - All app pages work correctly from 320px to 4K
    - Build passes without errors
    - No debug code left in codebase
  </done>
</task>

</tasks>

<verification>
1. Build verification: `npm run build` completes without errors
2. Visual verification at key breakpoints:
   - 375px (mobile): Content fits, no horizontal scroll
   - 768px (tablet): Two-column layouts where appropriate
   - 1024px (laptop): Full nav visible, proper spacing
   - 1920px (TV): Larger touch targets, comfortable spacing
   - 2560px (4K): Scaling continues, no cramped layouts
3. Touch target verification: All interactive elements meet 44px minimum on mobile
</verification>

<success_criteria>
- App pages (transfer, settings, history) have no horizontal overflow at any viewport width
- Components scale appropriately from mobile to TV
- Touch targets meet accessibility requirements (44px mobile, 56px TV)
- Typography is readable at all sizes
- Build passes without errors
- No debug code remains
</success_criteria>

<output>
After completion, create `.planning/quick/008-fix-ui-ux-responsive-design/008-SUMMARY.md`
</output>
