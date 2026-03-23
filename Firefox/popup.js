// popup.js - Firefox MV2 Compatible
const translations = {
  en: {
    desc: "Block YouTube Shorts from appearing across all YouTube pages.",
    enabled: "Enabled",
    disabled: "Disabled",
    sub_on: "Click to pause blocking",
    sub_off: "Click to resume blocking",
    status_on: "Shorts are being blocked",
    status_off: "Blocking is currently paused"
  },
  nl: {
    desc: "Blokkeer YouTube Shorts op alle YouTube-pagina's.",
    enabled: "Ingeschakeld",
    disabled: "Uitgeschakeld",
    sub_on: "Klik om te pauzeren",
    sub_off: "Klik om te hervatten",
    status_on: "Shorts worden geblokkeerd",
    status_off: "Blokkeren is gepauzeerd"
  }
};

let currentLang = 'en';

function updateUI(enabled) {
  const t = translations[currentLang];
  
  document.getElementById('toggle').checked = enabled;
  document.getElementById('label-enabled').textContent = enabled ? t.enabled : t.disabled;
  document.getElementById('sublabel-click').textContent = enabled ? t.sub_on : t.sub_off;
  document.getElementById('status-text').textContent = enabled ? t.status_on : t.status_off;
  document.getElementById('text-desc').textContent = t.desc;

  // Kleur aanpassingen voor status
  const statusBar = document.getElementById('status-area');
  if (enabled) {
    statusBar.style.color = 'var(--accent-green)';
    statusBar.style.borderColor = 'rgba(43, 166, 64, 0.2)';
    statusBar.style.background = 'rgba(43, 166, 64, 0.1)';
  } else {
    statusBar.style.color = '#ff4444';
    statusBar.style.borderColor = 'rgba(255, 68, 68, 0.2)';
    statusBar.style.background = 'rgba(255, 68, 68, 0.1)';
  }
}

function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-nl').classList.toggle('active', lang === 'nl');
  
  browser.storage.local.set({ language: lang });
  
  browser.storage.local.get('enabled').then(res => {
    updateUI(res.enabled !== false);
  });
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
  // Haal opgeslagen staat en taal op
  browser.storage.local.get(['enabled', 'language']).then(res => {
    if (res.language) {
      currentLang = res.language;
      document.getElementById('btn-en').classList.toggle('active', currentLang === 'en');
      document.getElementById('btn-nl').classList.toggle('active', currentLang === 'nl');
    }
    updateUI(res.enabled !== false);
  });

  // Toggle event
  document.getElementById('toggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    browser.runtime.sendMessage({ type: 'setState', enabled: isEnabled }).then(() => {
      updateUI(isEnabled);
    });
  });

  // Taal knoppen
  document.getElementById('btn-en').addEventListener('click', () => setLanguage('en'));
  document.getElementById('btn-nl').addEventListener('click', () => setLanguage('nl'));
});