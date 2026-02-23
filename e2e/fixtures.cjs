const os = require('os');
const path = require('path');
const fs = require('fs');

const { test: base, expect, chromium } = require('@playwright/test');

const EXTENSION_PATH = path.resolve(__dirname, '..');
let sharedPage = null;

function makeTempUserDataDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-catchurls-'));
  return dir;
}

const test = base.extend({
  extensionContext: [async ({}, use) => {
    const userDataDir = makeTempUserDataDir();

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 720 },
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    await use(context);

    if (sharedPage && !sharedPage.isClosed()) {
      await sharedPage.close().catch(() => {});
    }
    sharedPage = null;
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }, { scope: 'worker' }],

  context: async ({ extensionContext }, use) => {
    await use(extensionContext);
  },

  extensionId: async ({ extensionContext }, use) => {
    let [serviceWorker] = extensionContext.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await extensionContext.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  page: async ({ extensionContext }, use) => {
    let [serviceWorker] = extensionContext.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await extensionContext.waitForEvent('serviceworker');
    }

    await serviceWorker.evaluate(async () => {
      await chrome.storage.local.clear();
      if (chrome.storage.session?.clear) {
        await chrome.storage.session.clear();
      }
    });

    if (!sharedPage || sharedPage.isClosed()) {
      sharedPage = await extensionContext.newPage();
    }

    const extraPages = extensionContext.pages().filter(page => page !== sharedPage);
    for (const extraPage of extraPages) {
      if (!extraPage.isClosed()) {
        await extraPage.close().catch(() => {});
      }
    }
    await extensionContext.clearCookies();

    await sharedPage.goto('about:blank');
    await use(sharedPage);
  },
});

module.exports = { test, expect };
