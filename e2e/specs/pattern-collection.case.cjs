const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, sendActiveTabMessage } = require('../helpers/runtime-helpers.cjs');

test('collects links by regex/css pattern with preview', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/pattern-session.html');
  await ensureContentScriptReady(page);
  await sendActiveTabMessage(context, { type: 'SET_MODE', enabled: true });

  const cssPreview = await sendActiveTabMessage(context, {
    type: 'PREVIEW_PATTERN_COLLECTION',
    patternType: 'css',
    pattern: '.article-list a'
  });
  expect(cssPreview.success).toBeTruthy();
  expect(cssPreview.matchedCount).toBe(3);
  expect(cssPreview.newCount).toBe(3);
  expect(cssPreview.excludedCount).toBe(0);

  const cssCollect = await sendActiveTabMessage(context, {
    type: 'COLLECT_BY_PATTERN',
    patternType: 'css',
    pattern: '.article-list a'
  });
  expect(cssCollect.success).toBeTruthy();
  expect(cssCollect.addedCount).toBe(3);
  expect(cssCollect.totalCount).toBe(3);

  const regexPreview = await sendActiveTabMessage(context, {
    type: 'PREVIEW_PATTERN_COLLECTION',
    patternType: 'regex',
    pattern: 'docs\\.example\\.com'
  });
  expect(regexPreview.success).toBeTruthy();
  expect(regexPreview.matchedCount).toBe(2);
  expect(regexPreview.newCount).toBe(2);
});
