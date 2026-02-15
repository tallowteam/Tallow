// This script runs before React hydration to prevent flash of incorrect theme
// The inline script is safe as it contains only static code with no user input
export function ThemeScript() {
  const script = `
    (function() {
      function getTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (
          savedTheme === 'dark' ||
          savedTheme === 'light' ||
          savedTheme === 'forest' ||
          savedTheme === 'ocean' ||
          savedTheme === 'high-contrast' ||
          savedTheme === 'colorblind'
        ) {
          return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        // Default is light — Tallow 3.0 warm cream theme
      }

      const theme = getTheme();
      document.documentElement.setAttribute('data-theme', theme);
    })();
  `;

  return (
    <script suppressHydrationWarning>{script}</script>
  );
}
