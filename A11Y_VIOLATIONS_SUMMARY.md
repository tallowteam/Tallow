# Transfer Mode Accessibility Violations - Quick Reference

## Critical Issues (Fix Immediately)

1. **V-001**: Transfer toggle missing `aria-pressed` 
   - File: `app/app/page.tsx:2185-2202`
   - Fix: Add `aria-pressed={transferMode === 'group'}`

2. **V-002**: No live regions for mode changes
   - File: `app/app/page.tsx:2164-2222`
   - Fix: Add `<div role="status" aria-live="polite">`

3. **V-003**: RecipientSelector uses wrong ARIA pattern
   - File: `components/app/RecipientSelector.tsx:392-409`
   - Fix: Convert to listbox pattern with `role="option"`

4. **V-004**: Keyboard focus not programmatic
   - File: `components/app/RecipientSelector.tsx:199-214`
   - Fix: Add `itemRefs.current[focusedIndex]?.focus()`

5. **V-005**: Progress not announced
   - File: `components/app/GroupTransferProgress.tsx`
   - Fix: Add live region for progress updates

6. **V-006**: Progress bars missing ARIA values
   - File: `components/app/GroupTransferProgress.tsx:245,411`
   - Fix: Verify/add `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

## Serious Issues (Fix Soon)

7. **V-007**: Touch targets below 44px (3 locations)
8. **V-008**: Selection changes silent
9. **V-009**: Color contrast needs verification
10. **V-010**: Statistics need `<dl><dt><dd>`
11. **V-011**: Warnings need `role="alert"`
12. **V-012**: Errors not announced
13. **V-013**: Speed graph lacks text alternative
14. **V-014**: Keyboard shortcuts only in placeholder

## Moderate Issues (Fix When Possible)

15-17. Animations without reduced motion support
18. Icon consistency (mostly good)
19. Focus visibility needs dark mode testing
20-26. Various minor ARIA improvements

## Full Report

See `TRANSFER_MODE_A11Y_AUDIT.md` for complete details, code examples, and remediation plan.
