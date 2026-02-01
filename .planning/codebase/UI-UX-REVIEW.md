# UI/UX Review

**Analysis Date:** 2026-01-23
**Scope:** Full UI/UX audit of all user-facing code

---

## Accessibility (a11y)

### Issues

1. **Missing ARIA labels on icon-only buttons** (HIGH)
   - **File:** `app/app/page.tsx` - multiple icon buttons (Settings, History, etc.)
   - **Issue:** Icon buttons use `<Button variant="ghost" size="icon">` with only a Lucide icon inside, no `aria-label`.
   - **Impact:** Screen readers announce these as unlabeled buttons.
   - **Fix:** Add `aria-label="Settings"`, `aria-label="View history"`, etc.

2. **File drag-drop has no keyboard alternative announcement** (MEDIUM)
   - **File:** `components/transfer/file-selector.tsx`
   - **Issue:** Drop zone relies on drag events. While there's likely an input fallback, the instructions say "Drag & drop" without mentioning the keyboard/click alternative.
   - **Fix:** Add text: "Drag & drop files here, or click to browse"

3. **Dialog focus management relies on Radix defaults** (LOW - POSITIVE)
   - **File:** `components/ui/dialog.tsx`
   - **Finding:** Uses Radix Dialog which handles focus trap and return correctly.
   - **Status:** Properly implemented.

4. **Color contrast in muted text** (MEDIUM)
   - **File:** Various components using `text-muted-foreground`
   - **Issue:** Depending on theme values, muted text may not meet WCAG AA 4.5:1 contrast ratio.
   - **Fix:** Verify contrast ratios in both light and dark themes.

---

## Responsive Design

### Issues

5. **App page is 1500+ lines with complex state** (MEDIUM - Code Quality)
   - **File:** `app/app/page.tsx`
   - **Issue:** Massive single component file. Hard to maintain responsive behavior across all states.
   - **Recommendation:** Extract into sub-components (ConnectionPanel, TransferPanel, etc.)

6. **Mobile layout tested via Playwright** (POSITIVE)
   - **Files:** `tests/e2e/visual/screenshots.spec.ts` - mobile viewport tests
   - **Finding:** Visual regression tests cover mobile (375x667) viewport.

7. **Transfer progress may overflow on small screens** (LOW)
   - **Issue:** Progress indicators and speed/ETA text may wrap on very narrow viewports.

---

## Loading & Transfer States

### Issues

8. **PQC handshake has no visual progress indicator** (HIGH)
   - **File:** `app/app/page.tsx:234-243`
   - **Issue:** After connection, user sees "Establishing encrypted session..." toast, then waits with no visual feedback until PQC key exchange completes. For slow devices, this could appear frozen.
   - **Fix:** Add a spinner or progress stepper showing: Connected > Key Exchange > Ready.

9. **File encryption has no progress for large files** (HIGH)
   - **File:** `lib/transfer/pqc-transfer-manager.ts:356-413`
   - **Issue:** `fileEncryption.encrypt()` is called before chunked sending begins. For large files, the encryption step blocks with no progress indication.
   - **Impact:** UI appears frozen during encryption of large files.
   - **Fix:** Add progress callback to encryption, or show "Encrypting..." with indeterminate progress.

10. **Connection timeout feedback is only a toast** (MEDIUM)
    - **File:** `app/app/page.tsx:172-179`
    - **Issue:** 30-second timeout shows a toast error. During those 30 seconds, the only feedback is `isConnecting` state (presumably a spinner). User has no way to cancel.
    - **Fix:** Add a "Cancel" button during connection, show countdown or progress.

---

## Error States

### Issues

11. **Verification required error is confusing** (CRITICAL - UX)
    - **File:** `app/app/page.tsx:906-909`
    - **Issue:** Even after user completes verification, attempting to send shows "Peer verification required before sending files" due to the `peerVerified` state bug (see Security Review #1).
    - **Impact:** User successfully verifies peer, then can't send. Extremely confusing.

12. **"Encrypted transfer failed" is not actionable** (MEDIUM)
    - **File:** `app/app/page.tsx:286`
    - **Issue:** Shows raw error from PQC manager. User doesn't know why transfer failed or what to do.
    - **Fix:** Translate common errors: timeout → "Connection lost", key error → "Security error, reconnect", etc.

13. **Wrong password shows "File corrupted" instead of "Wrong password"** (MEDIUM)
    - **File:** `lib/crypto/file-encryption-pqc.ts:279-298`
    - **Issue:** Hash mismatch from wrong password displays as corruption, not authentication failure.
    - **Fix:** Catch hash mismatch after password decryption specifically and show appropriate message.

---

## Interaction Patterns

### Issues

14. **No confirmation before disconnecting during transfer** (MEDIUM)
    - **Issue:** If user navigates away or closes tab during transfer, there's no "Are you sure?" prompt.
    - **Fix:** Add `beforeunload` event listener during active transfers.

15. **QR scanner component is 380 lines** (LOW - Code Quality)
    - **File:** `components/devices/qr-scanner.tsx`
    - **Issue:** Complex camera handling in a single component.

16. **Send button enabled before connection ready** (MEDIUM)
    - **Issue:** User can select files and see a send button before `pqcReady` is true. The validation catches it, but the button should be disabled until ready.
    - **Fix:** Disable send button when `!isConnected || !pqcReady || selectedFiles.length === 0`.

---

## Visual Consistency

### Positive Patterns

17. **Consistent design system** (POSITIVE)
    - Uses shadcn/ui (Radix + Tailwind) throughout.
    - Consistent use of `Card`, `Button`, `Dialog`, `Badge`, `Progress` primitives.
    - Theme system via `next-themes` with proper CSS variables.

18. **Dark/light mode properly implemented** (POSITIVE)
    - Visual regression tests capture both themes.
    - Uses CSS variables for all colors.

19. **Animation library (Framer Motion) available** (POSITIVE)
    - `framer-motion` installed for smooth transitions.

---

## Performance UX

### Issues

20. **Large file feedback needs improvement** (HIGH)
    - **Issue:** Files >100MB will show encryption progress via chunks, but initial `fileEncryption.encrypt()` call loads entire file into memory before chunking begins.
    - **Impact:** Memory spike + UI freeze for large files.
    - **Fix:** Stream encryption or show clear "Preparing file..." state.

21. **Multiple file download is sequential with no delay** (MEDIUM)
    - **File:** `lib/hooks/use-file-transfer.ts:113-116`
    - **Issue:** Downloads 100+ files by creating DOM elements rapidly. May freeze browser.
    - **Fix:** Add small delay between downloads, show progress.

22. **No transfer resume on disconnect** (MEDIUM)
    - **Issue:** If connection drops mid-transfer, user must restart from beginning.
    - **Impact:** Large file transfers over unstable connections waste time.

---

## Empty States & Onboarding

### Issues

23. **First-time user has no onboarding** (MEDIUM)
    - **Issue:** User lands on app page and sees send/receive tabs, connection types, but no guidance on what to do first.
    - **Fix:** Add a brief "How it works: 1. Choose connection type 2. Share code 3. Send files" inline guide.

24. **No empty state for transfer history** (LOW)
    - **File:** `app/app/history/page.tsx`
    - **Issue:** First-time users see empty history with no explanation.
    - **Fix:** Show "No transfers yet. Start sending files to see your history here."

---

## Copy & Microcopy

### Issues

25. **"PQC encryption active"** (LOW)
    - **Issue:** Technical jargon. Users don't know what PQC means.
    - **Fix:** "End-to-end encrypted. Ready to transfer." (or keep PQC but add tooltip)

26. **Code display could be more prominent** (LOW)
    - **Issue:** Connection code is shown but could be larger/more scannable for read-aloud sharing.

---

## Summary

| Category | Issues | Critical |
|----------|--------|----------|
| Accessibility | 4 | 0 |
| Loading/States | 3 | 0 |
| Error States | 3 | 1 (verification UX) |
| Interactions | 3 | 0 |
| Performance UX | 3 | 0 |
| Onboarding | 2 | 0 |
| Positives | 4 | - |

**Most Urgent UX Issue:** The verification gate bug (#11) makes first-time transfers impossible from the user's perspective. They verify, then get told to verify again.

---

*UI/UX review: 2026-01-23*
