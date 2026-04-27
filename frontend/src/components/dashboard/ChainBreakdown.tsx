'use client';

import clsx from 'clsx';

interface ChainBreakdownProps {
  breakdown: Record<string, number>;  // { solana: 82, ethereum: 74, stacks: 90 }
}

const CHAIN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  solana:   { label: 'Solana',   color: '#9945FF', bg: '#9945FF22' },
  ethereum: { label: 'Ethereum', color: '#627EEA', bg: '#627EEA22' },
  stacks:   { label: 'Stacks',   color: '#F7931A', bg: '#F7931A22' },
};

export function ChainBreakdown({ breakdown }: ChainBreakdownProps) {
  const chains = Object.entries(breakdown);

  if (chains.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No chain data yet — score updates every 10 minutes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chains.map(([chain, score]) => {
        const cfg = CHAIN_CONFIG[chain] ?? { label: chain, color: '#555', bg: '#55555522' };
        return (
          <div key={chain}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded border"
                  style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + '44' }}
                >
                  {cfg.label}
                </span>
              </div>
              <span className="text-sm font-mono font-semibold" style={{ color: cfg.color }}>
                {score}/100
              </span>
            </div>

            {/* Bar */}
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  background: cfg.color,
                  boxShadow: `0 0 8px ${cfg.color}66`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

