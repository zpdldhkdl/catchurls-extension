document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const modifierSelect = document.getElementById('modifierSelect');
  const copyFormatSelect = document.getElementById('copyFormatSelect');
  const themeSelect = document.getElementById('themeSelect');
  const languageSelect = document.getElementById('languageSelect');
  const toggleKeyBtn = document.getElementById('toggleKeyBtn');
  const currentToggleKey = document.getElementById('currentToggleKey');
  const linkCount = document.getElementById('linkCount');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const appendBtn = document.getElementById('appendBtn');
  const openTabsBtn = document.getElementById('openTabsBtn');
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  const markVisitedBtn = document.getElementById('markVisitedBtn');
  const reverseBtn = document.getElementById('reverseBtn');
  const patternTypeSelect = document.getElementById('patternTypeSelect');
  const patternInput = document.getElementById('patternInput');
  const previewPatternBtn = document.getElementById('previewPatternBtn');
  const collectPatternBtn = document.getElementById('collectPatternBtn');
  const patternPreviewText = document.getElementById('patternPreviewText');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const sessionList = document.getElementById('sessionList');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const importMergeBtn = document.getElementById('importMergeBtn');
  const importReplaceBtn = document.getElementById('importReplaceBtn');
  const importFileInput = document.getElementById('importFileInput');
  const statsTotalValue = document.getElementById('statsTotalValue');
  const statsTrendBars = document.getElementById('statsTrendBars');
  const statsTopDomains = document.getElementById('statsTopDomains');
  const optionsBtn = document.getElementById('optionsBtn');
  const rateBtn = document.getElementById('rateBtn');
  const feedbackBtn = document.getElementById('feedbackBtn');
  const toastContainer = document.getElementById('toastContainer');
  const linkTransfer = window.CatchUrlsLinkTransfer;
  const CWS_URL = 'https://chromewebstore.google.com/detail/catchurls/lmffpcdgghhgjcgolflnpjnciedohojo';
  const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScLzh8iHHkRTulaW1pU6Z-gMq3CpaRVcOyyhU9xZeVckf8ITg/viewform';

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

  let contentScriptReady = false;
  let currentLang = 'en';
  let isCapturingKey = false;
  let currentToggleKeys = ['Control', 'Escape'];
  let collectedLinks = [];
  let sessions = [];
  let isReversed = false;
  let selectedTheme = 'system';
  let pendingImportMode = 'merge';
  let statsRefreshTimer = null;
  let lastCollectionStats = {
    totalAdded: 0,
    trend: [],
    topDomains: []
  };
  const prefersLightQuery = window.matchMedia('(prefers-color-scheme: light)');

  const i18nStrings = {
    en: {
      selectionMode: 'Selection Mode',
      modifierKey: 'Hotkey (e.g., Alt)',
      copyFormat: 'Copy Format',
      language: 'Language',
      toggleKey: 'Toggle Key',
      pressAnyKey: 'Press any key...',
      copyLinks: 'Copy All',
      clearAll: 'Clear',
      appendClipboard: 'Append',
      openTabs: 'Open Tabs',
      createBookmarks: 'Bookmark',
      markVisited: 'Mark Visited',
      reverse: 'Reverse',
      modeOn: 'ON',
      modeOff: 'OFF',
      modeNA: 'N/A',
      copied: 'Copied!',
      collectedLinks: 'links collected',
      escHint: 'to toggle on page',
      dragHint: 'Drag to select area',
      clickHint: 'Hotkey+click to add',
      linksCopied: '$1 links copied',
      cleared: 'Cleared',
      scriptInjectionFailed: 'Script injection failed. Please refresh the page.',
      pageNotSupported: 'This page is not supported',
      refreshAndRetry: 'Please refresh and try again',
      copyFailed: 'Copy failed',
      clearFailed: 'Clear failed',
      keySet: 'Toggle key set to $1',
      bookmarksCreated: '$1 bookmarks created',
      tabsOpened: 'Opening $1 tabs...',
      markedVisited: '$1 links marked as visited',
      appendedToClipboard: 'Appended to clipboard',
      reversed: 'Order reversed',
      rateUs: '⭐ Rate Us',
      feedback: '💬 Feedback',
      patternCollect: 'Pattern Collect',
      patternTypeRegex: 'Regex',
      patternTypeCss: 'CSS Selector',
      patternPlaceholderRegex: 'example\\\\.com/news/',
      patternPlaceholderCss: '.article-list a',
      previewPattern: 'Preview',
      collectPattern: 'Collect',
      patternHint: 'Enter pattern and preview',
      patternPreviewResult: '$1 matched / $2 new',
      patternCollected: '$1 links collected (total $2)',
      patternNoMatches: 'No links matched',
      patternInvalidRegex: 'Invalid regex pattern',
      patternInvalidSelector: 'Invalid CSS selector',
      patternInputRequired: 'Please enter a pattern',
      sessionHistory: 'Session History',
      saveSession: 'Save',
      noSessions: 'No saved sessions',
      sessionLinks: '$1 links',
      sessionSaved: 'Session saved ($1 links)',
      sessionSaveFailed: 'Failed to save session',
      noLinksToSave: 'No links to save',
      sessionMerged: 'Session merged ($1 added, total $2)',
      sessionReplaced: 'Session replaced (total $1)',
      sessionDeleted: 'Session deleted',
      restoreMerge: 'Merge',
      restoreReplace: 'Replace',
      deleteSession: 'Delete',
      sessionOpFailed: 'Session action failed',
      theme: 'Theme',
      themeSystem: 'System',
      themeDark: 'Dark',
      themeLight: 'Light',
      dataIO: 'Data Transfer',
      exportJson: 'Export JSON',
      exportCsv: 'Export CSV',
      importMerge: 'Import Merge',
      importReplace: 'Import Replace',
      exportFailed: 'Export failed',
      noLinksToExport: 'No links to export',
      exportedJson: 'JSON exported ($1 links)',
      exportedCsv: 'CSV exported ($1 links)',
      importReadFailed: 'Failed to read file',
      importFailed: 'Import failed',
      importMerged: 'Import merged ($1 added, total $2)',
      importReplaced: 'Import replaced (total $1)',
      importEmptyFile: 'File is empty',
      importInvalidJson: 'Invalid JSON file',
      importInvalidCsv: 'Invalid CSV file',
      importNoValidLinks: 'No valid links found',
      importUnsupportedType: 'Unsupported file type',
      statsDashboard: 'Collection Stats',
      statsTotalLabel: 'Total added',
      statsTrend7Days: 'Last 7 days',
      statsTopDomains: 'Top domains',
      statsNoData: 'No data'
    },
    ko: {
      selectionMode: '선택 모드',
      modifierKey: '단축키(Alt 등)',
      copyFormat: '복사 형식',
      language: '언어',
      toggleKey: '토글 키',
      pressAnyKey: '아무 키나 누르세요...',
      copyLinks: '복사',
      clearAll: '삭제',
      appendClipboard: '추가',
      openTabs: '탭 열기',
      createBookmarks: '북마크',
      markVisited: '방문 표시',
      reverse: '역순',
      modeOn: 'ON',
      modeOff: 'OFF',
      modeNA: 'N/A',
      copied: '복사됨!',
      collectedLinks: '개 링크 수집',
      escHint: '키로 페이지에서 토글',
      dragHint: '드래그로 영역 선택',
      clickHint: '단축키+클릭으로 개별 추가',
      linksCopied: '$1개 링크 복사됨',
      cleared: '초기화됨',
      scriptInjectionFailed: '스크립트 주입 실패. 페이지를 새로고침해주세요.',
      pageNotSupported: '이 페이지에서는 사용할 수 없습니다',
      refreshAndRetry: '페이지를 새로고침 후 다시 시도해주세요',
      copyFailed: '복사 실패',
      clearFailed: '초기화 실패',
      keySet: '토글 키가 $1(으)로 설정됨',
      bookmarksCreated: '$1개 북마크 생성됨',
      tabsOpened: '$1개 탭 열기 중...',
      markedVisited: '$1개 링크 방문 표시됨',
      appendedToClipboard: '클립보드에 추가됨',
      reversed: '순서 역전됨',
      rateUs: '⭐ 평가하기',
      feedback: '💬 피드백',
      patternCollect: '패턴 수집',
      patternTypeRegex: '정규식',
      patternTypeCss: 'CSS 선택자',
      patternPlaceholderRegex: 'example\\\\.com/news/',
      patternPlaceholderCss: '.article-list a',
      previewPattern: '미리보기',
      collectPattern: '수집',
      patternHint: '패턴 입력 후 미리보기를 실행하세요',
      patternPreviewResult: '매칭 $1개 / 신규 $2개',
      patternCollected: '$1개 링크 수집됨 (총 $2개)',
      patternNoMatches: '매칭되는 링크가 없습니다',
      patternInvalidRegex: '유효하지 않은 정규식 패턴',
      patternInvalidSelector: '유효하지 않은 CSS 선택자',
      patternInputRequired: '패턴을 입력해주세요',
      sessionHistory: '세션 히스토리',
      saveSession: '저장',
      noSessions: '저장된 세션이 없습니다',
      sessionLinks: '$1개 링크',
      sessionSaved: '세션 저장됨 ($1개 링크)',
      sessionSaveFailed: '세션 저장 실패',
      noLinksToSave: '저장할 링크가 없습니다',
      sessionMerged: '세션 병합됨 ($1개 추가, 총 $2개)',
      sessionReplaced: '세션 교체됨 (총 $1개)',
      sessionDeleted: '세션 삭제됨',
      restoreMerge: '병합',
      restoreReplace: '교체',
      deleteSession: '삭제',
      sessionOpFailed: '세션 작업 실패',
      theme: '테마',
      themeSystem: '시스템',
      themeDark: '다크',
      themeLight: '라이트',
      dataIO: '데이터 이동',
      exportJson: 'JSON 내보내기',
      exportCsv: 'CSV 내보내기',
      importMerge: '병합 가져오기',
      importReplace: '교체 가져오기',
      exportFailed: '내보내기 실패',
      noLinksToExport: '내보낼 링크가 없습니다',
      exportedJson: 'JSON 내보내기 완료 ($1개)',
      exportedCsv: 'CSV 내보내기 완료 ($1개)',
      importReadFailed: '파일 읽기에 실패했습니다',
      importFailed: '가져오기 실패',
      importMerged: '가져오기 병합됨 ($1개 추가, 총 $2개)',
      importReplaced: '가져오기 교체됨 (총 $1개)',
      importEmptyFile: '파일이 비어 있습니다',
      importInvalidJson: '유효하지 않은 JSON 파일',
      importInvalidCsv: '유효하지 않은 CSV 파일',
      importNoValidLinks: '유효한 링크가 없습니다',
      importUnsupportedType: '지원하지 않는 파일 형식입니다',
      statsDashboard: '수집 통계',
      statsTotalLabel: '총 추가 수',
      statsTrend7Days: '최근 7일',
      statsTopDomains: '상위 도메인',
      statsNoData: '데이터 없음'
    },
    ja: {
      selectionMode: '選択モード',
      modifierKey: 'ホットキー（Altなど）',
      copyFormat: 'コピー形式',
      language: '言語',
      toggleKey: 'トグルキー',
      pressAnyKey: '任意のキーを押してください...',
      copyLinks: 'コピー',
      clearAll: '削除',
      appendClipboard: '追加',
      openTabs: 'タブを開く',
      createBookmarks: 'ブックマーク',
      markVisited: '訪問済み',
      reverse: '逆順',
      modeOn: 'ON',
      modeOff: 'OFF',
      modeNA: 'N/A',
      copied: 'コピー完了!',
      collectedLinks: '個のリンクを収集',
      escHint: 'でページ上で切り替え',
      dragHint: 'ドラッグで範囲選択',
      clickHint: 'ホットキー+クリックで追加',
      linksCopied: '$1個のリンクをコピーしました',
      cleared: 'クリアしました',
      scriptInjectionFailed: 'スクリプト挿入に失敗しました。ページを更新してください。',
      pageNotSupported: 'このページでは使用できません',
      refreshAndRetry: 'ページを更新してから再試行してください',
      copyFailed: 'コピーに失敗しました',
      clearFailed: 'クリアに失敗しました',
      keySet: 'トグルキーが$1に設定されました',
      bookmarksCreated: '$1個のブックマークを作成しました',
      tabsOpened: '$1個のタブを開いています...',
      markedVisited: '$1個のリンクを訪問済みにしました',
      appendedToClipboard: 'クリップボードに追加しました',
      reversed: '順序を逆転しました',
      rateUs: '⭐ 評価する',
      feedback: '💬 フィードバック',
      patternCollect: 'パターン収集',
      patternTypeRegex: '正規表現',
      patternTypeCss: 'CSSセレクター',
      patternPlaceholderRegex: 'example\\\\.com/news/',
      patternPlaceholderCss: '.article-list a',
      previewPattern: 'プレビュー',
      collectPattern: '収集',
      patternHint: 'パターンを入力してプレビュー',
      patternPreviewResult: '$1件一致 / 新規$2件',
      patternCollected: '$1件のリンクを収集（合計$2件）',
      patternNoMatches: '一致するリンクがありません',
      patternInvalidRegex: '無効な正規表現パターンです',
      patternInvalidSelector: '無効なCSSセレクターです',
      patternInputRequired: 'パターンを入力してください',
      sessionHistory: 'セッション履歴',
      saveSession: '保存',
      noSessions: '保存されたセッションがありません',
      sessionLinks: '$1件のリンク',
      sessionSaved: 'セッションを保存しました（$1件）',
      sessionSaveFailed: 'セッション保存に失敗しました',
      noLinksToSave: '保存するリンクがありません',
      sessionMerged: 'セッションをマージしました（$1件追加、合計$2件）',
      sessionReplaced: 'セッションを置換しました（合計$1件）',
      sessionDeleted: 'セッションを削除しました',
      restoreMerge: 'マージ',
      restoreReplace: '置換',
      deleteSession: '削除',
      sessionOpFailed: 'セッション操作に失敗しました',
      theme: 'テーマ',
      themeSystem: 'システム',
      themeDark: 'ダーク',
      themeLight: 'ライト',
      dataIO: 'データ転送',
      exportJson: 'JSONを書き出し',
      exportCsv: 'CSVを書き出し',
      importMerge: 'マージで取り込み',
      importReplace: '置換で取り込み',
      exportFailed: '書き出しに失敗しました',
      noLinksToExport: '書き出すリンクがありません',
      exportedJson: 'JSONを書き出しました（$1件）',
      exportedCsv: 'CSVを書き出しました（$1件）',
      importReadFailed: 'ファイルの読み込みに失敗しました',
      importFailed: '取り込みに失敗しました',
      importMerged: '取り込みをマージしました（$1件追加、合計$2件）',
      importReplaced: '取り込みを置換しました（合計$1件）',
      importEmptyFile: 'ファイルが空です',
      importInvalidJson: '無効なJSONファイルです',
      importInvalidCsv: '無効なCSVファイルです',
      importNoValidLinks: '有効なリンクがありません',
      importUnsupportedType: '未対応のファイル形式です',
      statsDashboard: '収集統計',
      statsTotalLabel: '合計追加数',
      statsTrend7Days: '直近7日',
      statsTopDomains: '上位ドメイン',
      statsNoData: 'データなし'
    }
  };

  function t(key, ...args) {
    let str = i18nStrings[currentLang]?.[key] || i18nStrings['en'][key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`$${i + 1}`, arg);
    });
    return str;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-option]').forEach(el => {
      const key = el.dataset.i18nOption;
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = t(key);
    });

    const isOn = toggleBtn.classList.contains('on');
    toggleBtn.querySelector('.toggle-text').textContent = isOn ? t('modeOn') : t('modeOff');

    copyBtn.querySelector('.btn-text').textContent = t('copyLinks');
    clearBtn.querySelector('.btn-text').textContent = t('clearAll');

    updatePatternPlaceholder();
    if (!patternPreviewText.classList.contains('success') && !patternPreviewText.classList.contains('error')) {
      setPatternPreviewText(t('patternHint'));
    }
    renderSessionList();
    renderCollectionStats(lastCollectionStats);

    updateToggleKeyDisplay();
  }

  function getKeyDisplayName(key) {
    const keyMap = {
      'Escape': 'ESC',
      'Enter': 'Enter',
      'Space': 'Space',
      'Tab': 'Tab',
      'Backspace': '⌫',
      'Delete': 'Del',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Control': isMac ? '⌃' : 'Ctrl',
      'Alt': isMac ? '⌥' : 'Alt',
      'Shift': '⇧',
      'Meta': isMac ? '⌘' : 'Win',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
      'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
      'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12'
    };

    if (keyMap[key]) return keyMap[key];
    if (key.startsWith('Key')) return key.slice(3);
    if (key.startsWith('Digit')) return key.slice(5);
    return key;
  }

  function formatKeyCombination(keys) {
    const modifierOrder = ['Control', 'Alt', 'Shift', 'Meta'];
    const modifiers = keys.filter(k => modifierOrder.includes(k));
    const others = keys.filter(k => !modifierOrder.includes(k));

    modifiers.sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b));

    const sorted = [...modifiers, ...others];
    return sorted.map(getKeyDisplayName).join(' + ');
  }

  function updateToggleKeyDisplay() {
    currentToggleKey.textContent = formatKeyCombination(currentToggleKeys);
  }

  function updatePatternPlaceholder() {
    const placeholderKey = patternTypeSelect.value === 'css'
      ? 'patternPlaceholderCss'
      : 'patternPlaceholderRegex';
    patternInput.dataset.i18nPlaceholder = placeholderKey;
    patternInput.placeholder = t(placeholderKey);
  }

  function setPatternPreviewText(message, type = '') {
    patternPreviewText.textContent = message;
    patternPreviewText.classList.remove('success', 'error');
    if (type === 'success' || type === 'error') {
      patternPreviewText.classList.add(type);
    }
  }

  function formatSessionTime(createdAt) {
    if (!createdAt) return '-';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  function isValidTheme(theme) {
    return theme === 'system' || theme === 'dark' || theme === 'light';
  }

  function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      return theme;
    }

    return prefersLightQuery.matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const resolvedTheme = resolveTheme(theme);
    document.documentElement.dataset.theme = resolvedTheme;
  }

  function formatTrendDayLabel(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function renderCollectionStats(stats) {
    const safeStats = stats && typeof stats === 'object' ? stats : {};
    const totalAdded = Number(safeStats.totalAdded) || 0;
    const trend = Array.isArray(safeStats.trend) ? safeStats.trend : [];
    const topDomains = Array.isArray(safeStats.topDomains) ? safeStats.topDomains : [];

    statsTotalValue.textContent = String(totalAdded);

    statsTrendBars.innerHTML = '';
    if (trend.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'stats-empty';
      emptyEl.textContent = t('statsNoData');
      statsTrendBars.appendChild(emptyEl);
    } else {
      const maxCount = Math.max(...trend.map(item => item.count || 0), 1);
      trend.forEach(item => {
        const statsItem = document.createElement('div');
        statsItem.className = 'stats-trend-item';

        const bar = document.createElement('div');
        bar.className = 'stats-trend-bar';
        bar.title = `${item.date}: ${item.count || 0}`;

        const fill = document.createElement('div');
        fill.className = 'stats-trend-fill';
        const count = item.count || 0;
        const ratio = count > 0 ? (count / maxCount) * 100 : 0;
        fill.style.height = `${Math.max(ratio, count > 0 ? 8 : 2)}%`;

        const countText = document.createElement('span');
        countText.className = 'stats-trend-count';
        countText.textContent = String(count);

        const dayText = document.createElement('span');
        dayText.className = 'stats-trend-day';
        dayText.textContent = formatTrendDayLabel(item.date);

        bar.appendChild(fill);
        statsItem.appendChild(bar);
        statsItem.appendChild(countText);
        statsItem.appendChild(dayText);
        statsTrendBars.appendChild(statsItem);
      });
    }

    statsTopDomains.innerHTML = '';
    if (topDomains.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'stats-empty';
      emptyEl.textContent = t('statsNoData');
      statsTopDomains.appendChild(emptyEl);
      return;
    }

    topDomains.forEach(item => {
      const row = document.createElement('div');
      row.className = 'stats-domain-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'stats-domain-name';
      nameEl.textContent = item.domain || 'unknown';

      const countEl = document.createElement('span');
      countEl.className = 'stats-domain-count';
      countEl.textContent = String(item.count || 0);

      row.appendChild(nameEl);
      row.appendChild(countEl);
      statsTopDomains.appendChild(row);
    });
  }

  function renderSessionList() {
    sessionList.innerHTML = '';

    if (!sessions.length) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'session-empty';
      emptyEl.textContent = t('noSessions');
      sessionList.appendChild(emptyEl);
      return;
    }

    sessions.forEach(session => {
      const item = document.createElement('article');
      item.className = 'session-item';

      const meta = document.createElement('div');
      meta.className = 'session-meta';

      const domain = document.createElement('span');
      domain.className = 'session-domain';
      domain.textContent = session.sourceDomain || 'unknown';

      const time = document.createElement('span');
      time.className = 'session-time';
      time.textContent = formatSessionTime(session.createdAt);

      meta.appendChild(domain);
      meta.appendChild(time);

      const count = document.createElement('div');
      count.className = 'session-count';
      count.textContent = t('sessionLinks', session.count || 0);

      const actions = document.createElement('div');
      actions.className = 'session-actions';

      const mergeBtn = document.createElement('button');
      mergeBtn.type = 'button';
      mergeBtn.className = 'session-action-btn';
      mergeBtn.dataset.sessionAction = 'merge';
      mergeBtn.dataset.sessionId = session.id;
      mergeBtn.textContent = t('restoreMerge');

      const replaceBtn = document.createElement('button');
      replaceBtn.type = 'button';
      replaceBtn.className = 'session-action-btn';
      replaceBtn.dataset.sessionAction = 'replace';
      replaceBtn.dataset.sessionId = session.id;
      replaceBtn.textContent = t('restoreReplace');

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'session-action-btn';
      deleteBtn.dataset.sessionAction = 'delete';
      deleteBtn.dataset.sessionId = session.id;
      deleteBtn.textContent = t('deleteSession');

      actions.appendChild(mergeBtn);
      actions.appendChild(replaceBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(meta);
      item.appendChild(count);
      item.appendChild(actions);

      sessionList.appendChild(item);
    });
  }

  const settings = await chrome.storage.local.get([
    'modifierKey', 'copyFormat', 'language', 'toggleKeys', 'theme'
  ]);
  modifierSelect.value = settings.modifierKey || 'alt';
  copyFormatSelect.value = settings.copyFormat || 'urls';
  currentLang = settings.language || navigator.language.split('-')[0] || 'en';
  if (!['en', 'ko', 'ja'].includes(currentLang)) currentLang = 'en';
  languageSelect.value = currentLang;
  currentToggleKeys = settings.toggleKeys || ['Control', 'Escape'];
  selectedTheme = isValidTheme(settings.theme) ? settings.theme : 'system';
  themeSelect.value = selectedTheme;
  applyTheme(selectedTheme);

  prefersLightQuery.addEventListener('change', () => {
    if (selectedTheme === 'system') {
      applyTheme(selectedTheme);
    }
  });

  updateModifierLabels();
  applyTranslations();
  await loadSessions();
  await loadCollectionStats();

  // Footer links must work even on restricted pages (chrome://, file://, etc.)
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  rateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: CWS_URL
    });
  });

  feedbackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: FEEDBACK_FORM_URL
    });
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url || isRestrictedPage(tab.url)) {
    showError(t('pageNotSupported'));
    return;
  }

  contentScriptReady = await ensureContentScriptInjected(tab.id);

  if (contentScriptReady) {
    try {
      const response = await sendMessageWithRetry(tab.id, { type: 'GET_STATE' });
      collectedLinks = response.collectedLinks || [];
      updateUI(response);
    } catch (e) {
      console.log('Content script not responding:', e);
      contentScriptReady = false;
    }
  }

  function isRestrictedPage(url) {
    const restricted = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'moz-extension://',
      'file://'
    ];
    return restricted.some(prefix => url.startsWith(prefix));
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
      console.warn('Content script injected but not responding');
      return false;
    } catch (e) {
      console.error('Failed to inject content script:', e);
      return false;
    }
  }

  async function sendMessageWithRetry(tabId, message, retries = 3) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        return response;
      } catch (e) {
        lastError = e;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    }
    throw lastError;
  }

  async function loadSessions() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SESSIONS' });
      sessions = Array.isArray(response?.sessions) ? response.sessions : [];
      renderSessionList();
    } catch (e) {
      console.warn('Failed to load sessions:', e);
      sessions = [];
      renderSessionList();
    }
  }

  async function loadCollectionStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_COLLECTION_STATS',
        days: 7,
        topN: 5
      });

      if (response?.success && response.stats) {
        lastCollectionStats = response.stats;
      } else {
        lastCollectionStats = { totalAdded: 0, trend: [], topDomains: [] };
      }
    } catch (e) {
      console.warn('Failed to load collection stats:', e);
      lastCollectionStats = { totalAdded: 0, trend: [], topDomains: [] };
    }

    renderCollectionStats(lastCollectionStats);
  }

  function scheduleStatsRefresh() {
    if (statsRefreshTimer) {
      clearTimeout(statsRefreshTimer);
    }

    statsRefreshTimer = setTimeout(() => {
      loadCollectionStats();
    }, 200);
  }

  async function getCurrentCollectedLinks() {
    const injected = await ensureContentScriptInjected(tab.id);
    if (!injected) {
      throw new Error('CONTENT_SCRIPT_UNAVAILABLE');
    }

    const response = await sendMessageWithRetry(tab.id, { type: 'GET_COLLECTED_LINKS' });
    return Array.isArray(response?.links) ? response.links : [];
  }

  function downloadTextFile(text, filename, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function makeExportFilename(ext) {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('');
    const timePart = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    return `catchurls-links-${datePart}-${timePart}.${ext}`;
  }

  async function exportLinks(format) {
    if (!linkTransfer) {
      showToast(t('exportFailed'), 'error');
      return;
    }

    try {
      const links = await getCurrentCollectedLinks();
      if (links.length === 0) {
        showToast(t('noLinksToExport'), 'info');
        return;
      }

      if (format === 'json') {
        const content = linkTransfer.serializeLinksToJson(links);
        downloadTextFile(content, makeExportFilename('json'), 'application/json;charset=utf-8');
        showToast(t('exportedJson', links.length));
        return;
      }

      const content = linkTransfer.serializeLinksToCsv(links);
      downloadTextFile(content, makeExportFilename('csv'), 'text/csv;charset=utf-8');
      showToast(t('exportedCsv', links.length));
    } catch (e) {
      console.error('Failed to export links:', e);
      showToast(t('exportFailed'), 'error');
    }
  }

  function resolveImportErrorMessage(errorCode) {
    switch (errorCode) {
      case 'EMPTY_FILE':
        return t('importEmptyFile');
      case 'INVALID_JSON':
        return t('importInvalidJson');
      case 'INVALID_CSV':
        return t('importInvalidCsv');
      case 'NO_VALID_LINKS':
        return t('importNoValidLinks');
      case 'UNSUPPORTED_FILE_TYPE':
        return t('importUnsupportedType');
      default:
        return t('importFailed');
    }
  }

  async function importLinksFromFile(file, replaceExisting) {
    if (!file || !linkTransfer) {
      showToast(t('importFailed'), 'error');
      return;
    }

    let text;
    try {
      text = await file.text();
    } catch (e) {
      console.error('Failed to read import file:', e);
      showToast(t('importReadFailed'), 'error');
      return;
    }

    const parsed = linkTransfer.parseImportText(text, {
      filename: file.name,
      mimeType: file.type
    });
    if (!parsed.ok) {
      showToast(resolveImportErrorMessage(parsed.error), 'error');
      return;
    }

    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        showToast(t('scriptInjectionFailed'), 'error');
        return;
      }

      const result = await sendMessageWithRetry(tab.id, {
        type: replaceExisting ? 'REPLACE_LINKS' : 'MERGE_LINKS',
        links: parsed.links
      });

      if (!result?.success) {
        showToast(t('importFailed'), 'error');
        return;
      }

      const stateResponse = await sendMessageWithRetry(tab.id, { type: 'GET_STATE' });
      collectedLinks = stateResponse.collectedLinks || [];
      updateUI(stateResponse);
      scheduleStatsRefresh();

      if (replaceExisting) {
        showToast(t('importReplaced', result.totalCount));
      } else {
        showToast(t('importMerged', result.addedCount, result.totalCount));
      }
    } catch (e) {
      console.error('Failed to import links:', e);
      showToast(t('importFailed'), 'error');
    }
  }

  function resolvePatternErrorMessage(errorCode) {
    switch (errorCode) {
      case 'EMPTY_PATTERN':
        return t('patternInputRequired');
      case 'INVALID_REGEX':
        return t('patternInvalidRegex');
      case 'INVALID_SELECTOR':
        return t('patternInvalidSelector');
      default:
        return t('patternNoMatches');
    }
  }

  async function saveCurrentSession(showSuccessToast = true) {
    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        if (showSuccessToast) showToast(t('scriptInjectionFailed'), 'error');
        return false;
      }

      const linksResponse = await sendMessageWithRetry(tab.id, { type: 'GET_COLLECTED_LINKS' });
      const links = linksResponse?.links || [];

      if (!links.length) {
        if (showSuccessToast) showToast(t('noLinksToSave'), 'info');
        return false;
      }

      const result = await chrome.runtime.sendMessage({
        type: 'SAVE_SESSION',
        links,
        tabUrl: tab.url,
        tabTitle: tab.title
      });

      if (!result?.success) {
        if (showSuccessToast) showToast(t('sessionSaveFailed'), 'error');
        return false;
      }

      sessions = Array.isArray(result.sessions) ? result.sessions : sessions;
      renderSessionList();

      if (showSuccessToast) {
        showToast(t('sessionSaved', result.session?.count || links.length));
      }
      return true;
    } catch (e) {
      console.error('Failed to save session:', e);
      if (showSuccessToast) showToast(t('sessionSaveFailed'), 'error');
      return false;
    }
  }

  async function previewPatternCollection() {
    const pattern = patternInput.value.trim();
    if (!pattern) {
      setPatternPreviewText(t('patternInputRequired'), 'error');
      return;
    }

    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        showToast(t('scriptInjectionFailed'), 'error');
        return;
      }

      const result = await sendMessageWithRetry(tab.id, {
        type: 'PREVIEW_PATTERN_COLLECTION',
        patternType: patternTypeSelect.value,
        pattern
      });

      if (!result?.success) {
        setPatternPreviewText(resolvePatternErrorMessage(result?.error), 'error');
        return;
      }

      setPatternPreviewText(t('patternPreviewResult', result.matchedCount, result.newCount), 'success');
    } catch (e) {
      console.error('Failed to preview pattern collection:', e);
      setPatternPreviewText(t('patternNoMatches'), 'error');
    }
  }

  async function collectByPattern() {
    const pattern = patternInput.value.trim();
    if (!pattern) {
      setPatternPreviewText(t('patternInputRequired'), 'error');
      return;
    }

    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        showToast(t('scriptInjectionFailed'), 'error');
        return;
      }

      const result = await sendMessageWithRetry(tab.id, {
        type: 'COLLECT_BY_PATTERN',
        patternType: patternTypeSelect.value,
        pattern
      });

      if (!result?.success) {
        setPatternPreviewText(resolvePatternErrorMessage(result?.error), 'error');
        return;
      }

      if (result.addedCount > 0) {
        showToast(t('patternCollected', result.addedCount, result.totalCount));
        setPatternPreviewText(t('patternPreviewResult', result.matchedCount, result.addedCount), 'success');
      } else {
        showToast(t('patternNoMatches'), 'info');
      }

      const stateResponse = await sendMessageWithRetry(tab.id, { type: 'GET_STATE' });
      collectedLinks = stateResponse.collectedLinks || [];
      updateUI(stateResponse);
    } catch (e) {
      console.error('Failed to collect links by pattern:', e);
      setPatternPreviewText(t('patternNoMatches'), 'error');
    }
  }

  async function restoreSession(session, replaceExisting) {
    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        showToast(t('scriptInjectionFailed'), 'error');
        return;
      }

      const result = await sendMessageWithRetry(tab.id, {
        type: replaceExisting ? 'REPLACE_LINKS' : 'MERGE_LINKS',
        links: session.links || []
      });

      if (!result?.success) {
        showToast(t('sessionOpFailed'), 'error');
        return;
      }

      const stateResponse = await sendMessageWithRetry(tab.id, { type: 'GET_STATE' });
      collectedLinks = stateResponse.collectedLinks || [];
      updateUI(stateResponse);

      if (replaceExisting) {
        showToast(t('sessionReplaced', result.totalCount));
      } else {
        showToast(t('sessionMerged', result.addedCount, result.totalCount));
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      showToast(t('sessionOpFailed'), 'error');
    }
  }

  async function removeSession(sessionId) {
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'DELETE_SESSION',
        sessionId
      });

      if (!result?.success) {
        showToast(t('sessionOpFailed'), 'error');
        return;
      }

      sessions = Array.isArray(result.sessions) ? result.sessions : [];
      renderSessionList();
      showToast(t('sessionDeleted'));
    } catch (e) {
      console.error('Failed to delete session:', e);
      showToast(t('sessionOpFailed'), 'error');
    }
  }

  function updateModifierLabels() {
    const options = modifierSelect.querySelectorAll('option');
    options.forEach(option => {
      const label = isMac ? option.dataset.mac : option.dataset.win;
      if (label) {
        option.textContent = label;
      }
    });
  }

  function updateUI(state) {
    if (!state) return;

    const isOn = state.enabled;
    const count = state.collectedCount || 0;

    toggleBtn.classList.toggle('on', isOn);
    toggleBtn.classList.toggle('off', !isOn);
    toggleBtn.setAttribute('aria-pressed', isOn);
    toggleBtn.querySelector('.toggle-text').textContent = isOn ? t('modeOn') : t('modeOff');

    linkCount.textContent = count;

    const hasLinks = count > 0;
    copyBtn.disabled = !hasLinks;
    clearBtn.disabled = !hasLinks;
    appendBtn.disabled = !hasLinks;
    openTabsBtn.disabled = !hasLinks;
    bookmarkBtn.disabled = !hasLinks;
    markVisitedBtn.disabled = !hasLinks;
    reverseBtn.disabled = !hasLinks;
    saveSessionBtn.disabled = !hasLinks;
    exportJsonBtn.disabled = !hasLinks;
    exportCsvBtn.disabled = !hasLinks;
  }

  function showError(message) {
    toggleBtn.disabled = true;
    toggleBtn.querySelector('.toggle-text').textContent = t('modeNA');
    copyBtn.disabled = true;
    clearBtn.disabled = true;
    appendBtn.disabled = true;
    openTabsBtn.disabled = true;
    bookmarkBtn.disabled = true;
    markVisitedBtn.disabled = true;
    reverseBtn.disabled = true;
    previewPatternBtn.disabled = true;
    collectPatternBtn.disabled = true;
    saveSessionBtn.disabled = true;
    exportJsonBtn.disabled = true;
    exportCsvBtn.disabled = true;
    importMergeBtn.disabled = true;
    importReplaceBtn.disabled = true;
    patternInput.disabled = true;
    patternTypeSelect.disabled = true;
    if (message) {
      showToast(message, 'error');
    }
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  toggleBtn.addEventListener('click', async () => {
    if (toggleBtn.disabled) return;

    const isCurrentlyOn = toggleBtn.classList.contains('on');
    const newState = !isCurrentlyOn;

    try {
      const injected = await ensureContentScriptInjected(tab.id);
      if (!injected) {
        showToast(t('scriptInjectionFailed'), 'error');
        return;
      }

      await sendMessageWithRetry(tab.id, {
        type: 'SET_MODE',
        enabled: newState
      });

      toggleBtn.classList.toggle('on', newState);
      toggleBtn.classList.toggle('off', !newState);
      toggleBtn.querySelector('.toggle-text').textContent = newState ? t('modeOn') : t('modeOff');

      chrome.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        enabled: newState,
        tabId: tab.id
      });
    } catch (e) {
      console.error('Failed to toggle mode:', e);
      showToast(t('refreshAndRetry'), 'error');
    }
  });

  modifierSelect.addEventListener('change', async () => {
    const value = modifierSelect.value;

    await chrome.storage.local.set({ modifierKey: value });

    try {
      await sendMessageWithRetry(tab.id, {
        type: 'SET_MODIFIER',
        modifier: value
      });
    } catch (e) {
      console.log('Could not notify content script:', e);
    }
  });

  copyFormatSelect.addEventListener('change', async () => {
    const value = copyFormatSelect.value;
    await chrome.storage.local.set({ copyFormat: value });
  });

  themeSelect.addEventListener('change', async () => {
    selectedTheme = isValidTheme(themeSelect.value) ? themeSelect.value : 'system';
    applyTheme(selectedTheme);
    await chrome.storage.local.set({ theme: selectedTheme });
  });

  languageSelect.addEventListener('change', async () => {
    currentLang = languageSelect.value;
    await chrome.storage.local.set({ language: currentLang });
    applyTranslations();

    try {
      await sendMessageWithRetry(tab.id, {
        type: 'SET_LANGUAGE',
        language: currentLang
      });
    } catch (e) {
      console.log('Could not notify content script:', e);
    }
  });

  patternTypeSelect.addEventListener('change', () => {
    updatePatternPlaceholder();
    setPatternPreviewText(t('patternHint'));
  });

  previewPatternBtn.addEventListener('click', async () => {
    await previewPatternCollection();
  });

  collectPatternBtn.addEventListener('click', async () => {
    await collectByPattern();
  });

  patternInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await previewPatternCollection();
    }
  });

  saveSessionBtn.addEventListener('click', async () => {
    await saveCurrentSession(true);
  });

  exportJsonBtn.addEventListener('click', async () => {
    if (exportJsonBtn.disabled) return;
    await exportLinks('json');
  });

  exportCsvBtn.addEventListener('click', async () => {
    if (exportCsvBtn.disabled) return;
    await exportLinks('csv');
  });

  importMergeBtn.addEventListener('click', () => {
    if (importMergeBtn.disabled) return;
    pendingImportMode = 'merge';
    importFileInput.value = '';
    importFileInput.click();
  });

  importReplaceBtn.addEventListener('click', () => {
    if (importReplaceBtn.disabled) return;
    pendingImportMode = 'replace';
    importFileInput.value = '';
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async () => {
    const [file] = importFileInput.files || [];
    if (!file) return;

    const shouldReplace = pendingImportMode === 'replace';
    await importLinksFromFile(file, shouldReplace);
    importFileInput.value = '';
  });

  sessionList.addEventListener('click', async (e) => {
    const actionBtn = e.target.closest('[data-session-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.sessionAction;
    const sessionId = actionBtn.dataset.sessionId;
    const session = sessions.find(item => item.id === sessionId);

    if (!session) return;

    if (action === 'delete') {
      await removeSession(sessionId);
      return;
    }

    if (action === 'merge') {
      await restoreSession(session, false);
      return;
    }

    if (action === 'replace') {
      await restoreSession(session, true);
    }
  });

  toggleKeyBtn.addEventListener('click', () => {
    if (isCapturingKey) {
      stopKeyCapture();
    } else {
      startKeyCapture();
    }
  });

  function startKeyCapture() {
    isCapturingKey = true;
    toggleKeyBtn.classList.add('capturing');
    currentToggleKey.textContent = t('pressAnyKey');
    document.addEventListener('keydown', captureKey);
    document.addEventListener('keyup', finishKeyCapture);
  }

  function stopKeyCapture() {
    isCapturingKey = false;
    toggleKeyBtn.classList.remove('capturing');
    updateToggleKeyDisplay();
    document.removeEventListener('keydown', captureKey);
    document.removeEventListener('keyup', finishKeyCapture);
  }

  let capturedKeys = new Set();
  let captureTimeout = null;

  function captureKey(e) {
    e.preventDefault();
    e.stopPropagation();

    if (capturedKeys.size >= 3) return;

    if (e.ctrlKey) capturedKeys.add('Control');
    if (e.altKey) capturedKeys.add('Alt');
    if (e.shiftKey) capturedKeys.add('Shift');
    if (e.metaKey) capturedKeys.add('Meta');

    const ignoredKeys = ['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'];
    if (!ignoredKeys.includes(e.key) && capturedKeys.size < 3) {
      capturedKeys.add(e.code);
    }

    currentToggleKey.textContent = formatKeyCombination([...capturedKeys]) || t('pressAnyKey');

    if (captureTimeout) clearTimeout(captureTimeout);
    captureTimeout = setTimeout(() => {
      if (capturedKeys.size > 0 && hasNonModifierKey([...capturedKeys])) {
        saveToggleKeys();
      }
    }, 500);
  }

  function hasNonModifierKey(keys) {
    const modifiers = ['Control', 'Alt', 'Shift', 'Meta'];
    return keys.some(k => !modifiers.includes(k));
  }

  function finishKeyCapture(e) {
    if (capturedKeys.size > 0 && hasNonModifierKey([...capturedKeys])) {
      if (captureTimeout) clearTimeout(captureTimeout);
      saveToggleKeys();
    }
  }

  async function saveToggleKeys() {
    const keys = [...capturedKeys];
    capturedKeys.clear();

    if (keys.length === 0 || !hasNonModifierKey(keys)) {
      stopKeyCapture();
      return;
    }

    currentToggleKeys = keys;
    await chrome.storage.local.set({ toggleKeys: currentToggleKeys });

    stopKeyCapture();
    showToast(t('keySet', formatKeyCombination(currentToggleKeys)));

    try {
      await sendMessageWithRetry(tab.id, {
        type: 'SET_TOGGLE_KEY',
        toggleKeys: currentToggleKeys
      });
    } catch (err) {
      console.log('Could not notify content script:', err);
    }
  }

  copyBtn.addEventListener('click', async () => {
    if (copyBtn.disabled) return;

    try {
      const format = copyFormatSelect.value;
      const copySettings = await chrome.storage.local.get(['copySeparator']);
      const separator = copySettings.copySeparator || '\n';
      const response = await sendMessageWithRetry(tab.id, {
        type: 'COPY_LINKS',
        format: format,
        separator: separator
      });

      if (response?.copied) {
        const originalText = copyBtn.querySelector('.btn-text').textContent;
        copyBtn.querySelector('.btn-icon').textContent = '✓';
        copyBtn.querySelector('.btn-text').textContent = t('copied');

        setTimeout(() => {
          copyBtn.querySelector('.btn-icon').textContent = '📋';
          copyBtn.querySelector('.btn-text').textContent = originalText;
        }, 1500);

        showToast(t('linksCopied', response.count));
        void saveCurrentSession(false);
      }
    } catch (e) {
      console.error('Failed to copy:', e);
      showToast(t('copyFailed'), 'error');
    }
  });

  clearBtn.addEventListener('click', async () => {
    if (clearBtn.disabled) return;

    try {
      await sendMessageWithRetry(tab.id, { type: 'CLEAR_LINKS' });

      linkCount.textContent = '0';
      collectedLinks = [];
      copyBtn.disabled = true;
      clearBtn.disabled = true;
      appendBtn.disabled = true;
      openTabsBtn.disabled = true;
      bookmarkBtn.disabled = true;
      markVisitedBtn.disabled = true;
      reverseBtn.disabled = true;
      saveSessionBtn.disabled = true;
      exportJsonBtn.disabled = true;
      exportCsvBtn.disabled = true;

      showToast(t('cleared'));
    } catch (e) {
      console.error('Failed to clear:', e);
      showToast(t('clearFailed'), 'error');
    }
  });

  appendBtn.addEventListener('click', async () => {
    if (appendBtn.disabled) return;

    try {
      await sendMessageWithRetry(tab.id, { type: 'APPEND_CLIPBOARD' });
      showToast(t('appendedToClipboard'));
    } catch (e) {
      console.error('Failed to append:', e);
      showToast(t('copyFailed'), 'error');
    }
  });

  openTabsBtn.addEventListener('click', async () => {
    if (openTabsBtn.disabled) return;

    try {
      const response = await sendMessageWithRetry(tab.id, { type: 'GET_COLLECTED_LINKS' });
      const links = response?.links || [];

      if (links.length > 0) {
        const urls = links.map(l => l.url);
        const settings = await chrome.storage.local.get(['openTabDelay', 'openTabNextToActive']);

        const result = await chrome.runtime.sendMessage({
          type: 'OPEN_TABS',
          urls: isReversed ? [...urls].reverse() : urls,
          options: {
            delay: settings.openTabDelay || 0,
            nextToActive: settings.openTabNextToActive !== false,
            reverse: false,
            active: false
          }
        });

        if (result?.success) {
          showToast(t('tabsOpened', result.count));
        }
      }
    } catch (e) {
      console.error('Failed to open tabs:', e);
      showToast('Failed to open tabs', 'error');
    }
  });

  bookmarkBtn.addEventListener('click', async () => {
    if (bookmarkBtn.disabled) return;

    try {
      const response = await sendMessageWithRetry(tab.id, { type: 'GET_COLLECTED_LINKS' });
      const links = response?.links || [];

      if (links.length > 0) {
        const result = await chrome.runtime.sendMessage({
          type: 'CREATE_BOOKMARKS',
          links: isReversed ? [...links].reverse() : links,
          folderName: tab.title || 'CatchUrls Collection'
        });

        if (result?.success) {
          showToast(t('bookmarksCreated', result.count));
        }
      }
    } catch (e) {
      console.error('Failed to create bookmarks:', e);
      showToast('Failed to create bookmarks', 'error');
    }
  });

  markVisitedBtn.addEventListener('click', async () => {
    if (markVisitedBtn.disabled) return;

    try {
      const response = await sendMessageWithRetry(tab.id, { type: 'GET_COLLECTED_LINKS' });
      const links = response?.links || [];

      if (links.length > 0) {
        const urls = links.map(l => l.url);

        const result = await chrome.runtime.sendMessage({
          type: 'MARK_AS_VISITED',
          urls: urls
        });

        if (result?.success) {
          showToast(t('markedVisited', result.count));
        }
      }
    } catch (e) {
      console.error('Failed to mark as visited:', e);
      showToast('Failed to mark as visited', 'error');
    }
  });

  reverseBtn.addEventListener('click', () => {
    isReversed = !isReversed;
    reverseBtn.classList.toggle('active', isReversed);
    showToast(t('reversed'));
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATE_UPDATE') {
      collectedLinks = message.state.collectedLinks || [];
      updateUI(message.state);
      scheduleStatsRefresh();
    }
  });
});
