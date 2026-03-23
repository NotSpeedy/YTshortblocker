// YouTube Shorts Blocker - Content Script (Firefox MV2)
(function() {
  let enabled = true;

  const style = document.createElement('style');
  style.id = 'yt-shorts-blocker-style';
  (document.head || document.documentElement).appendChild(style);

  const CSS_RULES = `
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,
    tp-yt-paper-tab:has(> .tab-content > yt-icon + .tab-title:not([hidden])):has(a[href*="shorts"]),
    yt-tab-shape[tab-title="Shorts"],
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]),
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"],
    ytd-notification-renderer:has(a[href*="/shorts/"]) {
      display: none !important;
    }
  `;

  function updateStyle() {
    style.textContent = enabled ? CSS_RULES : '';
  }

  function handleRedirect() {
    if (!enabled) return;
    const path = window.location.pathname;
    if (path.startsWith('/shorts/')) {
      const videoId = path.split('/shorts/')[1].split('?')[0];
      window.location.replace('https://www.youtube.com/watch?v=' + videoId);
    }
  }

  browser.runtime.sendMessage({ type: 'getState' }).then((res) => {
    enabled = res.enabled;
    updateStyle();
    handleRedirect();
  }).catch(() => {});

  browser.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      updateStyle();
    }
  });

  const navObserver = new MutationObserver(() => {
    handleRedirect();
  });
  navObserver.observe(document.documentElement, { childList: true, subtree: true });

  updateStyle();
})();
