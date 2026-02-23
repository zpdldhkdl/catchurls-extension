const DEFAULT_EXCLUSION_FILTERS = [
  { type: 'regex', value: 'youtube\\.com/@[^/]+$' },
  { type: 'regex', value: 'youtube\\.com/channel/' },
  { type: 'regex', value: 'youtube\\.com/c/' }
];

const MAX_SESSIONS = 50;
const MAX_DAILY_STATS_DAYS = 365;
const DEFAULT_THEME = 'system';

const DEFAULT_SETTINGS = {
  modifierKey: 'alt',
  clearOnToggle: false,
  theme: DEFAULT_THEME,
  copyFormat: 'urls',
  copySeparator: '\n',
  openTabDelay: 0,
  openTabNextToActive: true,
  markAsVisited: false,
  exclusionFilters: DEFAULT_EXCLUSION_FILTERS,
  disabledDomains: [],
  linkifyEnabled: false,
  linkifyAggressive: false,
  dynamicLinkDetection: true,
  autoCopy: true,
  sessions: [],
  collectionStats: createDefaultCollectionStats()
};

function getDefaultSettings() {
  return {
    ...DEFAULT_SETTINGS,
    exclusionFilters: DEFAULT_EXCLUSION_FILTERS.map(filter => ({ ...filter })),
    disabledDomains: [],
    sessions: [],
    collectionStats: createDefaultCollectionStats()
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'UPDATE_BADGE':
      updateBadge(message.enabled, message.tabId || sender.tab?.id);
      break;

    case 'GET_SETTINGS':
      chrome.storage.local.get(['modifierKey', 'clearOnToggle']).then(result => {
        sendResponse({
          modifierKey: result.modifierKey || 'alt',
          clearOnToggle: result.clearOnToggle || false
        });
      });
      return true;

    case 'OPEN_TABS':
      openTabs(message.urls, message.options).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'GET_ALL_SETTINGS':
      chrome.storage.local.get(null).then(result => {
        sendResponse(result);
      });
      return true;

    case 'SAVE_SETTINGS':
      chrome.storage.local.set(message.settings).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'SAVE_SESSION':
      saveSession({
        links: message.links,
        tabUrl: message.tabUrl,
        tabTitle: message.tabTitle
      }).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'GET_SESSIONS':
      readSessions().then(sessions => {
        sendResponse({ success: true, sessions });
      }).catch(err => {
        sendResponse({ success: false, error: err.message, sessions: [] });
      });
      return true;

    case 'DELETE_SESSION':
      deleteSession(message.sessionId).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'TRACK_COLLECTION_STATS':
      trackCollectionStats(message.links, message.source).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'GET_COLLECTION_STATS':
      getCollectionStats({ days: message.days, topN: message.topN }).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'EXECUTE_COMMAND':
      executeCommand(message.command).then(result => {
        sendResponse(result);
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  executeCommand(command, tab).catch(err => {
    console.warn('[CatchUrls] Failed to execute command:', command, err);
  });
});

function updateBadge(enabled, tabId) {
  const text = enabled ? 'ON' : '';
  const color = enabled ? '#4CAF50' : '#9E9E9E';

  const options = { text };
  const colorOptions = { color };

  if (tabId) {
    options.tabId = tabId;
    colorOptions.tabId = tabId;
  }

  chrome.action.setBadgeText(options);
  chrome.action.setBadgeBackgroundColor(colorOptions);
}

function isHttpUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeSessionLinks(links) {
  if (!Array.isArray(links)) return [];

  const uniqueLinks = [];
  const seen = new Set();

  for (const link of links) {
    if (!link || typeof link.url !== 'string') continue;
    if (!isHttpUrl(link.url)) continue;

    const normalizedUrl = new URL(link.url).href;
    if (seen.has(normalizedUrl)) continue;

    seen.add(normalizedUrl);
    const title = typeof link.title === 'string' ? link.title.trim() : '';

    uniqueLinks.push({
      url: normalizedUrl,
      title: title || normalizedUrl
    });
  }

  return uniqueLinks;
}

function extractDomain(url) {
  if (!isHttpUrl(url)) return 'unknown';

  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function createDefaultCollectionStats() {
  return {
    totalAdded: 0,
    dailyCounts: {},
    domainCounts: {},
    updatedAt: 0
  };
}

function normalizeTheme(theme) {
  if (theme === 'dark' || theme === 'light' || theme === 'system') {
    return theme;
  }
  return DEFAULT_THEME;
}

function getLocalDateKey(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateKey(date.getTime());
}

function sanitizeCollectionStats(raw) {
  const next = createDefaultCollectionStats();
  const source = raw && typeof raw === 'object' ? raw : {};

  const totalAdded = Number(source.totalAdded);
  next.totalAdded = Number.isFinite(totalAdded) && totalAdded >= 0
    ? Math.floor(totalAdded)
    : 0;

  if (source.dailyCounts && typeof source.dailyCounts === 'object') {
    Object.entries(source.dailyCounts).forEach(([key, value]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
      const count = Number(value);
      if (!Number.isFinite(count) || count <= 0) return;
      next.dailyCounts[key] = Math.floor(count);
    });
  }

  if (source.domainCounts && typeof source.domainCounts === 'object') {
    Object.entries(source.domainCounts).forEach(([domain, value]) => {
      if (typeof domain !== 'string' || domain.trim() === '') return;
      const count = Number(value);
      if (!Number.isFinite(count) || count <= 0) return;
      next.domainCounts[domain.toLowerCase()] = Math.floor(count);
    });
  }

  const updatedAt = Number(source.updatedAt);
  next.updatedAt = Number.isFinite(updatedAt) && updatedAt > 0 ? Math.floor(updatedAt) : 0;

  pruneDailyCounts(next.dailyCounts);
  return next;
}

function pruneDailyCounts(dailyCounts) {
  if (!dailyCounts || typeof dailyCounts !== 'object') return;

  const oldestAllowedKey = getDateKeyDaysAgo(MAX_DAILY_STATS_DAYS - 1);
  Object.keys(dailyCounts).forEach(key => {
    if (key < oldestAllowedKey) {
      delete dailyCounts[key];
    }
  });
}

async function readCollectionStats() {
  const result = await chrome.storage.local.get(['collectionStats']);
  return sanitizeCollectionStats(result.collectionStats);
}

async function writeCollectionStats(stats) {
  const sanitized = sanitizeCollectionStats(stats);
  await chrome.storage.local.set({ collectionStats: sanitized });
  return sanitized;
}

async function trackCollectionStats(links, source = 'manual') {
  const normalizedLinks = normalizeSessionLinks(links);
  if (normalizedLinks.length === 0) {
    return { success: true, trackedCount: 0, source };
  }

  const stats = await readCollectionStats();
  const dayKey = getLocalDateKey();

  stats.totalAdded += normalizedLinks.length;
  stats.dailyCounts[dayKey] = (stats.dailyCounts[dayKey] || 0) + normalizedLinks.length;

  normalizedLinks.forEach(link => {
    const domain = extractDomain(link.url);
    if (!domain || domain === 'unknown') return;
    stats.domainCounts[domain] = (stats.domainCounts[domain] || 0) + 1;
  });

  stats.updatedAt = Date.now();
  pruneDailyCounts(stats.dailyCounts);
  await writeCollectionStats(stats);

  return {
    success: true,
    trackedCount: normalizedLinks.length,
    source
  };
}

function buildTrend(dailyCounts, days = 7) {
  const safeDays = Number.isFinite(Number(days))
    ? Math.min(Math.max(Math.floor(Number(days)), 1), 31)
    : 7;

  const trend = [];
  for (let offset = safeDays - 1; offset >= 0; offset--) {
    const key = getDateKeyDaysAgo(offset);
    trend.push({
      date: key,
      count: dailyCounts[key] || 0
    });
  }
  return trend;
}

function buildTopDomains(domainCounts, topN = 5) {
  const safeTopN = Number.isFinite(Number(topN))
    ? Math.min(Math.max(Math.floor(Number(topN)), 1), 20)
    : 5;

  return Object.entries(domainCounts)
    .filter(([domain, count]) => typeof domain === 'string' && domain && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, safeTopN)
    .map(([domain, count]) => ({ domain, count }));
}

async function getCollectionStats({ days = 7, topN = 5 } = {}) {
  const stats = await readCollectionStats();

  return {
    success: true,
    stats: {
      totalAdded: stats.totalAdded,
      trend: buildTrend(stats.dailyCounts, days),
      topDomains: buildTopDomains(stats.domainCounts, topN),
      updatedAt: stats.updatedAt
    }
  };
}

async function readSessions() {
  const result = await chrome.storage.local.get(['sessions']);
  if (!Array.isArray(result.sessions)) return [];
  return result.sessions;
}

async function saveSession({ links, tabUrl, tabTitle }) {
  const normalizedLinks = normalizeSessionLinks(links);
  if (normalizedLinks.length === 0) {
    return { success: false, error: 'No links to save' };
  }

  const sessions = await readSessions();
  const createdAt = Date.now();
  const session = {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    sourceDomain: extractDomain(tabUrl),
    sourceTitle: typeof tabTitle === 'string' ? tabTitle : '',
    count: normalizedLinks.length,
    links: normalizedLinks
  };

  const nextSessions = [session, ...sessions].slice(0, MAX_SESSIONS);
  await chrome.storage.local.set({ sessions: nextSessions });

  return {
    success: true,
    session,
    sessions: nextSessions
  };
}

async function deleteSession(sessionId) {
  if (!sessionId) {
    return { success: false, error: 'Session id is required' };
  }

  const sessions = await readSessions();
  const nextSessions = sessions.filter(session => session.id !== sessionId);
  await chrome.storage.local.set({ sessions: nextSessions });

  return {
    success: true,
    sessions: nextSessions
  };
}

async function openTabs(urls, options = {}) {
  if (!urls || urls.length === 0) {
    return { success: false, error: 'No URLs provided' };
  }

  const {
    delay = 0,
    nextToActive = true,
    reverse = false,
    active = false
  } = options;

  let urlList = [...urls].filter(isHttpUrl);
  if (reverse) {
    urlList.reverse();
  }

  if (urlList.length === 0) {
    return { success: false, error: 'No valid URLs provided' };
  }

  const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
  let insertIndex = currentTab[0] ? currentTab[0].index + 1 : undefined;

  let openedCount = 0;
  for (let i = 0; i < urlList.length; i++) {
    const url = urlList[i];

    try {
      const tabOptions = {
        url,
        active: active && i === 0
      };

      if (nextToActive && insertIndex !== undefined) {
        tabOptions.index = insertIndex + i;
      }

      await chrome.tabs.create(tabOptions);
      openedCount++;

      if (delay > 0 && i < urlList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (e) {
      console.warn('[CatchUrls] Failed to open tab:', e);
    }
  }

  return { success: true, count: openedCount };
}

async function resolveTargetTab(tabHint) {
  if (tabHint?.id) return tabHint;

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return activeTab;
}

async function ensureContentScriptInjected(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (response?.pong) return true;
  } catch {
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/content.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js']
    });

    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
        if (response?.pong) return true;
      } catch {
        continue;
      }
    }

    return false;
  } catch (e) {
    console.warn('[CatchUrls] Failed to inject content script:', e);
    return false;
  }
}

async function executeCommand(command, tabHint) {
  const tab = await resolveTargetTab(tabHint);
  if (!tab?.id) {
    return { success: false, error: 'No active tab available' };
  }

  const injected = await ensureContentScriptInjected(tab.id);
  if (!injected) {
    return { success: false, error: 'Content script unavailable' };
  }

  switch (command) {
    case 'copy-links': {
      const settings = await chrome.storage.local.get(['copyFormat', 'copySeparator']);
      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'COPY_LINKS',
        format: settings.copyFormat || 'urls',
        separator: settings.copySeparator || '\n'
      });

      if (result?.copied && result.count > 0) {
        const linksResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_COLLECTED_LINKS' });
        await saveSession({
          links: linksResponse?.links || [],
          tabUrl: tab.url,
          tabTitle: tab.title
        });
      }

      return { success: true, result };
    }

    case 'clear-links': {
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_LINKS' });
      return { success: true, result };
    }

    case 'open-links-tabs': {
      const linksResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_COLLECTED_LINKS' });
      const urls = Array.isArray(linksResponse?.links)
        ? linksResponse.links.map(link => link.url).filter(isHttpUrl)
        : [];

      if (urls.length === 0) {
        return { success: false, error: 'No links to open' };
      }

      const settings = await chrome.storage.local.get(['openTabDelay', 'openTabNextToActive']);
      const result = await openTabs(urls, {
        delay: settings.openTabDelay || 0,
        nextToActive: settings.openTabNextToActive !== false,
        reverse: false,
        active: false
      });

      return { success: result.success, result };
    }

    default:
      return { success: false, error: `Unknown command: ${command}` };
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  const defaults = getDefaultSettings();

  if (details.reason === 'install') {
    await chrome.storage.local.set(defaults);
  } else if (details.reason === 'update') {
    const existing = await chrome.storage.local.get(null);
    const merged = { ...defaults, ...existing };
    merged.theme = normalizeTheme(existing.theme);
    merged.collectionStats = sanitizeCollectionStats(existing.collectionStats);
    if (!Array.isArray(merged.sessions)) {
      merged.sessions = [];
    }
    await chrome.storage.local.set(merged);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
