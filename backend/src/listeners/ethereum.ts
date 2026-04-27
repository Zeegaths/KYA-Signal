// KYA Signal — Ethereum Chain Listener
// Indexes Aave, Compound, and other DeFi protocol interactions for agents

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import type { ChainEvent } from '../normalizer/engine';

// Minimal ABIs for event parsing
const AAVE_POOL_ABI = [
  'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
  'event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)',
  'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint8 interestRateMode, uint256 borrowRate, uint16 indexed referralCode)',
];

const AAVE_V3_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

export class EthereumListener {
  private provider: ethers.JsonRpcProvider;
  private prisma: PrismaClient;
  private isRunning = false;
  private pollingIntervalMs: number;

  constructor(
    prisma: PrismaClient,
    rpcEndpoint: string,
    pollingIntervalMs = 15_000
  ) {
    this.prisma = prisma;
    this.provider = new ethers.JsonRpcProvider(rpcEndpoint);
    this.pollingIntervalMs = pollingIntervalMs;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[eth-listener] Starting Ethereum chain listener');
    await this.pollLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.indexRecentActivity();
      } catch (err) {
        console.error('[eth-listener] Poll error:', err);
      }
      await this.sleep(this.pollingIntervalMs);
    }
  }

  private async indexRecentActivity(): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: {
        OR: [
          { sourceChain: 'ethereum' },
          { sourceChain: 'solana' }, // cross-chain: ETH secondary for all agents
        ],
        active: true,
      },
      select: { id: true, geid: true, sourceChainKey: true, sourceChain: true },
    });

    const chainRegistry = await this.prisma.chainRegistry.findUnique({
      where: { chainId: 'ethereum' },
    });
    if (!chainRegistry) return;

    const currentBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(chainRegistry.lastIndexedBlock, currentBlock - 1000);

    for (const agent of agents) {
      try {
        await this.indexAgentEthEvents(agent, fromBlock, currentBlock);
      } catch (err) {
        console.error(`[eth-listener] Error indexing agent ${agent.geid}:`, err);
      }
    }

    await this.prisma.chainRegistry.update({
      where: { chainId: 'ethereum' },
      data: { lastIndexedBlock: currentBlock },
    });
  }

  private async indexAgentEthEvents(
    agent: { id: string; geid: string; sourceChainKey: string },
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    const agentAddress = agent.sourceChainKey.toLowerCase();

    // Validate Ethereum address format
    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      return;
    }

    const aavePool = new ethers.Contract(AAVE_V3_POOL, AAVE_POOL_ABI, this.provider);

    // Check for liquidation events where this agent is the liquidator
    const liquidationFilter = aavePool.filters.LiquidationCall(
      null, null, null, null, null, agentAddress
    );

    try {
      const liquidationEvents = await aavePool.queryFilter(
        liquidationFilter,
        fromBlock,
        toBlock
      );

      const activeConfig = await this.prisma.normalizationConfig.findFirst({
        where: { deprecated: false, activatedAt: { not: null } },
        orderBy: { activatedAt: 'desc' },
      });

      for (const evt of liquidationEvents) {
        if (!('blockNumber' in evt)) continue;
        const block = await this.provider.getBlock(evt.blockNumber);
        if (!block) continue;

        await this.upsertScoreEvent(agent.id, {
          configId: activeConfig?.id ?? '',
          configHash: activeConfig?.configHash ?? '',
          chain: 'ethereum',
          txHash: evt.transactionHash,
          eventType: 'liquidation',
          rawScoreDelta: 0,
          normalizedScore: 0,
          btcBlockHeight: 0,
          stacksBlockHeight: 0,
          submittedByOracle: process.env.ORACLE_STACKS_ADDRESS ?? '',
        });
      }

      // Check Supply events (vault rebalances)
      const supplyFilter = aavePool.filters.Supply(null, agentAddress);
      const supplyEvents = await aavePool.queryFilter(supplyFilter, fromBlock, toBlock);

      for (const evt of supplyEvents) {
        await this.upsertScoreEvent(agent.id, {
          configId: activeConfig?.id ?? '',
          configHash: activeConfig?.configHash ?? '',
          chain: 'ethereum',
          txHash: evt.transactionHash,
          eventType: 'vault_rebalance',
          rawScoreDelta: 0,
          normalizedScore: 0,
          btcBlockHeight: 0,
          stacksBlockHeight: 0,
          submittedByOracle: process.env.ORACLE_STACKS_ADDRESS ?? '',
        });
      }
    } catch (err) {
      console.error('[eth-listener] Event query error:', err);
    }
  }

  private async upsertScoreEvent(
    agentId: string,
    data: {
      configId: string;
      configHash: string;
      chain: string;
      txHash: string;
      eventType: string;
      rawScoreDelta: number;
      normalizedScore: number;
      btcBlockHeight: number;
      stacksBlockHeight: number;
      submittedByOracle: string;
    }
  ): Promise<void> {
    // Idempotent: skip if txHash already indexed
    const existing = await this.prisma.scoreEvent.findFirst({
      where: { txHash: data.txHash, chain: data.chain },
    });
    if (existing) return;

    await this.prisma.scoreEvent.create({
      data: { agentId, rawInputsHash: '', ...data },
    });
  }

  classifyEthEvent(eventType: string, success: boolean, timestamp: number): ChainEvent {
    return {
      chain: 'ethereum',
      eventType: eventType as ChainEvent['eventType'],
      success,
      timestamp,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

