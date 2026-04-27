'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';

export default function DisputesClient() {
  const searchParams = useSearchParams();
  const defaultGeid = searchParams.get('geid') ?? '';
  const [geid, setGeid] = useState(defaultGeid);
  const [submittedGeid, setSubmittedGeid] = useState(defaultGeid);
  const [filter, setFilter] = useState('ALL');

  const { data, isLoading } = useSWR(
    submittedGeid ? `disputes:${submittedGeid}` : null,
    () => api.getDisputes(submittedGeid)
  );

  const filtered = data?.disputes.filter(d => filter === 'ALL' ? true : d.status === filter) ?? [];
  const statusColor: Record<string, string> = { OPEN: '#F59E0B', UNDER_REVIEW: '#3B82F6', RESOLVED: '#cafd00', DISMISSED: '#555' };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Disputes</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Flag inaccurate score events. Each dispute is logged on-chain and resolved by the contract owner.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#fff', outline: 'none' }}
          placeholder="GEID (64-char hex)..."
          value={geid}
          onChange={e => setGeid(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && geid.length === 64) setSubmittedGeid(geid); }}
        />
        <button
          onClick={() => setSubmittedGeid(geid)}
          disabled={geid.length !== 64}
          style={{ background: '#F7931A', color: '#000', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', opacity: geid.length !== 64 ? 0.4 : 1 }}
        >
          Load
        </button>
      </div>

      {submittedGeid && (
        <>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', padding: '5px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', background: filter === s ? 'rgba(247,147,26,0.1)' : '#0f0f0f', borderColor: filter === s ? 'rgba(247,147,26,0.4)' : '#1a1a1a', color: filter === s ? '#F7931A' : '#555' }}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {isLoading && <div style={{ color: '#555', fontSize: '13px' }}>Loading disputes...</div>}

          {!isLoading && filtered.length === 0 && (
            <div style={{ color: '#444', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
              {data?.disputes.length === 0 ? 'No disputes for this agent.' : `No ${filter.toLowerCase().replace('_', ' ')} disputes.`}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(d => (
              <div key={d.id} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: '4px', background: `${statusColor[d.status]}18`, color: statusColor[d.status], border: `1px solid ${statusColor[d.status]}30` }}>{d.status.replace('_', ' ')}</span>
                  <span style={{ fontSize: '13px', color: '#fff', flex: 1 }}>{d.reason}</span>
                  <span style={{ fontSize: '10px', color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                {d.resolution && <div style={{ fontSize: '12px', color: '#cafd00', fontFamily: 'JetBrains Mono, monospace', marginTop: '8px' }}>{d.resolution}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {!submittedGeid && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#333' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚑</div>
          <div style={{ fontSize: '13px' }}>Enter a GEID to view its disputes</div>
        </div>
      )}
    </div>
  );
}
