'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { ChainBreakdown } from '@/components/dashboard/ChainBreakdown';
import { LtvCard } from '@/components/dashboard/LtvCard';

const fetcher = (geid: string) => api.getScore(geid);

export default function DashboardPage() {
  const [geid, setGeid] = useState('');
  const [submittedGeid, setSubmittedGeid] = useState('');
  const router = useRouter();

  const { data: score, isLoading, error } = useSWR(
    submittedGeid ? submittedGeid : null,
    fetcher,
    { refreshInterval: 30_000 }
  );

  const { data: breakdown } = useSWR(
    submittedGeid ? `breakdown:${submittedGeid}` : null,
    () => api.getBreakdown(submittedGeid)
  );

  const { data: profile } = useSWR(
    submittedGeid ? `profile:${submittedGeid}` : null,
    () => api.getProfile(submittedGeid)
  );

  const handleLookup = () => {
    if (geid.trim().length === 64) setSubmittedGeid(geid.trim());
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-gray-400 text-sm">Live reputation score, Bitcoin-anchored every 10 minutes.</p>
      </div>

      {/* GEID lookup */}
      <div className="flex gap-2 mb-8">
        <input
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-muted focus:outline-none focus:border-btc/50 transition-colors"
          placeholder="Enter GEID (64-char hex)..."
          value={geid}
          onChange={e => setGeid(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
        />
        <button
          onClick={handleLookup}
          className="px-5 py-2.5 bg-btc text-black font-bold rounded-lg hover:bg-btc/90 transition-colors text-sm"
        >
          Look up
        </button>
      </div>

      {!submittedGeid && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">◉</p>
          <p className="text-sm">Enter a GEID to view an agent's live score</p>
          <p className="text-xs mt-2">
            Don't have one?{' '}
            <Link href="/register" className="text-btc hover:underline">Register your agent →</Link>
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl skeleton" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-sm text-red-400">
          {error.message}
        </div>
      )}

      {score && (
        <div className="space-y-4">
          {/* Header badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">GEID</span>
            <span className="text-xs font-mono text-gray-300 bg-surface border border-border px-2 py-0.5 rounded">
              {submittedGeid.slice(0, 16)}...{submittedGeid.slice(-8)}
            </span>
            {score.verified && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-acid/10 text-acid border border-acid/20 verified-glow">
                {score.premium ? '◆ KYA Premium' : '◈ KYA Verified'}
              </span>
            )}
            {score.cached && (
              <span className="text-xs text-gray-400 font-mono ml-auto">cached</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score ring */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center gap-4">
              <ScoreRing
                score={score.normalizedScore}
                verified={score.verified}
                premium={score.premium}
              />

              <div className="text-center space-y-1 w-full">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>BTC Block</span>
                  <span className="font-mono text-white">#{score.btcBlockHeight.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Config Hash</span>
                  <span className="font-mono text-gray-300 truncate max-w-28">
                    {score.configHash.slice(0, 12)}...
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Updated</span>
                  <span className="font-mono text-white">
                    {new Date(score.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* LTV */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">
                MUSD Borrowing Limit
              </h3>
              <LtvCard
                score={score.normalizedScore}
                mezowallet={profile?.hasMezoWallet ? 'linked' : null}
              />
            </div>

            {/* Chain breakdown */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">
                Chain Breakdown
              </h3>
              <ChainBreakdown
                breakdown={
                  breakdown?.breakdown
                    ? Object.fromEntries(
                        Object.entries(breakdown.breakdown).map(([chain, events]) => {
                          const scores = Object.values(events).map(e =>
                            Math.min(100, Math.max(0, 50 + e.avgDelta * e.successRate * 50))
                          );
                          const avg = scores.length
                            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                            : 0;
                          return [chain, avg];
                        })
                      )
                    : {}
                }
              />
            </div>

            {/* Quick actions */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Actions</h3>

              <Link
                href={`/audit?geid=${submittedGeid}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-btc/30 hover:bg-btc/5 transition-all group"
              >
                <span className="text-sm text-white group-hover:text-btc">View full audit trail</span>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href={`/profile/${submittedGeid}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-btc/30 hover:bg-btc/5 transition-all group"
              >
                <span className="text-sm text-white group-hover:text-btc">Share public scorecard</span>
                <span className="text-gray-400">→</span>
              </Link>

              <Link
                href={`/disputes?geid=${submittedGeid}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-btc/30 hover:bg-btc/5 transition-all group"
              >
                <span className="text-sm text-white group-hover:text-btc">Flag a score event</span>
                <span className="text-gray-400">→</span>
              </Link>

              <div className="p-3 rounded-lg border border-border">
                <p className="text-xs text-gray-400 mb-1">Protocol Query Response</p>
                <pre className="text-xs text-acid font-mono">
                  {JSON.stringify(
                    { verified: score.verified, 'suggested-ltv': score.suggestedLtv },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

