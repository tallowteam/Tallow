# Vercel Component Examples

> Ready-to-use component code based on Vercel's design system

---

## Quick Reference Components

### 1. Hero Section

```html
<section class="hero">
  <div class="hero-content">
    <h1 class="hero-title">Build and deploy on the AI Cloud.</h1>
    <p class="hero-description">
      Vercel provides the developer tools and cloud infrastructure to build,
      scale, and secure a faster, more personalized web.
    </p>
    <div class="hero-actions">
      <a href="#" class="btn btn-primary">
        Start Deploying
      </a>
      <a href="#" class="btn btn-secondary">
        Get a Demo
      </a>
    </div>
  </div>
</section>
```

```css
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background: linear-gradient(to bottom, #08090a 0%, #0f1011 100%);
}

.hero-content {
  max-width: 800px;
  text-align: center;
}

.hero-title {
  font-family: "Inter Variable", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 510;
  line-height: 1.06;
  letter-spacing: -0.022em;
  color: #f7f8f8;
  margin-bottom: 24px;
}

.hero-description {
  font-size: clamp(15px, 2vw, 17px);
  line-height: 1.6;
  color: #8a8f98;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
```

---

### 2. Button System

```html
<!-- Primary Button -->
<button class="btn btn-primary">
  <span>Start Deploying</span>
  <svg><!-- Arrow Icon --></svg>
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">
  Get a Demo
</button>

<!-- Ghost Button -->
<button class="btn btn-ghost">
  Learn More
</button>
```

```css
/* Base Button Styles */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: "Inter Variable", -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 510;
  line-height: 1;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
}

/* Primary Button */
.btn-primary {
  background-color: #5e6ad2;
  color: #ffffff;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background-color: #828fff;
  box-shadow: 0px 4px 12px rgba(94, 106, 210, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: #f7f8f8;
  border: 2px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: #8a8f98;
}

.btn-ghost:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f7f8f8;
}

/* Button Focus State */
.btn:focus-visible {
  outline: 2px solid #5e6ad2;
  outline-offset: 2px;
}

/* Button Disabled State */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### 3. Card Components

```html
<!-- Feature Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">AI Apps</h3>
  </div>
  <div class="card-content">
    <p class="card-description">
      Enrich any product or feature with the latest models and tools.
    </p>
  </div>
  <div class="card-footer">
    <a href="#" class="card-link">
      Learn more
      <svg><!-- Arrow --></svg>
    </a>
  </div>
</div>

<!-- Glass Card -->
<div class="card-glass">
  <span class="badge">New</span>
  <p>Latest Feature</p>
</div>
```

```css
/* Standard Card */
.card {
  background-color: #141516;
  border-radius: 30px;
  padding: 32px;
  transition: background-color 0.2s ease-out;
  border: 1px solid transparent;
}

.card:hover {
  background-color: #191a1b;
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  font-size: 21px;
  font-weight: 510;
  line-height: 1.33;
  letter-spacing: -0.012em;
  color: #f7f8f8;
  margin: 0;
}

.card-content {
  margin-bottom: 24px;
}

.card-description {
  font-size: 15px;
  line-height: 1.6;
  color: #8a8f98;
  margin: 0;
}

.card-footer {
  margin-top: auto;
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 510;
  color: #828fff;
  text-decoration: none;
  transition: color 0.2s ease-out;
}

.card-link:hover {
  color: #ffffff;
}

/* Glass Card */
.card-glass {
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  padding: 12px 24px;
  backdrop-filter: blur(8px);
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  background-color: #5e6ad2;
  color: #ffffff;
  font-size: 12px;
  font-weight: 510;
}
```

---

### 4. Header/Navigation

```html
<header class="header">
  <div class="header-container">
    <div class="header-logo">
      <a href="/">
        <svg class="logo"><!-- Vercel Logo --></svg>
      </a>
    </div>

    <nav class="header-nav">
      <a href="#" class="nav-link">Products</a>
      <a href="#" class="nav-link">Resources</a>
      <a href="#" class="nav-link">Company</a>
      <a href="#" class="nav-link">Pricing</a>
    </nav>

    <div class="header-actions">
      <button class="btn btn-ghost">Sign In</button>
      <button class="btn btn-primary">Sign Up</button>
    </div>
  </div>
</header>
```

```css
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 11, 11, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  height: 64px;
}

.header-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo svg {
  height: 24px;
  width: auto;
}

.header-nav {
  display: flex;
  gap: 32px;
  align-items: center;
}

.nav-link {
  font-size: 13px;
  font-weight: 510;
  color: #8a8f98;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.nav-link:hover {
  color: #f7f8f8;
  background: rgba(255, 255, 255, 0.05);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }
}
```

---

### 5. Feature Grid

```html
<section class="features">
  <div class="features-header">
    <h2 class="section-title">Your product, delivered.</h2>
    <p class="section-description">
      Security, speed, and AI included, so you can focus on your user.
    </p>
  </div>

  <div class="features-grid">
    <div class="feature-item">
      <div class="feature-icon">
        <svg><!-- Icon --></svg>
      </div>
      <h3 class="feature-title">Agents</h3>
      <p class="feature-description">
        Deliver more value to users by executing complex workflows.
      </p>
      <a href="#" class="feature-link">
        Learn more
        <svg><!-- Arrow --></svg>
      </a>
    </div>

    <!-- Repeat feature-item -->
  </div>
</section>
```

```css
.features {
  padding: 120px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.features-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-title {
  font-size: clamp(40px, 4vw, 56px);
  font-weight: 538;
  line-height: 1.1;
  letter-spacing: -0.0325em;
  color: #f7f8f8;
  margin-bottom: 16px;
}

.section-description {
  font-size: 17px;
  line-height: 1.6;
  color: #8a8f98;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-item {
  background-color: #141516;
  border-radius: 24px;
  padding: 40px 32px;
  transition: background-color 0.2s ease-out;
}

.feature-item:hover {
  background-color: #191a1b;
}

.feature-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 24px;
  color: #5e6ad2;
}

.feature-title {
  font-size: 21px;
  font-weight: 510;
  line-height: 1.33;
  letter-spacing: -0.012em;
  color: #f7f8f8;
  margin-bottom: 12px;
}

.feature-description {
  font-size: 15px;
  line-height: 1.6;
  color: #8a8f98;
  margin-bottom: 24px;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 510;
  color: #828fff;
  text-decoration: none;
  transition: color 0.2s ease-out;
}

.feature-link:hover {
  color: #ffffff;
}
```

---

### 6. Footer

```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-section">
        <h3 class="footer-heading">Products</h3>
        <ul class="footer-links">
          <li><a href="#">AI</a></li>
          <li><a href="#">Enterprise</a></li>
          <li><a href="#">Next.js</a></li>
          <li><a href="#">Previews</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3 class="footer-heading">Resources</h3>
        <ul class="footer-links">
          <li><a href="#">Docs</a></li>
          <li><a href="#">Templates</a></li>
          <li><a href="#">Help</a></li>
          <li><a href="#">Community</a></li>
        </ul>
      </div>

      <!-- More sections -->
    </div>

    <div class="footer-bottom">
      <div class="footer-logo">
        <svg><!-- Logo --></svg>
      </div>

      <div class="theme-selector">
        <button class="theme-btn" data-theme="system">System</button>
        <button class="theme-btn" data-theme="light">Light</button>
        <button class="theme-btn active" data-theme="dark">Dark</button>
      </div>
    </div>
  </div>
</footer>
```

```css
.footer {
  background-color: #08090a;
  border-top: 1px solid #23252a;
  padding: 80px 24px 40px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 48px;
  margin-bottom: 64px;
}

.footer-heading {
  font-size: 13px;
  font-weight: 510;
  color: #f7f8f8;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  font-size: 14px;
  color: #8a8f98;
  text-decoration: none;
  transition: color 0.2s ease-out;
}

.footer-links a:hover {
  color: #f7f8f8;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  border-top: 1px solid #23252a;
}

.theme-selector {
  display: flex;
  gap: 8px;
  background-color: #141516;
  padding: 4px;
  border-radius: 8px;
}

.theme-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #8a8f98;
  font-size: 13px;
  font-weight: 510;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.theme-btn:hover {
  color: #f7f8f8;
}

.theme-btn.active {
  background-color: #5e6ad2;
  color: #ffffff;
}
```

---

### 7. Code Block

```html
<div class="code-block">
  <div class="code-header">
    <div class="code-tabs">
      <button class="code-tab active">AI SDK</button>
      <button class="code-tab">Python</button>
      <button class="code-tab">OpenAI HTTP</button>
    </div>
    <button class="code-copy">
      <svg><!-- Copy Icon --></svg>
      Copy code
    </button>
  </div>
  <div class="code-content">
    <pre><code class="language-javascript">import { streamText } from 'ai'

const result = streamText({
  model: 'openai/gpt-5.2',
  prompt: 'Why is the sky blue?'
})</code></pre>
  </div>
</div>
```

```css
.code-block {
  background-color: #08090a;
  border: 1px solid #23252a;
  border-radius: 12px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #0f1011;
  border-bottom: 1px solid #23252a;
}

.code-tabs {
  display: flex;
  gap: 8px;
}

.code-tab {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #8a8f98;
  font-size: 13px;
  font-weight: 510;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.code-tab:hover {
  color: #f7f8f8;
  background-color: rgba(255, 255, 255, 0.05);
}

.code-tab.active {
  color: #f7f8f8;
  background-color: #141516;
}

.code-copy {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #8a8f98;
  font-size: 13px;
  font-weight: 510;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.code-copy:hover {
  color: #f7f8f8;
  background-color: rgba(255, 255, 255, 0.05);
}

.code-content {
  padding: 24px;
  overflow-x: auto;
}

.code-content pre {
  margin: 0;
  font-family: "Berkeley Mono", ui-monospace, "SF Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #d0d6e0;
}

.code-content code {
  font-family: inherit;
}
```

---

### 8. Status Badge

```html
<div class="status-badge status-success">All systems operational</div>
<div class="status-badge status-warning">Degraded performance</div>
<div class="status-badge status-error">System outage</div>
```

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 510;
  border: 1px solid;
}

.status-badge::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-success {
  background-color: rgba(76, 183, 130, 0.1);
  border-color: rgba(76, 183, 130, 0.3);
  color: #4cb782;
}

.status-success::before {
  background-color: #4cb782;
}

.status-warning {
  background-color: rgba(242, 201, 76, 0.1);
  border-color: rgba(242, 201, 76, 0.3);
  color: #f2c94c;
}

.status-warning::before {
  background-color: #f2c94c;
}

.status-error {
  background-color: rgba(235, 87, 87, 0.1);
  border-color: rgba(235, 87, 87, 0.3);
  color: #eb5757;
}

.status-error::before {
  background-color: #eb5757;
}
```

---

### 9. Loading States

```html
<!-- Skeleton Loader -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-card"></div>

<!-- Spinner -->
<div class="spinner"></div>
```

```css
/* Skeleton Loader */
.skeleton {
  background: linear-gradient(
    90deg,
    #141516 0%,
    #191a1b 50%,
    #141516 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
}

.skeleton-text {
  height: 16px;
  width: 100%;
}

.skeleton-card {
  height: 200px;
  width: 100%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #5e6ad2;
  border-radius: 50%;
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

---

### 10. Tooltip

```html
<div class="tooltip-container">
  <button class="btn btn-ghost">Hover me</button>
  <div class="tooltip">This is a helpful tooltip</div>
</div>
```

```css
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background-color: #1c1c1f;
  border: 1px solid #23252a;
  border-radius: 8px;
  font-size: 13px;
  color: #f7f8f8;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-out;
  z-index: 1100;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1c1c1f;
}

.tooltip-container:hover .tooltip {
  opacity: 1;
}
```

---

## Utility Classes

```css
/* Spacing Utilities */
.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }
.mt-4 { margin-top: 32px; }
.mt-5 { margin-top: 48px; }

/* Text Utilities */
.text-primary { color: #f7f8f8; }
.text-secondary { color: #d0d6e0; }
.text-tertiary { color: #8a8f98; }

.text-sm { font-size: 14px; }
.text-base { font-size: 15px; }
.text-lg { font-size: 17px; }
.text-xl { font-size: 21px; }

.font-medium { font-weight: 510; }
.font-semibold { font-weight: 590; }

/* Layout Utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-2 { gap: 16px; }
.gap-4 { gap: 32px; }

/* Visibility */
.hidden { display: none; }

@media (max-width: 768px) {
  .md\:hidden { display: none; }
}

@media (min-width: 769px) {
  .md\:block { display: block; }
}
```

---

## JavaScript Examples

### Theme Switcher

```javascript
// Theme switching functionality
const themeBtns = document.querySelectorAll('.theme-btn');
const html = document.documentElement;

// Get saved theme or default to system
const savedTheme = localStorage.getItem('theme') || 'system';
setTheme(savedTheme);

themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    setTheme(theme);
    localStorage.setItem('theme', theme);
  });
});

function setTheme(theme) {
  // Remove active class from all buttons
  themeBtns.forEach(b => b.classList.remove('active'));

  // Add active class to current theme button
  const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Apply theme
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', theme);
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'system' || !currentTheme) {
    html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
```

### Smooth Scroll

```javascript
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
```

### Copy Code Button

```javascript
const copyButtons = document.querySelectorAll('.code-copy');

copyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const codeBlock = btn.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;

    try {
      await navigator.clipboard.writeText(code);

      // Update button text safely
      const originalContent = btn.textContent;
      btn.textContent = 'Copied!';

      setTimeout(() => {
        btn.textContent = originalContent;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
});
```

---

## Animation Examples

### Fade In on Scroll

```css
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});
```

---

**Document Version**: 1.0
**Last Updated**: February 3, 2026
**Companion to**: VERCEL_DESIGN_SYSTEM_SPECIFICATION.md
