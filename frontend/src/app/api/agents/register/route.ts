import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sourceChainKey, sourceChain, stacksKey, emailHash } = body

    if (!sourceChainKey || !sourceChain || !stacksKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const geid = crypto
      .createHash('sha256')
      .update(`${sourceChainKey}:${stacksKey}`)
      .digest('hex')
      .slice(0, 64)

    const existing = await pool.query(
      'SELECT geid FROM "Agent" WHERE geid = $1',
      [geid]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Agent already registered', geid }, { status: 409 })
    }

    let btcBlock = 0
    try {
      const res = await fetch(process.env.MEZO_RPC_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
      })
      const data = await res.json() as { result: string }
      btcBlock = parseInt(data.result, 16)
    } catch { /* non-fatal */ }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await pool.query(
      `INSERT INTO "Agent" (id, geid, "sourceChainKey", "sourceChain", "stacksKey", "registeredAtBlock", "registeredAt", active, "emailHash")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, geid, sourceChainKey, sourceChain, stacksKey, btcBlock, now, true, emailHash ?? null]
    )

    return NextResponse.json({
      geid,
      registeredAtBlock: btcBlock,
      message: 'Agent registered. GEID = sha256(sourceChainKey:stacksKey)',
    }, { status: 201 })

  } catch (err: any) {
    console.error('[register]', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}