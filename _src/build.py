#!/usr/bin/env python3
"""OMGSWAP static site builder: inject shared header/footer into page bodies."""
import os, re, html as html_mod

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # omgswap-site/
SRC = os.path.join(ROOT, '_src')
PAGES_DIR = os.path.join(SRC, 'pages')

# Bump this whenever img/logo-mark.png or img/favicon* change, so browsers
# that aggressively cache static assets (e.g. plain http.server, no
# Cache-Control headers) are forced to fetch the new file instead of
# reusing a stale cached copy under the same URL.
ASSET_V = '5'

NAV = [
    ('index.html', 'home', 'Главная'),
    ('contacts.html', 'contacts', 'Контакты'),
    ('about.html', 'about', 'О нас'),
    ('job.html', 'work', 'О работе'),
    ('guides.html', 'guides', 'Гайды'),
    ('faq.html', 'faq', 'FAQ'),
    ('verification.html', 'verification', 'Верификация'),
]

def nav_html(active_key):
    links = []
    for href, key, label in NAV:
        cls = 'active' if key == active_key else ''
        links.append(
            f'<a class="nav__link {cls}" href="{href}" data-nav-key="{key}">{label}</a>'
        )
    return '\n              '.join(links)

def mobile_nav_html(active_key):
    links = []
    for href, key, label in NAV:
        cls = 'active' if key == active_key else ''
        links.append(f'<a href="{href}" class="{cls}" data-nav-key="{key}">{label}</a>')
    return '\n      '.join(links)

def header(active_key):
    return f'''<header class="header">
  <div class="container header__inner">
    <a class="brand" href="index.html" aria-label="OMGSWAP">
      <span class="brand__mark" aria-hidden="true">
        <img class="brand__logo-mark" src="img/logo-mark.png?v={ASSET_V}" alt="" />
      </span>
      <span class="brand__wordmark">OMG<em>SWAP</em></span>
    </a>
    <nav class="nav" aria-label="Основная навигация">
      {nav_html(active_key)}
    </nav>
    <div class="header__actions">
      <button type="button" class="btn btn-primary btn-sm hidden-sm js-open-contact">Оставить заявку</button>
      <button type="button" class="tg-chip js-open-contact" aria-label="Написать в Telegram">
        <svg viewBox="0 0 22 19" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21.6 1.65L18.31 17.01c-.24 1.09-.87 1.33-1.78.84l-4.92-3.63-2.41 2.3c-.25.25-.46.46-.94.46l.38-5.06L17.72 3.6c.38-.39-.1-.6-.6-.34L5.71 10.59.78 9.09C-.3 8.74-.3 8 .99 7.51L20.17.08c.94-.28 1.75.2 1.43 1.57Z"/>
        </svg>
      </button>
      <button class="burger" id="burger" aria-label="Меню" aria-controls="mobileMenu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<aside class="mobile-menu" id="mobileMenu" aria-hidden="true">
  {mobile_nav_html(active_key)}
  <div class="mm-actions">
    <button type="button" class="btn btn-primary js-open-contact">Оставить заявку</button>
    <button type="button" class="btn btn-ghost js-open-contact">Написать в Telegram</button>
  </div>
</aside>'''

FOOTER = f'''<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__col">
        <a class="footer-logo brand" href="index.html" aria-label="OMGSWAP">
          <span class="brand__mark"><img class="brand__logo-mark" src="img/logo-mark.png?v={ASSET_V}" alt="" /></span>
          <span class="brand__wordmark">OMG<em>SWAP</em></span>
        </a>
        <div class="footer__sponsor">Партнёрская сеть</div>
        <div class="partner-grid" role="list">
          <span class="partner">100+ обменных пунктов</span>
          <span class="partner">17+ городов РФ</span>
          <span class="partner">Курьерская служба</span>
          <span class="partner">24/7</span>
        </div>
      </div>
      <div class="footer__col">
        <h4>Сервис</h4>
        <div class="footer__links">
          <a class="footer__link" href="index.html">Главная</a>
          <a class="footer__link" href="index.html#reviews">Отзывы</a>
          <a class="footer__link" href="about.html">О нас</a>
          <a class="footer__link" href="job.html">О работе</a>
          <a class="footer__link" href="guides.html">Гайды</a>
        </div>
      </div>
      <div class="footer__col">
        <h4>Документы</h4>
        <div class="footer__links">
          <a class="footer__link" href="verification.html">Верификация</a>
          <a class="footer__link" href="rules.html">Правила сервиса</a>
          <a class="footer__link" href="faq.html">FAQ</a>
          <a class="footer__link" href="cookie.html">Файлы cookie</a>
        </div>
      </div>
      <div class="footer__col">
        <h4>Контакты</h4>
        <div class="footer__contacts">
          <button type="button" class="btn btn-ghost js-open-contact">Связаться в Telegram</button>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 2026 OMGSWAP. Все права защищены.</span>
      <span class="slogan">NO AML. NO KYC.</span>
    </div>
  </div>
</footer>'''

CONTACT_MODAL = '''<div class="contact-modal-overlay" id="contactModal" aria-hidden="true">
  <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">
    <button type="button" class="contact-modal__close" id="contactModalClose" aria-label="Закрыть">&times;</button>
    <div class="contact-modal__body" id="contactModalForm">
      <h3 id="contactModalTitle">Связаться в Telegram</h3>
      <p class="contact-modal__hint">Оставьте юзернейм и сумму обмена — менеджер напишет вам первым.</p>
      <div class="form-field">
        <label class="field-label">Ваш Telegram-юзернейм</label>
        <input class="input" id="cmUsername" type="text" placeholder="@username" autocomplete="off" />
      </div>
      <div class="form-field">
        <label class="field-label">Сумма обмена</label>
        <input class="input" id="cmAmount" type="number" step="0.01" min="0" placeholder="1000" />
      </div>
      <div class="form-field">
        <label class="field-label">Валюта (необязательно)</label>
        <input class="input" id="cmCurrency" type="text" placeholder="USD, EUR, CNY..." maxlength="8" />
      </div>
      <div class="form-field">
        <label class="field-label">Комментарий (необязательно)</label>
        <textarea class="textarea" id="cmComment" rows="2" placeholder="Например, направление или город"></textarea>
      </div>
      <div id="contactModalError" class="contact-modal__error" role="alert"></div>
      <button type="button" class="btn btn-primary btn-lg" id="contactModalSubmit" style="width:100%;">Отправить</button>
    </div>
    <div class="contact-modal__done" id="contactModalDone" hidden>
      <div class="big">✓</div>
      <h3>Заявка отправлена</h3>
      <p>Менеджер свяжется с вами в Telegram в ближайшее время.</p>
    </div>
  </div>
</div>'''

PAGES = {
    'index.html': ('index', 'OMGSWAP — точный обмен валют с доставкой',
                   'Точный обмен валют с доставкой. Проверенные партнёры, единые стандарты сделки, собственная курьерская служба.'),
    'contacts.html': ('contacts', 'Контакты — OMGSWAP', 'Свяжитесь с нами в Telegram или по почте — отвечаем круглосуточно.'),
    'verification.html': ('verification', 'Верификация менеджера — OMGSWAP', 'Проверьте менеджера OMGSWAP по Telegram-юзернейму.'),
    'guides.html': ('guides', 'Гайды — OMGSWAP', 'База знаний: инструкции и разборы по обмену валют, безопасности и работе с курьерами.'),
    'guide.html': ('guides', 'Гайд — OMGSWAP', 'Статья из базы знаний OMGSWAP.'),
    'faq.html': ('faq', 'FAQ — OMGSWAP', 'Часто задаваемые вопросы о сервисе.'),
    'about.html': ('about', 'О нас — OMGSWAP', 'Агрегатор обменных пунктов с собственной курьерской службой.'),
    'job.html': ('work', 'Работа в команде — OMGSWAP', 'Вакансии: курьеры, диспетчеры, менеджеры. Заявка онлайн.'),
    'rules.html': ('rules', 'Правила сервиса — OMGSWAP', 'Порядок использования сервиса OMGSWAP.'),
    'cookie.html': ('cookie', 'Файлы cookie — OMGSWAP', 'Как мы используем cookie.'),
}

def main():
    for fname, (active_key, title, desc) in PAGES.items():
        body_path = os.path.join(PAGES_DIR, fname)
        with open(body_path, encoding='utf-8') as f:
            body = f.read()
        head = f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <link rel="icon" type="image/x-icon" href="img/favicon.ico?v={ASSET_V}" />
  <link rel="icon" type="image/png" sizes="64x64" href="img/favicon.png?v={ASSET_V}" />
  <link rel="shortcut icon" href="img/favicon.ico?v={ASSET_V}" />
  <link rel="stylesheet" href="css/omgswap.css?v={ASSET_V}" />
</head>
<body>
{header(active_key)}
<main>'''
        tail = f'''</main>
{FOOTER}
{CONTACT_MODAL}
<script src="js/main.js?v={ASSET_V}"></script>
<script src="js/rates.js?v={ASSET_V}"></script>
<script src="js/calc.js?v={ASSET_V}"></script>
<script src="js/feedback.js?v={ASSET_V}"></script>
<script src="js/reviews.js?v={ASSET_V}"></script>
<script src="js/guides.js?v={ASSET_V}"></script>
<script src="js/contact-modal.js?v={ASSET_V}"></script>
</body>
</html>'''
        out = os.path.join(ROOT, fname)
        with open(out, 'w', encoding='utf-8') as f:
            f.write(head + '\n' + body + '\n' + tail)
        print('built', fname)

if __name__ == '__main__':
    main()
