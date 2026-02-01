# Verification Checklist: PWA & i18n Implementation

Use this checklist to verify that all PWA and i18n features are working correctly.

## Pre-Deployment Verification

### PWA Features (Task #32)

#### 1. Manifest Configuration
- [ ] Open `/manifest.json` in browser
- [ ] Verify manifest is valid (use [Manifest Validator](https://manifest-validator.appspot.com/))
- [ ] Check that icons load correctly
- [ ] Verify theme colors match design
- [ ] Test app shortcuts (if browser supports)

#### 2. Service Worker
- [ ] Open Chrome DevTools → Application → Service Workers
- [ ] Verify service worker is registered
- [ ] Check that service worker is active
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] Verify cached assets (Application → Cache Storage)
- [ ] Test cache updates on new deployment

#### 3. Install Prompt
- [ ] Wait 30 seconds on first visit
- [ ] Verify install prompt appears
- [ ] Test dismiss functionality
- [ ] Verify prompt respects 7-day dismissal
- [ ] Test install flow on desktop
- [ ] Test install flow on mobile

#### 4. Offline Page
- [ ] Disable network in DevTools
- [ ] Navigate to uncached page
- [ ] Verify offline page displays
- [ ] Test retry button
- [ ] Check connection status indicator
- [ ] Verify offline features list

#### 5. Push Notifications
- [ ] Request notification permission
- [ ] Verify permission prompt appears
- [ ] Test notification display
- [ ] Check notification icon
- [ ] Test notification click action
- [ ] Verify notification actions work

#### 6. PWA Hook (`usePWA`)
- [ ] Test `isInstalled` state
- [ ] Test `isStandalone` state
- [ ] Test `canInstall` state
- [ ] Test `isOnline` state
- [ ] Test `needsUpdate` state
- [ ] Test `install()` function
- [ ] Test `update()` function

#### 7. Installation Testing

**Desktop (Chrome/Edge)**
- [ ] Install app from browser
- [ ] Launch installed app
- [ ] Verify standalone mode
- [ ] Test app shortcuts
- [ ] Uninstall and reinstall

**iOS (Safari)**
- [ ] View install instructions
- [ ] Add to home screen
- [ ] Launch from home screen
- [ ] Verify standalone mode

**Android (Chrome)**
- [ ] See install banner
- [ ] Install app
- [ ] Launch from home screen
- [ ] Verify standalone mode

### i18n Features (Task #33)

#### 1. Language Files
- [ ] Verify all 22 language files exist
- [ ] Check Hebrew (he.json) has all keys
- [ ] Compare with English (en.json) structure
- [ ] Verify no missing translations
- [ ] Test JSON syntax validity

#### 2. Language Switching
- [ ] Open language selector
- [ ] Switch to each language
- [ ] Verify UI updates immediately
- [ ] Check localStorage saves choice
- [ ] Reload and verify language persists
- [ ] Test loading state

#### 3. RTL Support

**Arabic (ar)**
- [ ] Switch to Arabic
- [ ] Verify `dir="rtl"` on html element
- [ ] Check text alignment (right)
- [ ] Verify menu order reversed
- [ ] Check spacing (margins/padding)
- [ ] Test form inputs
- [ ] Verify icon flipping

**Hebrew (he)**
- [ ] Switch to Hebrew
- [ ] Verify `dir="rtl"` on html element
- [ ] Check text alignment (right)
- [ ] Verify menu order reversed
- [ ] Check spacing (margins/padding)
- [ ] Test form inputs
- [ ] Verify icon flipping

**Urdu (ur)**
- [ ] Switch to Urdu
- [ ] Verify `dir="rtl"` on html element
- [ ] Check text alignment (right)
- [ ] Verify menu order reversed
- [ ] Check spacing (margins/padding)
- [ ] Test form inputs
- [ ] Verify icon flipping

#### 4. Locale Formatting

For each major language (en, es, de, fr, ar, he, zh):

**Date Formatting**
- [ ] Test `formatDate()`
- [ ] Verify locale-specific format
- [ ] Check month names
- [ ] Test day/month/year order

**Time Formatting**
- [ ] Test `formatTime()`
- [ ] Verify 12/24 hour format
- [ ] Check AM/PM (if applicable)

**Number Formatting**
- [ ] Test `formatNumber()`
- [ ] Verify thousands separator
- [ ] Check decimal separator
- [ ] Test negative numbers

**Currency Formatting**
- [ ] Test `formatCurrency()`
- [ ] Verify currency symbol position
- [ ] Check decimal places
- [ ] Test different currencies (USD, EUR, JPY)

**File Size Formatting**
- [ ] Test `formatFileSize()`
- [ ] Verify number format
- [ ] Check unit labels (KB, MB, GB)

**Percent Formatting**
- [ ] Test `formatPercent()`
- [ ] Verify percent symbol
- [ ] Check decimal places

#### 5. Translation Keys
- [ ] Test navigation translations
- [ ] Test hero section translations
- [ ] Test app UI translations
- [ ] Test settings translations
- [ ] Test error messages
- [ ] Test donate section
- [ ] Verify fallback to English works

#### 6. Language Context
- [ ] Test `useLanguage()` hook
- [ ] Verify `language` state
- [ ] Test `setLanguage()` function
- [ ] Verify `t()` translation function
- [ ] Check `currentLanguage` object
- [ ] Test `isRTL` flag
- [ ] Verify `isLoading` state

## Testing Tools

### Browser DevTools
```
Chrome DevTools → Application → Service Workers
Chrome DevTools → Application → Manifest
Chrome DevTools → Application → Cache Storage
Chrome DevTools → Network → Offline checkbox
Chrome DevTools → Lighthouse → PWA audit
```

### Test Panel Component
Add to your app for testing:
```tsx
import { PWAi18nTestPanel } from '@/components/app/pwa-i18n-test-panel';

<PWAi18nTestPanel />
```

### Automated Tests
```bash
# Run Lighthouse PWA audit
npm run lighthouse

# Test all languages
npm run test:i18n

# Test service worker
npm run test:sw
```

## Performance Checks

### PWA Performance
- [ ] Initial load < 3 seconds
- [ ] Cached load < 1 second
- [ ] Offline page loads < 500ms
- [ ] Service worker registers < 1 second
- [ ] Install prompt shows within 30 seconds

### i18n Performance
- [ ] Language switch < 500ms
- [ ] Translation loading < 200ms
- [ ] RTL switch < 100ms
- [ ] No FOUC (Flash of Unstyled Content)

## Accessibility Checks

### PWA Accessibility
- [ ] Install prompt has ARIA labels
- [ ] Offline page is keyboard navigable
- [ ] Focus management in install prompt
- [ ] Screen reader announces status

### i18n Accessibility
- [ ] `lang` attribute updates on language change
- [ ] `dir` attribute updates for RTL
- [ ] Language selector is keyboard navigable
- [ ] Screen reader announces language change
- [ ] ARIA labels are translated

## Browser Compatibility

### PWA
- [ ] Chrome 90+ (Windows/Mac/Linux)
- [ ] Edge 90+ (Windows)
- [ ] Safari iOS 11.3+ (Limited)
- [ ] Chrome Android 90+

### i18n
- [ ] Chrome (all platforms)
- [ ] Firefox (all platforms)
- [ ] Safari (all platforms)
- [ ] Edge (all platforms)

## Lighthouse Audit

Run Lighthouse audit and verify:
- [ ] PWA score ≥ 90
- [ ] Performance score ≥ 90
- [ ] Accessibility score ≥ 90
- [ ] Best Practices score ≥ 90
- [ ] SEO score ≥ 90

### PWA Specific
- [ ] Registers a service worker
- [ ] Web app manifest meets requirements
- [ ] Has a <meta name="viewport"> tag
- [ ] Content is sized correctly for viewport
- [ ] Has a <meta name="theme-color"> tag
- [ ] Provides a valid apple-touch-icon
- [ ] Configured for a custom splash screen
- [ ] Sets an address-bar theme color
- [ ] Page load is fast on mobile networks
- [ ] Current page responds with a 200 when offline

## Production Checklist

### Before Deployment
- [ ] All verification items above passed
- [ ] Service worker cache version incremented
- [ ] All translation files committed
- [ ] Documentation reviewed
- [ ] Test on real devices
- [ ] Review console for errors
- [ ] Check bundle size impact

### After Deployment
- [ ] Verify service worker registers in production
- [ ] Test installation on live site
- [ ] Verify offline functionality
- [ ] Check all languages load
- [ ] Monitor error rates
- [ ] Check analytics for PWA installs
- [ ] Verify push notifications work

## Troubleshooting

### Service Worker Not Registering
1. Check HTTPS is enabled
2. Verify `/sw.js` is accessible
3. Check browser console for errors
4. Clear browser cache and retry

### Install Prompt Not Showing
1. Verify manifest.json is valid
2. Check PWA criteria met
3. Ensure user hasn't dismissed recently
4. Test on supported browser

### RTL Not Working
1. Check `dir` attribute on html element
2. Verify RTL CSS is loaded
3. Test with browser DevTools
4. Check language has `rtl: true` flag

### Translations Not Loading
1. Verify translation file exists
2. Check JSON syntax
3. Check browser console for import errors
4. Verify language code matches filename

## Sign-off

After completing all checks:

- [ ] PWA features verified ✅
- [ ] i18n features verified ✅
- [ ] All tests passed ✅
- [ ] Documentation complete ✅
- [ ] Ready for production ✅

**Verified by**: _________________
**Date**: _________________
**Notes**: _________________
