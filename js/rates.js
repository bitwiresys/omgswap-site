/* OMGSWAP — rates.js: Central Bank of Russia daily rates (same source as reference site) */
(function () {
  'use strict';

  var API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
  var REFRESH_MS = 5 * 60 * 1000;
  var BUY_FACTOR = 0.995;
  var SELL_FACTOR = 1.015;
  var CODES = ['USD', 'EUR', 'CNY', 'GBP', 'TRY', 'AED', 'JPY'];

  // Offline/fallback reference rates (RUB per unit) — used only if the CBR API is unreachable.
  var FALLBACK = { USD: 80.66, EUR: 90.74, CNY: 11.95, GBP: 108.28, TRY: 1.70, AED: 21.96, JPY: 0.50 };

  window.ratesCache = window.ratesCache || {};
  window.ratesCache['RUB'] = { mid: 1 };

  function formatPrice(v) {
    if (v == null || Number.isNaN(v)) return '\u2014';
    return Number(v).toFixed(2);
  }

  function applyToTable(code, mid) {
    var row = document.querySelector('.currency-table tbody tr[data-currency="' + code + '"]');
    if (!row) return;
    var buy = row.querySelector('.cell-buy');
    var sell = row.querySelector('.cell-sell');
    if (buy) buy.textContent = formatPrice(mid * BUY_FACTOR);
    if (sell) sell.textContent = formatPrice(mid * SELL_FACTOR);
  }

  function applyToCards(code, mid) {
    document.querySelectorAll('.crypto-card[data-currency="' + code + '"]').forEach(function (card) {
      var buy = formatPrice(mid * BUY_FACTOR);
      var sell = formatPrice(mid * SELL_FACTOR);
      card.dataset.buy = buy;
      card.dataset.sell = sell;
      var active = card.querySelector('.crypto-card__buttons button.active');
      var price = card.querySelector('.price');
      if (price) price.textContent = (active && active.dataset.type === 'sell') ? sell : buy;
    });
  }

  function setRatesDate(dateStr) {
    var el = document.getElementById('ratesDate');
    if (!el) return;
    var d = new Date(dateStr || new Date().toISOString());
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    el.textContent = dd + '.' + mm + '.' + d.getFullYear();
  }

  async function fetchAndApply() {
    try {
      var r = await fetch(API_URL, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var data = await r.json();
      setRatesDate(data.Timestamp || data.Date);
      var valutes = data.Valute || {};
      CODES.forEach(function (code) {
        var v = valutes[code];
        if (v && typeof v.Value === 'number') {
          var perUnit = v.Value / (v.Nominal || 1);
          window.ratesCache[code] = { mid: perUnit };
          applyToTable(code, perUnit);
          applyToCards(code, perUnit);
        }
      });
      // notify calculator
      if (window.OMGSWAP && OMGSWAP.calc) OMGSWAP.calc.update();
    } catch (e) {
      console.warn('[rates] fetch failed, using fallback values', e);
      setRatesDate(new Date().toISOString());
      CODES.forEach(function (code) {
        var v = FALLBACK[code];
        if (v) {
          window.ratesCache[code] = { mid: v };
          applyToTable(code, v);
          applyToCards(code, v);
        }
      });
      if (window.OMGSWAP && OMGSWAP.calc) OMGSWAP.calc.update();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // buy/sell toggle on crypto cards
    document.querySelectorAll('.crypto-card__buttons button').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.crypto-card');
        card.querySelectorAll('.crypto-card__buttons button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var price = card.querySelector('.price');
        if (price) {
          var v = b.dataset.type === 'sell' ? card.dataset.sell : card.dataset.buy;
          if (v) price.textContent = v;
        }
      });
    });
    fetchAndApply();
    setInterval(fetchAndApply, REFRESH_MS);
  });
})();
