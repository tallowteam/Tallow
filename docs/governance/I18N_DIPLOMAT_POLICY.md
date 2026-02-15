# I18N Diplomat Policy (AGENT 057)

## Objective
Maintain multilingual and locale-aware transfer UX controls with RTL and formatting discipline.

## Required Controls
1. Locale inventory:
- 22 locale modules MUST remain present under `lib/i18n/locales`.
- Runtime language registry MUST expose all supported locales.

2. RTL support:
- Arabic and Hebrew MUST be treated as RTL locales.
- Direction updates MUST set document `dir` and locale attributes.

3. Locale formatting:
- Number/date/time/relative/currency/list formatting MUST route through `Intl` helpers.

4. Missing-translation detection:
- Translation-missing detection utilities MUST exist and remain callable in development flows.

5. Release gate:
- `npm run verify:i18n:diplomat` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/i18n/i18n.ts`
- `lib/i18n/locales/index.ts`
- `lib/i18n/types.ts`
- `lib/i18n/rtl-support.ts`
- `lib/i18n/locale-formatting.ts`
- `lib/i18n/missing-detection.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
