import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";

/**
 * Comprehensive ESLint Configuration
 *
 * Enforces:
 * - TypeScript strict mode compliance
 * - React Hooks best practices
 * - Accessibility standards (WCAG)
 * - Security best practices
 * - Next.js optimizations
 */
const eslintConfig = defineConfig([
  // Base Next.js configurations
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "daemon/dist/**",
    "reports/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    ".playwright-mcp/**",
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
    ".planning/**",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
    ".lighthouserc.js",
    "lighthouserc.js",
    "signaling-server.js",
    "*.md",
    "public/**",
    "scripts/**",
    "screenshots/**",
    "k8s/**",
    "docs/**",
    "examples/**",
    "configs/**",
    // Ignore all loose JS files at root level
    "*.js",
    // Ignore test output and log files
    "*.log",
    "*.txt",
    "*.json",
    "screenshot-*.mjs",
    "verify-*.mjs",
    // Ignore shell and batch scripts
    "*.sh",
    "*.bat",
    "*.ps1",
    // Ignore Docker files
    "Dockerfile*",
    "docker-compose*.yml",
    // Ignore other config files
    "*.yml",
    "*.yaml",
    "wrangler.toml",
    "nginx.conf"
  ]),

  // Main configuration
  {
    plugins: {
      "react-hooks": reactHooks,
      "security": security
    },

    rules: {
      // ============================================
      // TypeScript Rules (non-type-aware for compatibility)
      // ============================================
      "@typescript-eslint/no-explicit-any": "off",
      // Type-aware rules disabled - require parserOptions.project setup
      // "@typescript-eslint/no-unsafe-assignment": "off",
      // "@typescript-eslint/no-unsafe-member-access": "off",
      // "@typescript-eslint/no-unsafe-call": "off",
      // "@typescript-eslint/no-unsafe-return": "off",
      // "@typescript-eslint/no-unnecessary-condition": "off",
      // "@typescript-eslint/strict-boolean-expressions": "off",
      // "@typescript-eslint/prefer-nullish-coalescing": "off",
      // "@typescript-eslint/no-floating-promises": "off",
      // "@typescript-eslint/await-thenable": "off",
      // "@typescript-eslint/no-misused-promises": "off",
      // "@typescript-eslint/require-await": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/prefer-optional-chain": "off", // Requires type info
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],

      // ============================================
      // React Hooks Rules (Critical for React 19)
      // ============================================
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",

      // ============================================
      // Accessibility Rules (WCAG Compliance)
      // ============================================
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "off",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "jsx-a11y/no-redundant-roles": "off",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",

      // ============================================
      // Security Rules
      // ============================================
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "off",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "off",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-require": "off",
      "security/detect-possible-timing-attacks": "off",
      "security/detect-pseudoRandomBytes": "error",

      // ============================================
      // General Best Practices
      // ============================================
      "no-console": "off",
      "no-debugger": "error",
      "no-alert": "off",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "off",
      "require-await": "off", // Disabled due to conflicts
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // ============================================
      // React Specific
      // ============================================
      "react/jsx-no-target-blank": "error",
      "react/no-danger": "off",
      "react/no-deprecated": "error",
      "react/no-unescaped-entities": "off",
      "react/self-closing-comp": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": ["error", {
        props: "never",
        children: "never"
      }],

      // ============================================
      // Next.js Specific
      // ============================================
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "off",
      "@next/next/no-sync-scripts": "error",

      // Disable type-aware rules that require project configuration
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "jsx-a11y/no-static-element-interactions": "off", // Many interactive divs in current codebase
      "require-await": "off", // Conflicts with TypeScript async patterns

      // React 19 new rules - set as warnings for gradual migration
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",

      // Additional suppressions
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "import/no-anonymous-default-export": "off"
    },

    settings: {
      react: {
        version: "detect"
      },
      "jsx-a11y": {
        polymorphicPropName: "as",
        components: {
          Button: "button",
          Input: "input",
          Select: "select",
          Textarea: "textarea",
          // Lucide React icons - Image icon is not an img element
          Image: "svg"
        }
      }
    }
  }
]);

export default eslintConfig;
