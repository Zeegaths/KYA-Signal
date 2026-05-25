import fetch from 'node-fetch';

const GOLDSKY_URL = 'https://api.goldsky.com/api/public/project_clz9zgnuov25e01urhx3x85e8/subgraphs/kya-signal/v1/gn';

export async function fetchLiquidationEvents(since: number): Promise<any[]> {
  const query = `{
    agentEvents(
      where: { eventType: "LIQUIDATION", blockNumber_gt: "${since}" }
      orderBy: blockNumber
      orderDirection: asc
      first: 100
    ) {
      id
      agent
      eventType
      blockNumber
      timestamp
      txHash
      collateralAsset
      debtAsset
      amount
    }
  }`;

  try {
    const res = await fetch(GOLDSKY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json() as any;
    return data?.data?.agentEvents ?? [];
  } catch (err: any) {
    console.error('[goldsky] Query failed:', err?.message);
    return [];
  }
}
