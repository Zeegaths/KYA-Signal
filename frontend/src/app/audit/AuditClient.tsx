'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';

export default function AuditClient() {
  const searchParams = useSearchParams();
  const defaultGeid = searchParams.get('geid') ?? '';
  const [geid, setGeid] = useState(defaultGeid);
  const [submittedGeid, setSubmittedGeid] = useState(defaultGeid);
  const [page, setPage] = useState(1);
  const [disputeEventId, setDisputeEventId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFrom, setDisputeFrom] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeDone, setDisputeDone] = useState(false);

  const { data, isLoading } = useSWR(
    submittedGeid ? `audit:${submittedGeid}:${page}` : null,
    () => api.getAudit(submittedGeid, page, 20)
  );

  const handleDispute = async () => {
    if (!disputeEventId || !disputeReason || !disputeFrom) return;
    setDisputeLoading(true);
    try {
      await api.createDispute({ geid: submittedGeid, scoreEventId: disputeEventId, reason: disputeReason, flaggedBy: disputeFrom });
      setDisputeDone(true);
    } catch (err: any) { alert(err.message); }
    finally { setDisputeLoading(false); }
  };

  const chainClass: Record<string, string> = { solana: 'chain-solana', ethereum: 'chain-ethereum', stacks: 'chain-stacks' };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Audit Trail</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Every score event, config hash, and raw inputs hash — verifiable against the on-chain record.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#fff', outline: 'none' }}
          placeholder="Enter GEID (64-char hex)..."
          value={geid}
          onChange={e => setGeid(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && geid.length === 64) { setSubmittedGeid(geid); setPage(1); } }}
        />
        <button
          onClick={() => { setSubmittedGeid(geid); setPage(1); }}
          disabled={geid.length !== 64}
          style={{ background: '#F7931A', color: '#000', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', opacity: geid.length !== 64 ? 0.4 : 1 }}
        >
          Load
        </button>
      </div>

      {isLoading && <div style={{ color: '#555', fontSize: '13px' }}>Loading events...</div>}

      {data && (
        <div>
          <div style={{ fontSize: '11px', color: '#444', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
            {data.total} total events · Page {data.page} / {data.pages}
          </div>
          {data.events.map(event => (
            <div key={event.id} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: '3px', border: '1px solid', color: event.chain === 'solana' ? '#9945FF' : event.chain === 'ethereum' ? '#627EEA' : '#F7931A', background: event.chain === 'solana' ? '#9945FF12' : event.chain === 'ethereum' ? '#627EEA12' : '#F7931A12', borderColor: event.chain === 'solana' ? '#9945FF30' : event.chain === 'ethereum' ? '#627EEA30' : '#F7931A30' }}>{event.chain}</span>
                <span style={{ fontSize: '11px', color: '#888', flex: 1 }}>{event.eventType.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: event.rawScoreDelta >= 0 ? '#cafd00' : '#ef4444' }}>{event.rawScoreDelta >= 0 ? '+' : ''}{event.rawScoreDelta.toFixed(1)}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', minWidth: '32px', textAlign: 'right' }}>{event.normalizedScore}</span>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#F7931A' }}>#{event.btcBlockHeight.toLocaleString()}</span>
                <button onClick={() => { setDisputeEventId(event.id); setDisputeDone(false); setDisputeReason(''); }} style={{ fontSize: '10px', color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer' }}>Flag</button>
              </div>
              <div style={{ marginTop: '8px', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#2a2a2a', wordBreak: 'break-all' }}>
                cfg: {event.configHash} · raw: {event.rawInputsHash}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '7px', padding: '8px 16px', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Previous</button>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '7px', padding: '8px 16px', cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      )}

      {disputeEventId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontWeight: 700, color: '#F59E0B' }}>Flag Score Event</span>
              <button onClick={() => setDisputeEventId(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            {disputeDone ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ color: '#cafd00', fontSize: '24px', marginBottom: '8px' }}>✓</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>Dispute submitted</div>
                <button onClick={() => setDisputeEventId(null)} style={{ marginTop: '16px', background: '#F7931A', color: '#000', fontWeight: 700, border: 'none', borderRadius: '7px', padding: '10px 20px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <input placeholder="Your wallet / identifier" value={disputeFrom} onChange={e => setDisputeFrom(e.target.value)} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '7px', padding: '10px 12px', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', marginBottom: '12px', outline: 'none' }}/>
                <textarea placeholder="Reason for dispute..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '7px', padding: '10px 12px', color: '#fff', fontSize: '13px', marginBottom: '16px', outline: 'none', resize: 'none' }}/>
                <button onClick={handleDispute} disabled={!disputeReason || !disputeFrom || disputeLoading} style={{ width: '100%', padding: '12px', background: '#F59E0B', color: '#000', fontWeight: 700, border: 'none', borderRadius: '7px', cursor: 'pointer', opacity: (!disputeReason || !disputeFrom || disputeLoading) ? 0.4 : 1 }}>
                  {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
