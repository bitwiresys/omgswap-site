// GET /api/daily-stats — triggered once a day by Vercel Cron (see vercel.json).
// Reads yesterday's Upstash Redis counters (pageviews + leads), sends a
// summary to the manager Telegram chats, then leaves the raw keys in place
// (they expire on their own — see the EXPIRE calls in lead.js/track.js) so
// nothing needs manual cleanup.
//
// Vercel Cron calls this with a GET request carrying an Authorization header
// (Bearer CRON_SECRET) that Vercel sets automatically when CRON_SECRET is
// defined as an env var — set one so this endpoint can't be triggered by
// random visitors hitting the URL.

var { sendTelegramMessage } = require('./_telegram');
var { getKV } = require('./_kv');

function dateKey(offsetDays) {
  var d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
  });
}

module.exports = async function handler(req, res) {
  var secret = process.env.CRON_SECRET;
  if (secret) {
    var auth = req.headers['authorization'] || '';
    if (auth !== 'Bearer ' + secret) {
      res.status(401).json({ ok: false, error: 'unauthorized' });
      return;
    }
  }

  var kv = await getKV();
  if (!kv) {
    res.status(200).json({ ok: false, error: 'kv_not_configured' });
    return;
  }

  var day = dateKey(-1); // summarize the day that just ended (UTC)
  var [viewsTotal, viewsByPage, leadsCount, leadsRaw] = await Promise.all([
    kv.get('views_total:' + day),
    kv.hgetall('views_by_page:' + day),
    kv.get('leads_count:' + day),
    kv.lrange('leads:' + day, 0, -1)
  ]);

  // The SDK may hand back list entries already-parsed (objects) or as raw
  // JSON strings depending on version — accept either rather than assuming.
  var leads = (leadsRaw || []).map(function (s) {
    if (s && typeof s === 'object') return s;
    try { return JSON.parse(s); } catch (e) { return null; }
  }).filter(Boolean);

  var volumeByCurrency = {};
  leads.forEach(function (l) {
    var c = l.currency || '—';
    volumeByCurrency[c] = (volumeByCurrency[c] || 0) + (Number(l.amount) || 0);
  });

  var pagesLines = Object.keys(viewsByPage || {})
    .sort(function (a, b) { return (viewsByPage[b] | 0) - (viewsByPage[a] | 0); })
    .slice(0, 10)
    .map(function (p) { return '  ' + escapeHTML(p) + ': ' + viewsByPage[p]; })
    .join('\n');

  var volumeLines = Object.keys(volumeByCurrency)
    .map(function (c) { return '  ' + escapeHTML(c) + ': ' + volumeByCurrency[c].toLocaleString('ru-RU'); })
    .join('\n');

  var text =
    '📊 <b>Статистика OMGSWAP за ' + day + '</b>\n\n' +
    '👀 Просмотров всего: ' + (viewsTotal || 0) + '\n' +
    (pagesLines ? 'По страницам:\n' + pagesLines + '\n\n' : '\n') +
    '💬 Заявок: ' + (leadsCount || leads.length || 0) + '\n' +
    (volumeLines ? 'Заявленный объём по валютам:\n' + volumeLines : '');

  var sent = await sendTelegramMessage(text);
  res.status(200).json({ ok: true, notified: sent.ok, day: day, viewsTotal: viewsTotal || 0, leadsCount: leadsCount || leads.length });
};
