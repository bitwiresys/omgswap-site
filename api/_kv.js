// Shared Upstash Redis client. Reads KV_REST_API_URL / KV_REST_API_TOKEN
// (auto-injected by the Vercel<->Upstash marketplace integration once the
// database is connected to this project — Settings → Storage). Returns null
// if the integration isn't connected yet, so callers can no-op gracefully
// instead of crashing.
async function getKV() {
  try {
    var Redis = require('@upstash/redis').Redis;
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
    return Redis.fromEnv();
  } catch (e) {
    return null;
  }
}

module.exports = { getKV: getKV };
