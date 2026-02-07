# Theme Toggle Testing Guide

## Quick Test

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Navigate to `http://localhost:3000`
   - Open DevTools Console

3. **Test Theme Toggle**
   - Click the Sun/Moon icon in the header
   - Verify background changes from black to white (or vice versa)
   - Check console for errors (there should be none)

4. **Test Persistence**
   - Toggle theme to light mode
   - Refresh the page (F5)
   - Verify theme is still light mode
   - Toggle back to dark mode
   - Open in new tab - should be dark mode

5. **Test System Preference**
   - Clear localStorage: `localStorage.removeItem('theme')`
   - Refresh page
   - Should match your OS theme preference

6. **Test FOUC Prevention**
   - Set theme to light mode
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Watch carefully - there should be NO flash of dark theme
   - Background should be white immediately

## Manual Testing Checklist

### Visual Tests
- [ ] Dark mode has black background (#000000)
- [ ] Light mode has white background (#ffffff)
- [ ] Text is readable in both modes
- [ ] Borders are visible in both modes
- [ ] All components adapt to theme change
- [ ] No visual glitches during transition

### Functional Tests
- [ ] Theme toggle button is visible
- [ ] Click toggles between dark/light
- [ ] Icon changes (Sun ↔ Moon)
- [ ] Theme persists on refresh
- [ ] Theme persists in new tabs
- [ ] localStorage is updated correctly
- [ ] data-theme attribute updates on HTML element

### Accessibility Tests
- [ ] Button has proper aria-label
- [ ] Icon is visible and recognizable
- [ ] Works with keyboard (Tab + Enter)
- [ ] Screen reader announces theme change
- [ ] Sufficient color contrast in both modes

### Browser Tests
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Edge Cases
- [ ] Private/Incognito mode (localStorage disabled)
- [ ] Multiple tabs changing theme simultaneously
- [ ] System preference changes while app is open
- [ ] JavaScript disabled (should default to CSS :root)

## Console Commands for Testing

Open DevTools Console and try these commands:

```javascript
// Check current theme
document.documentElement.getAttribute('data-theme')

// Check localStorage
localStorage.getItem('theme')

// Manually set theme
localStorage.setItem('theme', 'light')
location.reload()

// Clear theme
localStorage.removeItem('theme')
location.reload()

// Check system preference
window.matchMedia('(prefers-color-scheme: dark)').matches

// Watch for theme changes
const observer = new MutationObserver(() => {
  console.log('Theme changed to:', document.documentElement.getAttribute('data-theme'))
})
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
```

## Expected Behavior

### First Visit
1. Page loads
2. ThemeScript checks localStorage (empty)
3. Falls back to system preference
4. Sets data-theme attribute
5. CSS applies correct colors
6. React hydrates
7. ThemeProvider syncs with current theme

### Subsequent Visits
1. Page loads
2. ThemeScript checks localStorage (found: "dark" or "light")
3. Sets data-theme attribute immediately
4. CSS applies correct colors
5. React hydrates
6. ThemeProvider syncs with saved theme

### Theme Toggle
1. User clicks button
2. toggleTheme() called
3. State updates (dark → light or light → dark)
4. useEffect triggers:
   - localStorage.setItem('theme', newTheme)
   - document.documentElement.setAttribute('data-theme', newTheme)
5. CSS variables change
6. UI updates instantly

## Debugging

### Theme not persisting?
- Check if localStorage is enabled
- Check browser console for errors
- Verify localStorage.getItem('theme') returns correct value

### Flash of wrong theme?
- Verify ThemeScript is in <head> tag
- Check if suppressHydrationWarning is on <html> tag
- Ensure script runs before React hydration

### Theme toggle not working?
- Check if useTheme hook is inside ThemeProvider
- Verify toggleTheme function is called
- Check browser console for errors

### Icons not showing?
- Verify Sun and Moon components exist in icons.tsx
- Check if mounted state is used to prevent hydration mismatch
- Look for CSS hiding the icons

## Performance Testing

### Lighthouse
- Run Lighthouse audit
- Check for:
  - No layout shift (CLS = 0)
  - Fast first paint
  - No blocking scripts

### Network Tab
- ThemeScript should be inline (no network request)
- No flash of unstyled content
- Instant theme switching (no delay)

### Memory
- Toggle theme 100 times
- Check for memory leaks in DevTools Memory tab
- Should be stable, no increasing memory usage

## Success Criteria

✅ Theme toggles instantly on click
✅ No flash of wrong theme on page load
✅ Theme persists across refreshes
✅ Theme persists across tabs/windows
✅ Respects system preference on first visit
✅ Works in all modern browsers
✅ Accessible with keyboard and screen readers
✅ No console errors or warnings
✅ Smooth visual transition
✅ TypeScript compiles without errors

## Common Issues

### Issue: Flash of dark theme in light mode
**Solution**: Ensure ThemeScript is in <head> before any CSS

### Issue: Theme not persisting
**Solution**: Check localStorage is enabled and not blocked

### Issue: Hydration mismatch
**Solution**: Use suppressHydrationWarning on <html> tag

### Issue: Icons not changing
**Solution**: Ensure mounted state prevents SSR/client mismatch

### Issue: Multiple theme toggles slow
**Solution**: Debounce or throttle toggle function if needed
