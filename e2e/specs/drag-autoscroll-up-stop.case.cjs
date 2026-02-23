const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady, setSelectionMode } = require('../helpers/runtime-helpers.cjs');
test.setTimeout(20000);

test('auto-scrolls up while dragging near top edge, and stops after mouseup', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/scroll.html');
  await ensureContentScriptReady(page);
  await setSelectionMode(context, page, true);
  await page.evaluate(() => window.scrollTo(0, 1400));
  const before = await page.evaluate(() => window.scrollY);
  const startX = 640;
  const startY = 12;
  const nearTopY = 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let i = 0; i < 20; i++) {
    await page.mouse.move(startX, nearTopY, { steps: 1 });
    await page.waitForTimeout(25);
  }

  const mid = await page.evaluate(() => window.scrollY);
  expect(mid).toBeLessThan(before - 24);

  await page.mouse.up();
  const afterUp = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(300);
  const settled = await page.evaluate(() => window.scrollY);
  expect(Math.abs(settled - afterUp)).toBeLessThanOrEqual(4);
});
