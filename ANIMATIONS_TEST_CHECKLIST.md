# Animation Testing Checklist

Use this checklist to verify all animations are working correctly.

---

## 🏠 Landing Page (`/`)

### Hero Section
- [ ] **Badge Dot** - Green dot pulses softly (2s loop)
- [ ] **"Quantum-safe" Text** - Gradient shimmers left to right (3s loop)
- [ ] **Background Gradient** - Subtle movement visible (15s loop, slow)
- [ ] **Hero Badge** - Fades down on page load
- [ ] **Hero Title** - Fades up after 100ms
- [ ] **Hero Description** - Fades up after 200ms
- [ ] **Hero Buttons** - Fade up after 300ms
- [ ] **Hero Stats** - Fade up after 400ms with stagger

### Feature Cards
**Scroll into view**:
- [ ] Cards enter with staggered fade-up (75ms between each)
- [ ] All 6 cards animate in sequence

**Hover on any card**:
- [ ] Card lifts up (-4px translateY)
- [ ] Card gets larger shadow
- [ ] Purple gradient border appears around edge
- [ ] Icon background changes to purple
- [ ] Icon scales to 1.1x
- [ ] All transitions smooth (200ms)

**Reduced Motion Test**:
- [ ] Enable "Reduce Motion" in OS
- [ ] Cards don't lift on hover
- [ ] Icons don't scale
- [ ] Entrance animations disabled
- [ ] Page still looks good

### Security Cards
**Hover on any card**:
- [ ] Card scales to 1.02x
- [ ] Purple radial glow appears in center
- [ ] Purple glow shadow appears
- [ ] Glow pulses while hovering (2s breathing loop)

### CTA Section
- [ ] Section fades in with scale animation when scrolling to bottom

---

## 📁 Transfer Page (`/transfer`)

### Header
- [ ] History button hover - lifts -1px + purple border
- [ ] Chat button hover (if visible) - same as history

### File Drop Zone
**Initial state**:
- [ ] Visible with dashed border

**Hover (no files)**:
- [ ] Zone scales to 1.01x
- [ ] Border color shifts to purple
- [ ] Icon scales to 1.1x and turns purple

**Drag file over zone**:
- [ ] Border becomes solid purple
- [ ] Background turns purple tint
- [ ] Zone scales to 1.02x
- [ ] Border pulses (1.5s loop)
- [ ] Shadow expands and contracts

**Drop files**:
- [ ] Pulse animation stops
- [ ] Success state visible

### Share Mode Tabs
**Initial state**:
- [ ] "Nearby" tab is active (purple glow)
- [ ] Active tab has shimmer overlay (subtle 2s loop)

**Hover inactive tab**:
- [ ] Tab background lightens
- [ ] Tab icon scales to 1.05x

**Click inactive tab**:
- [ ] Tab animates with bounce (0-300ms):
  - 0ms: scale 0.95 (shrink)
  - 150ms: scale 1.02 (overshoot)
  - 300ms: scale 1.0 (settle)
- [ ] Purple glow appears
- [ ] Shimmer overlay starts
- [ ] Previous active tab loses glow

### Device Discovery

**Scan Status**:
- [ ] "Scanning..." has rotating spinner icon (2s loop)
- [ ] "Scanned X devices" appears after scan

**Device Cards - Initial**:
- [ ] Online dots pulse on online devices (2s loop)
- [ ] "This Device" card has purple tint

**Hover on device card (not "This Device")**:
- [ ] Card lifts -4px
- [ ] Card scales to 1.02x
- [ ] Multi-layer shadow appears
- [ ] Purple glow shadow appears
- [ ] Glow pulses while hovering (2s breathing)
- [ ] Device icon scales to 1.1x
- [ ] Icon background glows
- [ ] Send indicator (→) fades in at top-right
- [ ] Send indicator scales to 1.1x

**Click device card**:
- [ ] Card scales to 1.01 and lifts to -2px (active state)

**Hover on "This Device" card**:
- [ ] No hover effects (card is disabled)

---

## 🔘 Buttons (All Pages)

### Primary Button
**Idle**:
- [ ] Purple background visible

**Hover**:
- [ ] Background brightens (1.1x)
- [ ] Purple glow shadow appears
- [ ] Radial overlay fades in

**Click/Active**:
- [ ] Button scales to 0.98x (press effect)
- [ ] Background darkens (0.95x)
- [ ] Returns to normal on release

**Loading State**:
- [ ] Spinner appears in center
- [ ] Spinner rotates smoothly (800ms per rotation)
- [ ] Text/icon hidden

### Secondary Button
**Hover**:
- [ ] Background lightens
- [ ] Border strengthens
- [ ] Lifts -1px
- [ ] Shadow appears

### Outline/Ghost Buttons
**Hover**:
- [ ] Background subtle fill
- [ ] Border strengthens (outline only)

---

## 🏷️ Badges (All Pages)

### Badge with Dot
- [ ] Dot pulses continuously (2s loop)
- [ ] Scale: 1.0 → 1.1 → 1.0
- [ ] Opacity: 1.0 → 0.7 → 1.0

Example locations:
- [ ] "Now with quantum-safe encryption" badge (hero)
- [ ] Feature card badges (AES-256, ML-KEM-768, etc.)

---

## 🌐 Global Elements

### Header Navigation (All Pages)
**Hover on nav links**:
- [ ] Text color transitions
- [ ] Smooth 200ms transition

**Hover on logo**:
- [ ] Smooth transition (if any styling changes)

### Footer (All Pages)
**Hover on footer links**:
- [ ] Color transition
- [ ] Smooth 200ms

---

## ♿ Accessibility Tests

### Reduced Motion
**Steps**:
1. Enable "Reduce Motion" in OS settings:
   - **macOS**: System Settings → Accessibility → Display → Reduce Motion
   - **Windows**: Settings → Accessibility → Visual effects → Animation effects → Off
   - **iOS**: Settings → Accessibility → Motion → Reduce Motion
2. Reload page

**Expected Results**:
- [ ] Hero shimmer text stops (remains gradient, no animation)
- [ ] Hero background gradient stops moving
- [ ] Badge dots stop pulsing
- [ ] Card hover effects have no transform (no lift)
- [ ] Icon hover effects have no scale
- [ ] Tab activation has no bounce
- [ ] Drop zone has no pulse when dragging
- [ ] Device card glow stops pulsing
- [ ] Spinner rotates slower (if at all)
- [ ] All entrance animations disabled
- [ ] Page remains fully functional
- [ ] Layout doesn't break

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus states visible on all elements
- [ ] Focus ring appears (purple, 2px offset)
- [ ] Can activate buttons with Enter/Space
- [ ] Can switch tabs with arrow keys (if implemented)
- [ ] Animations don't interfere with focus

### Screen Readers
- [ ] VoiceOver (Mac) / NVDA (Windows) can read all content
- [ ] Animations don't disrupt reading flow
- [ ] Hidden loading spinners announced properly
- [ ] Status changes announced (if using aria-live)

---

## 📱 Mobile Tests

### Responsive Behavior
**Test on phone (or DevTools mobile view)**:
- [ ] All animations work on mobile
- [ ] Touch interactions trigger hover states
- [ ] Animations don't cause scrolling issues
- [ ] Performance acceptable (no lag)
- [ ] Reduced motion works on mobile

### Touch Interactions
- [ ] Tap buttons - see active state
- [ ] Tap cards - see active state
- [ ] Swipe gestures don't conflict with animations

---

## 🌐 Browser Tests

### Chrome/Edge
- [ ] All animations smooth
- [ ] Shimmer text renders correctly
- [ ] Gradients display properly
- [ ] 60fps achieved (check DevTools Performance)

### Firefox
- [ ] All animations smooth
- [ ] Backdrop blur works
- [ ] CSS mask properties work
- [ ] Gradients correct

### Safari (Mac/iOS)
- [ ] All animations smooth
- [ ] Webkit prefixes work
- [ ] Background-clip: text works
- [ ] Transforms render correctly

---

## ⚡ Performance Tests

### Chrome DevTools
**Steps**:
1. Open DevTools → Performance tab
2. Start recording
3. Scroll page, hover elements, trigger animations
4. Stop recording

**Check**:
- [ ] Frame rate stays near 60fps
- [ ] No long tasks (>50ms)
- [ ] No layout thrashing
- [ ] Paint times reasonable (<16ms)

### Lighthouse
**Steps**:
1. Run Lighthouse audit
2. Check Performance score

**Targets**:
- [ ] Performance score >90
- [ ] First Contentful Paint <1.8s
- [ ] Time to Interactive <3.8s
- [ ] Cumulative Layout Shift <0.1
- [ ] Total Blocking Time <200ms

---

## 🎨 Visual Quality Checks

### Animation Smoothness
- [ ] No "janky" or stuttering animations
- [ ] Consistent frame rates
- [ ] Smooth easing curves (no abrupt stops)
- [ ] Timing feels natural

### Visual Consistency
- [ ] Purple color matches design system
- [ ] Shadow depths appropriate
- [ ] Glow effects not overwhelming
- [ ] Shimmer effects subtle

### Cross-Page Consistency
- [ ] Similar elements animate similarly
- [ ] Timing consistent across pages
- [ ] Easing functions consistent
- [ ] Color palette consistent

---

## 🐛 Common Issues to Check

### Animation Issues
- [ ] No infinite loops causing performance issues
- [ ] No conflicting animations
- [ ] No animations getting stuck
- [ ] No flickering during state changes

### Layout Issues
- [ ] No layout shift during animations
- [ ] No content jumping
- [ ] No scroll position changes
- [ ] No z-index conflicts

### Interaction Issues
- [ ] Hover states revert when mouse leaves
- [ ] Active states revert when mouse up
- [ ] Animations don't block clicks
- [ ] Multiple rapid clicks don't break animations

---

## ✅ Final Verification

### Complete System Test
**Steps**:
1. Navigate to landing page (`/`)
2. Scroll through entire page slowly
3. Hover over various elements
4. Click through to transfer page
5. Interact with all transfer page elements
6. Enable reduced motion
7. Repeat above steps
8. Test on mobile device
9. Test in different browsers

**Sign-off Checklist**:
- [ ] All animations work as expected
- [ ] No performance issues
- [ ] No visual glitches
- [ ] Accessibility passes
- [ ] Mobile works correctly
- [ ] Reduced motion works
- [ ] Cross-browser compatible
- [ ] Ready for production

---

## 📊 Test Results Template

```
Date: _____________
Tester: _____________
Browser: _____________
OS: _____________
Device: _____________

Landing Page Animations: ✅ / ❌
Transfer Page Animations: ✅ / ❌
Button Interactions: ✅ / ❌
Badge Animations: ✅ / ❌
Reduced Motion: ✅ / ❌
Keyboard Navigation: ✅ / ❌
Mobile Responsive: ✅ / ❌
Performance (60fps): ✅ / ❌

Issues Found:
-
-
-

Notes:


Approved for Production: ✅ / ❌
```

---

## 🔄 Regression Testing (Future Updates)

After any code changes, re-test:
- [ ] Hero animations still work
- [ ] Feature card hovers still work
- [ ] Transfer page animations still work
- [ ] Reduced motion still respected
- [ ] Performance not degraded

---

**Testing Status**: ⬜ Not Started / 🟡 In Progress / ✅ Complete

**Last Updated**: February 6, 2026
