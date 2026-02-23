async function ensureContentScriptReady(page) {
  await page.waitForSelector('#catchurls-selection-box', { state: 'attached' });
}

async function getServiceWorker(context) {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  await worker.evaluate(() => true);
  return worker;
}

async function sendActiveTabMessage(context, payload) {
  const worker = await getServiceWorker(context);
  return worker.evaluate(async (message) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(tab.id, message);
  }, payload);
}

async function sendRuntimeMessage(context, payload) {
  const worker = await getServiceWorker(context);
  return worker.evaluate(async (message) => {
    const sendViaRuntime = (payloadMessage) => chrome.runtime.sendMessage(payloadMessage);

    switch (message.type) {
      case 'SAVE_SESSION':
        if (typeof saveSession === 'function') {
          return saveSession({
            links: message.links,
            tabUrl: message.tabUrl || 'https://example.com',
            tabTitle: message.tabTitle || 'Example'
          });
        }
        return sendViaRuntime({
          type: 'SAVE_SESSION',
          links: message.links,
          tabUrl: message.tabUrl || 'https://example.com',
          tabTitle: message.tabTitle || 'Example'
        });
      case 'DELETE_SESSION':
        if (typeof deleteSession === 'function') {
          return deleteSession(message.sessionId);
        }
        return sendViaRuntime({
          type: 'DELETE_SESSION',
          sessionId: message.sessionId
        });
      case 'GET_SESSION_DETAIL':
        if (typeof getSessionDetail === 'function') {
          return getSessionDetail(message.sessionId);
        }
        if (typeof readSessions === 'function') {
          const sessions = await readSessions();
          const session = sessions.find(item => item.id === message.sessionId);
          if (!session) {
            return { success: false, error: 'SESSION_NOT_FOUND' };
          }
          return { success: true, session };
        }
        return sendViaRuntime({
          type: 'GET_SESSION_DETAIL',
          sessionId: message.sessionId
        });
      case 'EXECUTE_COMMAND':
        if (typeof executeCommand === 'function') {
          return executeCommand(message.command);
        }
        return sendViaRuntime({
          type: 'EXECUTE_COMMAND',
          command: message.command
        });
      case 'GET_COLLECTION_STATS':
        if (typeof getCollectionStats === 'function') {
          return getCollectionStats({ days: message.days, topN: message.topN });
        }
        return sendViaRuntime({
          type: 'GET_COLLECTION_STATS',
          days: message.days,
          topN: message.topN
        });
      case 'TRACK_COLLECTION_STATS':
        if (typeof trackCollectionStats === 'function') {
          return trackCollectionStats(message.links, message.source);
        }
        return sendViaRuntime({
          type: 'TRACK_COLLECTION_STATS',
          links: message.links,
          source: message.source
        });
      default:
        return chrome.runtime.sendMessage(message);
    }
  }, payload);
}

async function setSelectionMode(context, page, enabled) {
  await sendActiveTabMessage(context, { type: 'SET_MODE', enabled });
  if (enabled) {
    await page.waitForFunction(() => document.body.classList.contains('catchurls-mode-on'));
    return;
  }
  await page.waitForFunction(() => !document.body.classList.contains('catchurls-mode-on'));
}

module.exports = {
  ensureContentScriptReady,
  getServiceWorker,
  sendActiveTabMessage,
  sendRuntimeMessage,
  setSelectionMode
};
