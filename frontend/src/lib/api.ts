// KYA Signal — Frontend API Client

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── AGENT ─────────────────────────────────────────────────────────────

export interface AgentScore {
  geid: string;
  normalizedScore: number;
  configHash: string;
  rawInputsHash: string;
  btcBlockHeight: number;
  stacksBlockHeight: number;
  verified: boolean;
  premium: boolean;
  suggestedLtv: number;
  updatedAt: string;
  cached: boolean;
}

export interface AgentProfile {
  geid: string;
  sourceChain: string;
  registeredAtBlock: number;
  registeredAt: string;
  score: number;
  verified: boolean;
  premium: boolean;
  btcBlockHeight: number;
  configHash: string | null;
  hasMezoWallet: boolean;
}

export interface ScoreBreakdown {
  geid: string;
  breakdown: Record<string, Record<string, { count: number; avgDelta: number; successRate: number }>>;
  totalEvents: number;
}

export interface AuditEvent {
  id: string;
  chain: string;
  txHash: string | null;
  eventType: string;
  normalizedScore: number;
  rawScoreDelta: number;
  btcBlockHeight: number;
  configHash: string;
  configVersion: string;
  rawInputsHash: string;
  createdAt: string;
}

export interface AuditTrail {
  geid: string;
  page: number;
  limit: number;
  total: number;
  pages: number;
  events: AuditEvent[];
}

export interface Dispute {
  id: string;
  agentId: string;
  scoreEventId: string;
  flaggedBy: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ConfigVersion {
  version: string;
  configHash: string;
  description: string | null;
  activatedAt: string | null;
  deprecated: boolean;
}

export const api = {
  // Agent
  register: (body: {
    sourceChainKey: string;
    sourceChain: string;
    stacksKey: string;
    emailHash?: string;
  }) => apiFetch<{ geid: string; registeredAtBlock: number; message: string }>(
    '/agents/register', { method: 'POST', body: JSON.stringify(body) }
  ),

  linkMezo: (geid: string, mezowallet: string) =>
    apiFetch<{ geid: string; mezowallet: string }>(
      '/agents/link-mezo', { method: 'POST', body: JSON.stringify({ geid, mezowallet }) }
    ),

  getScore: (geid: string) =>
    apiFetch<AgentScore>(`/agents/${geid}/score`),

  getProfile: (geid: string) =>
    apiFetch<AgentProfile>(`/agents/${geid}/profile`),

  getBreakdown: (geid: string) =>
    apiFetch<ScoreBreakdown>(`/agents/${geid}/breakdown`),

  getAudit: (geid: string, page = 1, limit = 20) =>
    apiFetch<AuditTrail>(`/agents/${geid}/audit?page=${page}&limit=${limit}`),

  // Protocol query
  query: (geid: string, protocolAddress: string) =>
    apiFetch<{ verified: boolean; suggestedLtv: number; btcBlock: number; cached: boolean }>(
      '/protocol/query', { method: 'POST', body: JSON.stringify({ geid, protocolAddress }) }
    ),

  // Disputes
  createDispute: (body: { geid: string; scoreEventId: string; reason: string; flaggedBy: string }) =>
    apiFetch<{ disputeId: string; status: string }>(
      '/disputes', { method: 'POST', body: JSON.stringify(body) }
    ),

  getDisputes: (geid: string) =>
    apiFetch<{ geid: string; disputes: Dispute[] }>(`/disputes/${geid}`),

  // Config
  getConfigs: () =>
    apiFetch<{ configs: ConfigVersion[] }>('/configs'),

  // Stats
  getStats: () =>
    apiFetch<{ totalAgents: number; verifiedAgents: number; totalQueries: number; totalEvents: number }>(
      '/stats'
    ),
};

