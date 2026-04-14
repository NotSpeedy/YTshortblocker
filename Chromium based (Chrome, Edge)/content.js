(function() {
  let enabled = true;

  function maybeRedirectShorts() {
    if (!window.location.pathname.startsWith('/shorts/')) return;
    chrome.storage.local.get('enabled', (data) => {
      if (chrome.runtime.lastError) return;
      if (data.enabled !== false) {
        window.location.replace('https://www.youtube.com/?yt-shorts-blocked=1');
      }
    });
  }
  maybeRedirectShorts();

  const style = document.createElement('style');
  style.id = 'yt-shorts-blocker-style';
  (document.head || document.documentElement).appendChild(style);

  const CSS_RULES = `
    /* ===== HOME PAGE – dedicated Shorts shelves ===== */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,

    /* ===== SEARCH RESULTS – Shorts carousel row only ===== */
    /* Do NOT hide ytd-item-section-renderer itself — it contains regular videos too */
    ytd-reel-shelf-renderer.ytd-item-section-renderer,
    yt-horizontal-list-renderer:has(ytd-reel-item-renderer),
    ytd-reel-item-renderer,

    /* ===== SEARCH RESULTS – individual Short video rows ===== */
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),

    /* ===== FILTER CHIPS ===== */
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]),
    iron-selector yt-chip-cloud-chip-renderer:has([title="Shorts"]),

    /* ===== TABS ===== */
    tp-yt-paper-tab:has(> .tab-content > yt-icon + .tab-title:not([hidden])):has(a[href*="shorts"]),
    yt-tab-shape[tab-title="Shorts"],

    /* ===== VIDEO GRID / CHANNEL / HOME CARDS ===== */
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]),
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),

    /* ===== SIDEBAR NAVIGATION ===== */
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-guide-entry-renderer:has(a[title="Shorts"]),

    /* ===== SHORTS BADGE ON THUMBNAILS ===== */
    ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"],

    /* ===== NOTIFICATIONS ===== */
    ytd-notification-renderer:has(a[href*="/shorts/"]),

    /* ===== SHORTS PLAYER PAGE (fallback) ===== */
    ytd-shorts,
    ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-clip-create"] {
      display: none !important;
    }
  `;

  function updateStyle() {
    style.textContent = enabled ? CSS_RULES : '';
  }

  function handleShortsPage() {
    if (!enabled) return;
    if (!window.location.pathname.startsWith('/shorts/')) return;
    window.location.replace('https://www.youtube.com/?yt-shorts-blocked=1');
  }

  function removeOverlay() {
    const overlay = document.getElementById('yt-shorts-blocked-overlay');
    const blockedStyle = document.getElementById('yt-shorts-blocked-style');
    if (overlay) overlay.remove();
    if (blockedStyle) blockedStyle.remove();
  }

  let cleanupTimer = null;
  function scheduleShortsCleanup() {
    if (!enabled || cleanupTimer) return;
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      if (!enabled) return;
      const selectors = [
        'ytd-reel-shelf-renderer',
        'ytd-reel-item-renderer',
        'ytd-video-renderer:has(a[href*="/shorts/"])',
        'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
        'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
      ].join(',');
      document.querySelectorAll(selectors).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    }, 500);
  }

  chrome.runtime.sendMessage({ type: 'getState' }, (res) => {
    if (chrome.runtime.lastError) return;
    enabled = res.enabled;
    updateStyle();
    handleShortsPage();
    scheduleShortsCleanup();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      updateStyle();
      if (enabled) {
        handleShortsPage();
        scheduleShortsCleanup();
      } else {
        removeOverlay();
      }
    }
  });

  let lastPath = window.location.pathname;

  function onNavigate() {
    const path = window.location.pathname;
    if (path === lastPath) return;
    lastPath = path;

    if (path.startsWith('/shorts/') && enabled) {
      handleShortsPage();
    } else {
      removeOverlay();
    }
    if (enabled) {
      scheduleShortsCleanup();
    }
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function(...args) {
    _pushState(...args);
    onNavigate();
  };

  const _replaceState = history.replaceState.bind(history);
  history.replaceState = function(...args) {
    _replaceState(...args);
    onNavigate();
  };

  window.addEventListener('popstate', onNavigate);

  updateStyle();
})();
