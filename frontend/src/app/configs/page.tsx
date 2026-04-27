'use client';

import useSWR from 'swr';
import { api, ConfigVersion } from '@/lib/api';

export default function ConfigsPage() {
  const { data, isLoading } = useSWR('configs', api.getConfigs);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Normalization Configs</h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
          Every score submission stores the config hash on-chain. You can verify any score by
          comparing its on-chain <span className="font-mono text-white">config_hash</span> to
          the record below. Changing weights requires a new version — old scores remain attributable
          to the config that produced them.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)}
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {data.configs.map((cfg: ConfigVersion) => (
            <div
              key={cfg.version}
              className={`bg-surface border rounded-xl p-5 space-y-3 ${
                !cfg.deprecated && cfg.activatedAt
                  ? 'border-acid/30'
                  : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-white">{cfg.version}</span>
                {!cfg.deprecated && cfg.activatedAt && (
                  <span className="text-xs px-2 py-0.5 rounded bg-acid/10 text-acid border border-acid/20 font-mono">
                    active
                  </span>
                )}
                {cfg.deprecated && (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-border font-mono">
                    deprecated
                  </span>
                )}
              </div>

              {cfg.description && (
                <p className="text-sm text-gray-400">{cfg.description}</p>
              )}

              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Config Hash (SHA-256)</p>
                  <p className="hash-mono">{cfg.configHash}</p>
                </div>
                {cfg.activatedAt && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Activated</p>
                    <p className="text-xs font-mono text-white">
                      {new Date(cfg.activatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">How to verify a score</h3>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li>Find the <span className="font-mono text-white">config_hash</span> on your score event (audit trail)</li>
          <li>Match it to a version in this table</li>
          <li>
            SHA-256 the weights JSON yourself:{' '}
            <span className="font-mono text-white text-xs">sha256(JSON.stringify(weights, sortedKeys))</span>
          </li>
          <li>The hash is also stored on-chain in the Stacks contract — fully auditable without trusting this UI</li>
        </ol>
      </div>
    </div>
  );
}

