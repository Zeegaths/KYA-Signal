// KYA Signal - Ethereum Chain Listener (Goldsky-powered)
import { PrismaClient } from '@prisma/client';
import { fetchLiquidationEvents } from './goldsky';

export class EthereumListener {
  private prisma: PrismaClient;
  private isRunning = false;
  private pollingIntervalMs: number;
  private lastIndexedBlock = 5000000;

  constructor(prisma: PrismaClient, _rpcEndpoint: string, pollingIntervalMs = 30000) {
    this.prisma = prisma;
    this.pollingIntervalMs = pollingIntervalMs;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[eth-listener] Starting Ethereum listener via Goldsky');
    await this.pollLoop();
  }

  stop(): void { this.isRunning = false; }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try { await this.indexViaGoldsky(); }
      catch (err) { console.error('[eth-listener] Poll error:', err); }
      await this.sleep(this.pollingIntervalMs);
    }
  }

  private async indexViaGoldsky(): Promise<void> {
    const events = await fetchLiquidationEvents(this.lastIndexedBlock);
    if (events.length === 0) {
      console.log('[eth-listener] No new events from Goldsky');
      return;
    }
    console.log('[eth-listener] Goldsky returned ' + events.length + ' events');
    const agents = await this.prisma.agent.findMany({
      where: { sourceChain: 'ethereum', active: true },
      select: { id: true, geid: true, sourceChainKey: true },
    });
    const agentMap = new Map(agents.map((a: any) => [a.sourceChainKey.toLowerCase(), a]));
    for (const event of events) {
      const agent = agentMap.get(event.agent.toLowerCase());
      const blockNum = parseInt(event.blockNumber);
      if (blockNum > this.lastIndexedBlock) this.lastIndexedBlock = blockNum;
      console.log('[eth-listener] Liquidation indexed for agent ' + (agent as any).geid);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}