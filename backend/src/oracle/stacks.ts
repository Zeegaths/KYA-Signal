import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  bufferCV,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { PrismaClient } from '@prisma/client';
import { NormalizationEngine, ChainEvent, ScoreResult } from '../normalizer/engine';
import crypto from 'crypto';

export class StacksOracle {
  private prisma: PrismaClient;
  private engine: NormalizationEngine;
  private network: StacksTestnet | StacksMainnet;
  private privateKey: string;
  private contractAddress: string;
  private contractName: string;
  private mezoContractName: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.engine = new NormalizationEngine(prisma);
    const isMainnet = process.env.STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? new StacksMainnet() : new StacksTestnet();
    this.privateKey = process.env.ORACLE_PRIVATE_KEY ?? '';
    this.contractAddress = process.env.KYA_CONTRACT_ADDRESS ?? '';
    this.contractName = 'kya-score';
    this.mezoContractName = 'mezo-lender-query';
  }

  async processAgent(geid: string): Promise<{ txId: string; score: number }> {
    console.log(`[oracle] Processing agent ${geid}`);

    const agent = await this.prisma.agent.findUnique({
      where: { geid },
      include: {
        scoreEvents: { orderBy: { createdAt: 'desc' }, take: 500 },
      },
    });

    if (!agent) throw new Error(`Agent not found: ${geid}`);

    const events: ChainEvent[] = agent.scoreEvents.map(e => ({
      chain: e.chain as ChainEvent['chain'],
      eventType: e.eventType as ChainEvent['eventType'],
      txHash: e.txHash ?? undefined,
      success: e.rawScoreDelta >= 0,
      timestamp: e.createdAt.getTime(),
    }));

    const result: ScoreResult = await this.engine.computeScore(events);
    const txId = await this.submitScore(geid, result);

    await this.prisma.scoreEvent.updateMany({
      where: { agentId: agent.id, btcBlockHeight: 0 },
      data: { rawInputsHash: result.rawInputsHash, normalizedScore: result.normalizedScore },
    });

    await this.syncMezoContract(geid, result);
    await this.checkThresholdAlert(agent.id, result.normalizedScore);

    console.log(`[oracle] Agent ${geid} — score: ${result.normalizedScore}, txId: ${txId}`);
    return { txId, score: result.normalizedScore };
  }

  private async submitScore(geid: string, result: ScoreResult): Promise<string> {
    if (!this.privateKey || !this.contractAddress) {
      console.warn('[oracle] No private key or contract address set — skipping on-chain submission');
      return 'skipped';
    }

    const configHashBuf = Buffer.from(result.configHash, 'hex');
    const rawInputsHashBuf = Buffer.from(result.rawInputsHash, 'hex');

    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'submit-score',
      functionArgs: [
        stringAsciiCV(geid),
        uintCV(result.normalizedScore),
        bufferCV(configHashBuf),
        bufferCV(rawInputsHashBuf),
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    });

    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    if ('error' in broadcastResponse) {
      throw new Error(`Stacks broadcast failed: ${broadcastResponse.error}`);
    }
    return broadcastResponse.txid;
  }

  private async syncMezoContract(geid: string, result: ScoreResult): Promise<void> {
    if (!this.privateKey || !this.contractAddress) return;

    const btcBlock = await this.getBtcBlockHeight();
    const configHashBuf = Buffer.from(result.configHash, 'hex');

    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: this.mezoContractName,
      functionName: 'sync-score',
      functionArgs: [
        stringAsciiCV(geid),
        uintCV(result.normalizedScore),
        uintCV(btcBlock),
        bufferCV(configHashBuf),
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    });

    await broadcastTransaction(transaction, this.network);
  }

  private async getBtcBlockHeight(): Promise<number> {
    try {
      const res = await fetch(`${this.network.coreApiUrl}/v2/info`);
      const data = await res.json() as { burn_block_height: number };
      return data.burn_block_height;
    } catch {
      return 0;
    }
  }

  private async checkThresholdAlert(agentId: string, score: number): Promise<void> {
    const THRESHOLD = 85;
    const previousEvent = await this.prisma.scoreEvent.findFirst({
      where: { agentId, normalizedScore: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      skip: 1,
    });
    if (!previousEvent) return;

    const previousScore = previousEvent.normalizedScore;
    if (
      (previousScore < THRESHOLD && score >= THRESHOLD) ||
      (previousScore >= THRESHOLD && score < THRESHOLD)
    ) {
      await this.prisma.alertLog.create({
        data: { agentId, type: 'SCORE_THRESHOLD_CROSSED', recipientHash: '', success: false },
      });
    }
  }

  static generateGEID(sourceChainKey: string, stacksKey: string): string {
    return crypto
      .createHash('sha256')
      .update(`${sourceChainKey}:${stacksKey}`)
      .digest('hex')
      .slice(0, 64);
  }
}
