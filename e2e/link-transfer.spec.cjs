const { test, expect } = require('@playwright/test');
const linkTransfer = require('../popup/link-transfer.js');

test('JSON roundtrip keeps valid unique links', async () => {
  const source = [
    { url: 'https://example.com/a', title: 'A' },
    { url: 'https://example.com/a', title: 'A duplicate' },
    { url: 'https://example.com/b', title: '' },
    { url: 'mailto:test@example.com', title: 'Mail' }
  ];

  const jsonText = linkTransfer.serializeLinksToJson(source);
  const parsed = linkTransfer.parseJsonLinks(jsonText);

  expect(parsed.ok).toBe(true);
  expect(parsed.links).toEqual([
    { url: 'https://example.com/a', title: 'A' },
    { url: 'https://example.com/b', title: 'https://example.com/b' }
  ]);
});

test('CSV roundtrip supports comma, quotes, and newline in title', async () => {
  const source = [
    { url: 'https://example.com/a', title: 'Hello, "World"' },
    { url: 'https://example.com/b', title: 'Line 1\nLine 2' }
  ];

  const csvText = linkTransfer.serializeLinksToCsv(source);
  const parsed = linkTransfer.parseCsvLinks(csvText);

  expect(parsed.ok).toBe(true);
  expect(parsed.links).toEqual([
    { url: 'https://example.com/a', title: 'Hello, "World"' },
    { url: 'https://example.com/b', title: 'Line 1\nLine 2' }
  ]);
});

test('invalid JSON returns INVALID_JSON', async () => {
  const parsed = linkTransfer.parseJsonLinks('{not-json');
  expect(parsed.ok).toBe(false);
  expect(parsed.error).toBe('INVALID_JSON');
});

test('invalid CSV returns INVALID_CSV', async () => {
  const parsed = linkTransfer.parseCsvLinks('url,title\n"https://example.com/a,"broken');
  expect(parsed.ok).toBe(false);
  expect(parsed.error).toBe('INVALID_CSV');
});

test('unsupported extension returns UNSUPPORTED_FILE_TYPE', async () => {
  const parsed = linkTransfer.parseImportText('https://example.com/a', { filename: 'links.txt' });
  expect(parsed.ok).toBe(false);
  expect(parsed.error).toBe('UNSUPPORTED_FILE_TYPE');
});
