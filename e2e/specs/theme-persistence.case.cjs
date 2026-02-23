const { test, expect } = require('../fixtures.cjs');

test('applies and persists theme from options to popup', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options/options.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#theme');
  await page.selectOption('#theme', 'light');
  await page.click('#saveBtn');
  await page.waitForSelector('#toast.show');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(200);
  await expect(page.locator('#themeSelect')).toHaveValue('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto(`chrome-extension://${extensionId}/options/options.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#theme');
  await page.selectOption('#theme', 'dark');
  await page.click('#saveBtn');
  await page.waitForSelector('#toast.show');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(200);
  await expect(page.locator('#themeSelect')).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
