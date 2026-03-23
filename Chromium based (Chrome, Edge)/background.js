// Default to enabled
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    chrome.storage.local.get('enabled', (data) => {
      sendResponse({ enabled: data.enabled !== false });
    });
    return true;
  }
  if (msg.type === 'setState') {
    chrome.storage.local.set({ enabled: msg.enabled }, () => {
      sendResponse({ enabled: msg.enabled });
    });
    return true;
  }
});
