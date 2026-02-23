const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, sendActiveTabMessage, sendRuntimeMessage } = require('../helpers/runtime-helpers.cjs');

test('tracks cumulative collection stats across pattern and import flows', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/pattern-session.html');
  await ensureContentScriptReady(page);
  await sendActiveTabMessage(context, { type: 'SET_MODE', enabled: true });

  const baselineTrack = await sendRuntimeMessage(context, {
    type: 'TRACK_COLLECTION_STATS',
    links: [{ url: 'https://stats-baseline.example.com/seed', title: 'seed' }],
    source: 'baseline'
  });
  expect(baselineTrack.success).toBeTruthy();

  const cssCollect = await sendActiveTabMessage(context, {
    type: 'COLLECT_BY_PATTERN',
    patternType: 'css',
    pattern: '.article-list a'
  });
  expect(cssCollect.success).toBeTruthy();
  expect(cssCollect.addedCount).toBe(3);

  const regexCollect = await sendActiveTabMessage(context, {
    type: 'COLLECT_BY_PATTERN',
    patternType: 'regex',
    pattern: 'docs\\.example\\.com'
  });
  expect(regexCollect.success).toBeTruthy();
  expect(regexCollect.addedCount).toBe(2);

  const importResult = await sendActiveTabMessage(context, {
    type: 'MERGE_LINKS',
    links: [
      { url: 'https://imported.example.com/one', title: 'one' },
      { url: 'https://imported.example.com/two', title: 'two' },
      { url: 'https://example.com/news/1', title: 'dup' }
    ]
  });
  expect(importResult.success).toBeTruthy();
  expect(importResult.addedCount).toBe(2);

  const statsResult = await sendRuntimeMessage(context, { type: 'GET_COLLECTION_STATS', days: 7, topN: 5 });
  expect(statsResult.success).toBeTruthy();
  expect(statsResult.stats.totalAdded).toBeGreaterThanOrEqual(7);
  const topDomains = statsResult.stats.topDomains;
  expect(topDomains.length).toBeGreaterThan(0);
  expect(topDomains[0].domain).toContain('example.com');
});
