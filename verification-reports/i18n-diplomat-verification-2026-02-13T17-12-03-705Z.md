# I18N Diplomat Verification

Generated: 2026-02-13T17:12:03.702Z

## Checks
- [PASS] i18n policy, runtime modules, and workflows exist
- [PASS] Locale inventory and runtime language registry cover 22 locales
- [PASS] RTL locales and document direction controls are enforced
- [PASS] Locale formatting routes through Intl-aware helpers
- [PASS] Missing-translation detection utilities remain available
- [PASS] i18n diplomat gate is wired in package scripts and workflows

### i18n policy, runtime modules, and workflows exist
- all required i18n diplomat files are present

### Locale inventory and runtime language registry cover 22 locales
- locale imports in index.ts: 22
- locale type values in types.ts: 22
- runtime registry derives from LOCALE_CODES with full LocaleCode coverage

### RTL locales and document direction controls are enforced
- Arabic and Hebrew RTL handling plus document dir/lang switching verified

### Locale formatting routes through Intl-aware helpers
- number/date/time/relative/currency/list formatting helpers are present and Intl-backed

### Missing-translation detection utilities remain available
- translation missing/extra detection and reporting helpers are present

### i18n diplomat gate is wired in package scripts and workflows
- verify:i18n:diplomat: node scripts/verify-i18n-diplomat.js
- .github/workflows/ci.yml runs i18n diplomat verification
- .github/workflows/release.yml runs i18n diplomat verification

## Summary
- Overall: PASS

