// Firefox MV2 background script
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'getState') {
    return browser.storage.local.get('enabled').then((data) => {
      return { enabled: data.enabled !== false };
    });
  }
  if (msg.type === 'setState') {
    return browser.storage.local.set({ enabled: msg.enabled }).then(() => {
      return { enabled: msg.enabled };
    });
  }
});
