// KYA Signal — Normalization Engine
// Converts raw on-chain events into a 0-100 normalized score.
// Every config version is hashed so the on-chain submission is auditable.

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export interface ChainEvent {
  chain: 'solana' | 'ethereum' | 'stacks';
  eventType: 'vault_rebalance' | 'liquidation' | 'uptime' | 'protocol_interaction' | 'failed_tx';
  txHash?: string;
  success: boolean;
  value?: number;       // USD value involved
  timestamp: number;
}

export interface NormalizationWeights {
  chains: {
    [chain: string]: {
      globalWeight: number;    // how much this chain contributes to composite
      events: {
        [eventType: string]: {
          basePoints: number;  // points per occurrence
          successMultiplier: number;
          failurePenalty: number;
        };
      };
    };
  };
  recencyDecay: number;        // exponential decay factor per day
  minEvents: number;           // minimum events before a score is meaningful
  maxScore: number;            // cap (always 100)
}

export interface ScoreResult {
  normalizedScore: number;      // 0-100
  configHash: string;           // SHA-256 of the weights used
  rawInputsHash: string;        // SHA-256 of the events array
  breakdown: {
    [chain: string]: number;    // per-chain contribution
  };
  eventCount: number;
  configVersion: string;
}

const DEFAULT_WEIGHTS: NormalizationWeights = {
  chains: {
    solana: {
      globalWeight: 0.45,
      events: {
        vault_rebalance:       { basePoints: 15, successMultiplier: 1.2, failurePenalty: -20 },
        liquidation:           { basePoints: 20, successMultiplier: 1.5, failurePenalty: -30 },
        uptime:                { basePoints: 10, successMultiplier: 1.0, failurePenalty: -5  },
        protocol_interaction:  { basePoints: 8,  successMultiplier: 1.1, failurePenalty: -10 },
        failed_tx:             { basePoints: 0,  successMultiplier: 0,   failurePenalty: -15 },
      },
    },
    ethereum: {
      globalWeight: 0.35,
      events: {
        vault_rebalance:       { basePoints: 12, successMultiplier: 1.2, failurePenalty: -18 },
        liquidation:           { basePoints: 18, successMultiplier: 1.4, failurePenalty: -25 },
        uptime:                { basePoints: 8,  successMultiplier: 1.0, failurePenalty: -5  },
        protocol_interaction:  { basePoints: 10, successMultiplier: 1.1, failurePenalty: -12 },
        failed_tx:             { basePoints: 0,  successMultiplier: 0,   failurePenalty: -12 },
      },
    },
    stacks: {
      globalWeight: 0.20,
      events: {
        protocol_interaction:  { basePoints: 12, successMultiplier: 1.3, failurePenalty: -15 },
        failed_tx:             { basePoints: 0,  successMultiplier: 0,   failurePenalty: -10 },
        uptime:                { basePoints: 8,  successMultiplier: 1.0, failurePenalty: -4  },
        vault_rebalance:       { basePoints: 10, successMultiplier: 1.1, failurePenalty: -15 },
        liquidation:           { basePoints: 15, successMultiplier: 1.3, failurePenalty: -20 },
      },
    },
  },
  recencyDecay: 0.02,    // 2% decay per day
  minEvents: 5,
  maxScore: 100,
};

export class NormalizationEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Hash a config deterministically — used for on-chain anchoring
  hashConfig(weights: NormalizationWeights): string {
    const canonical = JSON.stringify(weights, Object.keys(weights).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  // Hash the raw input events — proves what data produced a given score
  hashRawInputs(events: ChainEvent[]): string {
    const canonical = JSON.stringify(
      events.map(e => ({
        chain: e.chain,
        eventType: e.eventType,
        txHash: e.txHash ?? '',
        success: e.success,
        timestamp: e.timestamp,
      })).sort((a, b) => a.timestamp - b.timestamp)
    );
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  // Apply recency decay: older events contribute less
  private decayWeight(eventTimestamp: number): number {
    const nowMs = Date.now();
    const ageMs = nowMs - eventTimestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return Math.exp(-DEFAULT_WEIGHTS.recencyDecay * ageDays);
  }

  // Core normalization: events -> 0-100 score
  normalize(events: ChainEvent[], weights = DEFAULT_WEIGHTS): Omit<ScoreResult, 'configVersion'> {
    if (events.length < weights.minEvents) {
      // Not enough history — return a neutral score with a penalty for low data
      return {
        normalizedScore: Math.max(0, 40 - (weights.minEvents - events.length) * 5),
        configHash: this.hashConfig(weights),
        rawInputsHash: this.hashRawInputs(events),
        breakdown: {},
        eventCount: events.length,
      };
    }

    const chainScores: { [chain: string]: number } = {};
    const chainEventCounts: { [chain: string]: number } = {};

    for (const event of events) {
      const chainConfig = weights.chains[event.chain];
      if (!chainConfig) continue;

      const eventConfig = chainConfig.events[event.eventType];
      if (!eventConfig) continue;

      const decay = this.decayWeight(event.timestamp);

      let points: number;
      if (event.success) {
        points = eventConfig.basePoints * eventConfig.successMultiplier * decay;
      } else {
        points = eventConfig.failurePenalty * decay;
      }

      chainScores[event.chain] = (chainScores[event.chain] ?? 0) + points;
      chainEventCounts[event.chain] = (chainEventCounts[event.chain] ?? 0) + 1;
    }

    // Normalize each chain's raw score to 0-100, then apply global chain weight
    let composite = 0;
    const breakdown: { [chain: string]: number } = {};

    for (const [chain, chainConfig] of Object.entries(weights.chains)) {
      const rawScore = chainScores[chain] ?? 0;
      const eventCount = chainEventCounts[chain] ?? 0;

      // Scale raw score relative to max possible in this chain
      const maxPossiblePerEvent = Math.max(
        ...Object.values(chainConfig.events).map(
          e => e.basePoints * e.successMultiplier
        )
      );
      const maxPossible = maxPossiblePerEvent * Math.max(eventCount, 1);
      const chainNormalized = Math.min(100, Math.max(0,
        ((rawScore + maxPossible) / (2 * maxPossible)) * 100
      ));

      breakdown[chain] = Math.round(chainNormalized);
      composite += chainNormalized * chainConfig.globalWeight;
    }

    const finalScore = Math.min(weights.maxScore, Math.max(0, Math.round(composite)));

    return {
      normalizedScore: finalScore,
      configHash: this.hashConfig(weights),
      rawInputsHash: this.hashRawInputs(events),
      breakdown,
      eventCount: events.length,
    };
  }

  // Load active config from DB, fall back to hardcoded default
  async getActiveConfig(): Promise<{ weights: NormalizationWeights; version: string; id: string }> {
    try {
      const dbConfig = await this.prisma.normalizationConfig.findFirst({
        where: { deprecated: false, activatedAt: { not: null } },
        orderBy: { activatedAt: 'desc' },
      });

      if (dbConfig) {
        return {
          weights: dbConfig.weights as NormalizationWeights,
          version: dbConfig.version,
          id: dbConfig.id,
        };
      }
    } catch (err) {
      console.warn('[normalizer] DB config fetch failed, using hardcoded default:', err);
    }

    return {
      weights: DEFAULT_WEIGHTS,
      version: 'v1.0.0-default',
      id: 'default',
    };
  }

  // Full pipeline: fetch config, normalize, return with version info
  async computeScore(events: ChainEvent[]): Promise<ScoreResult> {
    const { weights, version } = await this.getActiveConfig();
    const result = this.normalize(events, weights);
    return { ...result, configVersion: version };
  }

  // Seed the default config into DB (run on startup if missing)
  async seedDefaultConfig(): Promise<void> {
    const hash = this.hashConfig(DEFAULT_WEIGHTS);
    await this.prisma.normalizationConfig.upsert({
      where: { version: 'v1.0.0' },
      update: {},
      create: {
        version: 'v1.0.0',
        configHash: hash,
        weights: DEFAULT_WEIGHTS as any,
        description: 'Initial normalization config — Solana 45%, Ethereum 35%, Stacks 20%',
        activatedAt: new Date(),
      },
    });
    console.log(`[normalizer] Default config seeded — hash: ${hash}`);
  }
}

