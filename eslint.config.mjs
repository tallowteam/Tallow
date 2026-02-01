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
      "@typescript-eslint/no-explicit-any": "warn",
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
      "@typescript-eslint/no-non-null-assertion": "warn",
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
      "react-hooks/exhaustive-deps": "warn", // Many existing issues, fix gradually

      // ============================================
      // Accessibility Rules (WCAG Compliance)
      // ============================================
      "jsx-a11y/alt-text": "warn", // Some existing issues
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "warn", // Many existing issues
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "warn", // Some existing issues
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "warn", // Many existing issues
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-noninteractive-tabindex": "warn", // Some existing issues
      "jsx-a11y/no-redundant-roles": "warn", // Some existing issues
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",

      // ============================================
      // Security Rules
      // ============================================
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "warn", // Some patterns need review
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",

      // ============================================
      // General Best Practices
      // ============================================
      "no-console": ["warn", {
        allow: ["warn", "error", "info"]
      }],
      "no-debugger": "error",
      "no-alert": "warn", // Used in confirm dialogs in existing code
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "warn", // Many existing usages, fix gradually
      "require-await": "off", // Disabled due to conflicts
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // ============================================
      // React Specific
      // ============================================
      "react/jsx-no-target-blank": "error",
      "react/no-danger": "warn",
      "react/no-deprecated": "error",
      "react/no-unescaped-entities": "warn", // Many existing issues
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
      "@next/next/no-img-element": "warn", // Some legacy usages
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
      "react-hooks/refs": "warn", // New React 19 rule about refs during render
      "react-hooks/set-state-in-effect": "warn", // New React 19 rule about setState in effects
      "react-hooks/immutability": "warn", // New React 19 rule about accessing before declaration
      "react-hooks/purity": "warn", // New React 19 rule about impure functions during render
      "react-hooks/static-components": "warn", // New React 19 rule about creating components during render

      // Additional suppressions
      "@typescript-eslint/ban-ts-comment": "warn", // Some legitimate uses of ts-ignore
      "@typescript-eslint/no-require-imports": "warn", // Some dynamic requires needed
      "@next/next/no-assign-module-variable": "warn", // Used in security tests
      "@typescript-eslint/no-empty-object-type": "warn", // Some valid interface patterns
      "@typescript-eslint/no-unsafe-function-type": "warn" // Function type used in test mocks
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
