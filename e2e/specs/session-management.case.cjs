const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, sendActiveTabMessage, sendRuntimeMessage } = require('../helpers/runtime-helpers.cjs');

test('saves, restores, replaces, and deletes sessions', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/pattern-session.html');
  await ensureContentScriptReady(page);
  await sendActiveTabMessage(context, { type: 'SET_MODE', enabled: true });

  await sendActiveTabMessage(context, { type: 'COLLECT_BY_PATTERN', patternType: 'css', pattern: '.article-list a' });
  const linksResponse = await sendActiveTabMessage(context, { type: 'GET_COLLECTED_LINKS' });
  expect(linksResponse.links.length).toBe(3);

  const saveResult = await sendRuntimeMessage(context, {
    type: 'SAVE_SESSION',
    links: linksResponse.links,
    tabUrl: 'https://example.com/news',
    tabTitle: 'Example News'
  });
  expect(saveResult.success).toBeTruthy();
  const sessionId = saveResult.session.id;
  expect(sessionId).toBeTruthy();

  const detail = await sendRuntimeMessage(context, { type: 'GET_SESSION_DETAIL', sessionId });
  expect(detail.success).toBeTruthy();
  expect(detail.session.links.length).toBe(3);

  await sendActiveTabMessage(context, { type: 'CLEAR_LINKS' });
  const cleared = await sendActiveTabMessage(context, { type: 'GET_COLLECTED_LINKS' });
  expect(cleared.links.length).toBe(0);

  const mergeResult = await sendActiveTabMessage(context, { type: 'MERGE_LINKS', links: detail.session.links });
  expect(mergeResult.success).toBeTruthy();
  expect(mergeResult.totalCount).toBe(3);

  const deleteResult = await sendRuntimeMessage(context, { type: 'DELETE_SESSION', sessionId });
  expect(deleteResult.success).toBeTruthy();
  const detailAfterDelete = await sendRuntimeMessage(context, { type: 'GET_SESSION_DETAIL', sessionId });
  expect(detailAfterDelete.success).toBeFalsy();
  expect(detailAfterDelete.error).toBe('SESSION_NOT_FOUND');
});
