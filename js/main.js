/* OMGSWAP — main.js: header, mobile menu, reveal animations, dropdowns helper */
(function () {
  'use strict';

  /* Mobile menu */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll('.animate-fadein, .animate-fadein-stagger > *');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Generic dropdowns: position element under trigger, close on outside click / Esc */
  window.OMGSWAP = window.OMGSWAP || {};
  OMGSWAP.dropdown = {
    active: null,
    close: function () {
      if (!this.active) return;
      var d = this.active;
      try { d.btn.classList.remove('open'); d.btn.removeAttribute('aria-expanded'); } catch (e) {}
      if (d.el) { d.el.classList.remove('show'); d.el.setAttribute('aria-hidden', 'true'); d.el.remove(); }
      this.active = null;
    },
    open: function (btn, el, opts) {
      opts = opts || {};
      this.close();
      document.body.appendChild(el);
      var r = btn.getBoundingClientRect();
      el.style.left = Math.round(r.left + (window.scrollX || 0)) + 'px';
      el.style.top = Math.round(r.bottom + (window.scrollY || 0) + 8) + 'px';
      el.style.minWidth = Math.max(140, Math.round(r.width)) + 'px';
      requestAnimationFrame(function () { el.classList.add('show'); });
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      this.active = { el: el, btn: btn };
    }
  };
  document.addEventListener('click', function (e) {
    var d = OMGSWAP.dropdown;
    if (d.active && !d.active.el.contains(e.target) && !d.active.btn.contains(e.target)) d.close();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') OMGSWAP.dropdown.close();
  });

  /* Pageview beacon for the daily stats digest (see /api/track, /api/daily-stats).
     Best-effort, fire-and-forget — never blocks or throws on failure. */
  try {
    var payload = JSON.stringify({ page: location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
    }
  } catch (e) {}

  /* FAQ accordions (generic) */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      if (!item) return;
      var wasOpen = item.classList.contains('open');
      // close siblings within the same list
      var list = item.parentElement;
      if (list) list.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        var a = el.querySelector('.faq-a');
        if (a) a.style.maxHeight = '0px';
      });
      if (!wasOpen) {
        item.classList.add('open');
        var ans = item.querySelector('.faq-a');
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });
})();
