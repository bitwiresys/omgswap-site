// Shared Telegram helper for serverless functions.
// Reads credentials from environment variables only — never hardcode a
// bot token or chat id in source, since this repo is public.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN  — token from @BotFather
//   TELEGRAM_CHAT_IDS   — comma-separated chat ids to notify, e.g. "111,222"

function getChatIds() {
  var raw = process.env.TELEGRAM_CHAT_IDS || '';
  return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}

async function sendTelegramMessage(text) {
  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatIds = getChatIds();
  if (!token || !chatIds.length) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_IDS not configured, skipping send');
    return { ok: false, skipped: true };
  }
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  var results = await Promise.all(chatIds.map(function (chatId) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true })
    }).then(function (r) { return r.json(); }).catch(function (e) { return { ok: false, error: String(e) }; });
  }));
  results.forEach(function (r, i) {
    if (!r.ok) console.warn('[telegram] send to', chatIds[i], 'failed:', r.description || r.error);
  });
  // At least one recipient reaching the message counts as delivered — a
  // single stale/unreachable chat id shouldn't hide a lead from everyone.
  return { ok: results.some(function (r) { return r.ok; }), results: results };
}

module.exports = { sendTelegramMessage: sendTelegramMessage, getChatIds: getChatIds };
