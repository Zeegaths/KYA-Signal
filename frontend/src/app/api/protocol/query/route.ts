import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const rateLimitMap = new Map<string, { count: number; block: number }>()

async function getMezoBlock(): Promise<number> {
  try {
    const res = await fetch(process.env.MEZO_RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    })
    const data = await res.json() as { result: string }
    return parseInt(data.result, 16)
  } catch { return 0 }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { geid, protocolAddress } = body
    if (!geid || !protocolAddress) {
      return NextResponse.json({ error: 'Missing geid or protocolAddress' }, { status: 400 })
    }
    const btcBlock = await getMezoBlock()
    const rateKey = protocolAddress + ':' + btcBlock
    const current = rateLimitMap.get(rateKey) ?? { count: 0, block: btcBlock }
    if (current.count >= 20) {
      return NextResponse.json({ error: 'Rate limit exceeded: 20 queries per BTC block' }, { status: 429 })
    }
    rateLimitMap.set(rateKey, { count: current.count + 1, block: btcBlock })
    const result = await pool.query(
      'SELECT se."normalizedScore", se."configHash", se."btcBlockHeight" FROM "ScoreEvent" se JOIN "Agent" a ON a.id = se."agentId" WHERE a.geid = $1 ORDER BY se."createdAt" DESC LIMIT 1',
      [geid]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ verified: false, suggestedLtv: 60, btcBlock, geid, reason: 'No score found' })
    }
    const score = result.rows[0]
    const normalizedScore = score.normalizedScore
    const verified = normalizedScore >= 85
    const premium = normalizedScore >= 95
    const suggestedLtv = premium ? 90 : verified ? 80 : 60
    return NextResponse.json({ verified, suggestedLtv, btcBlock, geid, normalizedScore, configHash: score.configHash })
  } catch (err: any) {
    console.error('[protocol/query]', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
