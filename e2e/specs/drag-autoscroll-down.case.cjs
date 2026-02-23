const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, setSelectionMode } = require('../helpers/runtime-helpers.cjs');
test.setTimeout(20000);

test('auto-scrolls down while dragging near bottom edge', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/scroll.html');
  await ensureContentScriptReady(page);
  await setSelectionMode(context, page, true);

  const before = await page.evaluate(() => window.scrollY);
  const startX = 640;
  const startY = 700;
  const nearBottomY = 718;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let i = 0; i < 22; i++) {
    await page.mouse.move(startX, nearBottomY, { steps: 1 });
    await page.waitForTimeout(25);
  }

  await page.mouse.up();
  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBeGreaterThan(before + 24);
});
