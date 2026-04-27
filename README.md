# KYA Signal · Know Your Agent

> Bitcoin-anchored cross-chain agent reputation. Portable. Permissionless. Verified.

---

## What it does

KYA Signal is a portable reputation layer for autonomous agents. It indexes agent behavior across Solana and Ethereum, normalizes it into a 0–100 score using a versioned, hash-committed config, and settles that score on Bitcoin via Stacks.

Any protocol can query any agent's score with no whitelist or partnership. The Mezo integration gates MUSD borrowing LTV directly from the on-chain score:

| Score | Status | LTV on MUSD |
|-------|--------|-------------|
| 0–84  | Base   | 60%         |
| 85–94 | KYA Verified | 80%   |
| 95–100| KYA Premium  | 90%   |

---

## Architecture

```
contracts/
  kya-score.clar          — score storage, dispute flags, Bitcoin anchoring
  mezo-lender-query.clar  — LTV gating with rate limiting, synced from kya-score

backend/
  src/
    listeners/
      solana.ts           — Solana tx indexer (vault rebalances, liquidations)
      ethereum.ts         — Ethereum event indexer (Aave supply/liquidation)
    normalizer/
      engine.ts           — versioned score normalization + config hashing
    oracle/
      stacks.ts           — submits scores on-chain, syncs mezo contract
    cache/
      redis.ts            — TTL cache (scores 60s, LTV responses 30s)
    api/
      routes/index.ts     — Fastify REST API
    email/
      service.ts          — Zepto Mail alert templates
    index.ts              — entry point, cron jobs

frontend/
  src/app/
    page.tsx              — landing page
    register/             — agent registration flow
    dashboard/            — live score, LTV, chain breakdown
    audit/                — full event history with hash verification
    disputes/             — dispute management
    profile/[geid]/       — public read-only scorecard
    configs/              — normalization config versions
```

---

## Local Setup (no Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL — local install or [Neon](https://neon.tech) (free)
- Redis — local install or [Upstash](https://upstash.com) (free)

### 1. Clone & install

```bash
git clone https://github.com/your-org/kya-signal
cd kya-signal

# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values — see .env.example for all keys

# Frontend
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev --name init    # creates all tables
npx tsx src/seed.ts                   # seeds chain registry + default config
```

### 4. Deploy Clarity contracts (Stacks testnet)

```bash
# Install Clarinet
brew install clarinet  # macOS
# or: https://github.com/hirosystems/clarinet

cd contracts
clarinet check                        # validate contracts
clarinet deployments apply --testnet  # deploy to testnet
```

After deployment, copy the contract address into `backend/.env`:
```
KYA_CONTRACT_ADDRESS=SP...
```

### 5. Run

```bash
# Backend (port 4000)
cd backend
npm run dev

# Frontend (port 3000) — separate terminal
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

### Agent Registration
```
POST /agents/register
{ sourceChainKey, sourceChain, stacksKey, emailHash? }
→ { geid, registeredAtBlock }
```

GEID is deterministic: `sha256(sourceChainKey:stacksKey)` — independently verifiable.

### Score Read (cached 60s)
```
GET /agents/:geid/score
→ { normalizedScore, verified, premium, suggestedLtv, btcBlockHeight, configHash, rawInputsHash }
```

### Protocol LTV Query (rate-limited: 20/block/protocol)
```
POST /protocol/query
{ geid, protocolAddress }
→ { verified: bool, suggestedLtv: uint }
```

### Audit Trail
```
GET /agents/:geid/audit?page=1&limit=20
→ { events: [{ chain, eventType, normalizedScore, configHash, rawInputsHash, btcBlockHeight }] }
```

### Disputes
```
POST /disputes
{ geid, scoreEventId, reason, flaggedBy }
→ { disputeId, status: "OPEN" }

GET /disputes/:geid
→ { disputes: [{ status, reason, resolution, ... }] }
```

### Normalization Configs
```
GET /configs            — all versions with hashes
GET /configs/:version   — full weights for a version
```

---

## Verifying a Score

Every score submission stores two hashes both in the DB and on-chain:

- **`config_hash`** — `sha256(JSON.stringify(weights, sortedKeys))` — proves which normalization weights produced the score
- **`raw_inputs_hash`** — `sha256(JSON.stringify(sortedEvents))` — proves which chain events were fed in

To verify:
1. Get `configHash` from the audit trail or on-chain `get-score`
2. Match it to a version at `GET /configs`
3. Re-run `sha256(JSON.stringify(weights))` yourself — hashes must match
4. The same hash is stored in the Stacks contract — no need to trust this API

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| GEID = sha256(sourceChainKey:stacksKey) | Deterministic — no DB needed to verify identity |
| Versioned normalization configs | Changing weights doesn't invalidate old scores — each score is permanently attributable to the config that produced it |
| raw_inputs_hash on-chain | Proves what data produced a score, not just that a score was submitted |
| Redis cache (60s scores, 30s LTV) | Prevents DB hammering under concurrent protocol queries |
| Protocol query rate limit (20/block) | Prevents fishing attacks — each BTC block window resets |
| Dispute mechanism | Agents can flag inaccurate score events; status flows OPEN → RESOLVED on-chain |

---

## Third Parties

| Service | Purpose |
|---------|---------|
| Stacks / Hiro | Bitcoin settlement, Clarity contracts |
| Mezo | MUSD LTV integration |
| Helius / QuickNode | Solana RPC |
| Alchemy | Ethereum RPC |
| Neon | Hosted Postgres (optional) |
| Upstash | Hosted Redis (optional) |
| Zepto Mail | Email alerts |
| Vercel | Frontend deployment |

