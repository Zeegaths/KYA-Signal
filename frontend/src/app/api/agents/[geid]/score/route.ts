import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function GET(
  req: NextRequest,
  { params }: { params: { geid: string } }
) {
  const { geid } = params

  if (!geid || geid.length !== 64) {
    return NextResponse.json({ error: 'Invalid GEID' }, { status: 400 })
  }

  try {
    // Get agent
    const agentRes = await pool.query(
      'SELECT id, geid, "sourceChain", "stacksKey", "registeredAtBlock" FROM "Agent" WHERE geid = $1',
      [geid]
    )

    if (agentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agent = agentRes.rows[0]

    // Get latest score event
    const scoreRes = await pool.query(
      `SELECT se."normalizedScore", se."configHash", se."rawInputsHash", 
              se."btcBlockHeight", se."stacksBlockHeight", se."createdAt"
       FROM "ScoreEvent" se
       WHERE se."agentId" = $1
       ORDER BY se."createdAt" DESC
       LIMIT 1`,
      [agent.id]
    )

    if (scoreRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'No score yet - agent needs on-chain activity' },
        { status: 404 }
      )
    }

    const score = scoreRes.rows[0]
    const normalizedScore = score.normalizedScore
    const verified = normalizedScore >= 85
    const premium = normalizedScore >= 95
    const suggestedLtv = premium ? 90 : verified ? 80 : 60

    return NextResponse.json({
      geid,
      normalizedScore,
      configHash: score.configHash,
      rawInputsHash: score.rawInputsHash,
      btcBlockHeight: score.btcBlockHeight,
      stacksBlockHeight: score.stacksBlockHeight,
      verified,
      premium,
      suggestedLtv,
      updatedAt: score.createdAt,
      cached: false,
    })

  } catch (err: any) {
    console.error('[score]', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}