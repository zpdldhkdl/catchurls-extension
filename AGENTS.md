# AGENTS.md

Agent-facing guide for this repository.

## Project

- Product: CatchUrls (Chrome Extension, Manifest V3)
- Runtime: vanilla JavaScript + CSS (no build step)
- Testing: Playwright E2E

## Commands

### Install

```bash
npm ci
npm run pw:install
```

### Test

```bash
# Run all E2E tests (headed)
npm test

# Same as above
npm run test:e2e

# Interactive runner
npm run test:e2e:ui

# Run a single test file
npx playwright test e2e/drag-autoscroll.spec.cjs

# Run a single test by name (regex)
npx playwright test -g "auto-scrolls down"
```

### Dev / Manual QA

```bash
# No build step: load unpacked extension
# chrome://extensions -> Developer mode -> Load unpacked -> repo root

# Serve static fixtures / docs locally
npx http-server -p 4173 . -c-1
```

## Tooling Reality Check

- Lint/format: no root-level eslint/prettier/biome config and no `npm run lint` script.
- Type system: JavaScript only (no TypeScript build). Some files use `// @ts-check` for editor hints.

## Key Files

- `manifest.json`: MV3 manifest (permissions, entrypoints).
- `content/content.js`: main content script (selection box, link collection, messaging).
- `content/content.css`: injected overlay UI styles.
- `background/service-worker.js`: MV3 service worker (badge, storage defaults, open tabs).
- `popup/popup.{html,js,css}`: popup UI.
- `options/options.{html,js,css}`: options page (settings editor).
- `e2e/*.spec.cjs`: Playwright E2E tests.
- `e2e/fixtures.cjs`: Playwright fixtures; launches Chromium with the unpacked extension.
- `playwright.config.cjs`: testDir, webServer, baseURL.

## Code Style

### File Size Limit

- **Any file exceeding 1000 lines MUST be refactored** by splitting it into separate, smaller files.
- When splitting, group related functions/logic into dedicated modules (e.g., `utils/`, `helpers/`).
- Each extracted file should have a single, clear responsibility.

### JavaScript

- Module style: CommonJS for Node/test configs (`*.cjs`), browser scripts as plain JS.
- Content script is wrapped in an IIFE and uses strict mode:

```js
(function() {
  'use strict';
  // ...
})();
```

- Indentation: 2 spaces.
- Quotes: single quotes.
- Semicolons: used consistently.
- Naming:
  - Functions/vars: `camelCase`.
  - Event handlers: `handleX` (e.g., `handleMouseDown`).
  - Constants: `UPPER_SNAKE_CASE` (e.g., `TOGGLE_DEBOUNCE_MS`).

### State + Data

- `content/content.js` uses a single `state` object for runtime flags and UI handles.
- Collected links are stored in `state.collectedLinks` as a `Map()` keyed by normalized URL.

### Messaging (content <-> background)

- Pattern: `chrome.runtime.sendMessage({ type: '...' })`.
- In background/service worker: `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { switch (...) { ... } })`.
- If `sendResponse` is called async, return `true` from the listener.
- When sending messages that may fail on navigation/service-worker lifecycle, prefer:

```js
chrome.runtime.sendMessage(payload).catch(() => {});
```

### Error Handling

- Use try/catch around URL parsing and user-provided regexes.
- Use `console.warn('[CatchUrls] ...', e)` for recoverable failures.
- Avoid empty catches except for intentionally-ignored `sendMessage` failures.

### CSS

- Namespace: prefix all injected selectors with `catchurls-` to avoid page collisions.
- Overlays use very high z-index values:
  - selection box: ~2147483646
  - toast/badges: ~2147483647
- Use `!important` when overriding host page styles (sparingly, but pragmatically).

## i18n

- Manifest-level strings live in `_locales/` and are referenced by `__MSG_*__` in `manifest.json`.
- UI strings are defined inline in JS as `{ en, ko, ja }` objects and accessed via `t(key, ...args)`.
- Interpolation uses `$1`, `$2`, ... placeholders with an English fallback.

## Testing Notes (Playwright)

- `playwright.config.cjs` serves the repo root on `http://127.0.0.1:4173`.
- Tests are in `e2e/` and use CommonJS (`.cjs`).
- `e2e/fixtures.cjs` loads the extension via Chromium args:
  - `--disable-extensions-except=...`
  - `--load-extension=...`
- Content scripts run in an isolated world; tests assert behavior via DOM artifacts.
  Example readiness check: `#catchurls-selection-box` is attached.

## Making Changes Safely

### Add a new setting

1. Add default in `background/service-worker.js` (`DEFAULT_SETTINGS`).
2. Read/apply it in `content/content.js` (`loadSettings`).
3. Expose it in `options/options.html` + `options/options.js`.
4. If the popup needs it, wire `popup/popup.js`.
5. Update i18n keys in all supported languages (en/ko/ja).

### Add a new action

1. Define a message type (`type: '...'`).
2. Implement in `content/content.js` and/or `background/service-worker.js`.
3. Add/adjust E2E coverage in `e2e/`.

## Cursor / Copilot Rules

- Cursor rules: none found in `.cursor/rules/` or `.cursorrules`.

## Chrome Web Store Distribution

### Build ZIP for Submission

```bash
# Default: creates catch-urls-v{version}.zip
./build-extension.sh

# Custom filename
./build-extension.sh my-extension.zip
```

### Included Files

The `build-extension.sh` script includes only the files required for Chrome Web Store review:

| File / Directory | Description |
|-----------------|-------------|
| `manifest.json` | Extension manifest |
| `_locales/` | Internationalization (en, ko, ja) |
| `background/` | Service worker |
| `content/` | Content script and styles |
| `popup/` | Popup UI |
| `options/` | Options page |
| `icons/*.png` | Icons (icon16, icon48, icon128) |

### Excluded Files

- `node_modules/`, `package.json`, `package-lock.json` (dev dependencies)
- `docs/` (landing page)
- `e2e/`, `test-page.html`, `test-results/` (tests)
- `.gitignore`, `.DS_Store`, `.sisyphus/` (meta/system files)
- `AGENTS.md`, `PRIVACY_POLICY.md`, `STORE_LISTING.md` (docs)
- `icons/master_image.png` (source image)

### ⚠️ Maintenance Rules

> Version must be bumped when adding or modifying features.
> **Important**: When new files or directories are added/changed in the extension, `build-extension.sh` must be updated accordingly.

Examples:
- New permission → update `manifest.json` (no script change needed)
- New directory (e.g., `utils/`) → add to `FILES_TO_INCLUDE` array
- New icon file → add to `FILES_TO_INCLUDE` array

### Git Push

Always use the `Makefile` for git operations. The `make push` command excludes internal files (e.g., `docs/`, `STORE_LISTING.md`, `TODO.md`) from staging automatically.

```bash
make push m="your commit message"
```

See the `EXCLUDE` variable in `Makefile` for the full list of excluded paths.

## Non-Goals

- Do not introduce a bundler/build pipeline unless explicitly requested.
- Do not add new permissions casually; MV3 permission changes are user-visible.
