// POST /api/track — tiny pageview beacon, fired once per page load
// (see js/main.js). No cookies, no IP storage, no PII — just a per-day,
// per-page counter in Upstash Redis that /api/daily-stats reads and resets.
// Silently no-ops if the KV integration isn't connected to the project yet.

var { getKV } = require('./_kv');

function todayKey(prefix) {
  var d = new Date().toISOString().slice(0, 10);
  return prefix + ':' + d;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }
  var page = String((req.body && req.body.page) || '/').trim().slice(0, 200) || '/';

  try {
    var kv = await getKV();
    if (kv) {
      var TTL = 60 * 60 * 24 * 3;
      await kv.incr(todayKey('views_total'));
      await kv.expire(todayKey('views_total'), TTL);
      await kv.hincrby(todayKey('views_by_page'), page, 1);
      await kv.expire(todayKey('views_by_page'), TTL);
    }
  } catch (e) {
    console.warn('[track] KV write failed', e);
  }

  res.status(204).end();
};
