'use client';

import clsx from 'clsx';

interface LtvCardProps {
  score: number;
  mezowallet?: string | null;
}

const TIERS = [
  {
    label: 'Base',
    ltv: 60,
    minScore: 0,
    maxScore: 84,
    color: '#555',
    desc: 'All agents start here',
  },
  {
    label: 'KYA Verified',
    ltv: 80,
    minScore: 85,
    maxScore: 94,
    color: '#cafd00',
    desc: 'Score ≥ 85',
  },
  {
    label: 'KYA Premium',
    ltv: 90,
    minScore: 95,
    maxScore: 100,
    color: '#F7931A',
    desc: 'Score ≥ 95',
  },
];

export function LtvCard({ score, mezowallet }: LtvCardProps) {
  const activeTier = score >= 95 ? TIERS[2] : score >= 85 ? TIERS[1] : TIERS[0];
  const ptsToNext = score >= 95 ? null : score >= 85 ? 95 - score : 85 - score;
  const nextTier = score >= 95 ? null : score >= 85 ? TIERS[2] : TIERS[1];

  return (
    <div className="space-y-3">
      {/* Active tier highlight */}
      <div
        className="rounded-xl border p-4"
        style={{
          background: activeTier.color + '0f',
          borderColor: activeTier.color + '44',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1">
              Current LTV Limit
            </p>
            <p className="text-3xl font-bold" style={{ color: activeTier.color }}>
              {activeTier.ltv}%
            </p>
            <p className="text-xs mt-1" style={{ color: activeTier.color + 'bb' }}>
              {activeTier.label}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: activeTier.color + '22' }}
          >
            {activeTier.ltv === 90 ? '◆' : activeTier.ltv === 80 ? '◈' : '○'}
          </div>
        </div>

        {/* Progress to next tier */}
        {ptsToNext !== null && nextTier && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>{ptsToNext} pts to {nextTier.label}</span>
              <span>{nextTier.ltv}% LTV</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${((score - activeTier.minScore) / (nextTier.minScore - activeTier.minScore)) * 100}%`,
                  background: nextTier.color,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* All tiers */}
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map(tier => {
          const isActive = activeTier.ltv === tier.ltv;
          return (
            <div
              key={tier.ltv}
              className="rounded-lg border p-2.5 text-center"
              style={{
                background: isActive ? tier.color + '15' : 'transparent',
                borderColor: isActive ? tier.color + '55' : '#1f1f1f',
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <p className="text-xs text-gray-400">{tier.label}</p>
              <p className="font-bold text-lg" style={{ color: isActive ? tier.color : '#555' }}>
                {tier.ltv}%
              </p>
              <p className="text-xs text-gray-400 font-mono">{tier.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Mezo wallet link */}
      {!mezowallet && (
        <p className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-lg px-3 py-2">
          ⚑ Link your Mezo wallet to activate KYA-gated borrowing limits
        </p>
      )}
      {mezowallet && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-acid" />
          <span className="font-mono">Mezo wallet linked</span>
          <span className="text-acid ml-auto">Active</span>
        </div>
      )}
    </div>
  );
}

