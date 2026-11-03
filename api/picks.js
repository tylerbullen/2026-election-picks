import { redis, ENTRIES, RESULTS, hash, isLocked } from './_store.js';
import { RACE_OPTS } from './_races.js';

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const MAX_PLAYERS = 500;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const { id, token } = req.query || {};
      if (!ID_RE.test(id || '')) return res.status(400).json({ error: 'bad_id' });
      const mine = await redis.hget(ENTRIES, id);
      // Group picks stay hidden until this player has submitted their own.
      if (!mine || mine.tokenHash !== hash(token)) return res.status(403).json({ error: 'submit_first' });
      const all = (await redis.hgetall(ENTRIES)) || {};
      const entries = Object.entries(all).map(([k, v]) => ({ id: k, name: v.name, picks: v.picks, updatedAt: v.updatedAt }));
      const results = (await redis.get(RESULTS)) || {};
      return res.status(200).json({ entries, results, lockAt: process.env.PICKS_LOCK_AT || null });
    }

    if (req.method === 'POST') {
      if (isLocked()) return res.status(423).json({ error: 'locked' });
      const { id, token, name, picks } = req.body || {};
      if (!ID_RE.test(id || '')) return res.status(400).json({ error: 'bad_id' });
      if (typeof token !== 'string' || token.length < 16 || token.length > 200) return res.status(400).json({ error: 'bad_token' });
      const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, 40) : '';
      if (!cleanName) return res.status(400).json({ error: 'bad_name' });
      const clean = {};
      for (const [race, opts] of Object.entries(RACE_OPTS)) {
        const v = picks && picks[race];
        if (!opts.includes(v)) return res.status(400).json({ error: 'incomplete_picks', race });
        clean[race] = v;
      }
      const all = (await redis.hgetall(ENTRIES)) || {};
      const existing = all[id];
      if (existing && existing.tokenHash !== hash(token)) return res.status(403).json({ error: 'not_yours' });
      if (!existing && Object.keys(all).length >= MAX_PLAYERS) return res.status(429).json({ error: 'full' });
      const lower = cleanName.toLowerCase();
      if (Object.entries(all).some(([k, v]) => k !== id && String(v.name).toLowerCase() === lower)) {
        return res.status(409).json({ error: 'name_taken' });
      }
      await redis.hset(ENTRIES, { [id]: { name: cleanName, picks: clean, tokenHash: hash(token), updatedAt: Date.now() } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
