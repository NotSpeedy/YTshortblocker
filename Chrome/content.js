// YouTube Shorts Blocker - Content Script (Chrome/Edge MV3)
(function() {
  let enabled = true;

  const style = document.createElement('style');
  style.id = 'yt-shorts-blocker-style';
  (document.head || document.documentElement).appendChild(style);

  const CSS_RULES = `
    /* ===== HOME PAGE ===== */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,

    /* ===== SEARCH RESULTS PAGE (/results) ===== */
    /* Shorts shelf in search */
    ytd-reel-shelf-renderer.ytd-item-section-renderer,
    ytd-item-section-renderer:has(ytd-reel-shelf-renderer),
    /* Shorts shelf with header */
    ytd-shelf-renderer:has(a[href*="/shorts/"]),
    ytd-shelf-renderer:has([title="Shorts"]),
    ytd-shelf-renderer:has(span:not([hidden])),
    /* Individual shorts in search results */
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
    /* Shorts filter chip in search */
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]),
    iron-selector yt-chip-cloud-chip-renderer:has([title="Shorts"]),
    /* Section with shorts heading */
    ytd-item-section-renderer:has(#title:not([hidden])):has(a[href*="/shorts/"]),

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

    /* ===== SHORTS PLAYER PAGE ===== */
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

  function handleShortsPage() {
    if (!enabled) return;
    const path = window.location.pathname;
    if (!path.startsWith('/shorts/')) return;

    const existing = document.getElementById('yt-shorts-blocked-overlay');
    if (existing) return;

    const blockedStyle = document.createElement('style');
    blockedStyle.id = 'yt-shorts-blocked-style';
    blockedStyle.textContent = BLOCKED_PAGE_CSS;
    (document.head || document.documentElement).appendChild(blockedStyle);

    const overlay = document.createElement('div');
    overlay.id = 'yt-shorts-blocked-overlay';
    overlay.className = 'yt-shorts-blocked-overlay';
    overlay.innerHTML = `
      <h1>🚫 Short Blocked</h1>
      <p>YouTube Shorts are blocked by your extension.</p>
      <a href="https://www.youtube.com">Go to YouTube Home</a>
    `;

    function inject() {
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        requestAnimationFrame(inject);
      }
    }
    inject();
  }

  function removeOverlay() {
    const overlay = document.getElementById('yt-shorts-blocked-overlay');
    const blockedStyle = document.getElementById('yt-shorts-blocked-style');
    if (overlay) overlay.remove();
    if (blockedStyle) blockedStyle.remove();
  }

  // Also hide shorts elements that load dynamically via DOM removal
  function removeShortsElements() {
    if (!enabled) return;
    // Target reel shelves that CSS :has() might miss
    document.querySelectorAll('ytd-reel-shelf-renderer').forEach(el => {
      el.style.display = 'none';
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

  // Listen for state changes
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

  // Handle SPA navigation
  const navObserver = new MutationObserver(() => {
    const path = window.location.pathname;
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
