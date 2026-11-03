import { Redis } from '@upstash/redis';
import crypto from 'node:crypto';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
export const ENTRIES = 'mmb:entries';
export const RESULTS = 'mmb:results';
export const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const isLocked = () => {
  const at = process.env.PICKS_LOCK_AT;
  return !!at && Date.now() > Date.parse(at);
};
