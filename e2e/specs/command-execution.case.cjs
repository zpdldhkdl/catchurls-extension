const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, sendActiveTabMessage, sendRuntimeMessage } = require('../helpers/runtime-helpers.cjs');

test('executes command actions for copy, clear, and open tabs', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/pattern-session.html');
  await ensureContentScriptReady(page);
  await sendActiveTabMessage(context, { type: 'SET_MODE', enabled: true });

  const collectResult = await sendActiveTabMessage(context, {
    type: 'COLLECT_BY_PATTERN',
    patternType: 'regex',
    pattern: 'example\\.com'
  });
  expect(collectResult.success).toBeTruthy();
  expect(collectResult.totalCount).toBeGreaterThan(0);

  const copyResult = await sendRuntimeMessage(context, { type: 'EXECUTE_COMMAND', command: 'copy-links' });
  expect(copyResult.success).toBeTruthy();
  expect(copyResult.result.copied).toBeTruthy();

  const openTabsResult = await sendRuntimeMessage(context, {
    type: 'EXECUTE_COMMAND',
    command: 'open-links-tabs'
  });
  expect(openTabsResult.success).toBeTruthy();
  expect(openTabsResult.result.count).toBeGreaterThan(0);

  const clearResult = await sendRuntimeMessage(context, { type: 'EXECUTE_COMMAND', command: 'clear-links' });
  expect(clearResult.success).toBeTruthy();
  expect(clearResult.result.success).toBeTruthy();
});
