/* OMGSWAP — reviews.js: partner feedback carousel (no external deps) */
(function () {
  'use strict';

  var REVIEWS = [
    { name: 'Дмитрий', role: 'Постоянный клиент', date: 'июль 2026', rating: 5, text: 'Провёл уже несколько обменов через сервис. Курс согласовали заранее, курьер приехал в назначенное время, передача заняла пару минут. Всё по протоколу.' },
    { name: 'Анатолий', role: 'Партнёр, обменный пункт', date: 'июль 2026', rating: 5, text: 'Подключили курьерскую доставку без собственного штата. Заявки оформляются через систему, статус виден сразу. Клиенты довольны сервисом.' },
    { name: 'Светлана', role: 'Клиент, Москва', date: 'июнь 2026', rating: 5, text: 'Привезли наличные домой. Курьер сверил серии купюр, выдал чек — заняло меньше пяти минут. Удобно и спокойно.' },
    { name: 'Руслан', role: 'Клиент, Казань', date: 'июнь 2026', rating: 4, text: 'В целом остался доволен. Курьер немного задержался из-за пробок, но заранее предупредил и извинился. Курс не менялся.' },
    { name: 'Мария', role: 'Клиент', date: 'май 2026', rating: 5, text: 'Оператор объяснил каждый шаг. Договорились о встрече с курьером, передали наличные — на карту пришло в тот же день.' },
    { name: 'Alex093', role: 'Партнёр-обменник', date: 'май 2026', rating: 5, text: 'Работаем почти ежедневно. Заявки обрабатываются быстро, курьеры аккуратные. Статусы фиксируются в системе — удобно для отчётности.' },
    { name: 'Антон', role: 'Клиент, Санкт-Петербург', date: 'апрель 2026', rating: 5, text: 'Выгодный курс, без очередей. Понравилось, что все условия фиксируют до сделки — заранее знаешь итог в обеих валютах.' },
    { name: 'Тимур', role: 'Партнёр, обменный пункт', date: 'апрель 2026', rating: 5, text: 'До подключения курьерку возили сами — постоянно не хватало людей. Сейчас закрываем заявки без своего штата, клиенты довольны скоростью.' },
    { name: 'Ольга', role: 'Клиент', date: 'март 2026', rating: 5, text: 'Переводила родным в Минск. Раньше банк держал перевод сутки, теперь деньги приходят в тот же день. Менеджер подсказал оптимальный маршрут.' },
    { name: 'Виктория', role: 'Клиент, Новосибирск', date: 'январь 2026', rating: 5, text: 'Проверила менеджера через страницу верификации перед сделкой — удобно, что можно свериться заранее. Всё оказалось честно.' }
  ];

  function slideHTML(r, hidden) {
    var stars = '';
    for (var i = 0; i < r.rating; i++) stars += '★';
    return '<div class="review-slide"' + (hidden ? ' aria-hidden="true"' : '') + '>' +
      '<div class="review-card">' +
        '<div class="review-card__head">' +
          '<div><div class="review-card__name">' + r.name + '</div>' +
          '<div class="review-card__role">' + r.role + '</div></div>' +
          '<div class="review-card__meta">' + r.date + '</div>' +
        '</div>' +
        '<div class="review-card__stars" aria-label="Оценка ' + r.rating + ' из 5">' + stars + '</div>' +
        '<p class="review-card__text">' + r.text + '</p>' +
        '<div class="review-card__verified">✓ Отзыв подтверждён менеджером</div>' +
      '</div>' +
    '</div>';
  }

  // Seamless infinite loop: render [clone][real][clone] back to back. The
  // carousel always sits in the middle "real" block; when a move carries it
  // into a clone block, we silently (no transition) jump it back by one
  // full set — visually identical, since the clone is a pixel-for-pixel
  // copy of the real block it borders.
  function build() {
    var wrap = document.getElementById('reviewsSlider');
    if (!wrap) return;
    var html = '';
    REVIEWS.forEach(function (r) { html += slideHTML(r, true); });
    REVIEWS.forEach(function (r) { html += slideHTML(r, false); });
    REVIEWS.forEach(function (r) { html += slideHTML(r, true); });
    wrap.innerHTML = html;
  }

  function carousel() {
    var wrap = document.getElementById('reviewsSlider');
    var prevBtn = document.getElementById('reviewsPrev');
    var nextBtn = document.getElementById('reviewsNext');
    if (!wrap || !prevBtn || !nextBtn) return;
    var L = REVIEWS.length;
    var index = L; // start at the first slide of the middle "real" block
    var perView = 3;

    function countPerView() {
      var w = window.innerWidth;
      if (w < 700) return 1;
      if (w < 1080) return 2;
      return 3;
    }

    function place(withTransition) {
      wrap.style.transition = withTransition ? 'transform .45s cubic-bezier(.2,.8,.2,1)' : 'none';
      wrap.style.transform = 'translateX(-' + (index * (100 / perView)) + '%)';
    }

    // After the slide-transition finishes, if we've drifted into a clone
    // block, jump back into the equivalent real position with no animation.
    function settle() {
      if (index >= 2 * L) {
        index -= L;
        place(false);
        void wrap.offsetWidth; // force reflow so the jump doesn't animate
      } else if (index < L) {
        index += L;
        place(false);
        void wrap.offsetWidth;
      }
    }

    function style() {
      wrap.style.display = 'flex';
      wrap.style.willChange = 'transform';
      var slides = wrap.querySelectorAll('.review-slide');
      slides.forEach(function (s) { s.style.flex = '0 0 ' + (100 / perView) + '%'; });
    }

    function onTransitionEnd(e) {
      if (e.propertyName === 'transform') settle();
    }
    wrap.addEventListener('transitionend', onTransitionEnd);

    prevBtn.addEventListener('click', function () { index -= 1; place(true); });
    nextBtn.addEventListener('click', function () { index += 1; place(true); });

    window.addEventListener('resize', function () {
      perView = countPerView();
      style();
      place(false);
    });

    perView = countPerView();
    style();
    place(false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    build();
    carousel();
  });
})();
