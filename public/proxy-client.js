(() => {
  const PROXY_PREFIX = '/service/';

  function encodeBase64Url(value) {
    const encoded = btoa(unescape(encodeURIComponent(value)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function proxify(url) {
    return `${PROXY_PREFIX}${encodeBase64Url(url)}`;
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    const absolute = new URL(href, window.location.href);
    if (!/^https?:$/.test(absolute.protocol)) return;

    event.preventDefault();
    window.location.assign(proxify(absolute.toString()));
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const action = form.getAttribute('action') || window.location.href;
    const absolute = new URL(action, window.location.href);
    if (!/^https?:$/.test(absolute.protocol)) return;

    event.preventDefault();
    window.location.assign(proxify(absolute.toString()));
  });
})();
