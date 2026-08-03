/* OMGSWAP — feedback.js: manager verification */
(function () {
  'use strict';

  function showModal(items) {
    var overlay = document.createElement('div');
    overlay.className = 'req-modal-overlay';
    var box = document.createElement('div');
    box.className = 'req-modal';
    var p = document.createElement('p');
    p.textContent = (items && items.length === 3) ? 'Пожалуйста, заполните все поля' : 'Пожалуйста заполните:';
    box.appendChild(p);
    if (items && items.length && items.length !== 3) {
      var ul = document.createElement('ul');
      items.forEach(function (name) {
        var li = document.createElement('li');
        li.textContent = name;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    function dismiss() { overlay.remove(); }
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'req-modal-close';
    close.textContent = 'Ок';
    close.addEventListener('click', dismiss);
    box.appendChild(close);
    overlay.appendChild(box);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' && overlay.isConnected) { dismiss(); document.removeEventListener('keydown', onKey); }
    });
    document.body.appendChild(overlay);
  }

  /* ---- Verification form ---- */
  // Whitelist of official OMGSWAP manager handles. Anything not on this
  // list is reported as unverified — a "verify manager" tool that always
  // says "confirmed" would defeat its own anti-phishing purpose.
  var VERIFIED_HANDLES = ['pulsenova', 'omgswap', 'whorealer'];
  var USERNAME_RE = /^[a-z0-9_]{5,32}$/i;

  function normalizeHandle(v) {
    return v.trim().replace(/^@/, '');
  }

  function bindVerification() {
    var btn = document.getElementById('verifyBtn');
    var input = document.getElementById('verifyInput');
    var res = document.getElementById('verifyResult');
    if (!btn || !input || !res) return;
    btn.addEventListener('click', function () {
      var raw = input.value.trim();
      if (!raw) { showModal(['Введите Telegram-юзернейм']); return; }
      var handle = normalizeHandle(raw);
      var safeRaw = raw.replace(/</g, '&lt;');
      if (!USERNAME_RE.test(handle)) {
        res.className = 'verify-result bad';
        res.innerHTML = 'Похоже, это не юзернейм Telegram. Введите ник в формате <strong>@username</strong> — проверка работает только по юзернейму.';
        res.style.display = 'block';
        return;
      }
      var isVerified = VERIFIED_HANDLES.indexOf(handle.toLowerCase()) !== -1;
      if (isVerified) {
        res.className = 'verify-result ok';
        res.innerHTML = 'Подтверждено: <strong>@' + handle + '</strong> — официальный представитель OMGSWAP.';
      } else {
        res.className = 'verify-result bad';
        res.innerHTML = 'Не подтверждено. В нашей базе нет менеджера «@' + safeRaw.replace(/^@/, '') + '». ' +
          'Официальный менеджер OMGSWAP пишет с одного из аккаунтов: <strong>@pulsenova</strong>, <strong>@omgswap</strong>, <strong>@whorealer</strong>. Будьте осторожны с другими аккаунтами.';
      }
      res.style.display = 'block';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindVerification();
  });
})();
