---
phase: quick-015
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/page.tsx
  - app/features/page.tsx
  - app/security/page.tsx
  - app/privacy/page.tsx
  - app/terms/page.tsx
  - app/how-it-works/page.tsx
  - app/app/page.tsx
  - app/app/settings/page.tsx
  - app/help/page.tsx
  - components/ui/*.tsx
  - components/app/*.tsx
  - components/transfer/*.tsx
  - components/features/*.tsx
  - components/devices/*.tsx
  - components/friends/*.tsx
  - tailwind.config.ts
  - app/globals.css
autonomous: true
user_setup: []

must_haves:
  truths:
    - 'All UI uses monochrome EUVEKA design (no blue #0099ff anywhere)'
    - 'Dark mode only with #191610 background and #fefefc white accent'
    - 'All buttons have 60px pill radius and 56-64px height'
    - 'All cards have 24-32px organic border radius'
    - 'All glow effects are white rgba(254,254,252) not blue'
    - 'All focus rings are white #fefefc'
    - 'Cormorant Garamond for headlines, Inter for body text'
  artifacts:
    - path: 'app/page.tsx'
      provides: 'Landing page with EUVEKA monochrome design'
    - path: 'components/ui/button.tsx'
      provides: 'Pill-shaped buttons with white glow'
    - path: 'components/ui/card.tsx'
      provides: 'Organic radius cards'
  key_links:
    - from: 'tailwind.config.ts'
      to: 'all components'
      via: 'Tailwind classes'
      pattern: 'euveka|accent|glow-white'
---

<objective>
Comprehensive UI/UX audit and fix using all UI subagents to verify and fix every section, page, and component across the entire Tallow website and app, ensuring consistent monochrome EUVEKA design.

Purpose: Ensure 100% design consistency after quick-014 monochrome
dark-mode-only design system implementation. Verify no blue #0099ff remnants
exist and all components follow EUVEKA specifications.

Output: All pages and components audited and fixed for EUVEKA monochrome
compliance. </objective>

<execution_context> @./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md </execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@tailwind.config.ts
@app/globals.css
@tallow-ui-subagents/TALLOW_UI_UX_ALL_20_SUBAGENTS.md
</context>

<design_reference>

## EUVEKA Monochrome Design System

### Color Palette (STRICT - NO BLUE #0099ff)

- **Background Dark:** #191610 (warm charcoal)
- **Accent/Primary:** #fefefc (off-white)
- **Neutrals:** #fefdfb, #fcf6ec, #f3ede2, #e5dac7, #d6cec2, #b2987d, #544a36,
  #2c261c, #242018
- **Error:** #ff4f4f (red, NOT blue)
- **Success:** #22c55e (green)
- **Warning:** #f59e0b (amber)

### Typography

- **Headlines:** Cormorant Garamond, weight 300-400, line-height 0.95-1.1
- **Body:** Inter, weight 400-500

### Component Specifications

- **Buttons:** pill shape (border-radius: 60px), height 56-64px
- **Cards:** border-radius 24-32px
- **Blur effects:** filter blur(84px)
- **Glow effects:** WHITE rgba(254, 254, 252, 0.3) - NOT blue

### Classes to Search For (Violations)

- `text-blue-*`, `bg-blue-*`, `border-blue-*`
- `#0099ff`, `#0066ff`, `rgb(0, 153, 255)`
- `glow-blue`, `shadow-blue`
- `ring-blue-*`, `focus:ring-blue-*` </design_reference>

<tasks>

<task type="auto">
  <name>Task 1: Landing & Marketing Pages - Design System Architect + Tailwind Master</name>
  <files>
    app/page.tsx
    app/features/page.tsx
    app/features/features-content.tsx
    app/security/page.tsx
    app/privacy/page.tsx
    app/terms/page.tsx
    app/how-it-works/page.tsx
  </files>
  <action>
Audit and fix all landing/marketing pages for EUVEKA monochrome compliance:

1.  **Search for blue color violations:**

    ```bash
    grep -rn "blue-" app/page.tsx app/features/ app/security/ app/privacy/ app/terms/ app/how-it-works/
    grep -rn "#0099ff\|#0066ff\|rgb(0" app/page.tsx app/features/ app/security/ app/privacy/ app/terms/ app/how-it-works/
    ```

2.  **Replace any blue references with EUVEKA white accent:**
    - `text-blue-*` -> `text-accent` or `text-[#fefefc]`
    - `bg-blue-*` -> `bg-accent` or `bg-[#fefefc]`
    - `border-blue-*` -> `border-accent` or `border-[#fefefc]`
    - `ring-blue-*` -> `ring-accent` or `ring-[#fefefc]`

3.  **Verify typography:**
    - Headlines should use `font-display` (Cormorant Garamond)
    - Body text should use `font-sans` (Inter)
    - Check for proper font weights (display: 300-400, body: 400-500)

4.  **Verify button styling:**
    - All buttons should have `rounded-button` or `rounded-[60px]`
    - Primary buttons: `bg-accent text-primary-foreground`
    - Height should be `h-14` (56px) or `h-16` (64px)

5.  **Verify card styling:**
    - All cards should have `rounded-card` or `rounded-[24px]`
    - Large cards: `rounded-card-lg` or `rounded-[32px]`
    - Background: `bg-card` or `bg-[#242018]`

6.  **Check glow effects:**
    - All glow should be white: `shadow-glow-white` or `glow-white`
    - Replace any `glow-blue` with `glow-white` </action> <verify> grep -rn
      "blue-\|#0099ff\|#0066ff" app/page.tsx app/features/ app/security/
      app/privacy/ app/terms/ app/how-it-works/


        # Should return empty (no blue violations)
      </verify>
      <done>
        All landing/marketing pages (7 pages) use EUVEKA monochrome design with no blue color references.
      </done>
    </task>

<task type="auto">
  <name>Task 2: App Pages & Transfer Components - React Component Expert + Form Specialist</name>
  <files>
    app/app/page.tsx
    app/app/settings/page.tsx
    app/app/history/page.tsx
    app/app/privacy-settings/page.tsx
    app/room/[code]/page.tsx
    app/share/[id]/page.tsx
    components/transfer/transfer-card.tsx
    components/transfer/transfer-progress.tsx
    components/transfer/transfer-queue.tsx
    components/transfer/qr-code-generator.tsx
    components/transfer/pqc-transfer-demo.tsx
  </files>
  <action>
Audit and fix all app pages and transfer components for EUVEKA compliance:

1.  **Search for blue color violations in app pages:**

    ```bash
    grep -rn "blue-\|#0099ff\|#0066ff" app/app/ app/room/ app/share/ components/transfer/
    ```

2.  **Fix transfer components:**
    - TransferCard: Ensure card uses `rounded-card bg-card border-card-border`
    - TransferProgress: Progress bar should be `bg-accent` not blue
    - TransferQueue: Queue items should use monochrome styling
    - QR Generator: QR styling should be monochrome

3.  **Fix form inputs:**
    - Input focus: `focus:ring-accent focus:border-accent`
    - Input background: `bg-input` (#242018)
    - Input border: `border-input-border` (#544a36)
    - Placeholder: `placeholder:text-muted` (#b2987d)

4.  **Fix status indicators:**
    - Success: `text-success` (#22c55e) - NOT blue
    - Error: `text-error` (#ff4f4f) - NOT blue
    - Warning: `text-warning` (#f59e0b)
    - Info/Neutral: `text-accent` (#fefefc) - NOT blue

5.  **Verify button consistency:**
    - Primary actions: `bg-accent text-primary-foreground rounded-button`
    - Secondary actions: `bg-secondary text-secondary-foreground rounded-button`
    - Destructive: `bg-destructive text-destructive-foreground rounded-button`
      </action> <verify> grep -rn "blue-\|#0099ff\|#0066ff" app/app/ app/room/
      app/share/ components/transfer/


        # Should return empty (no blue violations)
      </verify>
      <done>
        All app pages and transfer components use EUVEKA monochrome design.
      </done>
    </task>

<task type="auto">
  <name>Task 3: Base UI Components - Design System Architect + Icon Expert</name>
  <files>
    components/ui/button.tsx
    components/ui/card.tsx
    components/ui/input.tsx
    components/ui/dialog.tsx
    components/ui/dropdown-menu.tsx
    components/ui/tabs.tsx
    components/ui/badge.tsx
    components/ui/progress.tsx
    components/ui/tooltip.tsx
    components/ui/avatar.tsx
    components/ui/separator.tsx
    components/ui/scroll-area.tsx
    components/ui/label.tsx
    components/ui/sonner.tsx
  </files>
  <action>
Audit and fix all base UI components (shadcn/ui) for EUVEKA compliance:

1.  **Search for blue color violations in UI components:**

    ```bash
    grep -rn "blue-\|#0099ff\|#0066ff\|ring-blue" components/ui/
    ```

2.  **Button component (button.tsx):**
    - Verify variants use `rounded-button` (60px)
    - Default: `bg-accent text-primary-foreground`
    - Focus: `focus-visible:ring-accent`
    - Glow: `hover:shadow-glow-white`

3.  **Card component (card.tsx):**
    - Verify `rounded-card` (24px) or `rounded-card-lg` (32px)
    - Background: `bg-card` (#242018)
    - Border: `border-card-border` (#544a36)

4.  **Input component (input.tsx):**
    - Focus ring: `focus-visible:ring-accent`
    - Border: `border-input-border`
    - Background: `bg-input`

5.  **Dialog component (dialog.tsx):**
    - Overlay: `bg-surface-overlay` with blur
    - Content: `bg-card rounded-card-lg`
    - Focus trap ring: `ring-accent`

6.  **Badge component (badge.tsx):**
    - Default: `bg-accent/10 text-accent`
    - Remove any blue variant

7.  **Progress component (progress.tsx):**
    - Indicator: `bg-accent` NOT blue
    - Track: `bg-secondary`

8.  **Tabs component (tabs.tsx):**
    - Active tab: `bg-accent text-primary-foreground`
    - Inactive: `text-muted hover:text-foreground`

9.  **All focus states:**
    - Replace `ring-blue-*` with `ring-accent`
    - Replace `focus:ring-blue-*` with `focus:ring-accent` </action> <verify>
      grep -rn "blue-\|#0099ff\|#0066ff\|ring-blue" components/ui/


        # Should return empty (no blue violations)
      </verify>
      <done>
        All base UI components (14 components) use EUVEKA monochrome design with white accent.
      </done>
    </task>

<task type="auto">
  <name>Task 4: Device, Friends & Accessibility Components - Accessibility Specialist</name>
  <files>
    components/devices/device-card.tsx
    components/devices/device-list.tsx
    components/friends/friends-list.tsx
    components/friends/add-friend-dialog.tsx
    components/friends/friend-settings-dialog.tsx
    components/accessibility/keyboard-shortcuts-dialog.tsx
    components/security/verification-dialog.tsx
    components/privacy/metadata-strip-dialog.tsx
    components/app/MDNSStatusIndicator.tsx
    components/app/GroupTransferProgress.tsx
  </files>
  <action>
Audit and fix device, friends, and accessibility components for EUVEKA compliance:

1.  **Search for blue color violations:**

    ```bash
    grep -rn "blue-\|#0099ff\|#0066ff" components/devices/ components/friends/ components/accessibility/ components/security/ components/privacy/
    ```

2.  **Device components:**
    - DeviceCard: Use `rounded-card bg-card`
    - Status indicators: Online = `text-success`, Offline = `text-muted`
    - Connection status: NOT blue - use `text-accent` for connected

3.  **Friends components:**
    - FriendsList: Card styling with `rounded-card`
    - Add friend button: `bg-accent rounded-button`
    - Friend status: Online = `bg-success`, NOT blue

4.  **Accessibility components:**
    - Focus rings: `ring-accent` or `ring-[#fefefc]`
    - Skip links: `bg-accent text-primary-foreground`
    - Keyboard shortcuts: Monochrome styling

5.  **Security & Privacy dialogs:**
    - Dialog overlay: `bg-surface-overlay`
    - Dialog content: `bg-card rounded-card-lg`
    - Action buttons: `bg-accent rounded-button`

6.  **Status indicators (MDNSStatusIndicator, GroupTransferProgress):**
    - Active/Success: `text-success` or `bg-success` (green #22c55e)
    - Error: `text-error` or `bg-error` (red #ff4f4f)
    - Pending/Loading: `text-accent` (white #fefefc) - NOT blue
    - Progress bars: `bg-accent` - NOT blue </action> <verify> grep -rn
      "blue-\|#0099ff\|#0066ff" components/devices/ components/friends/
      components/accessibility/ components/security/ components/privacy/


        # Should return empty (no blue violations)
      </verify>
      <done>
        All device, friends, and accessibility components use EUVEKA monochrome design.
      </done>
    </task>

<task type="auto">
  <name>Task 5: Final Verification - Full Codebase Blue Color Audit</name>
  <files>
    app/**/*.tsx
    components/**/*.tsx
    tailwind.config.ts
    app/globals.css
  </files>
  <action>
Perform comprehensive final verification of the entire codebase:

1.  **Full codebase search for blue violations:**

    ```bash
    # Search all TSX files for blue references
    grep -rn "blue-" app/ components/ --include="*.tsx"
    grep -rn "#0099ff\|#0066ff\|rgb(0, 153, 255)\|rgb(0,153,255)" app/ components/ --include="*.tsx"
    grep -rn "glow-blue\|shadow-blue" app/ components/ --include="*.tsx"
    ```

2.  **Verify tailwind.config.ts:**
    - No blue color definitions in the color palette
    - All glow effects use white rgba(254, 254, 252, x)
    - Button radius is 60px
    - Card radius is 24px/32px

3.  **Verify globals.css:**
    - No blue CSS variables
    - All --glow-\* variables use white
    - All --accent-\* variables use #fefefc

4.  **Check for any lingering blue imports:**

    ```bash
    grep -rn "from.*blue\|blue.*import" app/ components/ --include="*.tsx"
    ```

5.  **Verify all status colors are semantic (not blue):**
    - Success = green
    - Error = red
    - Warning = amber
    - Info = white/neutral (NOT blue)

6.  **Create audit summary:**
    - List any remaining violations found
    - Document all fixes made
    - Confirm EUVEKA compliance score </action> <verify>


        # Final comprehensive check
        grep -rn "blue-\|#0099ff\|#0066ff\|rgb(0, 153, 255)" app/ components/ --include="*.tsx" | wc -l
        # Should return 0
      </verify>
      <done>
        Full codebase audit complete with 0 blue color violations. All components and pages use EUVEKA monochrome design system.
      </done>
    </task>

</tasks>

<verification>
## Overall Phase Verification

Run the following commands to verify complete EUVEKA compliance:

```bash
# 1. No blue Tailwind classes
grep -rn "text-blue-\|bg-blue-\|border-blue-\|ring-blue-" app/ components/ --include="*.tsx" | wc -l

# 2. No blue hex codes
grep -rn "#0099ff\|#0066ff\|#3b82f6\|#2563eb\|#1d4ed8" app/ components/ --include="*.tsx" | wc -l

# 3. No blue RGB values
grep -rn "rgb(0, 153, 255)\|rgb(59, 130, 246)\|rgb(37, 99, 235)" app/ components/ --include="*.tsx" | wc -l

# 4. No blue glow effects
grep -rn "glow-blue\|shadow-blue" app/ components/ --include="*.tsx" | wc -l

# 5. Verify white accent is used
grep -rn "accent\|#fefefc\|glow-white" app/ components/ --include="*.tsx" | head -20

# 6. Build verification
npm run build
```

All grep commands should return 0 for blue violations. </verification>

<success_criteria>

- [ ] All 7 landing/marketing pages audited and fixed
- [ ] All app pages (app/, room/, share/) audited and fixed
- [ ] All 14 base UI components audited and fixed
- [ ] All device, friends, accessibility components audited and fixed
- [ ] No blue color references (#0099ff, blue-\*, rgb(0,153,255)) in codebase
- [ ] All glow effects use white rgba(254, 254, 252, x)
- [ ] All buttons use 60px pill radius
- [ ] All cards use 24-32px organic radius
- [ ] All focus rings use white #fefefc accent
- [ ] Build passes with no errors </success_criteria>

<output>
After completion, create `.planning/quick/015-comprehensive-ui-subagents-audit/015-SUMMARY.md` with:
- Total files audited
- Total violations found and fixed
- Component-by-component breakdown
- Confirmation of EUVEKA monochrome compliance
</output>
