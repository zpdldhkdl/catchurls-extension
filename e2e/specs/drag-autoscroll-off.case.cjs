const { test, expect } = require('../fixtures.cjs');
const { ensureContentScriptReady } = require('../helpers/runtime-helpers.cjs');
test.setTimeout(20000);

test('does not auto-scroll when selection mode is OFF', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/e2e/fixtures/scroll.html');
  await ensureContentScriptReady(page);

  const before = await page.evaluate(() => window.scrollY);
  const startX = 640;
  const startY = 700;
  const nearBottomY = 718;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let i = 0; i < 16; i++) {
    await page.mouse.move(startX, nearBottomY, { steps: 1 });
    await page.waitForTimeout(20);
  }

  await page.mouse.up();
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(8);
});
