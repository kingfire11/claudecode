document.addEventListener('DOMContentLoaded', function() {
  // Apply saved API key
  const apiKey = localStorage.getItem('cca_api_key');
  if (apiKey) {
    document.querySelectorAll('.code-block code').forEach(el => {
      el.textContent = el.textContent.replace(/YOUR_API_KEY/g, apiKey);
    });
    document.querySelectorAll('.field-value').forEach(el => {
      if (el.textContent.trim() === 'YOUR_API_KEY') {
        el.textContent = apiKey;
        if (el.dataset.copy) el.dataset.copy = apiKey;
      }
    });
  }

  // Copy buttons for code blocks
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add('copied');
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Скопировано';
        setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
      } catch(e) {}
    });
  });

  // Copyable fields
  document.querySelectorAll('.copyable').forEach(el => {
    el.addEventListener('click', async () => {
      const text = el.dataset.copy || el.textContent;
      try {
        await navigator.clipboard.writeText(text);
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 1500);
      } catch(e) {}
    });
  });

  // Header shadow
  let ticking = false;
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.style.boxShadow = window.scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.5)' : 'none';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Language switcher (basic)
  let currentLang = 'ru';
  const ruTexts = {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    ruTexts[el.getAttribute('data-i18n')] = el.innerHTML;
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.dataset.lang;
      if (lang === currentLang) return;
      currentLang = lang;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.documentElement.lang = lang;

      const t = lang === 'en' ? (window.toolTranslations || {}) : ruTexts;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerHTML = t[key];
      });
    });
  });
});
