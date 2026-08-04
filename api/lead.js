// POST /api/lead — receives the "Связаться в Telegram" form (username + amount),
// notifies the manager chats immediately, and appends the lead to today's KV
// bucket so /api/daily-stats can summarize it later.
//
// Storage is optional: if the Upstash Redis integration isn't connected to
// this project yet, the lead still reaches Telegram in real time — it just
// won't appear in the daily digest.

var { sendTelegramMessage } = require('./_telegram');
var { getKV } = require('./_kv');

function escapeHTML(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
  });
}

function todayKey(prefix) {
  var d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return prefix + ':' + d;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  var body = req.body || {};
  var username = String(body.username || '').trim().replace(/^@/, '');
  var amount = Number(body.amount);
  var currency = String(body.currency || '').trim().toUpperCase().slice(0, 8);
  var comment = String(body.comment || '').trim().slice(0, 500);
  var page = String(body.page || '').trim().slice(0, 200);

  var errors = [];
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(username)) errors.push('username');
  if (!amount || !isFinite(amount) || amount <= 0) errors.push('amount');
  if (errors.length) {
    res.status(400).json({ ok: false, error: 'validation', fields: errors });
    return;
  }

  var lead = {
    username: username,
    amount: amount,
    currency: currency || null,
    comment: comment || null,
    page: page || null,
    ts: new Date().toISOString()
  };

  // Best-effort persistence — a lead is never rejected because KV is unset
  // or unreachable, since the Telegram notification is the source of truth.
  try {
    var kv = await getKV();
    if (kv) {
      var TTL = 60 * 60 * 24 * 3; // 3 days — daily-stats reads yesterday's data well before this expires
      await kv.rpush(todayKey('leads'), JSON.stringify(lead));
      await kv.expire(todayKey('leads'), TTL);
      await kv.incr(todayKey('leads_count'));
      await kv.expire(todayKey('leads_count'), TTL);
    }
  } catch (e) {
    console.warn('[lead] KV write failed', e);
  }

  var text =
    '💬 <b>Новая заявка OMGSWAP</b>\n' +
    'Telegram: @' + escapeHTML(username) + '\n' +
    'Сумма: ' + escapeHTML(amount) + (currency ? ' ' + escapeHTML(currency) : '') + '\n' +
    (comment ? 'Комментарий: ' + escapeHTML(comment) + '\n' : '') +
    (page ? 'Страница: ' + escapeHTML(page) + '\n' : '') +
    new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) + ' МСК';

  var sent = await sendTelegramMessage(text);

  res.status(200).json({ ok: true, notified: sent.ok });
};
