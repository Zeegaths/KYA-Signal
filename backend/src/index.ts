// KYA Signal — Backend Entry Point

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

import { registerRoutes } from './api/routes/index';
import { SolanaListener } from './listeners/solana';
import { EthereumListener } from './listeners/ethereum';
import { StacksOracle } from './oracle/stacks';
import { NormalizationEngine } from './normalizer/engine';
import { processEmailQueue } from './email/service';
import { getRedis } from './cache/redis';

const prisma = new PrismaClient();

async function bootstrap() {
  // ── Fastify ────────────────────────────────────────────────────────
  const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } });

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await registerRoutes(app);

  // ── DB + Redis ─────────────────────────────────────────────────────
  await prisma.$connect();
  console.log('[db] PostgreSQL connected');

  const redis = getRedis();
  try {
    await redis.connect();
    console.log('[redis] Connected');
  } catch (err) {
    console.warn('[redis] Connection failed — running without cache');
  }

  // ── Normalization config seed ──────────────────────────────────────
  const engine = new NormalizationEngine(prisma);
  await engine.seedDefaultConfig();

  // ── Chain listeners ────────────────────────────────────────────────
  const solanaListener = new SolanaListener(prisma, {
    rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT ?? 'https://api.mainnet-beta.solana.com',
    programIds: [],
    pollingIntervalMs: 10_000,
  });

  const ethListener = new EthereumListener(
    prisma,
    process.env.ETH_RPC_ENDPOINT ?? '',
    15_000
  );

  // Start listeners (non-blocking)
  solanaListener.start().catch(err => console.error('[solana-listener] Fatal:', err));
  ethListener.start().catch(err => console.error('[eth-listener] Fatal:', err));

  // ── Oracle cron — score submission every 10 minutes ───────────────
  const oracle = new StacksOracle(prisma);

  cron.schedule('*/10 * * * *', async () => {
    console.log('[oracle-cron] Running score submission cycle');
    try {
      const agents = await prisma.agent.findMany({
        where: { active: true },
        select: { geid: true },
      });

      for (const agent of agents) {
        try {
          await oracle.processAgent(agent.geid);
        } catch (err) {
          console.error(`[oracle-cron] Failed for agent ${agent.geid}:`, err);
        }
      }
    } catch (err) {
      console.error('[oracle-cron] Cycle error:', err);
    }
  });

  // ── Email worker — every 5 minutes ───────────────────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processEmailQueue();
    } catch (err) {
      console.error('[email-worker] Error:', err);
    }
  });

  // ── Start server ───────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '4000');
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[server] KYA Signal backend running on port ${port}`);

  // ── Graceful shutdown ──────────────────────────────────────────────
  const shutdown = async () => {
    console.log('[server] Shutting down...');
    solanaListener.stop();
    ethListener.stop();
    await prisma.$disconnect();
    await redis.quit();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => {
  console.error('[bootstrap] Fatal error:', err);
  process.exit(1);
});

