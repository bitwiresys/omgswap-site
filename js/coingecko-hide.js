// Hide "Powered by coingecko" attribution row inside the CoinGecko price
// chart widget. The widget is a custom element whose shadowRoot is open in
// practice, so we can inject a <style> into each shadow tree. CSS attempts
// from the host page cannot pierce it.
//
// Pattern lifted from script/binance-slow.js — recursive walker + inject
// style + MutationObserver in case the widget re-renders.

(function () {
  'use strict';

  const STYLE_MARKER = 'data-cd-hide-powered';
  const CSS = `
    [class*="powered" i],
    [class*="attribution" i],
    [class*="footer" i],
    a[href*="coingecko.com" i] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
  `;

  function injectStyle(root) {
    if (!root || !root.querySelector) return;
    if (root.querySelector(`style[${STYLE_MARKER}]`)) return;
    try {
      const style = document.createElement('style');
      style.setAttribute(STYLE_MARKER, '1');
      style.textContent = CSS;
      root.appendChild(style);
    } catch (e) {
      console.warn('[coingecko-hide] inject failed', e);
    }
  }

  function walkAndInject(root) {
    if (!root) return;
    injectStyle(root);
    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    elements.forEach((el) => {
      if (el.shadowRoot) walkAndInject(el.shadowRoot);
    });
  }

  function sweep() {
    walkAndInject(document.documentElement);
    document
      .querySelectorAll('gecko-coin-price-chart-widget, gecko-coin-list-widget, [class*="gecko" i]')
      .forEach((el) => { if (el.shadowRoot) walkAndInject(el.shadowRoot); });
  }

  function start() {
    sweep();
    const obs = new MutationObserver(() => sweep());
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    // Widgets sometimes rebuild their shadow tree after their own async
    // fetch lands. Sweep periodically for the first 30s as a safety net.
    let n = 0;
    const tick = setInterval(() => {
      sweep();
      if (++n > 30) clearInterval(tick);
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
