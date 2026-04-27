// KYA Signal — Solana Chain Listener
// Indexes agent behavior: vault rebalances, liquidations, uptime pings

import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';
import type { ChainEvent } from '../normalizer/engine';

interface SolanaListenerConfig {
  rpcEndpoint: string;
  programIds: string[];       // program IDs to watch for agent interactions
  pollingIntervalMs: number;
}

export class SolanaListener {
  private connection: Connection;
  private prisma: PrismaClient;
  private config: SolanaListenerConfig;
  private isRunning = false;

  constructor(prisma: PrismaClient, config: SolanaListenerConfig) {
    this.prisma = prisma;
    this.config = config;
    this.connection = new Connection(config.rpcEndpoint, 'confirmed');
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[solana-listener] Starting Solana chain listener');
    await this.pollLoop();
  }

  stop(): void {
    this.isRunning = false;
    console.log('[solana-listener] Stopped');
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.indexRecentActivity();
      } catch (err) {
        console.error('[solana-listener] Poll error:', err);
      }
      await this.sleep(this.config.pollingIntervalMs);
    }
  }

  // Fetch recent transactions for all registered Solana agents
  private async indexRecentActivity(): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { sourceChain: 'solana', active: true },
      select: { id: true, geid: true, sourceChainKey: true },
    });

    const chainRegistry = await this.prisma.chainRegistry.findUnique({
      where: { chainId: 'solana' },
    });
    if (!chainRegistry) return;

    for (const agent of agents) {
      try {
        await this.indexAgentTransactions(agent, chainRegistry.lastIndexedBlock);
      } catch (err) {
        console.error(`[solana-listener] Error indexing agent ${agent.geid}:`, err);
      }
    }

    // Update last indexed slot
    const slot = await this.connection.getSlot();
    await this.prisma.chainRegistry.update({
      where: { chainId: 'solana' },
      data: { lastIndexedBlock: slot },
    });
  }

  private async indexAgentTransactions(
    agent: { id: string; geid: string; sourceChainKey: string },
    fromSlot: number
  ): Promise<ChainEvent[]> {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(agent.sourceChainKey);
    } catch {
      console.warn(`[solana-listener] Invalid pubkey for agent ${agent.geid}`);
      return [];
    }

    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: 50,
      minContextSlot: fromSlot,
    });

    const events: ChainEvent[] = [];

    for (const sig of signatures) {
      const tx = await this.connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) continue;

      const event = this.classifyTransaction(tx, sig.signature);
      if (!event) continue;

      events.push(event);

      // Persist to DB
      const activeConfig = await this.prisma.normalizationConfig.findFirst({
        where: { deprecated: false, activatedAt: { not: null } },
        orderBy: { activatedAt: 'desc' },
      });

      if (activeConfig) {
        await this.prisma.scoreEvent.create({
          data: {
            agentId: agent.id,
            configId: activeConfig.id,
            configHash: activeConfig.configHash,
            rawInputsHash: '',       // filled by normalization engine on submission
            chain: 'solana',
            txHash: sig.signature,
            eventType: event.eventType,
            rawScoreDelta: 0,        // filled after normalization
            normalizedScore: 0,      // filled after normalization
            btcBlockHeight: 0,       // filled on Stacks submission
            stacksBlockHeight: 0,    // filled on Stacks submission
            submittedByOracle: process.env.ORACLE_STACKS_ADDRESS ?? '',
          },
        });
      }
    }

    return events;
  }

  // Classify a Solana transaction into a KYA event type
  private classifyTransaction(
    tx: ParsedTransactionWithMeta,
    signature: string
  ): ChainEvent | null {
    if (!tx.blockTime) return null;

    const success = tx.meta?.err === null;
    const instructions = tx.transaction.message.instructions;

    // Heuristic classification based on instruction data / program IDs
    // In production, decode against specific program IDLs
    for (const ix of instructions) {
      if ('programId' in ix) {
        const programId = ix.programId.toString();

        // Vault rebalance pattern — matches known vault program IDs
        if (this.isVaultProgram(programId)) {
          return {
            chain: 'solana',
            eventType: 'vault_rebalance',
            txHash: signature,
            success,
            timestamp: tx.blockTime * 1000,
          };
        }

        // Liquidation pattern
        if (this.isLiquidationProgram(programId)) {
          return {
            chain: 'solana',
            eventType: 'liquidation',
            txHash: signature,
            success,
            timestamp: tx.blockTime * 1000,
          };
        }
      }
    }

    // Default: generic protocol interaction
    if (!success) {
      return {
        chain: 'solana',
        eventType: 'failed_tx',
        txHash: signature,
        success: false,
        timestamp: tx.blockTime * 1000,
      };
    }

    return {
      chain: 'solana',
      eventType: 'protocol_interaction',
      txHash: signature,
      success: true,
      timestamp: tx.blockTime * 1000,
    };
  }

  private isVaultProgram(programId: string): boolean {
    const KNOWN_VAULT_PROGRAMS = [
      'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', // Marinade
      'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', // Solend
    ];
    return KNOWN_VAULT_PROGRAMS.includes(programId);
  }

  private isLiquidationProgram(programId: string): boolean {
    const KNOWN_LIQUIDATION_PROGRAMS = [
      'LiquiPrPJekBa8Z5n4U7wR4Rj3UGJjZsXFXQ8tR3B2i', // placeholder
    ];
    return KNOWN_LIQUIDATION_PROGRAMS.includes(programId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

