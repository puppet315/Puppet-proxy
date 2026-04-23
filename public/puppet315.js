(() => {
  const tabsEl = document.getElementById('tabs');
  const frameWrap = document.getElementById('frameWrap');
  const addressBar = document.getElementById('addressBar');
  const statusEl = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const goBtn = document.getElementById('goBtn');

  const tabs = new Map();
  let activeTabId = null;

  const encodeBase64Url = (value) => btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const proxify = (url) => `/service/${encodeBase64Url(url)}`;

  function normalizeUrl(value) {
    const input = value.trim();
    if (!input) return null;
    if (!/^https?:\/\//i.test(input)) return new URL(`https://${input}`).toString();
    return new URL(input).toString();
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    for (const [id, tab] of tabs.entries()) {
      const tabEl = document.createElement('button');
      tabEl.className = `tab ${id === activeTabId ? 'active' : ''}`;
      tabEl.type = 'button';

      const title = document.createElement('span');
      title.className = 'tab-title';
      title.textContent = tab.title;
      tabEl.appendChild(title);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-btn';
      closeBtn.type = 'button';
      closeBtn.textContent = '✕';
      closeBtn.onclick = (event) => {
        event.stopPropagation();
        closeTab(id);
      };
      tabEl.appendChild(closeBtn);

      tabEl.onclick = () => activateTab(id);
      tabsEl.appendChild(tabEl);
    }

    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'new-tab';
    newTabBtn.type = 'button';
    newTabBtn.textContent = '+';
    newTabBtn.onclick = () => createTab();
    tabsEl.appendChild(newTabBtn);
  }

  function activateTab(id) {
    activeTabId = id;
    for (const [tabId, tab] of tabs.entries()) {
      tab.iframe.classList.toggle('active', tabId === id);
    }
    const active = tabs.get(id);
    addressBar.value = active?.url || '';
    renderTabs();
  }

  function createTab(initialUrl = 'https://example.org') {
    const id = crypto.randomUUID();
    const iframe = document.createElement('iframe');
    iframe.referrerPolicy = 'no-referrer';
    iframe.setAttribute('sandbox', 'allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts');

    const tab = {
      id,
      title: 'New Tab',
      url: '',
      iframe,
    };

    iframe.addEventListener('load', () => {
      try {
        const docTitle = iframe.contentDocument?.title?.trim();
        if (docTitle) tab.title = docTitle;
      } catch (_) {}
      renderTabs();
      setStatus(`Loaded: ${tab.url}`);
    });

    tabs.set(id, tab);
    frameWrap.appendChild(iframe);
    activateTab(id);
    navigate(initialUrl, id);
  }

  function closeTab(id) {
    const tab = tabs.get(id);
    if (!tab) return;
    tab.iframe.remove();
    tabs.delete(id);

    if (tabs.size === 0) {
      createTab();
      return;
    }

    if (activeTabId === id) {
      const fallback = tabs.keys().next().value;
      activateTab(fallback);
    }

    renderTabs();
  }

  function navigate(raw, tabId = activeTabId) {
    const tab = tabs.get(tabId);
    if (!tab) return;

    try {
      const url = normalizeUrl(raw);
      if (!url) return;
      tab.url = url;
      tab.title = new URL(url).hostname;
      tab.iframe.src = proxify(url);
      addressBar.value = url;
      setStatus(`Loading ${url} ...`);
      renderTabs();
    } catch {
      setStatus('Invalid URL. Try a full host like example.org or https://example.org');
    }
  }

  goBtn.onclick = () => navigate(addressBar.value);
  addressBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') navigate(addressBar.value);
  });

  backBtn.onclick = () => {
    const tab = tabs.get(activeTabId);
    tab?.iframe.contentWindow?.history.back();
  };
  forwardBtn.onclick = () => {
    const tab = tabs.get(activeTabId);
    tab?.iframe.contentWindow?.history.forward();
  };
  reloadBtn.onclick = () => {
    const tab = tabs.get(activeTabId);
    tab?.iframe.contentWindow?.location.reload();
  };

  createTab();
})();
