// KYA Signal — API Routes
// Agent registration, score reads, protocol query endpoint, dispute flagging

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StacksOracle } from '../../oracle/stacks';
import {
  getCachedScore,
  cacheScore,
  getCachedQueryResponse,
  cacheQueryResponse,
  checkAndIncrementRateLimit,
  invalidateScore,
} from '../../cache/redis';

const prisma = new PrismaClient();
const oracle = new StacksOracle(prisma);

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

const RegisterAgentSchema = z.object({
  sourceChainKey: z.string().min(32).max(128),
  sourceChain: z.enum(['solana', 'ethereum', 'stacks']),
  stacksKey: z.string().min(10).max(100),
  emailHash: z.string().optional(),
});

const LinkMezoSchema = z.object({
  geid: z.string().length(64),
  mezowallet: z.string().min(10).max(42),
});

const DisputeSchema = z.object({
  geid: z.string().length(64),
  scoreEventId: z.string(),
  reason: z.string().min(10).max(500),
  flaggedBy: z.string(),
});

// =====================================================================
// ROUTES
// =====================================================================

export async function registerRoutes(app: FastifyInstance): Promise<void> {

  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

  // ── AGENT REGISTRATION ──────────────────────────────────────────────

  app.post('/agents/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterAgentSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { sourceChainKey, sourceChain, stacksKey, emailHash } = body.data;
    const geid = StacksOracle.generateGEID(sourceChainKey, stacksKey);

    const existing = await prisma.agent.findUnique({ where: { geid } });
    if (existing) return reply.status(409).send({ error: 'Agent already registered', geid });

    let btcBlock = 0;
    try {
      const res = await fetch('https://stacks-node-api.testnet.stacks.co/v2/info');
      const data = await res.json() as { burn_block_height: number };
      btcBlock = data.burn_block_height;
    } catch { /* non-fatal */ }

    const agent = await prisma.agent.create({
      data: { geid, sourceChainKey, sourceChain, stacksKey, registeredAtBlock: btcBlock, emailHash },
    });

    if (emailHash) {
      await prisma.alertLog.create({
        data: { agentId: agent.id, type: 'REGISTRATION_CONFIRM', recipientHash: emailHash, success: false },
      });
    }

    return reply.status(201).send({
      geid,
      registeredAtBlock: btcBlock,
      message: 'Agent registered. GEID = sha256(sourceChainKey:stacksKey)',
    });
  });

  app.post('/agents/link-mezo', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = LinkMezoSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { geid, mezowallet } = body.data;
    const agent = await prisma.agent.update({ where: { geid }, data: { mezowallet } });
    return { geid, mezowallet: agent.mezowallet };
  });

  // ── SCORE READS ─────────────────────────────────────────────────────

  app.get('/agents/:geid/score', async (req: FastifyRequest<{ Params: { geid: string } }>, reply) => {
    const { geid } = req.params;

    const cached = await getCachedScore(geid);
    if (cached) return { ...cached, cached: true };

    const agent = await prisma.agent.findUnique({
      where: { geid },
      include: {
        scoreEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const latest = agent.scoreEvents[0];
    if (!latest) return reply.status(404).send({ error: 'No score yet — agent needs on-chain activity' });

    const scoreData = {
      geid,
      normalizedScore: latest.normalizedScore,
      configHash: latest.configHash,
      rawInputsHash: latest.rawInputsHash,
      btcBlockHeight: latest.btcBlockHeight,
      stacksBlockHeight: latest.stacksBlockHeight,
      verified: latest.normalizedScore >= 85,
      premium: latest.normalizedScore >= 95,
      suggestedLtv: latest.normalizedScore >= 95 ? 90 : latest.normalizedScore >= 85 ? 80 : 60,
      updatedAt: latest.createdAt,
    };

    await cacheScore(geid, scoreData as any);
    return { ...scoreData, cached: false };
  });

  // Public scorecard for sharing (read-only)
  app.get('/agents/:geid/profile', async (req: FastifyRequest<{ Params: { geid: string } }>, reply) => {
    const { geid } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { geid },
      include: {
        scoreEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const latest = agent.scoreEvents[0];
    return {
      geid,
      sourceChain: agent.sourceChain,
      registeredAtBlock: agent.registeredAtBlock,
      registeredAt: agent.registeredAt,
      score: latest?.normalizedScore ?? 0,
      verified: (latest?.normalizedScore ?? 0) >= 85,
      premium: (latest?.normalizedScore ?? 0) >= 95,
      btcBlockHeight: latest?.btcBlockHeight ?? 0,
      configHash: latest?.configHash ?? null,
      hasMezoWallet: !!agent.mezowallet,
    };
  });

  // Audit trail — full score history
  app.get('/agents/:geid/audit', async (
    req: FastifyRequest<{ Params: { geid: string }; Querystring: { page?: string; limit?: string } }>,
    reply
  ) => {
    const { geid } = req.params;
    const page = parseInt(req.query.page ?? '1');
    const limit = Math.min(parseInt(req.query.limit ?? '20'), 100);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.scoreEvent.findMany({
        where: { agent: { geid } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { config: { select: { version: true } } },
      }),
      prisma.scoreEvent.count({ where: { agent: { geid } } }),
    ]);

    return {
      geid,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      events: events.map(e => ({
        id: e.id,
        chain: e.chain,
        txHash: e.txHash,
        eventType: e.eventType,
        normalizedScore: e.normalizedScore,
        rawScoreDelta: e.rawScoreDelta,
        btcBlockHeight: e.btcBlockHeight,
        configHash: e.configHash,
        configVersion: e.config.version,
        rawInputsHash: e.rawInputsHash,
        createdAt: e.createdAt,
      })),
    };
  });

  // Per-chain score breakdown
  app.get('/agents/:geid/breakdown', async (
    req: FastifyRequest<{ Params: { geid: string } }>,
    reply
  ) => {
    const { geid } = req.params;
    const agent = await prisma.agent.findUnique({ where: { geid } });
    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const events = await prisma.scoreEvent.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const breakdown: Record<string, Record<string, { count: number; avgDelta: number; successRate: number }>> = {};
    for (const e of events) {
      if (!breakdown[e.chain]) breakdown[e.chain] = {};
      if (!breakdown[e.chain][e.eventType]) {
        breakdown[e.chain][e.eventType] = { count: 0, avgDelta: 0, successRate: 0 };
      }
      const b = breakdown[e.chain][e.eventType];
      b.count += 1;
      b.avgDelta = (b.avgDelta * (b.count - 1) + e.rawScoreDelta) / b.count;
      b.successRate = e.rawScoreDelta >= 0
        ? (b.successRate * (b.count - 1) + 1) / b.count
        : (b.successRate * (b.count - 1)) / b.count;
    }

    return { geid, breakdown, totalEvents: events.length };
  });

  // ── PROTOCOL QUERY ───────────────────────────────────────────────────

  // The key endpoint — called by Mezo or any protocol to gate LTV
  app.post('/protocol/query', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      geid: z.string().length(64),
      protocolAddress: z.string().min(10),
    }).safeParse(req.body);

    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const { geid, protocolAddress } = body.data;

    // Get current BTC block for rate limit window
    let btcBlock = 0;
    try {
      const res = await fetch('https://stacks-node-api.testnet.stacks.co/v2/info');
      const data = await res.json() as { burn_block_height: number };
      btcBlock = data.burn_block_height;
    } catch { /* use 0 as fallback */ }

    // Enforce rate limit
    const { allowed, count } = await checkAndIncrementRateLimit(protocolAddress, btcBlock);
    if (!allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        detail: `Max 20 queries per BTC block per protocol. Current block: ${btcBlock}`,
      });
    }

    // Check cache
    const cached = await getCachedQueryResponse(geid, protocolAddress);
    if (cached) {
      return { ...cached, cached: true, btcBlock };
    }

    // Fetch from DB
    const agent = await prisma.agent.findUnique({
      where: { geid },
      include: { scoreEvents: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const score = agent.scoreEvents[0]?.normalizedScore ?? 0;
    const verified = score >= 85;
    const suggestedLtv = score >= 95 ? 90 : score >= 85 ? 80 : 60;

    const response = { verified, suggestedLtv };

    // Log the query
    const startMs = Date.now();
    await prisma.protocolQuery.create({
      data: {
        protocolAddress,
        agentId: agent.id,
        geid,
        verified,
        suggestedLtv,
        btcBlockHeight: btcBlock,
        responseMs: Date.now() - startMs,
      },
    });

    // Cache response
    await cacheQueryResponse(geid, protocolAddress, response);

    return { ...response, cached: false, btcBlock };
  });

  // ── DISPUTES ────────────────────────────────────────────────────────

  app.post('/disputes', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = DisputeSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { geid, scoreEventId, reason, flaggedBy } = body.data;

    const agent = await prisma.agent.findUnique({ where: { geid } });
    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const scoreEvent = await prisma.scoreEvent.findUnique({ where: { id: scoreEventId } });
    if (!scoreEvent) return reply.status(404).send({ error: 'Score event not found' });

    const dispute = await prisma.scoreDispute.create({
      data: {
        agentId: agent.id,
        scoreEventId,
        flaggedBy,
        reason,
        status: 'OPEN',
      },
    });

    // Notify via alert log
    await prisma.alertLog.create({
      data: { agentId: agent.id, type: 'DISPUTE_OPENED', recipientHash: agent.emailHash ?? '', success: false },
    });

    // Invalidate score cache so fresh data is served
    await invalidateScore(geid);

    return reply.status(201).send({ disputeId: dispute.id, status: 'OPEN' });
  });

  app.get('/disputes/:geid', async (req: FastifyRequest<{ Params: { geid: string } }>, reply) => {
    const { geid } = req.params;
    const agent = await prisma.agent.findUnique({ where: { geid } });
    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    const disputes = await prisma.scoreDispute.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
    });

    return { geid, disputes };
  });

  // ── NORMALIZATION CONFIGS ────────────────────────────────────────────

  // List config versions (public — protocols can verify weights)
  app.get('/configs', async () => {
    const configs = await prisma.normalizationConfig.findMany({
      select: { version: true, configHash: true, description: true, activatedAt: true, deprecated: true },
      orderBy: { activatedAt: 'desc' },
    });
    return { configs };
  });

  app.get('/configs/:version', async (req: FastifyRequest<{ Params: { version: string } }>, reply) => {
    const config = await prisma.normalizationConfig.findUnique({
      where: { version: req.params.version },
    });
    if (!config) return reply.status(404).send({ error: 'Config version not found' });
    return config;
  });

  // ── STATS (for dashboard) ────────────────────────────────────────────

  app.get('/stats', async () => {
    const [totalAgents, verifiedAgents, totalQueries, totalEvents] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({
        where: { scoreEvents: { some: { normalizedScore: { gte: 85 } } } },
      }),
      prisma.protocolQuery.count(),
      prisma.scoreEvent.count(),
    ]);

    return { totalAgents, verifiedAgents, totalQueries, totalEvents };
  });
}

