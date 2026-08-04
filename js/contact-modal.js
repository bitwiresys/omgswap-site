/* OMGSWAP — contact-modal.js: "Связаться в Telegram" form → /api/lead */
(function () {
  'use strict';

  var USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/;

  function bind() {
    var overlay = document.getElementById('contactModal');
    var closeBtn = document.getElementById('contactModalClose');
    var submitBtn = document.getElementById('contactModalSubmit');
    var errorBox = document.getElementById('contactModalError');
    var formBox = document.getElementById('contactModalForm');
    var doneBox = document.getElementById('contactModalDone');
    var openers = document.querySelectorAll('.js-open-contact');
    if (!overlay || !openers.length) return;

    var usernameEl = document.getElementById('cmUsername');
    var amountEl = document.getElementById('cmAmount');
    var currencyEl = document.getElementById('cmCurrency');
    var commentEl = document.getElementById('cmComment');

    function resetForm() {
      formBox.hidden = false;
      doneBox.hidden = true;
      errorBox.textContent = '';
      usernameEl.value = '';
      amountEl.value = '';
      currencyEl.value = '';
      commentEl.value = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить';
    }

    function open() {
      resetForm();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { usernameEl.focus(); }, 50);
    }

    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openers.forEach(function (btn) {
      btn.addEventListener('click', open);
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    submitBtn.addEventListener('click', function () {
      var username = usernameEl.value.trim().replace(/^@/, '');
      var amount = Number(amountEl.value);
      errorBox.textContent = '';

      if (!USERNAME_RE.test(username)) {
        errorBox.textContent = 'Введите корректный Telegram-юзернейм (5–32 символа, латиница/цифры/_).';
        usernameEl.focus();
        return;
      }
      if (!amount || amount <= 0) {
        errorBox.textContent = 'Укажите сумму обмена больше нуля.';
        amountEl.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          amount: amount,
          currency: currencyEl.value.trim(),
          comment: commentEl.value.trim(),
          page: location.pathname
        })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.ok) {
            formBox.hidden = true;
            doneBox.hidden = false;
          } else {
            errorBox.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
          }
        })
        .catch(function () {
          errorBox.textContent = 'Не удалось отправить заявку — проверьте соединение и попробуйте снова.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить';
        });
    });
  }

  document.addEventListener('DOMContentLoaded', bind);
})();
