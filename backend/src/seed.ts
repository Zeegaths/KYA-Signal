// KYA Signal — Database Seed
// Run with: npx tsx src/seed.ts

import { PrismaClient } from '@prisma/client';
import { NormalizationEngine } from './normalizer/engine';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KYA Signal database...');

  // ── Normalization config ─────────────────────────────────────────
  const engine = new NormalizationEngine(prisma);
  await engine.seedDefaultConfig();

  // ── Chain registry ───────────────────────────────────────────────
  const chains = [
    {
      chainId: 'solana',
      displayName: 'Solana',
      rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT ?? 'https://api.mainnet-beta.solana.com',
      rpcProvider: 'helius',
      normalizationWeight: 0.45,
    },
    {
      chainId: 'ethereum',
      displayName: 'Ethereum',
      rpcEndpoint: process.env.ETH_RPC_ENDPOINT ?? '',
      rpcProvider: 'alchemy',
      normalizationWeight: 0.35,
    },
    {
      chainId: 'stacks',
      displayName: 'Stacks',
      rpcEndpoint: 'https://stacks-node-api.testnet.stacks.co',
      rpcProvider: 'hiro',
      normalizationWeight: 0.20,
    },
  ];

  for (const chain of chains) {
    await prisma.chainRegistry.upsert({
      where: { chainId: chain.chainId },
      update: { normalizationWeight: chain.normalizationWeight },
      create: chain,
    });
    console.log(`Chain registry: ${chain.chainId} (${chain.normalizationWeight * 100}% weight)`);
  }

  // ── Email alert templates ────────────────────────────────────────
  const templates = [
    { type: 'REGISTRATION_CONFIRM' as const,      subject: 'Your KYA Signal agent is registered' },
    { type: 'SCORE_THRESHOLD_CROSSED' as const,   subject: 'KYA Score threshold update' },
    { type: 'PROTOCOL_QUERY_RECEIVED' as const,   subject: 'A protocol queried your agent score' },
    { type: 'DISPUTE_OPENED' as const,            subject: 'A score dispute has been opened' },
    { type: 'DISPUTE_RESOLVED' as const,          subject: 'Your score dispute has been resolved' },
  ];

  for (const t of templates) {
    await prisma.alertTemplate.upsert({
      where: { type: t.type },
      update: {},
      create: { type: t.type, subject: t.subject, htmlBody: '' },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());

