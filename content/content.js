(function() {
  'use strict';

  if (window.__catchUrlsLoaded) return;
  window.__catchUrlsLoaded = true;

  const state = {
    enabled: false,
    modifierKey: 'alt',
    language: 'en',
    toggleKeys: ['Control', 'Escape'],
    collectedLinks: new Map(),
    isDragging: false,
    dragStart: null,
    dragStartPage: null,
    lastPointer: null,
    autoScrollRafId: null,
    selectionBox: null,
    dragCounter: null,
    toastContainer: null,
    modeBadge: null,
    lastToggleTime: 0,
    exclusionFilters: [],
    disabledDomains: [],
    linkifyEnabled: false,
    linkifyAggressive: false,
    markAsVisited: false,
    dynamicLinkDetection: true,
    clearOnToggle: false,
    copyFormat: 'urls',
    copySeparator: '\n',
    autoCopy: true,
    mutationObserver: null
  };

  const TOGGLE_DEBOUNCE_MS = 300;
  const AUTO_SCROLL_EDGE_PX = 60;
  const AUTO_SCROLL_STEP_PX = 12;

  const i18n = {
    en: {
      selectionModeOn: 'Selection Mode ON',
      selectionModeOff: 'Selection Mode OFF',
      linksAdded: 'Added (total $1)',
      linksCopied: '$1 links copied',
      linksCopiedTotal: '$1 links copied (total $2)',
      alreadyAdded: 'Link already added',
      noNewLinks: 'No new links',
      cleared: 'Cleared',
      urlsToCopy: '$1 URLs to be copied',
      bookmarksCreated: '$1 bookmarks created',
      tabsOpened: 'Opening $1 tabs...',
      markedVisited: '$1 links marked as visited',
      appendedToClipboard: 'Appended $1 links to clipboard',
      domainDisabled: 'CatchUrls disabled on this domain',
      filterExcluded: '$1 links excluded by filter',
      singleLinkCopied: 'Link copied',
      patternInvalidRegex: 'Invalid regex pattern',
      patternInvalidSelector: 'Invalid CSS selector',
      patternRequiresInput: 'Pattern is required',
      sessionRestored: 'Session restored ($1 added, total $2)',
      sessionReplaced: 'Session replaced (total $1)'
    },
    ko: {
      selectionModeOn: '선택 모드 ON',
      selectionModeOff: '선택 모드 OFF',
      linksAdded: '추가됨 (현재 $1개)',
      linksCopied: '$1개 링크 복사됨',
      linksCopiedTotal: '$1개 링크 복사됨 (총 $2개)',
      alreadyAdded: '이미 추가된 링크입니다',
      noNewLinks: '새로운 링크 없음',
      cleared: '초기화됨',
      urlsToCopy: '$1개 URL 복사 예정',
      bookmarksCreated: '$1개 북마크 생성됨',
      tabsOpened: '$1개 탭 열기 중...',
      markedVisited: '$1개 링크 방문 표시됨',
      appendedToClipboard: '$1개 링크 클립보드에 추가됨',
      domainDisabled: '이 도메인에서 CatchUrls 비활성화됨',
      filterExcluded: '$1개 링크 필터에 의해 제외됨',
      singleLinkCopied: '링크 복사됨',
      patternInvalidRegex: '유효하지 않은 정규식 패턴',
      patternInvalidSelector: '유효하지 않은 CSS 선택자',
      patternRequiresInput: '패턴을 입력해주세요',
      sessionRestored: '세션 복원됨 ($1개 추가, 총 $2개)',
      sessionReplaced: '세션 교체됨 (총 $1개)'
    },
    ja: {
      selectionModeOn: '選択モード ON',
      selectionModeOff: '選択モード OFF',
      linksAdded: '追加しました (現在 $1個)',
      linksCopied: '$1個のリンクをコピーしました',
      linksCopiedTotal: '$1個のリンクをコピーしました (合計 $2個)',
      alreadyAdded: '既に追加済みのリンクです',
      noNewLinks: '新しいリンクはありません',
      cleared: 'クリアしました',
      urlsToCopy: '$1個のURLをコピー予定',
      bookmarksCreated: '$1個のブックマークを作成しました',
      tabsOpened: '$1個のタブを開いています...',
      markedVisited: '$1個のリンクを訪問済みにしました',
      appendedToClipboard: '$1個のリンクをクリップボードに追加しました',
      domainDisabled: 'このドメインでCatchUrlsは無効です',
      filterExcluded: '$1個のリンクがフィルターで除外されました',
      singleLinkCopied: 'リンクをコピーしました',
      patternInvalidRegex: '無効な正規表現パターンです',
      patternInvalidSelector: '無効なCSSセレクターです',
      patternRequiresInput: 'パターンを入力してください',
      sessionRestored: 'セッションを復元しました（$1件追加、合計$2件）',
      sessionReplaced: 'セッションを置換しました（合計$1件）'
    }
  };

  function t(key, ...args) {
    let str = i18n[state.language]?.[key] || i18n['en'][key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`$${i + 1}`, arg);
    });
    return str;
  }

  const EXCLUDED_SCHEMES = ['mailto:', 'tel:', 'javascript:', '#'];

  function init() {
    loadSettings().then(() => {
      if (isCurrentDomainDisabled()) {
        console.log('[CatchUrls] Disabled on this domain');
        return;
      }
      
      createSelectionBox();
      createToastContainer();
      setupEventListeners();
      
      if (state.dynamicLinkDetection) {
        setupMutationObserver();
      }
      
      if (state.linkifyEnabled) {
        linkifyPage();
      }
      
      console.log('[CatchUrls] Initialized with all features');
    });
  }

  async function loadSettings() {
    const result = await chrome.storage.local.get([
      'modifierKey', 'language', 'toggleKeys',
      'exclusionFilters', 'disabledDomains', 'linkifyEnabled',
      'linkifyAggressive', 'markAsVisited', 'dynamicLinkDetection', 'clearOnToggle',
      'copyFormat', 'copySeparator', 'autoCopy'
    ]);
    
    state.modifierKey = result.modifierKey || 'alt';
    state.language = result.language || navigator.language.split('-')[0] || 'en';
    if (!['en', 'ko', 'ja'].includes(state.language)) state.language = 'en';
    state.toggleKeys = result.toggleKeys || ['Control', 'Escape'];
    state.exclusionFilters = result.exclusionFilters || [];
    state.disabledDomains = result.disabledDomains || [];
    state.linkifyEnabled = result.linkifyEnabled || false;
    state.linkifyAggressive = result.linkifyAggressive || false;
    state.markAsVisited = result.markAsVisited || false;
    state.dynamicLinkDetection = result.dynamicLinkDetection !== false;
    state.clearOnToggle = result.clearOnToggle || false;
    state.copyFormat = result.copyFormat || 'urls';
    state.copySeparator = result.copySeparator || '\n';
    state.autoCopy = result.autoCopy !== false;
  }

  function isCurrentDomainDisabled() {
    const currentDomain = location.hostname;
    return state.disabledDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
  }

  function setupMutationObserver() {
    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
    }
    
    state.mutationObserver = new MutationObserver((mutations) => {
      if (!state.isDragging) return;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const newLinks = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
              if (newLinks.length > 0 || node.tagName === 'A') {
                highlightIntersectingLinks();
              }
            }
          });
        }
      }
    });
    
    state.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function linkifyPage() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement.closest('a, script, style, textarea, input, [contenteditable]')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    const urlPattern = state.linkifyAggressive
      ? /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi
      : /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi;

    textNodes.forEach(node => {
      const text = node.textContent;
      const matches = text.match(urlPattern);
      
      if (matches && matches.length > 0) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        
        let match;
        urlPattern.lastIndex = 0;
        while ((match = urlPattern.exec(text)) !== null) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          
          const link = document.createElement('a');
          let href = match[0];
          if (!href.startsWith('http')) {
            href = 'https://' + href;
          }
          link.href = href;
          link.textContent = match[0];
          link.classList.add('catchurls-linkified');
          fragment.appendChild(link);
          
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        
        node.parentNode.replaceChild(fragment, node);
      }
    });
  }

  function matchesExclusionFilter(url) {
    for (const filter of state.exclusionFilters) {
      try {
        if (filter.type === 'keyword') {
          if (url.toLowerCase().includes(filter.value.toLowerCase())) {
            return true;
          }
        } else if (filter.type === 'regex') {
          const regex = new RegExp(filter.value, 'i');
          if (regex.test(url)) {
            return true;
          }
        }
      } catch (e) {
        console.warn('[CatchUrls] Invalid filter:', filter, e);
      }
    }
    return false;
  }

  function createSelectionBox() {
    if (document.getElementById('catchurls-selection-box')) {
      state.selectionBox = document.getElementById('catchurls-selection-box');
      return;
    }
    
    const box = document.createElement('div');
    box.id = 'catchurls-selection-box';
    box.style.cssText = `
      position: fixed;
      border: 2px dashed #06B6D4;
      background: rgba(6, 182, 212, 0.15);
      pointer-events: none;
      z-index: 2147483646;
      border-radius: 4px;
      display: none;
    `;
    document.body.appendChild(box);
    state.selectionBox = box;
  }
  
  function createDragCounter() {
    if (document.getElementById('catchurls-drag-counter')) {
      state.dragCounter = document.getElementById('catchurls-drag-counter');
      return;
    }
    
    const counter = document.createElement('div');
    counter.id = 'catchurls-drag-counter';
    counter.style.cssText = `
      position: fixed;
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.9);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      white-space: nowrap;
    `;
    document.body.appendChild(counter);
    state.dragCounter = counter;
  }
  
  function updateDragCounter(count, x, y) {
    if (!state.dragCounter) {
      createDragCounter();
    }
    
    if (count > 0) {
      state.dragCounter.textContent = t('urlsToCopy', count);
      state.dragCounter.style.display = 'block';
      state.dragCounter.style.left = (x + 15) + 'px';
      state.dragCounter.style.top = (y + 15) + 'px';
    } else {
      state.dragCounter.style.display = 'none';
    }
  }
  
  function hideDragCounter() {
    if (state.dragCounter) {
      state.dragCounter.style.display = 'none';
    }
  }

  function createToastContainer() {
    if (document.getElementById('catchurls-toast-container')) {
      state.toastContainer = document.getElementById('catchurls-toast-container');
      return;
    }
    
    const container = document.createElement('div');
    container.id = 'catchurls-toast-container';
    document.body.appendChild(container);
    state.toastContainer = container;
  }

  function createModeBadge() {
    if (state.modeBadge) return;
    if (document.getElementById('catchurls-mode-badge')) {
      state.modeBadge = document.getElementById('catchurls-mode-badge');
      return;
    }
    
    const badge = document.createElement('div');
    badge.id = 'catchurls-mode-badge';
    badge.innerHTML = '<span class="badge-dot"></span> ' + t('selectionModeOn');
    badge.addEventListener('click', () => toggleMode());
    document.body.appendChild(badge);
    state.modeBadge = badge;
  }

  function removeModeBadge() {
    if (state.modeBadge) {
      state.modeBadge.remove();
      state.modeBadge = null;
    }
  }

  function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('blur', handleWindowBlur, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  function handleWindowBlur() {
    if (!state.isDragging) return;
    cleanupDragState();
  }

  function handleVisibilityChange() {
    if (!state.isDragging) return;
    if (document.visibilityState !== 'visible') {
      cleanupDragState();
    }
  }

  function stopAutoScrollLoop() {
    if (state.autoScrollRafId == null) return;
    cancelAnimationFrame(state.autoScrollRafId);
    state.autoScrollRafId = null;
  }

  function updateSelectionBoxFromPointer(clientX, clientY) {
    if (!state.selectionBox) return;
    if (!state.dragStartPage) return;

    const startPageX = state.dragStartPage.x;
    const startPageY = state.dragStartPage.y;
    const currentPageX = clientX + window.scrollX;
    const currentPageY = clientY + window.scrollY;

    const docLeft = Math.min(startPageX, currentPageX);
    const docTop = Math.min(startPageY, currentPageY);
    const docRight = Math.max(startPageX, currentPageX);
    const docBottom = Math.max(startPageY, currentPageY);

    const left = docLeft - window.scrollX;
    const top = docTop - window.scrollY;
    const width = docRight - docLeft;
    const height = docBottom - docTop;

    state.selectionBox.style.left = left + 'px';
    state.selectionBox.style.top = top + 'px';
    state.selectionBox.style.width = width + 'px';
    state.selectionBox.style.height = height + 'px';
  }

  function startAutoScrollLoop() {
    if (state.autoScrollRafId != null) return;

    const tick = () => {
      if (!state.enabled || !state.isDragging) {
        stopAutoScrollLoop();
        return;
      }

      const pointer = state.lastPointer;
      if (!pointer) {
        state.autoScrollRafId = requestAnimationFrame(tick);
        return;
      }

      const vh = window.innerHeight;
      let dy = 0;
      if (pointer.y <= AUTO_SCROLL_EDGE_PX) {
        dy = -AUTO_SCROLL_STEP_PX;
      } else if (pointer.y >= vh - AUTO_SCROLL_EDGE_PX) {
        dy = AUTO_SCROLL_STEP_PX;
      }

      if (dy !== 0) {
        const beforeY = window.scrollY;
        window.scrollBy(0, dy);
        const afterY = window.scrollY;

        if (afterY !== beforeY) {
          updateSelectionBoxFromPointer(pointer.x, pointer.y);
          const intersectingCount = highlightIntersectingLinks();
          updateDragCounter(intersectingCount, pointer.x, pointer.y);
        }
      }

      state.autoScrollRafId = requestAnimationFrame(tick);
    };

    state.autoScrollRafId = requestAnimationFrame(tick);
  }

  function handleKeyDown(e) {
    if (e.repeat) return;
    
    if (checkToggleKeysPressed(e)) {
      const now = Date.now();
      if (now - state.lastToggleTime < TOGGLE_DEBOUNCE_MS) {
        e.preventDefault();
        return;
      }
      state.lastToggleTime = now;
      toggleMode();
      e.preventDefault();
      return;
    }
    
    if (!state.enabled) return;
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && state.collectedLinks.size > 0) {
      const selection = window.getSelection();
      if (selection.toString().length === 0) {
        e.preventDefault();
        copyToClipboard();
        showToast(t('linksCopied', state.collectedLinks.size), 'success');
      }
    }
  }
  
  function checkToggleKeysPressed(e) {
    const keys = state.toggleKeys;
    if (!keys || keys.length === 0) return false;
    
    const modifiers = {
      'Control': e.ctrlKey,
      'Alt': e.altKey,
      'Shift': e.shiftKey,
      'Meta': e.metaKey
    };
    
    const pressedKey = e.code;
    
    for (const key of keys) {
      if (modifiers[key] !== undefined) {
        if (!modifiers[key]) return false;
      } else {
        if (pressedKey !== key) return false;
      }
    }
    
    const requiredModifiers = keys.filter(k => modifiers[k] !== undefined);
    const activeModifiers = Object.entries(modifiers).filter(([_, v]) => v).map(([k]) => k);
    
    for (const active of activeModifiers) {
      if (!requiredModifiers.includes(active)) {
        const nonModifierKey = keys.find(k => modifiers[k] === undefined);
        if (nonModifierKey) return false;
      }
    }
    
    return true;
  }

  function handleClick(e) {
    if (!state.enabled) return;
    
    const link = e.target.closest('a[href]');
    if (!link) return;
    
    const isModifierPressed = checkModifier(e);
    
    if (isModifierPressed) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const url = normalizeUrl(link.href);
      if (url && !state.collectedLinks.has(url)) {
        if (matchesExclusionFilter(url)) {
          showToast(t('filterExcluded', 1), 'info');
          return;
        }
        
        const title = getLinkTitle(link);
        state.collectedLinks.set(url, { url, title });
        trackCollectionStats([{ url, title }], 'manual');
        highlightLink(link);
        if (state.autoCopy) {
          copyToClipboard();
          showToast(t('linksAdded', state.collectedLinks.size), 'success');
        } else {
          showToast(t('linksAdded', state.collectedLinks.size), 'info');
        }
        notifyStateUpdate();
      } else if (state.collectedLinks.has(url)) {
        showToast(t('alreadyAdded'), 'info');
      }
    }
  }

  function handleContextMenu(e) {
    if (!state.enabled) return;
    
    const link = e.target.closest('a[href]');
    if (!link) return;
    
    const url = normalizeUrl(link.href);
    if (!url) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    copyUrlToClipboard(url);
    showToast(t('singleLinkCopied'), 'success');
  }

  function checkModifier(e) {
    switch (state.modifierKey) {
      case 'alt': return e.altKey;
      case 'ctrl': return e.ctrlKey;
      case 'meta': return e.metaKey;
      case 'shift': return e.shiftKey;
      default: return e.altKey;
    }
  }

  function handleMouseDown(e) {
    if (!state.enabled) return;
    if (e.button !== 0) return;
    if (checkModifier(e)) return;
    
    const interactiveElement = e.target.closest('button, input, select, textarea, [contenteditable="true"]');
    if (interactiveElement) return;
    
    state.isDragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY };
    state.dragStartPage = { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
    state.lastPointer = { x: e.clientX, y: e.clientY };
    
    if (!state.selectionBox) {
      createSelectionBox();
    }
    
    state.selectionBox.style.display = 'block';
    updateSelectionBoxFromPointer(e.clientX, e.clientY);

    startAutoScrollLoop();
    
    e.preventDefault();
    e.stopPropagation();
  }

  function handleMouseMove(e) {
    if (!state.isDragging) return;
    if (!state.selectionBox) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;

    state.lastPointer = { x: currentX, y: currentY };
    updateSelectionBoxFromPointer(currentX, currentY);
    
    const intersectingCount = highlightIntersectingLinks();
    updateDragCounter(intersectingCount, currentX, currentY);
    
    e.preventDefault();
  }

  function handleMouseUp(e) {
    if (!state.isDragging) return;
    
    state.isDragging = false;
    stopAutoScrollLoop();
    hideDragCounter();
    
    if (state.selectionBox) {
      const links = getIntersectingLinks();
      state.selectionBox.style.display = 'none';
      clearTempHighlights();
      
      if (links.length > 0) {
        let addedCount = 0;
        let excludedCount = 0;
        const addedLinks = [];
        
        links.forEach(link => {
          const url = normalizeUrl(link.href);
          if (url && !state.collectedLinks.has(url)) {
            if (matchesExclusionFilter(url)) {
              excludedCount++;
              return;
            }
            const title = getLinkTitle(link);
            state.collectedLinks.set(url, { url, title });
            addedLinks.push({ url, title });
            highlightLink(link);
            addedCount++;
          }
        });
        
        if (addedCount > 0) {
          trackCollectionStats(addedLinks, 'manual');
          if (state.autoCopy) {
            copyToClipboard();
            showToast(t('linksCopiedTotal', addedCount, state.collectedLinks.size), 'success');
          } else {
            showToast(t('linksAdded', state.collectedLinks.size), 'info');
          }
          notifyStateUpdate();
        } else if (excludedCount > 0) {
          showToast(t('filterExcluded', excludedCount), 'info');
        } else {
          showToast(t('noNewLinks'), 'info');
        }
      }
    }
    
    e.preventDefault();
  }

  function getLinkTitle(link) {
    let title = link.title || link.innerText.trim() || link.getAttribute('aria-label') || '';
    
    title = title.replace(/\s+/g, ' ').trim();
    
    if (title.length > 200) {
      title = title.substring(0, 197) + '...';
    }
    
    return title || new URL(link.href).pathname;
  }

  function getIntersectingLinks() {
    if (!state.selectionBox) return [];
    
    const boxRect = state.selectionBox.getBoundingClientRect();
    
    if (boxRect.width < 5 && boxRect.height < 5) {
      return [];
    }
    
    const allLinks = document.querySelectorAll('a[href]');
    const intersecting = [];
    
    allLinks.forEach(link => {
      if (!isElementVisible(link)) return;
      
      const linkRect = link.getBoundingClientRect();
      if (rectsIntersect(boxRect, linkRect)) {
        intersecting.push(link);
      }
    });
    
    return intersecting;
  }

  function isElementVisible(el) {
    if (!el) return false;
    
    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    
    return true;
  }

  function rectsIntersect(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function highlightIntersectingLinks() {
    clearTempHighlights();
    
    if (!state.selectionBox) return 0;
    
    const boxRect = state.selectionBox.getBoundingClientRect();
    const allLinks = document.querySelectorAll('a[href]');
    let count = 0;
    const seenUrls = new Set();
    
    allLinks.forEach(link => {
      if (!isElementVisible(link)) return;
      
      const linkRect = link.getBoundingClientRect();
      if (rectsIntersect(boxRect, linkRect)) {
        const url = normalizeUrl(link.href);
        if (url && !state.collectedLinks.has(url) && !seenUrls.has(url)) {
          if (!matchesExclusionFilter(url)) {
            seenUrls.add(url);
            link.classList.add('catchurls-temp-highlight');
            count++;
          }
        }
      }
    });
    
    return count;
  }

  function clearTempHighlights() {
    document.querySelectorAll('.catchurls-temp-highlight').forEach(el => {
      el.classList.remove('catchurls-temp-highlight');
    });
  }

  function normalizeUrl(href) {
    if (!href) return null;
    
    for (const scheme of EXCLUDED_SCHEMES) {
      if (href.startsWith(scheme) || href === '#') return null;
    }
    
    try {
      const url = new URL(href, location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url.href;
    } catch {
      return null;
    }
  }

  async function copyUrlToClipboard(url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  function highlightLink(element) {
    if (state.enabled) {
      element.classList.add('catchurls-selected');
      element.classList.remove('catchurls-selected-hidden');
      return;
    }

    element.classList.remove('catchurls-selected');
    element.classList.add('catchurls-selected-hidden');
  }

  function clearAllHighlights() {
    document.querySelectorAll('.catchurls-selected, .catchurls-selected-hidden').forEach(el => {
      el.classList.remove('catchurls-selected');
      el.classList.remove('catchurls-selected-hidden');
    });
  }

  function hideAllHighlights() {
    document.querySelectorAll('.catchurls-selected').forEach(el => {
      el.classList.remove('catchurls-selected');
      el.classList.add('catchurls-selected-hidden');
    });
  }

  function showAllHighlights() {
    document.querySelectorAll('.catchurls-selected-hidden').forEach(el => {
      el.classList.remove('catchurls-selected-hidden');
      el.classList.add('catchurls-selected');
    });
  }

  function highlightLinksByUrl(targetUrl) {
    document.querySelectorAll('a[href]').forEach(link => {
      const normalized = normalizeUrl(link.href);
      if (normalized === targetUrl) {
        highlightLink(link);
      }
    });
  }

  function normalizeImportedLinks(links) {
    if (!Array.isArray(links)) return [];

    const normalizedLinks = [];
    const seen = new Set();

    for (const link of links) {
      if (!link || typeof link.url !== 'string') continue;

      const normalizedUrl = normalizeUrl(link.url);
      if (!normalizedUrl || seen.has(normalizedUrl)) continue;

      seen.add(normalizedUrl);
      const title = typeof link.title === 'string' ? link.title.trim() : '';

      normalizedLinks.push({
        url: normalizedUrl,
        title: title || normalizedUrl
      });
    }

    return normalizedLinks;
  }

  function applyImportedLinks(links, replaceExisting = false) {
    const normalizedLinks = normalizeImportedLinks(links);

    if (replaceExisting) {
      state.collectedLinks.clear();
      clearAllHighlights();
    }

    let addedCount = 0;
    const addedLinks = [];
    for (const link of normalizedLinks) {
      if (state.collectedLinks.has(link.url)) continue;
      state.collectedLinks.set(link.url, { url: link.url, title: link.title });
      addedLinks.push({ url: link.url, title: link.title });
      highlightLinksByUrl(link.url);
      addedCount++;
    }

    trackCollectionStats(addedLinks, 'import');
    notifyStateUpdate();

    return {
      success: true,
      addedCount,
      totalCount: state.collectedLinks.size
    };
  }

  function resolvePatternMatches(patternType, pattern) {
    const trimmedPattern = typeof pattern === 'string' ? pattern.trim() : '';
    if (!trimmedPattern) {
      return { success: false, error: 'EMPTY_PATTERN' };
    }

    const targetPatternType = patternType === 'css' ? 'css' : 'regex';
    const candidates = [];

    if (targetPatternType === 'css') {
      let nodes;
      try {
        nodes = Array.from(document.querySelectorAll(trimmedPattern));
      } catch {
        return { success: false, error: 'INVALID_SELECTOR' };
      }

      nodes.forEach(node => {
        if (node.matches && node.matches('a[href]')) {
          candidates.push(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('a[href]').forEach(link => candidates.push(link));
        }
      });
    } else {
      let regex;
      try {
        regex = new RegExp(trimmedPattern, 'i');
      } catch {
        return { success: false, error: 'INVALID_REGEX' };
      }

      document.querySelectorAll('a[href]').forEach(link => {
        const normalizedUrl = normalizeUrl(link.href);
        if (!normalizedUrl) return;
        if (regex.test(normalizedUrl)) {
          candidates.push(link);
        }
      });
    }

    const matches = [];
    const seen = new Set();
    let excludedCount = 0;

    for (const candidate of candidates) {
      const normalizedUrl = normalizeUrl(candidate.href);
      if (!normalizedUrl || seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);

      if (matchesExclusionFilter(normalizedUrl)) {
        excludedCount++;
        continue;
      }

      matches.push({
        url: normalizedUrl,
        title: getLinkTitle(candidate),
        element: candidate
      });
    }

    return {
      success: true,
      matches,
      excludedCount
    };
  }

  function previewPatternMatches(patternType, pattern) {
    const resolved = resolvePatternMatches(patternType, pattern);
    if (!resolved.success) return resolved;

    const newCount = resolved.matches.filter(link => !state.collectedLinks.has(link.url)).length;
    return {
      success: true,
      matchedCount: resolved.matches.length,
      newCount,
      excludedCount: resolved.excludedCount
    };
  }

  function collectLinksByPattern(patternType, pattern) {
    const resolved = resolvePatternMatches(patternType, pattern);
    if (!resolved.success) return resolved;

    let addedCount = 0;
    let existingCount = 0;
    const addedLinks = [];

    for (const link of resolved.matches) {
      if (state.collectedLinks.has(link.url)) {
        existingCount++;
        continue;
      }

      state.collectedLinks.set(link.url, { url: link.url, title: link.title });
      addedLinks.push({ url: link.url, title: link.title });
      highlightLink(link.element);
      addedCount++;
    }

    if (addedCount > 0) {
      trackCollectionStats(addedLinks, 'pattern');
      if (state.autoCopy) {
        copyToClipboard();
      }
      notifyStateUpdate();
    }

    return {
      success: true,
      addedCount,
      existingCount,
      excludedCount: resolved.excludedCount,
      totalCount: state.collectedLinks.size,
      matchedCount: resolved.matches.length
    };
  }

  function clearLinks() {
    state.collectedLinks.clear();
    clearAllHighlights();
    notifyStateUpdate();
  }

  async function copyToClipboard(format = 'urls', separator = '\n') {
    if (state.collectedLinks.size === 0) return false;
    
    const linksArray = Array.from(state.collectedLinks.values());
    let text = '';
    
    switch (format) {
      case 'urls':
        text = linksArray.map(l => l.url).join(separator);
        break;
      case 'titles':
        text = linksArray.map(l => l.title || l.url).join(separator);
        break;
      case 'title-url':
        text = linksArray.map(l => `${l.title || 'Untitled'}\n${l.url}`).join('\n\n');
        break;
      case 'title-tab-url':
        text = linksArray.map(l => `${l.title || 'Untitled'}\t${l.url}`).join('\n');
        break;
      case 'markdown':
        text = linksArray.map(l => `[${l.title || l.url}](${l.url})`).join('\n');
        break;
      case 'html':
        text = linksArray.map(l => `<a href="${l.url}">${l.title || l.url}</a>`).join('\n');
        break;
      case 'json':
        text = JSON.stringify(linksArray, null, 2);
        break;
      default:
        text = linksArray.map(l => l.url).join(separator);
    }
    
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  async function appendToClipboard() {
    if (state.collectedLinks.size === 0) return false;
    
    // Disabled: permission removed in v1
    // try {
    //   const existingText = await navigator.clipboard.readText();
    //   const newUrls = Array.from(state.collectedLinks.values()).map(l => l.url).join('\n');
    //   const combined = existingText ? existingText + '\n' + newUrls : newUrls;
    //   await navigator.clipboard.writeText(combined);
    //   return true;
    // } catch {
    //   return copyToClipboard();
    // }
    
    // Fallback: just copy without appending
    return copyToClipboard();
  }

  function trackCollectionStats(addedLinks, source = 'manual') {
    if (!Array.isArray(addedLinks) || addedLinks.length === 0) return;

    chrome.runtime.sendMessage({
      type: 'TRACK_COLLECTION_STATS',
      links: addedLinks,
      source
    }).catch(() => {});
  }

  function showToast(message, type = 'success') {
    if (!state.toastContainer) {
      createToastContainer();
    }
    
    const toast = document.createElement('div');
    toast.className = `catchurls-toast ${type}`;
    toast.textContent = message;
    
    state.toastContainer.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  function toggleMode() {
    state.enabled = !state.enabled;
    document.body.classList.toggle('catchurls-mode-on', state.enabled);
    
    if (state.enabled) {
      createModeBadge();
      showAllHighlights();
      showToast(t('selectionModeOn'), 'info');
    } else {
      removeModeBadge();
      cleanupDragState();
      if (state.clearOnToggle) {
        clearLinks();
        showToast(t('cleared'), 'info');
      } else {
        hideAllHighlights();
        showToast(t('selectionModeOff'), 'info');
      }
    }
    
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_BADGE', 
      enabled: state.enabled 
    });
    
    notifyStateUpdate();
  }
  
  function cleanupDragState() {
    state.isDragging = false;
    stopAutoScrollLoop();
    state.dragStart = null;
    state.dragStartPage = null;
    state.lastPointer = null;
    
    if (state.selectionBox) {
      state.selectionBox.style.display = 'none';
    }
    
    hideDragCounter();
    clearTempHighlights();
  }

  function setMode(enabled) {
    state.enabled = enabled;
    document.body.classList.toggle('catchurls-mode-on', enabled);
    
    if (enabled) {
      createModeBadge();
      showAllHighlights();
    } else {
      removeModeBadge();
      cleanupDragState();
      hideAllHighlights();
    }
    
    notifyStateUpdate();
  }

  function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'PING':
        sendResponse({ pong: true });
        return true;
      
      case 'GET_STATE':
        sendResponse({
          enabled: state.enabled,
          collectedCount: state.collectedLinks.size,
          collectedLinks: Array.from(state.collectedLinks.values())
        });
        return true;
      
      case 'SET_MODE':
        setMode(message.enabled);
        chrome.runtime.sendMessage({ 
          type: 'UPDATE_BADGE', 
          enabled: message.enabled 
        });
        sendResponse({ success: true });
        return true;
      
      case 'SET_MODIFIER':
        state.modifierKey = message.modifier;
        sendResponse({ success: true });
        return true;
      
      case 'SET_CLEAR_ON_TOGGLE':
        state.clearOnToggle = message.enabled;
        sendResponse({ success: true });
        return true;
      
      case 'SET_LANGUAGE':
        state.language = message.language;
        if (state.modeBadge) {
          state.modeBadge.innerHTML = '<span class="badge-dot"></span> ' + t('selectionModeOn');
        }
        sendResponse({ success: true });
        return true;
      
      case 'SET_TOGGLE_KEY':
        state.toggleKeys = message.toggleKeys;
        sendResponse({ success: true });
        return true;
      
      case 'COPY_LINKS':
        const format = message.format || 'urls';
        const separator = message.separator || '\n';
        copyToClipboard(format, separator).then((copied) => {
          if (copied && state.collectedLinks.size > 0) {
            showToast(t('linksCopied', state.collectedLinks.size), 'success');
          }
          sendResponse({ copied: Boolean(copied), count: state.collectedLinks.size });
        });
        return true;
      
      case 'APPEND_CLIPBOARD':
        appendToClipboard().then(() => {
          showToast(t('appendedToClipboard', state.collectedLinks.size), 'success');
          sendResponse({ success: true, count: state.collectedLinks.size });
        });
        return true;
      
      case 'CLEAR_LINKS':
        clearLinks();
        showToast(t('cleared'), 'info');
        sendResponse({ success: true });
        return true;
      
      case 'SET_EXCLUSION_FILTERS':
        state.exclusionFilters = message.filters || [];
        sendResponse({ success: true });
        return true;
      
      case 'SET_DISABLED_DOMAINS':
        state.disabledDomains = message.domains || [];
        sendResponse({ success: true });
        return true;
      
      case 'SET_LINKIFY':
        state.linkifyEnabled = message.enabled;
        state.linkifyAggressive = message.aggressive || false;
        if (state.linkifyEnabled) {
          linkifyPage();
        }
        sendResponse({ success: true });
        return true;
      
      case 'SET_MARK_VISITED':
        state.markAsVisited = message.enabled;
        sendResponse({ success: true });
        return true;
      
      case 'GET_COLLECTED_LINKS':
        sendResponse({
          links: Array.from(state.collectedLinks.values())
        });
        return true;

      case 'PREVIEW_PATTERN_COLLECTION':
        sendResponse(previewPatternMatches(message.patternType, message.pattern));
        return true;

      case 'COLLECT_BY_PATTERN':
        sendResponse(collectLinksByPattern(message.patternType, message.pattern));
        return true;

      case 'MERGE_LINKS':
        sendResponse(applyImportedLinks(message.links, false));
        return true;

      case 'REPLACE_LINKS':
        sendResponse(applyImportedLinks(message.links, true));
        return true;
    }
  }

  function notifyStateUpdate() {
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      state: {
        enabled: state.enabled,
        collectedCount: state.collectedLinks.size,
        collectedLinks: Array.from(state.collectedLinks.values())
      }
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
