import crypto from 'node:crypto';
import { redis, RESULTS } from './_store.js';
import { RACE_OPTS } from './_races.js';

const keyOk = (k) => {
  const want = process.env.ADMIN_KEY || '';
  if (!want || typeof k !== 'string' || k.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(k), Buffer.from(want));
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!keyOk(req.headers['x-admin-key'])) return res.status(401).json({ error: 'bad_admin_key' });
  try {
    const input = (req.body && req.body.results) || {};
    const clean = {};
    for (const [race, v] of Object.entries(input)) {
      if (RACE_OPTS[race] && RACE_OPTS[race].includes(v)) clean[race] = v;
    }
    await redis.set(RESULTS, clean);
    return res.status(200).json({ ok: true, results: clean });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}
