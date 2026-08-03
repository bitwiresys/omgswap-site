/* OMGSWAP — calc.js: currency calculator (mirrors reference behaviour) */
(function () {
  'use strict';

  function getMid(code) {
    var r = window.ratesCache && window.ratesCache[code];
    if (r && typeof r.mid === 'number') return r.mid;
    if (code === 'RUB') return 1;
    var row = document.querySelector('.currency-table tbody tr[data-currency="' + code + '"]');
    if (row) {
      var txt = (row.querySelector('.cell-buy') || {}).textContent || '';
      var v = parseFloat(txt.replace(',', '.').replace(/[^\d.\-]/g, ''));
      if (!Number.isNaN(v) && v !== 0) return v;
    }
    return null;
  }

  function currencies() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.currency-table tbody tr[data-currency]'));
    var list = rows.map(function (r) { return r.dataset.currency; }).filter(Boolean);
    if (list.indexOf('RUB') === -1) list.unshift('RUB');
    return list.length ? list : ['RUB', 'USD', 'EUR', 'CNY'];
  }

  function setBtn(btn, code) {
    if (!btn) return;
    btn.classList.remove('open');
    btn.innerHTML = '';
    var span = document.createElement('span');
    span.className = 'currency-code';
    span.textContent = code;
    var img = document.createElement('img');
    img.src = 'img/arrow.svg';
    img.alt = '';
    img.className = 'currency-arrow';
    btn.appendChild(span);
    btn.appendChild(img);
    btn.setAttribute('aria-expanded', 'false');
  }

  function buildDropdown(btn) {
    var list = document.createElement('div');
    list.className = 'currency-dropdown';
    list.setAttribute('aria-hidden', 'true');
    currencies().forEach(function (code) {
      var it = document.createElement('button');
      it.type = 'button';
      it.className = 'currency-dropdown-item';
      it.textContent = code;
      it.addEventListener('click', function () {
        setBtn(btn, code);
        OMGSWAP.dropdown.close();
        update();
      });
      list.appendChild(it);
    });
    return list;
  }

  function update() {
    var fromBtn = document.querySelector('.currency-select[data-role="from"]');
    var toBtn = document.querySelector('.currency-select[data-role="to"]');
    var inFrom = document.querySelector('.fx-from');
    var inTo = document.querySelector('.fx-to');
    var rateEl = document.getElementById('fxRate');
    var crossEl = document.getElementById('fxCrossRate');
    if (!fromBtn || !toBtn || !inFrom || !inTo) return;

    var from = (fromBtn.querySelector('.currency-code') || {}).textContent || '';
    var to = (toBtn.querySelector('.currency-code') || {}).textContent || '';
    var mF = getMid(from.trim());
    var mT = getMid(to.trim());
    var val = Number(inFrom.value || 0);

    if (mF == null || mT == null || mT === 0) {
      if (rateEl) rateEl.textContent = '';
      if (crossEl) crossEl.textContent = '';
      inTo.value = '';
      return;
    }
    var rate = mF / mT;
    inTo.value = val ? (val * rate).toFixed(2) : '';
    if (rateEl) rateEl.textContent = '1 ' + from.trim() + ' = ' + rate.toFixed(4) + ' ' + to.trim();

    if (crossEl) {
      var base = 'EUR';
      var mb = getMid(base);
      var other = from.trim() === base ? to.trim() : (to.trim() === base ? from.trim() : null);
      if (other && mb != null) {
        var mo = getMid(other);
        crossEl.textContent = (mo != null && mo !== 0) ? ('1 ' + base + ' = ' + (mb / mo).toFixed(4) + ' ' + other) : '';
      } else {
        var pref = to.trim() || from.trim();
        var mp = getMid(pref);
        crossEl.textContent = (pref && mb != null && mp != null && mp !== 0) ? ('1 ' + base + ' = ' + (mb / mp).toFixed(4) + ' ' + pref) : '';
      }
    }
  }

  function init() {
    var swap = document.getElementById('fxSwap');
    if (swap) {
      swap.addEventListener('click', function () {
        var f = document.querySelector('.currency-select[data-role="from"]');
        var t = document.querySelector('.currency-select[data-role="to"]');
        if (!f || !t) return;
        var cf = (f.querySelector('.currency-code') || {}).textContent;
        var ct = (t.querySelector('.currency-code') || {}).textContent;
        var vf = document.querySelector('.fx-from');
        var vt = document.querySelector('.fx-to');
        setBtn(f, ct.trim());
        setBtn(t, cf.trim());
        if (vf && vt) { var tmp = vf.value; vf.value = vt.value; vt.value = tmp; }
        swap.classList.add('rotating');
        setTimeout(function () { swap.classList.remove('rotating'); }, 350);
        update();
      });
    }
    document.querySelectorAll('.currency-select').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var d = OMGSWAP.dropdown;
        if (d.active && d.active.btn === btn) { d.close(); return; }
        d.open(btn, buildDropdown(btn));
      });
    });
    var inFrom = document.querySelector('.fx-from');
    if (inFrom) inFrom.addEventListener('input', update);
    update();
  }

  OMGSWAP.calc = { update: update };
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
