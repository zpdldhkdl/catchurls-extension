(function(root, factory) {
  'use strict';

  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.CatchUrlsLinkTransfer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const ERROR_CODES = {
    EMPTY_FILE: 'EMPTY_FILE',
    INVALID_JSON: 'INVALID_JSON',
    INVALID_CSV: 'INVALID_CSV',
    NO_VALID_LINKS: 'NO_VALID_LINKS',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE'
  };

  function stripBom(text) {
    if (typeof text !== 'string') return '';
    if (text.charCodeAt(0) === 0xFEFF) {
      return text.slice(1);
    }
    return text;
  }

  function isHttpUrl(url) {
    if (typeof url !== 'string' || url.trim() === '') return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function normalizeLinks(links) {
    if (!Array.isArray(links)) return [];

    const normalized = [];
    const seen = new Set();

    for (const link of links) {
      const rawUrl = typeof link === 'string'
        ? link
        : (link && typeof link.url === 'string' ? link.url : '');

      if (!isHttpUrl(rawUrl)) continue;

      const normalizedUrl = new URL(rawUrl.trim()).href;
      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);

      const title = (link && typeof link.title === 'string')
        ? link.title.trim()
        : '';

      normalized.push({
        url: normalizedUrl,
        title: title || normalizedUrl
      });
    }

    return normalized;
  }

  function serializeLinksToJson(links) {
    return JSON.stringify(normalizeLinks(links), null, 2);
  }

  function escapeCsvValue(value) {
    const text = typeof value === 'string' ? value : String(value || '');
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function serializeLinksToCsv(links) {
    const normalized = normalizeLinks(links);
    const lines = ['url,title'];

    normalized.forEach(link => {
      lines.push(`${escapeCsvValue(link.url)},${escapeCsvValue(link.title)}`);
    });

    return lines.join('\n');
  }

  function parseCsvRows(rawText) {
    const rows = [];
    let row = [];
    let field = '';
    let i = 0;
    let inQuotes = false;
    let justClosedQuote = false;
    const text = stripBom(rawText);

    while (i < text.length) {
      const char = text[i];

      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          justClosedQuote = true;
          i += 1;
          continue;
        }

        field += char;
        i += 1;
        continue;
      }

      if (justClosedQuote) {
        if (char === ',') {
          row.push(field);
          field = '';
          justClosedQuote = false;
          i += 1;
          continue;
        }

        if (char === '\n' || char === '\r') {
          if (char === '\r' && text[i + 1] === '\n') {
            i += 1;
          }

          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          justClosedQuote = false;
          i += 1;
          continue;
        }

        throw new Error(ERROR_CODES.INVALID_CSV);
      }

      if (char === '"') {
        if (field.length > 0) {
          throw new Error(ERROR_CODES.INVALID_CSV);
        }
        inQuotes = true;
        i += 1;
        continue;
      }

      if (char === ',') {
        row.push(field);
        field = '';
        i += 1;
        continue;
      }

      if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') {
          i += 1;
        }

        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i += 1;
        continue;
      }

      field += char;
      i += 1;
    }

    if (inQuotes) {
      throw new Error(ERROR_CODES.INVALID_CSV);
    }

    row.push(field);
    const isTrailingEmptyRow = row.length === 1 && row[0] === '' && rows.length > 0;
    if (!isTrailingEmptyRow) {
      rows.push(row);
    }

    return rows;
  }

  function parseJsonLinks(text) {
    const normalizedText = stripBom(text).trim();
    if (!normalizedText) {
      return { ok: false, error: ERROR_CODES.EMPTY_FILE };
    }

    let parsed;
    try {
      parsed = JSON.parse(normalizedText);
    } catch {
      return { ok: false, error: ERROR_CODES.INVALID_JSON };
    }

    const candidates = Array.isArray(parsed)
      ? parsed
      : (parsed && Array.isArray(parsed.links) ? parsed.links : []);

    const links = normalizeLinks(candidates);
    if (!links.length) {
      return { ok: false, error: ERROR_CODES.NO_VALID_LINKS };
    }

    return { ok: true, links };
  }

  function parseCsvLinks(text) {
    const normalizedText = stripBom(text);
    if (!normalizedText.trim()) {
      return { ok: false, error: ERROR_CODES.EMPTY_FILE };
    }

    let rows;
    try {
      rows = parseCsvRows(normalizedText);
    } catch {
      return { ok: false, error: ERROR_CODES.INVALID_CSV };
    }

    if (!rows.length) {
      return { ok: false, error: ERROR_CODES.NO_VALID_LINKS };
    }

    const firstRow = rows[0] || [];
    const firstCol = (firstRow[0] || '').trim().toLowerCase();
    const hasHeader = firstCol === 'url';
    const startIndex = hasHeader ? 1 : 0;

    const candidates = [];
    for (let rowIndex = startIndex; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawUrl = typeof row[0] === 'string' ? row[0].trim() : '';
      if (!rawUrl) continue;

      const rawTitle = typeof row[1] === 'string' ? row[1].trim() : '';
      candidates.push({ url: rawUrl, title: rawTitle });
    }

    const links = normalizeLinks(candidates);
    if (!links.length) {
      return { ok: false, error: ERROR_CODES.NO_VALID_LINKS };
    }

    return { ok: true, links };
  }

  function resolveImportHint(hint) {
    if (typeof hint === 'string') {
      return {
        filename: hint,
        mimeType: ''
      };
    }

    if (hint && typeof hint === 'object') {
      return {
        filename: hint.filename || hint.name || '',
        mimeType: hint.mimeType || hint.type || ''
      };
    }

    return {
      filename: '',
      mimeType: ''
    };
  }

  function detectFormat(hint) {
    const { filename, mimeType } = resolveImportHint(hint);
    const lowerFileName = String(filename || '').toLowerCase();
    const lowerMime = String(mimeType || '').toLowerCase();

    if (lowerFileName.endsWith('.json') || lowerMime.includes('json')) return 'json';
    if (lowerFileName.endsWith('.csv') || lowerMime.includes('csv')) return 'csv';

    if (lowerFileName) return 'unsupported';
    return 'unknown';
  }

  function parseImportText(text, hint) {
    if (typeof text !== 'string' || stripBom(text).trim() === '') {
      return { ok: false, error: ERROR_CODES.EMPTY_FILE };
    }

    const detectedFormat = detectFormat(hint);

    if (detectedFormat === 'json') {
      return parseJsonLinks(text);
    }

    if (detectedFormat === 'csv') {
      return parseCsvLinks(text);
    }

    if (detectedFormat === 'unsupported') {
      return { ok: false, error: ERROR_CODES.UNSUPPORTED_FILE_TYPE };
    }

    const trimmed = stripBom(text).trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const jsonResult = parseJsonLinks(text);
      if (jsonResult.ok) return jsonResult;
      return jsonResult;
    }

    const csvResult = parseCsvLinks(text);
    if (csvResult.ok) return csvResult;

    const jsonResult = parseJsonLinks(text);
    if (jsonResult.ok) return jsonResult;

    if (csvResult.error === ERROR_CODES.NO_VALID_LINKS || jsonResult.error === ERROR_CODES.NO_VALID_LINKS) {
      return { ok: false, error: ERROR_CODES.NO_VALID_LINKS };
    }

    return csvResult.error === ERROR_CODES.INVALID_CSV
      ? csvResult
      : { ok: false, error: ERROR_CODES.UNSUPPORTED_FILE_TYPE };
  }

  return {
    ERROR_CODES,
    serializeLinksToJson,
    serializeLinksToCsv,
    parseJsonLinks,
    parseCsvLinks,
    parseImportText
  };
});
