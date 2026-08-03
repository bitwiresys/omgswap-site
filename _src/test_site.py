#!/usr/bin/env python3
"""Test built OMGSWAP site: load pages, capture console errors, screenshots, test interactions."""
import asyncio, json, os, http.server, threading, functools
from playwright.async_api import async_playwright

ROOT = "/home/user/omgswap-site"
OUT = "/home/user/omgswap-site/_src/shots"
os.makedirs(OUT, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, *a): pass

def serve():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8791), Handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv

PAGES = ["index.html", "contacts.html", "verification.html", "guides.html",
         "guide.html?slug=p05-aml-proverka-i-risk-skor", "faq.html",
         "about.html", "job.html", "rules.html", "cookie.html"]

async def main():
    srv = serve()
    log = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ru-RU")
        page = await ctx.new_page()
        errs = []
        page.on("console", lambda m: errs.append(f"[{m.type}] {m.text[:200]}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errs.append(f"[pageerror] {str(e)[:200]}"))

        for url in PAGES:
            name = url.split("?")[0].replace(".html", "")
            await page.goto(f"http://127.0.0.1:8791/{url}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1200)
            await page.screenshot(path=f"{OUT}/{name}.png", full_page=False)
            title = await page.title()
            h1 = await page.evaluate("document.querySelector('h1')?.innerText.trim() || ''")
            print(f"OK {name:22s} | {title[:55]} | h1: {h1[:40]}")

        # ---------- interaction tests on index ----------
        await page.goto("http://127.0.0.1:8791/index.html", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)

        # calc rate present?
        rate = await page.evaluate("document.getElementById('fxRate')?.textContent.trim()")
        print("calc rate:", rate)
        # swap
        await page.locator("#fxSwap").click()
        await page.wait_for_timeout(500)
        rate2 = await page.evaluate("document.getElementById('fxRate')?.textContent.trim()")
        print("calc rate after swap:", rate2)
        # currency dropdown
        await page.locator(".currency-select[data-role=from]").click()
        await page.wait_for_timeout(400)
        items = await page.locator(".currency-dropdown .currency-dropdown-item").count()
        print("dropdown items:", items)
        await page.locator(".currency-dropdown-item").nth(1).click()
        await page.wait_for_timeout(400)
        rate3 = await page.evaluate("document.getElementById('fxRate')?.textContent.trim()")
        print("calc after CNY:", rate3)

        # buy/sell tabs
        await page.locator(".crypto-card button[data-type=sell]").first.click()
        await page.wait_for_timeout(300)
        pr = await page.evaluate("document.querySelector('.crypto-card .price')?.textContent")
        print("card sell price:", pr)

        # reviews slides built?
        n = await page.locator(".review-slide").count()
        print("review slides:", n)
        await page.locator("#reviewsNext").click()
        await page.wait_for_timeout(500)

        # request form validation modal (empty submit)
        await page.locator(".req-submit").click()
        await page.wait_for_timeout(500)
        modal = await page.locator(".req-modal").count()
        print("validation modal on empty submit:", modal)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # fill + submit (will attempt POST api -> 404 -> mailto fallback; mailto triggers nav; guard)
        await page.locator(".req-telegram").fill("@testuser")
        await page.locator(".req-amount").fill("500")
        await page.locator(".req-textarea").fill("Тестовая заявка.")
        # intercept mailto navigation
        await page.evaluate("window._mailto = null")
        await page.expose_function("preventNav", lambda u: None)
        # click submit but prevent actual navigation by catching dialog? mailto opens new tab; playwright headless ignores
        await page.locator(".req-submit").click()
        await page.wait_for_timeout(2500)
        notif = await page.evaluate("document.getElementById('req-notification').classList.contains('show')")
        print("notification shown:", notif)

        # guides teaser populated?
        g = await page.locator("#homeGuides .guide-card").count()
        print("home guides:", g)

        # FAQ accordion
        await page.goto("http://127.0.0.1:8791/faq.html", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(800)
        await page.locator(".faq-q").first.click()
        await page.wait_for_timeout(400)
        openState = await page.evaluate("document.querySelector('.faq-item').classList.contains('open')")
        print("faq first open:", openState)

        # wizard
        await page.goto("http://127.0.0.1:8791/job.html", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(800)
        await page.locator("#wizard").scroll_into_view_if_needed()
        await page.wait_for_timeout(300)
        q1 = await page.evaluate("document.querySelector('#wizard h3')?.textContent")
        print("wizard q1:", q1)
        await page.locator("#wizard input").first.fill("Иванов Иван")
        await page.locator("#wizNext").click()
        await page.wait_for_timeout(400)
        q2 = await page.evaluate("document.querySelector('#wizard h3')?.textContent")
        print("wizard q2:", q2)

        # guides page
        await page.goto("http://127.0.0.1:8791/guides.html", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(600)
        n = await page.locator("#guidesList .guide-card").count()
        print("guides list count:", n)

        # mobile menu
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto("http://127.0.0.1:8791/index.html", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(800)
        await page.locator("#burger").click()
        await page.wait_for_timeout(500)
        mm = await page.evaluate("document.getElementById('mobileMenu').classList.contains('open')")
        print("mobile menu open:", mm)
        await page.screenshot(path=f"{OUT}/mobile_menu.png")
        await page.locator("#burger").click()

        print("\n=== CONSOLE ERRORS (dedup) ===")
        seen = set()
        for e in errs:
            k = e[:120]
            if k not in seen:
                seen.add(k); print(e)

        with open(f"{OUT}/test_log.json", "w", encoding="utf-8") as f:
            json.dump({"errors": errs}, f, ensure_ascii=False, indent=2)
        await browser.close()
    srv.shutdown()

asyncio.run(main())
