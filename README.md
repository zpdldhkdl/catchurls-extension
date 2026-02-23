# CatchUrls

Bulk link collector for Chrome: drag-select links or use modifier+click, then copy/export/open in batches.

[Chrome Web Store](https://chromewebstore.google.com/detail/catchurls/lmffpcdgghhgjcgolflnpjnciedohojo)

### Local Quick Start (3 steps)

1. Install dependencies:
   ```bash
   npm ci
   npm run pw:install
   ```
2. Open `chrome://extensions`, enable **Developer mode**, then **Load unpacked** and select this folder.
3. Use popup/options, and run E2E if needed:
   ```bash
   npm test
   ```

## Overview

CatchUrls는 웹페이지에서 여러 링크를 빠르게 수집하고 재사용할 수 있게 해주는 Chrome Extension입니다.

CatchUrls is a Manifest V3 Chrome extension focused on batch link workflows:
- Collect links by drag area selection.
- Add links one-by-one with modifier+click.
- Copy, open in tabs, save sessions, and transfer link sets as JSON/CSV.
- Keep lightweight local stats and theme/language preferences.

Source-of-truth version is `1.0.3.1` from `manifest.json` and `package.json`.

## Features

아래 기능은 코드와 E2E 테스트를 기준으로 공개 범위를 확정한 항목입니다.

| Feature | What it does | Verification |
| --- | --- | --- |
| Drag selection | Collect links inside a drag box with auto-scroll behavior. | `e2e/drag-autoscroll.spec.cjs` |
| Modifier+click collection | Add a single link using configured modifier key. | `e2e/drag-autoscroll.spec.cjs` (mode behavior), `e2e/pattern-session-shortcuts.spec.cjs` |
| Pattern collect (Regex/CSS) | Preview and collect links by regex or CSS selector. | `e2e/pattern-session-shortcuts.spec.cjs` |
| Session history | Save, merge/replace restore, and delete sessions. | `e2e/pattern-session-shortcuts.spec.cjs` |
| JSON/CSV transfer | Export/import links with validation and deduplication. | `e2e/link-transfer.spec.cjs` |
| Collection stats dashboard | Track total/trend/top domains and refresh UI state. | `e2e/stats-theme.spec.cjs` |
| Theme support | Persist and apply `system`/`dark`/`light` across popup/options. | `e2e/stats-theme.spec.cjs` |
| Multilingual UI | UI strings for English/Korean/Japanese with English fallback. | `e2e/stats-theme.spec.cjs` (popup/options UI flow), `e2e/pattern-session-shortcuts.spec.cjs` |

Primary UI feature anchors:
- Pattern Collect: `popup/popup.html:145` (`#patternTypeSelect`, `#patternInput`, `#previewPatternBtn`, `#collectPatternBtn`)
- Session History: `popup/popup.html:170` (`#saveSessionBtn`, `#sessionList`)
- Data Transfer: `popup/popup.html:178` (`#exportJsonBtn`, `#exportCsvBtn`, `#importMergeBtn`, `#importReplaceBtn`)
- Stats Dashboard: `popup/popup.html:203` (`#statsTotalValue`, `#statsTrendBars`, `#statsTopDomains`)

## Install

설치는 Chrome Web Store 또는 로컬 언팩 로드 두 가지 경로만 지원합니다.

### Option A: Chrome Web Store

Install from:
[https://chromewebstore.google.com/detail/catchurls/lmffpcdgghhgjcgolflnpjnciedohojo](https://chromewebstore.google.com/detail/catchurls/lmffpcdgghhgjcgolflnpjnciedohojo)

### Option B: Local unpacked (developer)

1. Clone this repository.
2. Run:
   ```bash
   npm ci
   npm run pw:install
   ```
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select this directory.

## Usage

기본 사용 흐름은 토글 ON 후 수집하고 원하는 형태로 내보내는 순서입니다.

1. Open popup and turn **Selection Mode ON**.
2. Collect links by drag area selection or modifier+click.
3. Use popup actions:
   - Copy all
   - Open tabs
   - Pattern collect (Regex/CSS)
   - Save/restore sessions
   - Export/import JSON/CSV
4. Adjust language/theme/copy/tab settings in Options.

## Architecture

코드 구조는 컨텐츠 스크립트 중심 + 서비스 워커 조합으로 단순하게 유지됩니다.

- `content/content.js:1`: in-page selection, collection, filtering, messaging entrypoint.
- `background/service-worker.js:11`: defaults/storage/session/commands/stats orchestration.
- `popup/popup.js:1`: user-facing control surface and runtime actions.
- `options/options.js:1`: persistent settings editor and stats view.
- `manifest.json`: MV3 entrypoints, permissions, commands, locale integration.

## Permissions & Privacy

권한은 `manifest.json`에 선언된 항목만 문서화하며, 데이터 처리는 Privacy Policy를 따릅니다.

### Permissions (`manifest.json`)

| Permission | Why it is needed |
| --- | --- |
| `activeTab` | Access current active tab context when actions are triggered. |
| `storage` | Persist user settings, sessions, and collection stats locally. |
| `clipboardWrite` | Copy collected links to clipboard. |
| `scripting` | Execute extension logic on supported pages. |
| `tabs` | Query active tab and open collected links in new tabs. |

Privacy policy:
- [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md)

## Keyboard Shortcuts

단축키는 현재 아래 3개 명령만 공식 지원합니다.

| Command | Windows/Linux | macOS | Description |
| --- | --- | --- | --- |
| `copy-links` | `Ctrl+Shift+C` | `Command+Shift+C` | Copy collected links |
| `clear-links` | `Ctrl+Shift+X` | `Command+Shift+X` | Clear collected links |
| `open-links-tabs` | `Ctrl+Shift+O` | `Command+Shift+O` | Open collected links in tabs |

## Development

이 프로젝트는 번들러 빌드 단계 없이 동작하도록 설계되어 있습니다.

No build step for the extension runtime.

Install:
```bash
npm ci
npm run pw:install
```

## Testing

테스트는 Playwright E2E를 기준으로 기능 회귀를 확인합니다.

Run all E2E (headed):
```bash
npm test
```

Interactive runner:
```bash
npm run test:e2e:ui
```

Single spec example:
```bash
npx playwright test e2e/drag-autoscroll.spec.cjs
```

## Contributing

기여 시에는 런타임 구조 단순성 유지와 E2E 회귀 방지를 우선합니다.

- Keep runtime vanilla JS/CSS and avoid adding a build pipeline.
- Prefer E2E-first validation for behavior changes.
- If runtime files/folders change, update `build-extension.sh` include list accordingly.
- Keep permission changes minimal and explicit in `manifest.json`.

## Release

릴리스는 ZIP 생성과 버전 동기화 확인을 최소 단위로 수행합니다.

Create Chrome Web Store ZIP:
```bash
./build-extension.sh
```

Custom output name:
```bash
./build-extension.sh my-extension.zip
```

Before release, ensure version sync:
- `manifest.json` -> `version`
- `package.json` -> `version`

## License

MIT
