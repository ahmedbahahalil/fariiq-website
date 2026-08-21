# Marketing website rules

`website/` is the public marketing site at fariiq.com. It is **not** an application.
Plain HTML, CSS, and browser JavaScript loaded with `<script>` tags. No framework,
no bundler, no build step, no npm runtime dependencies.

Keep it that way. If a change here seems to need React, a bundler, or a package from
npm, that is a signal the thing being built belongs in the Flutter app, not on the
marketing site. Stop and say so.

## Layout

```
index.html, privacy.html, terms.html   the pages
css/                                   stylesheets
js/translations.js                     EN + AR copy, a single global `translations`
js/main.js                             nav, language switching, contact form
images/, video/, logo assets
walkthroughs/                          product walkthrough pages
fariiq_walkthroughs_site/              second copy of the walkthrough pages
mockups/                               design mockups, not shipped
```

There is no import graph to enforce, so there is no layering rule here. The rules
that matter for this site are about copy, duplication, and not letting it grow a
toolchain.

## Rules

- **All visible copy lives in `js/translations.js`**, keyed, with both `en` and `ar`.
  No English string baked into the HTML that a reader would see. Arabic is a first
  class language on this site, not an afterthought: check `dir="rtl"` still renders
  correctly after any layout change.
- **`js/main.js` stays an IIFE in strict mode.** The site's entire cross-file API is
  the six globals defined in `js/translations.js`: `translations`, `t`,
  `getCurrentLanguage`, `setLanguage`, `toggleLanguage`, `applyTranslations`. That is
  the budget. Adding a seventh needs a reason.
- **No new inline `onclick=` handlers.** Bind listeners in `main.js`. The language
  switcher in the page headers (`onclick="setLanguage('ar')"`, `toggleLanguage()`) is
  the existing exception; leave it alone rather than churning it, but do not copy the
  pattern into new markup.
- No `console.log` in shipped JS. `console.warn` and `console.error` are fine.
- No tracking scripts beyond the existing GA tag without asking first. This is a
  public page subject to the privacy policy it hosts.
- Do not hardcode prices, currencies, or plan limits that also exist in the product.
  If they must appear, they are marketing copy in `translations.js` and someone owns
  keeping them in sync.
- Images are compressed and sized before commit. This site's whole value is loading fast.

## Known duplication

`walkthroughs/support.js` and `fariiq_walkthroughs_site/support.js` are byte-identical,
and the two walkthrough directories overlap. Do not edit one and forget the other.
Collapsing them into a single directory is a good first cleanup; do it as its own
change, not inside a content update.

## Tests

There is no test suite here and one is not warranted. The gate for this area is
`npx eslint .` plus opening the page and checking both `en` and `ar` render.
