(function () {
  let enabled = true;

  function redirectIfShortsPage() {
    if (enabled && window.location.pathname.startsWith('/shorts/')) {
      window.location.replace('https://www.youtube.com/');
    }
  }

  const style = document.createElement('style');
  style.id = 'yt-shorts-blocker-style';
  (document.head || document.documentElement).appendChild(style);

  const CSS_RULES = `
    /* === SIDEBAR NAVIGATION === */
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]) { display: none !important; }

    /* === HOME PAGE === */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer { display: none !important; }

    /* === SEARCH RESULTS — Shorts shelf (carousel / grid) === */
    /*
      YouTube wraps the Shorts carousel in one of these chains:
        ytd-item-section-renderer > ytd-shelf-view-model > yt-grid-shelf-view-model
        ytd-item-section-renderer > ytd-reel-shelf-renderer
      Hiding the item-section-renderer that contains any of those removes the
      entire block including the "Shorts" heading, without touching anything else.
    */
    ytd-item-section-renderer:has(yt-grid-shelf-view-model),
    ytd-item-section-renderer:has(ytd-shelf-view-model),
    ytd-item-section-renderer:has(ytd-reel-shelf-renderer),

    /* === SEARCH RESULTS — individual Short video cards === */
    /*
      Short video cards link to /shorts/… — hide the whole card.
    */
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),

    /* === HOME / CHANNEL — Short video cards === */
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]),

    /* === SHORTS BADGE on thumbnails === */
    ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"],

    /* === SEARCH FILTER CHIP === */
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]),

    /* === SHORTS TAB === */
    yt-tab-shape[tab-title="Shorts"],

    /* === NOTIFICATIONS === */
    ytd-notification-renderer:has(a[href*="/shorts/"]),

    /* === SHORTS PLAYER PAGE === */
    ytd-shorts { display: none !important; }
  `;

  function updateStyle() {
    style.textContent = enabled ? CSS_RULES : '';
  }

  let lastPath = window.location.pathname;

  const observer = new MutationObserver(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      redirectIfShortsPage();
    }
  });

  function startObserver() {
    const titleEl = document.querySelector('title');
    if (titleEl) {
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    } else {
      const bodyObserver = new MutationObserver(() => {
        const t = document.querySelector('title');
        if (t) {
          bodyObserver.disconnect();
          observer.observe(t, { childList: true, characterData: true, subtree: true });
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  redirectIfShortsPage();
  updateStyle();
  startObserver();

  browser.runtime.sendMessage({ type: 'getState' }).then((res) => {
    enabled = res.enabled;
    updateStyle();
    redirectIfShortsPage();
  }).catch(() => {});

  browser.storage.onChanged.addListener((changes) => {
    if (changes.enabled !== undefined) {
      enabled = changes.enabled.newValue;
      updateStyle();
      if (enabled) redirectIfShortsPage();
    }
  });

})();
