// ── Translations ───────────────────────────────────────────────────────────
var TRANSLATIONS = {
  en: {
    description:    'Block YouTube Shorts from appearing across all YouTube pages.',
    toggleLabel:    'Enabled',
    toggleLabelOff: 'Disabled',
    toggleSub:      'Click to pause blocking',
    toggleSubOff:   'Click to enable blocking',
    statusActive:   'Shorts are being blocked',
    statusInactive: 'Blocker is paused',
  },
  nl: {
    description:    'Blokkeer YouTube Shorts op alle YouTube-pagina\'s.',
    toggleLabel:    'Ingeschakeld',
    toggleLabelOff: 'Uitgeschakeld',
    toggleSub:      'Klik om te pauzeren',
    toggleSubOff:   'Klik om in te schakelen',
    statusActive:   'Shorts worden geblokkeerd',
    statusInactive: 'Blokkering is gepauzeerd',
  }
};

var currentLang = 'en';

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || key;
}

// ── Apply language to all text elements ────────────────────────────────────
function applyLang(lang) {
  currentLang = (lang === 'nl') ? 'nl' : 'en';

  document.getElementById('lang-en').classList.toggle('active', currentLang === 'en');
  document.getElementById('lang-nl').classList.toggle('active', currentLang === 'nl');

  document.getElementById('description').textContent = t('description');

  // Re-apply toggle text with current on/off state
  var on = document.getElementById('toggle').checked;
  applyToggleText(on);
}

function applyToggleText(on) {
  document.getElementById('toggle-label').textContent = on ? t('toggleLabel')   : t('toggleLabelOff');
  document.getElementById('toggle-sub').textContent   = on ? t('toggleSub')     : t('toggleSubOff');
  document.getElementById('status-text').textContent  = on ? t('statusActive')  : t('statusInactive');

  var pill = document.getElementById('status-pill');
  pill.className = 'status-pill ' + (on ? 'active' : 'inactive');
}

// ── Full UI update ─────────────────────────────────────────────────────────
function updateUI(on) {
  document.getElementById('toggle').checked = on;
  applyToggleText(on);
}

// ── Chrome storage helpers ─────────────────────────────────────────────────
function setState(on, callback) {
  chrome.runtime.sendMessage({ type: 'setState', enabled: on }, function(res) {
    if (chrome.runtime.lastError || !res || typeof res.enabled !== 'boolean') {
      chrome.storage.local.set({ enabled: on }, function() { callback(on); });
      return;
    }
    callback(res.enabled);
  });
}

// ── Boot — wait for DOM to be ready ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Wire up language buttons via addEventListener (CSP-safe, no inline handlers)
  document.getElementById('lang-en').addEventListener('click', function() {
    currentLang = 'en';
    chrome.storage.local.set({ lang: 'en' });
    applyLang('en');
  });

  document.getElementById('lang-nl').addEventListener('click', function() {
    currentLang = 'nl';
    chrome.storage.local.set({ lang: 'nl' });
    applyLang('nl');
  });

  // Wire up toggle
  document.getElementById('toggle').addEventListener('change', function() {
    var on = this.checked;
    updateUI(on);
    setState(on, function(confirmed) {
      if (confirmed !== on) updateUI(confirmed);
    });
  });

  // Load saved language + enabled state together on popup open
  chrome.storage.local.get(['enabled', 'lang'], function(data) {
    var lang = (data.lang === 'nl') ? 'nl' : 'en';
    var on   = (data.enabled !== false);

    currentLang = lang;
    applyLang(lang);  // sets button active states + all translated text
    updateUI(on);     // sets toggle checkbox + status pill
  });

});
