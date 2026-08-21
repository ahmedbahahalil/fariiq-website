// ESLint flat config for the static marketing site.
//
// This site has no bundler and no module graph: files are loaded with <script>
// tags, so `sourceType` is "script", not "module".
//
// The pack shipped eslint-plugin-boundaries and knip here. Both were dropped on
// purpose: boundaries enforces layering between import paths, and knip traces
// unused exports through an import graph. Neither exists on this site, so both
// would have run green while checking nothing. Real dead-code detection here is
// `no-unused-vars` below, plus review.

import js from "@eslint/js";
import globals from "globals";

// The global API that js/translations.js defines and everything else consumes.
// This is the site's whole cross-file interface. Keep it short.
const siteGlobals = {
  translations: "readonly",
  t: "readonly",
  getCurrentLanguage: "readonly",
  setLanguage: "readonly",
  toggleLanguage: "readonly",
  applyTranslations: "readonly",
};

export default [
  {
    ignores: [
      "mockups/**",       // design mockups, not shipped
      "**/*.min.js",
      "node_modules/**",
      // Generated bundles. Header says: "GENERATED from dc-runtime/src/*.ts —
      // do not edit. Rebuild with `cd dc-runtime && bun run build`." Linting a
      // build artifact reports 132 errors nobody can act on. If dc-runtime's
      // TypeScript source is ever vendored into this repo, lint that instead.
      "walkthroughs/support.js",
      "fariiq_walkthroughs_site/support.js",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...siteGlobals,
        gtag: "readonly",      // Google Analytics tag, loaded from the page
        dataLayer: "readonly",
      },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-implicit-globals": "error",
    },
  },

  {
    // translations.js is the one file whose job IS to define globals: the copy
    // table plus the t() / setLanguage() / toggleLanguage() helpers that the HTML
    // and main.js call. Declaring them here would collide with defining them, and
    // the functions look "unused" because their callers are inline onclick
    // attributes in the HTML, which ESLint cannot see.
    files: ["js/translations.js"],
    languageOptions: {
      // Flat config MERGES globals from earlier matching blocks rather than
      // replacing them, so siteGlobals is still in scope here and every
      // definition below would trip no-redeclare. Setting a global to "off" is
      // ESLint's documented way to remove one for a specific file.
      globals: Object.fromEntries(Object.keys(siteGlobals).map((k) => [k, "off"])),
    },
    rules: {
      "no-implicit-globals": "off",
      "no-unused-vars": "off",
    },
  },
];
