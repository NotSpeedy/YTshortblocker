const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const label = document.getElementById('label');

function updateUI(on) {
  toggle.checked = on;
  label.textContent = on ? 'Enabled' : 'Disabled';
  status.textContent = on ? '✓ Shorts are being blocked' : '✗ Blocker is paused';
  status.className = 'status ' + (on ? 'active' : 'inactive');
}

function getState(callback) {
  chrome.runtime.sendMessage({ type: 'getState' }, (res) => {
    if (chrome.runtime.lastError || !res || typeof res.enabled !== 'boolean') {
      chrome.storage.local.get('enabled', (data) => {
        callback(data.enabled !== false);
      });
      return;
    }

    callback(res.enabled);
  });
}

function setState(on, callback) {
  chrome.runtime.sendMessage({ type: 'setState', enabled: on }, (res) => {
    if (chrome.runtime.lastError || !res || typeof res.enabled !== 'boolean') {
      chrome.storage.local.set({ enabled: on }, () => callback(on));
      return;
    }

    callback(res.enabled);
  });
}

getState(updateUI);

toggle.addEventListener('change', () => {
  const on = toggle.checked;
  updateUI(on);
  setState(on, (confirmed) => {
    if (confirmed !== on) updateUI(confirmed);
  });
});