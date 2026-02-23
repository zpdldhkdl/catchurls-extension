document.addEventListener('DOMContentLoaded', async () => {
  const languageSelect = document.getElementById('language');
  const themeSelect = document.getElementById('theme');
  const modifierKeySelect = document.getElementById('modifierKey');
  const clearOnToggleCheck = document.getElementById('clearOnToggle');
  const copyFormatSelect = document.getElementById('copyFormat');
  const copySeparatorSelect = document.getElementById('copySeparator');
  const autoCopyCheck = document.getElementById('autoCopy');
  const openTabDelayInput = document.getElementById('openTabDelay');
  const openTabNextToActiveCheck = document.getElementById('openTabNextToActive');
  // const markAsVisitedCheck = document.getElementById('markAsVisited'); // Disabled: history permission removed
  const dynamicLinkDetectionCheck = document.getElementById('dynamicLinkDetection');
  const linkifyEnabledCheck = document.getElementById('linkifyEnabled');
  const linkifyAggressiveCheck = document.getElementById('linkifyAggressive');
  const filterTypeSelect = document.getElementById('filterType');
  const filterValueInput = document.getElementById('filterValue');
  const addFilterBtn = document.getElementById('addFilterBtn');
  const filterList = document.getElementById('filterList');
  const domainValueInput = document.getElementById('domainValue');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const domainList = document.getElementById('domainList');
  const saveBtn = document.getElementById('saveBtn');
  const toast = document.getElementById('toast');
  const statsTotalValue = document.getElementById('statsTotalValue');
  const statsTrendBars = document.getElementById('statsTrendBars');
  const statsTopDomains = document.getElementById('statsTopDomains');

  let exclusionFilters = [];
  let disabledDomains = [];
  let currentLang = 'en';
  let statsRefreshTimer = null;
  let lastCollectionStats = {
    totalAdded: 0,
    trend: [],
    topDomains: []
  };
  const prefersLightQuery = window.matchMedia('(prefers-color-scheme: light)');

  const i18nStrings = {
    en: {
      optionsTitle: 'CatchUrls Options',
      generalSettings: 'General Settings',
      language: 'Language',
      languageDesc: 'Choose your preferred language',
      theme: 'Theme',
      themeDesc: 'Choose your preferred appearance',
      themeSystem: 'System',
      themeDark: 'Dark',
      themeLight: 'Light',
      modifierKey: 'Hotkey (e.g., Alt)',
      modifierKeyDesc: 'Key to hold when clicking links',
      clearOnToggle: 'Clear URLs on Toggle',
      clearOnToggleDesc: 'Clear collected URLs when selection mode is toggled OFF',
      copySettings: 'Copy Settings',
      copyFormat: 'Default Copy Format',
      copyFormatDesc: 'How links are formatted when copied',
      copySeparator: 'URL Separator',
      copySeparatorDesc: 'Character between URLs',
      tabSettings: 'Tab Settings',
      openTabDelay: 'Open Tab Delay (ms)',
      openTabDelayDesc: 'Delay between opening each tab',
      openTabNextToActive: 'Open Next to Active Tab',
      openTabNextToActiveDesc: 'New tabs open beside current tab',
      advancedFeatures: 'Advanced Features',
      markAsVisited: 'Mark Links as Visited',
      markAsVisitedDesc: 'Automatically mark collected links as visited',
      dynamicLinkDetection: 'Dynamic Link Detection',
      dynamicLinkDetectionDesc: 'Detect new links during drag (infinite scroll)',
      linkifyEnabled: 'Linkify Text URLs',
      linkifyEnabledDesc: 'Convert plain text URLs into clickable links',
      linkifyAggressive: 'Aggressive Linkify Mode',
      linkifyAggressiveDesc: 'Recognize domain-only URLs (e.g., google.com)',
      exclusionFilters: 'Exclusion Filters',
      exclusionFiltersDesc: 'Skip links matching these patterns during selection',
      disabledDomains: 'Disabled Domains',
      disabledDomainsDesc: 'Completely disable CatchUrls on these domains',
      filterPlaceholder: 'Enter keyword or regex pattern',
      add: 'Add',
      saveSettings: 'Save Settings',
      rateUs: 'Rate Us ⭐',
      feedback: 'Feedback 💬',
      settingsSaved: 'Settings saved!',
      invalidRegex: 'Invalid regex pattern',
      domainAlreadyAdded: 'Domain already added',
      altOption: 'Alt (Option)',
      ctrlOption: 'Ctrl (Control)',
      metaOption: 'Meta (Command/Win)',
      shiftOption: 'Shift',
      none: 'None',
      urlsOnly: 'URLs only',
      titleUrl: 'Title + URL (newlines)',
      titleTabUrl: 'Title [Tab] URL',
      markdown: 'Markdown',
      json: 'JSON',
      html: 'HTML',
      newline: 'Newline',
      comma: 'Comma',
      tab: 'Tab',
      space: 'Space',
      keyword: 'Keyword',
      regex: 'Regex',
      autoCopy: 'Auto Copy',
      autoCopyDesc: 'Automatically copy to clipboard when links are collected',
      statsDashboard: 'Collection Stats',
      statsTotalLabel: 'Total added',
      statsTrend7Days: 'Last 7 days',
      statsTopDomains: 'Top domains',
      statsNoData: 'No data'
    },
    ko: {
      optionsTitle: 'CatchUrls 설정',
      generalSettings: '일반 설정',
      language: '언어',
      languageDesc: '원하는 언어를 선택하세요',
      theme: '테마',
      themeDesc: '원하는 화면 모드를 선택하세요',
      themeSystem: '시스템',
      themeDark: '다크',
      themeLight: '라이트',
      modifierKey: '단축키(Alt 등)',
      modifierKeyDesc: '링크 클릭 시 누를 키',
      clearOnToggle: '토글 시 URL 삭제',
      clearOnToggleDesc: '선택 모드 OFF 시 수집된 URL 삭제',
      copySettings: '복사 설정',
      copyFormat: '기본 복사 형식',
      copyFormatDesc: '링크 복사 시 형식',
      copySeparator: 'URL 구분자',
      copySeparatorDesc: 'URL 사이의 구분 문자',
      tabSettings: '탭 설정',
      openTabDelay: '탭 열기 딜레이 (ms)',
      openTabDelayDesc: '각 탭 열기 사이의 지연 시간',
      openTabNextToActive: '현재 탭 옆에 열기',
      openTabNextToActiveDesc: '새 탭을 현재 탭 옆에 열기',
      advancedFeatures: '고급 기능',
      markAsVisited: '방문 표시',
      markAsVisitedDesc: '수집된 링크를 자동으로 방문한 것으로 표시',
      dynamicLinkDetection: '동적 링크 감지',
      dynamicLinkDetectionDesc: '드래그 중 새 링크 감지 (무한 스크롤)',
      linkifyEnabled: '텍스트 URL 링크화',
      linkifyEnabledDesc: '일반 텍스트 URL을 클릭 가능한 링크로 변환',
      linkifyAggressive: '적극적 링크화 모드',
      linkifyAggressiveDesc: '도메인만 있는 URL 인식 (예: google.com)',
      exclusionFilters: '제외 필터',
      exclusionFiltersDesc: '선택 시 이 패턴과 일치하는 링크 건너뛰기',
      disabledDomains: '비활성화 도메인',
      disabledDomainsDesc: '이 도메인에서 CatchUrls 완전히 비활성화',
      filterPlaceholder: '키워드 또는 정규식 패턴 입력',
      add: '추가',
      saveSettings: '설정 저장',
      rateUs: '평가하기 ⭐',
      feedback: '피드백 💬',
      settingsSaved: '설정이 저장되었습니다!',
      invalidRegex: '유효하지 않은 정규식 패턴',
      domainAlreadyAdded: '이미 추가된 도메인입니다',
      altOption: 'Alt (Option)',
      ctrlOption: 'Ctrl (Control)',
      metaOption: 'Meta (Command/Win)',
      shiftOption: 'Shift',
      none: '없음',
      urlsOnly: 'URL만',
      titleUrl: '제목 + URL (줄바꿈)',
      titleTabUrl: '제목 [탭] URL',
      markdown: 'Markdown',
      json: 'JSON',
      html: 'HTML',
      newline: '줄바꿈',
      comma: '쉼표',
      tab: '탭',
      space: '공백',
      keyword: '키워드',
      regex: '정규식',
      autoCopy: '자동 복사',
      autoCopyDesc: '링크 수집 시 자동으로 클립보드에 복사',
      statsDashboard: '수집 통계',
      statsTotalLabel: '총 추가 수',
      statsTrend7Days: '최근 7일',
      statsTopDomains: '상위 도메인',
      statsNoData: '데이터 없음'
    },
    ja: {
      optionsTitle: 'CatchUrls 設定',
      generalSettings: '一般設定',
      language: '言語',
      languageDesc: '使用する言語を選択してください',
      theme: 'テーマ',
      themeDesc: '表示テーマを選択してください',
      themeSystem: 'システム',
      themeDark: 'ダーク',
      themeLight: 'ライト',
      modifierKey: 'ホットキー（Altなど）',
      modifierKeyDesc: 'リンククリック時に押すキー',
      clearOnToggle: 'トグル時にURL削除',
      clearOnToggleDesc: '選択モードOFF時に収集したURLを削除',
      copySettings: 'コピー設定',
      copyFormat: 'デフォルトコピー形式',
      copyFormatDesc: 'リンクコピー時の形式',
      copySeparator: 'URL区切り文字',
      copySeparatorDesc: 'URL間の区切り文字',
      tabSettings: 'タブ設定',
      openTabDelay: 'タブを開く遅延 (ms)',
      openTabDelayDesc: '各タブを開く間の遅延時間',
      openTabNextToActive: '現在のタブの隣に開く',
      openTabNextToActiveDesc: '新しいタブを現在のタブの隣に開く',
      advancedFeatures: '高度な機能',
      markAsVisited: '訪問済みとしてマーク',
      markAsVisitedDesc: '収集したリンクを自動的に訪問済みにする',
      dynamicLinkDetection: '動的リンク検出',
      dynamicLinkDetectionDesc: 'ドラッグ中に新しいリンクを検出（無限スクロール）',
      linkifyEnabled: 'テキストURLをリンク化',
      linkifyEnabledDesc: 'プレーンテキストURLをクリック可能なリンクに変換',
      linkifyAggressive: '積極的リンク化モード',
      linkifyAggressiveDesc: 'ドメインのみのURLを認識（例：google.com）',
      exclusionFilters: '除外フィルター',
      exclusionFiltersDesc: '選択時にこのパターンに一致するリンクをスキップ',
      disabledDomains: '無効化ドメイン',
      disabledDomainsDesc: 'これらのドメインでCatchUrlsを完全に無効化',
      filterPlaceholder: 'キーワードまたは正規表現パターンを入力',
      add: '追加',
      saveSettings: '設定を保存',
      rateUs: '評価する ⭐',
      feedback: 'フィードバック 💬',
      settingsSaved: '設定を保存しました！',
      invalidRegex: '無効な正規表現パターン',
      domainAlreadyAdded: '既に追加されているドメインです',
      altOption: 'Alt (Option)',
      ctrlOption: 'Ctrl (Control)',
      metaOption: 'Meta (Command/Win)',
      shiftOption: 'Shift',
      none: 'なし',
      urlsOnly: 'URLのみ',
      titleUrl: 'タイトル + URL（改行）',
      titleTabUrl: 'タイトル [タブ] URL',
      markdown: 'Markdown',
      json: 'JSON',
      html: 'HTML',
      newline: '改行',
      comma: 'カンマ',
      tab: 'タブ',
      space: 'スペース',
      keyword: 'キーワード',
      regex: '正規表現',
      autoCopy: '自動コピー',
      autoCopyDesc: 'リンク収集時に自動的にクリップボードにコピー',
      statsDashboard: '収集統計',
      statsTotalLabel: '合計追加数',
      statsTrend7Days: '直近7日',
      statsTopDomains: '上位ドメイン',
      statsNoData: 'データなし'
    }
  };

  function t(key) {
    return i18nStrings[currentLang]?.[key] || i18nStrings['en'][key] || key;
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
    document.documentElement.dataset.theme = resolveTheme(theme);
  }

  function formatTrendDayLabel(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function renderCollectionStats(stats) {
    if (!statsTotalValue || !statsTrendBars || !statsTopDomains) return;

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

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-option]').forEach(option => {
      const key = option.dataset.i18nOption;
      option.textContent = t(key);
    });

    document.title = t('optionsTitle');
    renderCollectionStats(lastCollectionStats);
  }

  async function loadSettings() {
    const settings = await chrome.storage.local.get(null);

    currentLang = settings.language || navigator.language.split('-')[0] || 'en';
    if (!['en', 'ko', 'ja'].includes(currentLang)) currentLang = 'en';

    languageSelect.value = currentLang;
    const selectedTheme = isValidTheme(settings.theme) ? settings.theme : 'system';
    themeSelect.value = selectedTheme;
    applyTheme(selectedTheme);
    modifierKeySelect.value = settings.modifierKey || 'alt';
    clearOnToggleCheck.checked = settings.clearOnToggle || false;
    copyFormatSelect.value = settings.copyFormat || 'urls';
    copySeparatorSelect.value = settings.copySeparator || '\n';
    autoCopyCheck.checked = settings.autoCopy !== false;
    openTabDelayInput.value = settings.openTabDelay || 0;
    openTabNextToActiveCheck.checked = settings.openTabNextToActive !== false;
    // markAsVisitedCheck.checked = settings.markAsVisited || false; // Disabled: history permission removed
    dynamicLinkDetectionCheck.checked = settings.dynamicLinkDetection !== false;
    linkifyEnabledCheck.checked = settings.linkifyEnabled || false;
    linkifyAggressiveCheck.checked = settings.linkifyAggressive || false;
    exclusionFilters = settings.exclusionFilters || [];
    disabledDomains = settings.disabledDomains || [];

    applyTranslations();
    renderFilters();
    renderDomains();
  }

  function renderFilters() {
    filterList.innerHTML = '';
    exclusionFilters.forEach((filter, index) => {
      const tag = document.createElement('div');
      tag.className = 'filter-tag';
      tag.innerHTML = `
        <span class="tag-type">${t(filter.type)}</span>
        <span class="tag-value">${filter.value}</span>
        <button class="tag-remove" data-index="${index}">×</button>
      `;
      filterList.appendChild(tag);
    });

    filterList.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        exclusionFilters.splice(index, 1);
        renderFilters();
      });
    });
  }

  function renderDomains() {
    domainList.innerHTML = '';
    disabledDomains.forEach((domain, index) => {
      const tag = document.createElement('div');
      tag.className = 'filter-tag';
      tag.innerHTML = `
        <span class="tag-value">${domain}</span>
        <button class="tag-remove" data-index="${index}">×</button>
      `;
      domainList.appendChild(tag);
    });

    domainList.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        disabledDomains.splice(index, 1);
        renderDomains();
      });
    });
  }

  languageSelect.addEventListener('change', () => {
    currentLang = languageSelect.value;
    applyTranslations();
    renderFilters();
  });

  themeSelect.addEventListener('change', () => {
    const selectedTheme = isValidTheme(themeSelect.value) ? themeSelect.value : 'system';
    applyTheme(selectedTheme);
  });

  prefersLightQuery.addEventListener('change', () => {
    if (themeSelect.value === 'system') {
      applyTheme('system');
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.collectionStats) {
      return;
    }
    scheduleStatsRefresh();
  });

  addFilterBtn.addEventListener('click', () => {
    const type = filterTypeSelect.value;
    const value = filterValueInput.value.trim();

    if (!value) return;

    if (type === 'regex') {
      try {
        new RegExp(value);
      } catch (e) {
        showToast(t('invalidRegex'));
        return;
      }
    }

    exclusionFilters.push({ type, value });
    filterValueInput.value = '';
    renderFilters();
  });

  addDomainBtn.addEventListener('click', () => {
    const value = domainValueInput.value.trim().toLowerCase();

    if (!value) return;
    if (disabledDomains.includes(value)) {
      showToast(t('domainAlreadyAdded'));
      return;
    }

    disabledDomains.push(value);
    domainValueInput.value = '';
    renderDomains();
  });

  saveBtn.addEventListener('click', async () => {
    const settings = {
      language: languageSelect.value,
      theme: isValidTheme(themeSelect.value) ? themeSelect.value : 'system',
      modifierKey: modifierKeySelect.value,
      clearOnToggle: clearOnToggleCheck.checked,
      copyFormat: copyFormatSelect.value,
      copySeparator: copySeparatorSelect.value,
      autoCopy: autoCopyCheck.checked,
      openTabDelay: parseInt(openTabDelayInput.value) || 0,
      openTabNextToActive: openTabNextToActiveCheck.checked,
      // markAsVisited: markAsVisitedCheck.checked, // Disabled: history permission removed
      dynamicLinkDetection: dynamicLinkDetectionCheck.checked,
      linkifyEnabled: linkifyEnabledCheck.checked,
      linkifyAggressive: linkifyAggressiveCheck.checked,
      exclusionFilters: exclusionFilters,
      disabledDomains: disabledDomains
    };

    await chrome.storage.local.set(settings);
    showToast(t('settingsSaved'));
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  filterValueInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addFilterBtn.click();
    }
  });

  domainValueInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addDomainBtn.click();
    }
  });

  await loadSettings();
  await loadCollectionStats();
});
