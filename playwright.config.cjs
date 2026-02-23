// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: './node_modules/.bin/http-server -p 4173 . -c-1 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
};
