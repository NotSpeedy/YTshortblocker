// YouTube Shorts Blocker - Content Script (Chrome/Edge MV3)
(function() {
  let enabled = true;

  // ─── Issue 1 fix: redirect /shorts/ pages IMMEDIATELY at document_start ───
  // Fires before the page can load/timeout. Defaults to blocked when no value stored.
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
    /* ===== HOME PAGE ===== */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,

    /* ===== SEARCH RESULTS PAGE – Issue 2 fix ===== */
    ytd-reel-shelf-renderer.ytd-item-section-renderer,
    ytd-item-section-renderer:has(ytd-reel-shelf-renderer),
    ytd-shelf-renderer:has(a[href*="/shorts/"]),
    ytd-shelf-renderer:has([title="Shorts"]),
    ytd-item-section-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
    yt-horizontal-list-renderer:has(ytd-reel-item-renderer),
    ytd-reel-item-renderer,
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]),
    iron-selector yt-chip-cloud-chip-renderer:has([title="Shorts"]),

    /* ===== TABS ===== */
    tp-yt-paper-tab:has(> .tab-content > yt-icon + .tab-title:not([hidden])):has(a[href*="shorts"]),
    yt-tab-shape[tab-title="Shorts"],

    /* ===== VIDEO ITEMS (home, channel, sidebar) ===== */
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
    ytd-shorts:has(ytd-reel-video-renderer),
    ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-clip-create"]:has(a[href*="/shorts/"]) {
      display: none !important;
    }
  `;

  const BLOCKED_PAGE_CSS = `
    .yt-shorts-blocked-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #0f0f0f; color: #fff; z-index: 999999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: 'YouTube Sans', 'Roboto', Arial, sans-serif;
    }
    .yt-shorts-blocked-overlay h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .yt-shorts-blocked-overlay p { font-size: 1.1rem; color: #aaa; margin-bottom: 1.5rem; }
    .yt-shorts-blocked-overlay a {
      background: #ff0000; color: #fff; padding: 12px 28px; border-radius: 24px;
      text-decoration: none; font-weight: 600; font-size: 1rem;
    }
    .yt-shorts-blocked-overlay a:hover { background: #cc0000; }
  `;

  function updateStyle() {
    style.textContent = enabled ? CSS_RULES : '';
  }

  // SPA navigation fallback: redirect if we land on /shorts/ via client-side nav
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

  // DOM removal fallback for elements CSS :has() may miss
  function removeShortsElements() {
    if (!enabled) return;
    const selectors = [
      'ytd-reel-shelf-renderer',
      'ytd-reel-item-renderer',
      'ytd-video-renderer:has(a[href*="/shorts/"])',
      'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
      'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
      'ytd-item-section-renderer:has(ytd-reel-shelf-renderer)',
      'ytd-item-section-renderer:has(a[href*="/shorts/"])',
    ].join(',');
    document.querySelectorAll(selectors).forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  // Check initial state
  chrome.runtime.sendMessage({ type: 'getState' }, (res) => {
    if (chrome.runtime.lastError) return;
    enabled = res.enabled;
    updateStyle();
    handleShortsPage();
    removeShortsElements();
  });

  // Listen for toggle changes from popup
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      updateStyle();
      if (enabled) {
        handleShortsPage();
        removeShortsElements();
      } else {
        removeOverlay();
      }
    }
  });

  // Handle SPA navigation (YouTube changes URL without full page reload)
  let lastPath = window.location.pathname;
  const navObserver = new MutationObserver(() => {
    const path = window.location.pathname;
    if (path === lastPath) return;
    lastPath = path;

    if (path.startsWith('/shorts/') && enabled) {
      handleShortsPage();
    } else {
      removeOverlay();
    }
    if (enabled) {
      removeShortsElements();
    }
  });
  navObserver.observe(document.documentElement, { childList: true, subtree: true });

  updateStyle();
})();
