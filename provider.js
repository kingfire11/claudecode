// Provider switcher: подменяет base URL в code-блоках и .field-value[data-copy].
// Хранится в localStorage под ключом cca_provider: "new" (по умолчанию) или "old".
(function () {
  var PROVIDERS = {
    old: {
      label: 'Старый',
      labelEn: 'Old',
      base: 'https://api.claudecodeapi.cloud',
    },
    new: {
      label: 'Новый',
      labelEn: 'New',
      base: 'https://api.east-api-3.org',
    },
  };
  var OLD = PROVIDERS.old.base;
  var STORAGE_KEY = 'cca_provider';

  function getProvider() {
    var v = localStorage.getItem(STORAGE_KEY);
    return v === 'old' ? 'old' : 'new';
  }
  function setProvider(p) {
    localStorage.setItem(STORAGE_KEY, p);
  }
  function currentBase() {
    return PROVIDERS[getProvider()].base;
  }

  // Заменяет вхождения OLD на target в строке.
  function swap(str, target) {
    if (!str) return str;
    return str.split(OLD).join(target);
  }

  // Обходит текстовые узлы внутри элемента и заменяет URL.
  function walkText(root, target) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.indexOf('api.') !== -1) {
        n.nodeValue = swap(n.nodeValue, target);
        // также подменяем уже-подставленный новый URL обратно при смене
      }
    }
  }

  function applyProvider() {
    var target = currentBase();

    // Перед заменой — нормализуем все известные базы обратно к OLD,
    // чтобы переключение туда-обратно работало.
    var bases = Object.keys(PROVIDERS).map(function (k) { return PROVIDERS[k].base; });

    function normalize(str) {
      if (!str) return str;
      bases.forEach(function (b) {
        if (b !== OLD) str = str.split(b).join(OLD);
      });
      return str;
    }

    // Code-блоки
    document.querySelectorAll('pre code').forEach(function (el) {
      el.textContent = swap(normalize(el.textContent), target);
    });

    // Inline .field-value[data-copy]
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      var dc = el.getAttribute('data-copy');
      var ndc = swap(normalize(dc), target);
      el.setAttribute('data-copy', ndc);
      // и видимый текст, если он совпадает с data-copy
      if (el.textContent.trim() === dc.trim()) {
        el.textContent = ndc;
      } else {
        // на всякий случай — нормализуем и его
        el.textContent = swap(normalize(el.textContent), target);
      }
    });

    // Прочие <code> вне <pre> (например, в инструкциях)
    document.querySelectorAll('code').forEach(function (el) {
      if (el.closest('pre')) return;
      el.textContent = swap(normalize(el.textContent), target);
    });

    // Подсветим активную кнопку
    document.querySelectorAll('.provider-btn').forEach(function (b) {
      var active = b.dataset.provider === getProvider();
      b.classList.toggle('active', active);
      b.style.background = active ? '#00dc82' : 'transparent';
      b.style.color = active ? '#0a0a0a' : '#8b949e';
      b.style.borderColor = active ? '#00dc82' : '#30363d';
    });

    // Сообщим страницам, использующим baseURL для fetch (например, index)
    window.dispatchEvent(new CustomEvent('cca:provider-changed', { detail: { base: target } }));
  }

  function injectSwitcher() {
    var langSwitch = document.querySelector('.lang-switch');
    if (!langSwitch || langSwitch.dataset.providerInjected) return;
    langSwitch.dataset.providerInjected = '1';

    var wrap = document.createElement('div');
    wrap.className = 'provider-switch';
    wrap.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-right:0.75rem;';

    Object.keys(PROVIDERS).forEach(function (key) {
      var btn = document.createElement('button');
      btn.className = 'provider-btn';
      btn.dataset.provider = key;
      btn.dataset.i18nLabel = PROVIDERS[key].labelEn;
      btn.textContent = PROVIDERS[key].label;
      btn.title = key === 'new' ? 'east-api-3.org' : 'claudecodeapi.cloud';
      btn.style.cssText = 'background:transparent;border:1px solid #30363d;color:#8b949e;padding:0.35rem 0.6rem;font-size:0.8rem;font-weight:500;border-radius:6px;cursor:pointer;transition:all 0.2s ease;';
      btn.addEventListener('click', function () {
        if (getProvider() === key) return;
        setProvider(key);
        applyProvider();
      });
      wrap.appendChild(btn);
    });

    langSwitch.parentNode.insertBefore(wrap, langSwitch);
  }

  function init() {
    injectSwitcher();
    applyProvider();

    // На случай переключения языка — он перерисовывает текст,
    // поэтому повторно применим провайдер после клика по lang-btn.
    document.querySelectorAll('.lang-btn:not(.provider-btn)').forEach(function (b) {
      b.addEventListener('click', function () {
        // дать i18n отработать
        setTimeout(applyProvider, 0);
      });
    });
  }

  // Экспорт для других скриптов (index.html: fetch баланса)
  window.CCAProvider = {
    get: getProvider,
    base: currentBase,
    onChange: function (cb) {
      window.addEventListener('cca:provider-changed', function (e) { cb(e.detail.base); });
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
