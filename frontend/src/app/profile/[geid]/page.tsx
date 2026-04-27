import { api } from '@/lib/api';
import { ScoreRing } from '@/components/dashboard/ScoreRing';

interface ProfilePageProps {
  params: { geid: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  let profile = null;
  let error = null;

  try {
    profile = await api.getProfile(params.geid);
  } catch (err: any) {
    error = err.message;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">{error ?? 'Agent not found'}</p>
        </div>
      </div>
    );
  }

  const ltv = profile.score >= 95 ? 90 : profile.score >= 85 ? 80 : 60;

  return (
    <div className="max-w-md mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-btc font-bold text-xl">KYA</span>
          <span className="text-acid font-bold text-xl">Signal</span>
        </div>
        <p className="text-xs text-gray-400 font-mono">Public Agent Scorecard</p>
      </div>

      {/* Card */}
      <div className={`bg-surface border rounded-2xl p-8 space-y-6 ${profile.verified ? 'border-acid/30 verified-glow' : 'border-border'}`}>

        {/* Score ring */}
        <div className="flex justify-center">
          <ScoreRing
            score={profile.score}
            size={160}
            verified={profile.verified}
            premium={profile.premium}
          />
        </div>

        {/* Verified badge */}
        {profile.verified && (
          <div className="flex justify-center">
            <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-acid/10 text-acid border border-acid/30">
              {profile.premium ? '◆ KYA Premium' : '◈ KYA Verified'}
            </span>
          </div>
        )}

        {/* Protocol query response */}
        <div className="bg-black rounded-xl border border-border p-4">
          <p className="text-xs text-gray-400 font-mono mb-2 uppercase tracking-widest">Contract Response</p>
          <pre className="text-xs font-mono text-acid leading-relaxed">
{`{
  "verified": ${profile.verified},
  "suggested-ltv": ${ltv}
}`}
          </pre>
        </div>

        {/* Meta */}
        <div className="space-y-2 text-xs">
          {[
            { label: 'GEID', value: params.geid, mono: true, truncate: true },
            { label: 'Source Chain', value: profile.sourceChain, mono: false },
            { label: 'Registered at BTC Block', value: `#${profile.registeredAtBlock.toLocaleString()}`, mono: true },
            { label: 'Last Score BTC Block', value: `#${profile.btcBlockHeight.toLocaleString()}`, mono: true },
            { label: 'Config Hash', value: (profile.configHash ? profile.configHash.slice(0, 20) + '...' : 'N/A'), mono: true },
            { label: 'Mezo Wallet Linked', value: profile.hasMezoWallet ? 'Yes' : 'No', mono: false },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-gray-400 shrink-0">{row.label}</span>
              <span className={`${row.mono ? 'font-mono' : ''} text-white text-right ${row.truncate ? 'truncate max-w-32' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Scores are anchored to Bitcoin via Stacks. Verify at{' '}
        <span className="text-btc font-mono">kya.signal</span>
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  return {
    title: `KYA Signal · Agent ${params.geid.slice(0, 8)}...`,
    description: 'Bitcoin-anchored agent reputation scorecard.',
  };
}

