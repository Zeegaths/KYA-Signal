// KYA Signal — Redis Cache Layer
// TTL-based caching for agent scores and protocol query responses.
// Prevents DB hammering when multiple protocols query the same agent.

import Redis from 'ioredis';

const SCORE_TTL_SECONDS = 60;          // score cache: 1 minute
const PROTOCOL_QUERY_TTL_SECONDS = 30; // LTV response: 30 seconds
const RATE_LIMIT_TTL_SECONDS = 600;    // rate limit window: 10 minutes

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[redis] Connection error:', err);
    });

    redis.on('connect', () => {
      console.log('[redis] Connected');
    });
  }

  return redis;
}

// =====================================================================
// SCORE CACHE
// =====================================================================

export async function cacheScore(
  geid: string,
  score: {
    normalizedScore: number;
    configHash: string;
    btcBlockHeight: number;
    breakdown: Record<string, number>;
  }
): Promise<void> {
  try {
    const r = getRedis();
    await r.setex(
      `score:${geid}`,
      SCORE_TTL_SECONDS,
      JSON.stringify(score)
    );
  } catch (err) {
    console.warn('[redis] cacheScore failed (non-fatal):', err);
  }
}

export async function getCachedScore(geid: string): Promise<{
  normalizedScore: number;
  configHash: string;
  btcBlockHeight: number;
  breakdown: Record<string, number>;
} | null> {
  try {
    const r = getRedis();
    const raw = await r.get(`score:${geid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function invalidateScore(geid: string): Promise<void> {
  try {
    await getRedis().del(`score:${geid}`);
  } catch {
    // non-fatal
  }
}

// =====================================================================
// PROTOCOL QUERY CACHE
// =====================================================================

export async function cacheQueryResponse(
  geid: string,
  protocolAddress: string,
  response: { verified: boolean; suggestedLtv: number }
): Promise<void> {
  try {
    const r = getRedis();
    const key = `query:${protocolAddress}:${geid}`;
    await r.setex(key, PROTOCOL_QUERY_TTL_SECONDS, JSON.stringify(response));
  } catch {
    // non-fatal
  }
}

export async function getCachedQueryResponse(
  geid: string,
  protocolAddress: string
): Promise<{ verified: boolean; suggestedLtv: number } | null> {
  try {
    const r = getRedis();
    const key = `query:${protocolAddress}:${geid}`;
    const raw = await r.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// =====================================================================
// RATE LIMITING (protocol query abuse prevention)
// =====================================================================

export async function checkAndIncrementRateLimit(
  protocolAddress: string,
  btcBlockHeight: number,
  maxPerWindow = 20
): Promise<{ allowed: boolean; count: number }> {
  try {
    const r = getRedis();
    const key = `ratelimit:${protocolAddress}:${btcBlockHeight}`;
    const count = await r.incr(key);

    if (count === 1) {
      // Set TTL on first increment
      await r.expire(key, RATE_LIMIT_TTL_SECONDS);
    }

    return { allowed: count <= maxPerWindow, count };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { allowed: true, count: 0 };
  }
}

