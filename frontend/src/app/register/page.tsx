'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type Step = 'form' | 'preview' | 'success';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    sourceChainKey: '',
    sourceChain: 'solana' as 'solana' | 'ethereum' | 'stacks',
    stacksKey: '',
    email: '',
  });
  const [result, setResult] = useState<{ geid: string; registeredAtBlock: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chainLabel: Record<string, string> = {
    solana: 'SOLANA PUBLIC KEY',
    ethereum: 'ETHEREUM ADDRESS',
    stacks: 'STACKS PRINCIPAL',
  };
  const chainPlaceholder: Record<string, string> = {
    solana: 'Base58 pubkey...',
    ethereum: '0x...',
    stacks: 'SP...',
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const emailHash = form.email ? btoa(form.email.toLowerCase().trim()) : undefined;
      const res = await api.register({
        sourceChainKey: form.sourceChainKey,
        sourceChain: form.sourceChain,
        stacksKey: form.stacksKey,
        emailHash,
      });
      setResult(res);
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');

        /* center the whole page within the sidebar layout */
        .rp-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: calc(100vh - 64px);
          padding: 48px 24px;
        }
        .rp {
          width: 100%;
          max-width: 520px;
          font-family: 'Space Grotesk', sans-serif;
        }

        /* header */
        .rp-header { margin-bottom: 36px; padding-bottom: 28px; border-bottom: 1px solid #1f1f1f; }
        .rp-title { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.8px; margin-bottom: 10px; }
        .rp-subtitle { font-size: 14px; color: #888; line-height: 1.7; }

        /* step indicator */
        .rp-steps-ind { display: flex; gap: 6px; align-items: center; margin-bottom: 32px; }
        .rp-step-dot { width: 6px; height: 6px; border-radius: 50%; background: #1f1f1f; transition: background .2s; }
        .rp-step-dot.active { background: #F7931A; }
        .rp-step-dot.done { background: #cafd00; }
        .rp-step-line { flex: 1; height: 1px; background: #1a1a1a; }

        /* field */
        .rp-field { margin-bottom: 28px; }
        .rp-label {
          display: block;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #aaa;
          letter-spacing: 0.12em;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .rp-input {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #fff;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          display: block;
        }
        .rp-input::placeholder { color: #333; }
        .rp-input:focus { border-color: rgba(247,147,26,0.5); background: #141414; }
        .rp-hint { font-size: 12px; color: #555; margin-top: 8px; line-height: 1.6; }

        /* chain selector */
        .rp-chains { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .rp-chain {
          padding: 12px 0;
          border-radius: 8px;
          border: 1px solid #1f1f1f;
          background: #0f0f0f;
          color: #666;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
          font-family: 'Space Grotesk', sans-serif;
        }
        .rp-chain:hover { border-color: #333; color: #bbb; background: #141414; }
        .rp-chain.active { background: rgba(247,147,26,0.1); border-color: rgba(247,147,26,0.45); color: #F7931A; }

        /* divider */
        .rp-divider { border: none; border-top: 1px solid #1a1a1a; margin: 8px 0 28px; }

        /* preview card */
        .rp-preview {
          background: #0f0f0f;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .rp-preview-header { padding: 14px 18px; border-bottom: 1px solid #1a1a1a; }
        .rp-preview-header-label { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #555; letter-spacing: 0.14em; }
        .rp-preview-row { padding: 14px 18px; border-bottom: 1px solid #141414; display: flex; flex-direction: column; gap: 5px; }
        .rp-preview-row:last-child { border-bottom: none; }
        .rp-preview-key { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #555; letter-spacing: 0.1em; }
        .rp-preview-val { font-size: 13px; color: #ddd; font-family: 'JetBrains Mono', monospace; word-break: break-all; line-height: 1.5; }

        /* buttons */
        .rp-btn-row { display: flex; gap: 10px; }
        .rp-btn-primary {
          flex: 1;
          padding: 14px;
          background: #F7931A;
          color: #000;
          font-weight: 700;
          font-size: 13px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Space Grotesk', sans-serif;
          transition: opacity 0.15s;
          letter-spacing: 0.02em;
        }
        .rp-btn-primary:hover { opacity: 0.88; }
        .rp-btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
        .rp-btn-secondary {
          flex: 1;
          padding: 14px;
          background: transparent;
          color: #888;
          font-weight: 500;
          font-size: 13px;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.15s;
        }
        .rp-btn-secondary:hover { border-color: #333; color: #fff; }

        /* error */
        .rp-error {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12px;
          color: #f87171;
          margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.6;
        }

        /* success */
        .rp-success { display: flex; flex-direction: column; gap: 24px; }
        .rp-success-top { display: flex; align-items: center; gap: 16px; }
        .rp-check {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(202,253,0,0.08);
          border: 1px solid rgba(202,253,0,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #cafd00; flex-shrink: 0;
        }
        .rp-success-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .rp-success-sub { font-size: 13px; color: #666; }
        .rp-geid-card {
          background: #0f0f0f;
          border: 1px solid rgba(202,253,0,0.15);
          border-radius: 10px;
          padding: 20px 22px;
        }
        .rp-geid-label { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #555; letter-spacing: 0.12em; margin-bottom: 12px; }
        .rp-geid-val { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #cafd00; word-break: break-all; line-height: 1.75; }
        .rp-btc-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 16px; padding-top: 16px; border-top: 1px solid #1a1a1a;
        }
        .rp-btc-label { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #444; letter-spacing: 0.1em; }
        .rp-btc-val { font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #F7931A; font-weight: 500; }
        .rp-note {
          font-size: 12px; color: #444; line-height: 1.75;
          font-family: 'JetBrains Mono', monospace;
          background: #0d0d0d; border: 1px solid #1a1a1a;
          border-radius: 8px; padding: 14px 16px;
        }
        .rp-note code { color: #666; }
      `}</style>

      <div className="rp-wrap">
        <div className="rp">

          {/* HEADER */}
          <div className="rp-header">
            <div className="rp-title">Register Agent</div>
            <div className="rp-subtitle">
              One-time registration. Your GEID is derived deterministically from your keys — no database lookup needed to verify it.
            </div>
          </div>

          {/* STEP INDICATOR */}
          <div className="rp-steps-ind">
            <div className={`rp-step-dot ${step === 'form' ? 'active' : step === 'preview' || step === 'success' ? 'done' : ''}`} />
            <div className="rp-step-line" />
            <div className={`rp-step-dot ${step === 'preview' ? 'active' : step === 'success' ? 'done' : ''}`} />
            <div className="rp-step-line" />
            <div className={`rp-step-dot ${step === 'success' ? 'active' : ''}`} />
          </div>

          {/* FORM */}
          {step === 'form' && (
            <div>
              <div className="rp-field">
                <label className="rp-label">SOURCE CHAIN</label>
                <div className="rp-chains">
                  {(['solana', 'ethereum', 'stacks'] as const).map(chain => (
                    <button
                      key={chain}
                      className={`rp-chain ${form.sourceChain === chain ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, sourceChain: chain }))}
                    >
                      {chain.charAt(0).toUpperCase() + chain.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label">{chainLabel[form.sourceChain]}</label>
                <input
                  className="rp-input"
                  placeholder={chainPlaceholder[form.sourceChain]}
                  value={form.sourceChainKey}
                  onChange={e => setForm(f => ({ ...f, sourceChainKey: e.target.value }))}
                />
              </div>

              <hr className="rp-divider" />

              <div className="rp-field">
                <label className="rp-label">STACKS PRINCIPAL</label>
                <input
                  className="rp-input"
                  placeholder="SP..."
                  value={form.stacksKey}
                  onChange={e => setForm(f => ({ ...f, stacksKey: e.target.value }))}
                />
                <div className="rp-hint">This key signs score submissions and owns your on-chain GEID.</div>
              </div>

              <div className="rp-field">
                <label className="rp-label">EMAIL FOR ALERTS &nbsp;<span style={{ color:'#2a2a2a' }}>OPTIONAL</span></label>
                <input
                  className="rp-input"
                  type="email"
                  placeholder="agent@protocol.xyz"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <div className="rp-hint">Score threshold alerts and dispute notifications. Hashed before storage.</div>
              </div>

              {error && <div className="rp-error">{error}</div>}

              <button
                className="rp-btn-primary"
                style={{ width: '100%' }}
                disabled={!form.sourceChainKey || !form.stacksKey}
                onClick={() => setStep('preview')}
              >
                Preview Registration →
              </button>
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && (
            <div>
              <div className="rp-preview">
                <div className="rp-preview-header">
                  <div className="rp-preview-header-label">CONFIRM DETAILS</div>
                </div>
                {[
                  { k: 'SOURCE CHAIN',      v: form.sourceChain },
                  { k: 'SOURCE CHAIN KEY',  v: form.sourceChainKey },
                  { k: 'STACKS PRINCIPAL',  v: form.stacksKey },
                  { k: 'ALERTS',            v: form.email || '—' },
                ].map(row => (
                  <div key={row.k} className="rp-preview-row">
                    <div className="rp-preview-key">{row.k}</div>
                    <div className="rp-preview-val">{row.v}</div>
                  </div>
                ))}
              </div>

              {error && <div className="rp-error">{error}</div>}

              <div className="rp-btn-row">
                <button className="rp-btn-secondary" onClick={() => setStep('form')}>← Edit</button>
                <button className="rp-btn-primary" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Registering...' : 'Confirm & Register'}
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && result && (
            <div className="rp-success">
              <div className="rp-success-top">
                <div className="rp-check">✓</div>
                <div>
                  <div className="rp-success-title">Agent Registered</div>
                  <div className="rp-success-sub">Your GEID has been minted and anchored on-chain.</div>
                </div>
              </div>
              <div className="rp-geid-card">
                <div className="rp-geid-label">GLOBAL ENTITY ID</div>
                <div className="rp-geid-val">{result.geid}</div>
                <div className="rp-btc-row">
                  <div className="rp-btc-label">ANCHORED AT BTC BLOCK</div>
                  <div className="rp-btc-val">#{result.registeredAtBlock.toLocaleString()}</div>
                </div>
              </div>
              <div className="rp-note">
                Your GEID is derived as <code>sha256(sourceChainKey:stacksKey)</code> — any verifier can reproduce it independently without querying this database.
              </div>
              <button
                className="rp-btn-primary"
                onClick={() => window.location.href = `/dashboard?geid=${result.geid}`}
              >
                View Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}