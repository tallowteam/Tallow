---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/e2e/landing.spec.ts
  - tests/e2e/app.spec.ts
  - tests/e2e/history.spec.ts
autonomous: true
must_haves:
  truths:
    - "All 87 Playwright tests pass (0 failures)"
    - "Visual regression baselines exist for win32 platform"
    - "No test.skip calls remain in the test suite"
  artifacts:
    - path: "tests/e2e/landing.spec.ts"
      provides: "Fixed landing page selectors matching actual UI text/structure"
    - path: "tests/e2e/app.spec.ts"
      provides: "Fixed app page selectors matching actual file-selector component"
    - path: "tests/e2e/history.spec.ts"
      provides: "Fixed history page empty state selector"
    - path: "tests/e2e/visual/screenshots.spec.ts.snapshots/"
      provides: "Baseline screenshot PNGs for win32"
  key_links:
    - from: "tests/e2e/landing.spec.ts"
      to: "app/page.tsx + lib/i18n/translations/en.json"
      via: "Selectors match actual rendered i18n text"
      pattern: "Share Files|Get Started|AES-256|E2E Encrypted"
    - from: "tests/e2e/app.spec.ts"
      to: "components/transfer/file-selector.tsx"
      via: "Selectors match actual file selector UI text"
      pattern: "Select Files|Drop files"
    - from: "tests/e2e/history.spec.ts"
      to: "app/app/history/page.tsx"
      via: "Selector matches actual empty state text"
      pattern: "No Transfer History"
---

<objective>
Fix all 36 failing Playwright tests by updating selectors in functional tests to match the actual UI text (from i18n translations and component render output), then generate visual regression baseline snapshots for win32.

Purpose: Get the full test suite green so CI can gate on test status.
Output: All tests passing, baseline screenshots generated.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Key files the executor needs to understand what the UI actually renders:

@app/page.tsx (landing page - uses i18n keys, has h1, footer, SiteNav, features with .card-feature, security tags)
@components/site-nav.tsx (nav - has links to /features and /how-it-works, CTA "Get Started" hidden on mobile with sm:block)
@components/transfer/file-selector.tsx (file selector - shows "Select Files" / "Drop files here or click to browse" via i18n)
@app/app/page.tsx (app page - has Send/Receive tabs, connection type cards with "Local Network"/"Internet P2P"/"Friends")
@app/app/history/page.tsx (history page - empty state shows "No Transfer History" heading and "Your transfer history will appear here")
@lib/i18n/translations/en.json (all English translation values)
@tests/e2e/visual/screenshots.spec.ts (visual regression tests needing baseline snapshots)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix functional test selectors to match actual UI</name>
  <files>
    tests/e2e/landing.spec.ts
    tests/e2e/app.spec.ts
    tests/e2e/history.spec.ts
  </files>
  <action>
Fix each failing selector based on what the UI actually renders:

**landing.spec.ts:**

1. "renders hero section with headline and CTA" (line 8-11):
   - `page.locator('h1')` is correct (h1 exists in hero section)
   - `page.getByRole('link', { name: /get started/i })` - The CTA is a Button inside a Link. On desktop this works but it's `.first()` needed since there are multiple "Get Started" links (nav + final CTA). Fix: use `.first()`.
   - Actually the real issue per failure message is: "heading with /fast|secure|simple|easy|transfer|share/i not found". The test originally checked for heading text content but the current test code just checks `page.locator('h1')`. Read the ACTUAL test file content that's running. The failures show the regex pattern, so the test likely has a `toHaveText` or `toContainText` check. Fix: the h1 contains "Share Files Without Limitation" from i18n. Update any text-matching regex to `/share|without|limitation/i`.

2. "renders navigation" (line 13-17):
   - `page.getByRole('link', { name: /features/i })` resolves to 2 elements (nav link + footer link). Fix: scope to `page.locator('nav').getByRole('link', { name: /features/i })` to avoid strict mode violation.
   - Same for "how it works" - scope to nav.

3. "renders features section" (line 19-24):
   - `page.locator('.card-feature')` - these DO exist in the landing page (6 feature cards). The test expects `.toHaveCount(6)`. This should pass. If it fails, check if the test also looks for a heading with /feature/i - the section heading uses i18n key "home.features.title" = "Everything You Need" which does NOT contain "feature". The eyebrow text is "Features". Fix: change heading selector to look for text matching /everything you need|features/i, or just check the eyebrow label text.

4. "renders security section with tags" (line 26-30):
   - Tests look for "zero knowledge", "AES-256", "e2e encrypted". Actual rendered text:
     - Section title: "Zero Knowledge. Always." (matches /zero knowledge/i)
     - Tags: "AES-256", "E2E Encrypted", "No Cloud Storage", "Open Source"
   - These should match. If failing, it may be a visibility/timing issue. Add `waitForSelector` or ensure section is scrolled into view. The security section uses class `section-dark` which may need scrollIntoView.

5. "renders connection types section" (line 32-35):
   - Looks for "local network" and "internet p2p" text. Actual rendered: "Local Network" and "Internet P2P" from i18n. Should pass.

6. "hero CTA navigates to app" (line 37-40):
   - Uses `getByRole('link', { name: /get started/i }).first().click()`. Should work since "Get Started" is the button text in both nav and hero CTA.
   - On MOBILE project (Pixel 5): the nav CTA has `className="hidden sm:block"` so it's NOT visible. The hero section CTA button also has text "Get Started". But the hero link is always visible. Fix: use `.first()` which should get the visible one. Actually the issue is getByRole may find hidden elements too. Fix for mobile: use `page.getByRole('link', { name: /get started/i }).filter({ has: page.locator(':visible') }).first()` or simply `page.locator('a:visible').filter({ hasText: /get started/i }).first()`.

7. "renders footer with links" (line 42-45):
   - `page.locator('footer')` should work - there IS a `<footer>` element.
   - `page.getByText(/open source/i)` - footer tagline is "Open source . Privacy first" which should match.
   - If contentinfo role is expected: the `<footer>` element implicitly has role contentinfo.

**app.spec.ts:**

1. "shows file selection area in send mode" (line 22-31):
   - Looks for `getByText(/select files|drop files/i)`. The FileSelector component renders:
     - h3: `{isDragging ? t('app.dropFiles') : t('app.selectFiles')}` = "Select Files" or "Drop files here or click to browse"
     - p: `{t('app.dropFiles')}` = "Drop files here or click to browse"
   - BUT the FileSelector only renders when `connectionType` is set (after clicking Local/Internet/Friends). The test only clicks "send" but doesn't select a connection type. Fix: After clicking send, also click a connection type card (e.g. click on "Local Network" or "Internet P2P" text), THEN check for file selector text. OR - make the regex broader. The simplest fix: click a connection type first. Use `page.getByText(/local network/i).first().click()` before checking for file selector.

**history.spec.ts:**

1. "shows empty state when no transfers" (line 12-16):
   - Looks for `/no (files|transfers|history)|empty/i`. Actual empty state heading: "No Transfer History" and text: "Your transfer history will appear here".
   - "No Transfer History" does NOT match the regex `/no (files|transfers|history)|empty/i` because it's "No Transfer History" (with "Transfer" between "No" and "History").
   - Fix: update regex to `/no transfer history|no (files|transfers|history)|empty|will appear here/i`.

**General approach:** For each fix, ensure the selector matches what the actual component renders using the English i18n translations. Use `.first()` where multiple elements may match. Scope to parent containers where strict mode violations occur.
  </action>
  <verify>
Run: `npx playwright test tests/e2e/landing.spec.ts tests/e2e/app.spec.ts tests/e2e/history.spec.ts --reporter=line 2>&1 | tail -20`
All functional tests in these 3 files should pass across chromium, firefox, and mobile projects.
  </verify>
  <done>All functional test assertions pass - selectors correctly target the actual rendered UI text and elements.</done>
</task>

<task type="auto">
  <name>Task 2: Generate visual regression baseline snapshots</name>
  <files>
    tests/e2e/visual/screenshots.spec.ts
  </files>
  <action>
After Task 1 functional tests pass, generate baseline snapshots for the visual regression tests.

Run: `npx playwright test tests/e2e/visual/screenshots.spec.ts --update-snapshots`

This will create baseline PNG files at the expected platform-specific paths (win32). The snapshots directory should be created at `tests/e2e/visual/screenshots.spec.ts-snapshots/` with filenames like:
- `landing-light-chromium-win32.png`
- `landing-dark-chromium-win32.png`
- `app-light-chromium-win32.png`
- `app-dark-chromium-win32.png`
- `landing-mobile-chromium-win32.png`
- `app-mobile-chromium-win32.png`
- (plus firefox and mobile project variants)

After generating, verify they exist and run the visual tests again WITHOUT --update-snapshots to confirm they pass.

If any visual tests still fail after snapshot generation (e.g., flaky rendering, animation timing), add `await page.waitForTimeout(500)` before the screenshot assertion to let animations settle, or add `animations: 'disabled'` to the screenshot options.
  </action>
  <verify>
Run: `npx playwright test tests/e2e/visual/ --reporter=line 2>&1 | tail -10`
All visual regression tests pass (snapshots match baselines).
  </verify>
  <done>Baseline snapshots exist for all 6 visual test cases across all 3 browser projects, and tests pass when run without --update-snapshots.</done>
</task>

<task type="auto">
  <name>Task 3: Full test suite verification</name>
  <files></files>
  <action>
Run the complete Playwright test suite to verify all 87 tests pass:

`npx playwright test --reporter=line`

If any tests still fail:
- Read the failure output carefully
- Fix remaining selector mismatches
- For timeout failures, increase the test timeout or add proper wait conditions
- For strict mode violations, add `.first()` or scope to parent container

Also verify no `test.skip` calls exist anywhere in the test files (grep for `test.skip` in tests/e2e/).

Final expected result: "87 passed" with 0 failures, 0 skipped.
  </action>
  <verify>
`npx playwright test --reporter=line 2>&1 | grep -E "passed|failed|skipped"`
Output should show all tests passed, 0 failed, 0 skipped.
  </verify>
  <done>Full Playwright test suite passes: 87 tests, 0 failures, 0 skipped across chromium, firefox, and mobile projects.</done>
</task>

</tasks>

<verification>
- `npx playwright test --reporter=line` exits with code 0
- No test failures in any of the 3 browser projects (chromium, firefox, mobile)
- Visual regression snapshot files exist in tests/e2e/visual/screenshots.spec.ts-snapshots/
- No `test.skip` calls in any test file
</verification>

<success_criteria>
- All 87 Playwright tests pass (0 failures, 0 skipped)
- Baseline screenshots generated and committed for win32 platform
- Test selectors accurately match the actual UI rendered text from i18n translations
</success_criteria>

<output>
After completion, create `.planning/quick/002-fix-all-playwright-tests/002-SUMMARY.md`
</output>
