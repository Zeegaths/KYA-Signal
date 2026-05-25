'use client';
import { useState } from 'react';

type Chain = 'ethereum' | 'solana';

export function WalletConnect({ onConnect }: { 
  onConnect: (address: string, chain: Chain) => void 
}) {
  const [connecting, setConnecting] = useState<Chain | null>(null);
  const [connected, setConnected] = useState<{ address: string; chain: Chain } | null>(null);
  const [error, setError] = useState('');

  const connectEVM = async () => {
    setConnecting('ethereum');
    setError('');
    try {
      const eth = (window as any).ethereum;
      if (!eth) { setError('MetaMask not found.'); return; }
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setConnected({ address, chain: 'ethereum' });
      onConnect(address, 'ethereum');
    } catch (err: any) {
      setError(err.message ?? 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const connectSolana = async () => {
    setConnecting('solana');
    setError('');
    try {
      const sol = (window as any).solana ?? (window as any).phantom?.solana;
      if (!sol) { setError('Phantom wallet not found.'); return; }
      const resp = await sol.connect();
      const address = resp.publicKey.toString();
      setConnected({ address, chain: 'solana' });
      onConnect(address, 'solana');
    } catch (err: any) {
      setError(err.message ?? 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#aaa', letterSpacing: '0.12em', marginBottom: '10px' }}>
        CONNECT WALLET
      </div>
      {connected ? (
        <div style={{ background: 'rgba(202,253,0,0.08)', border: '1px solid rgba(202,253,0,0.2)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cafd00', display: 'inline-block' }}/>
          <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#cafd00' }}>
            {connected.chain === 'solana' ? 'Phantom' : 'MetaMask'} · {connected.address.slice(0,8)}...{connected.address.slice(-6)}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={connectEVM}
            disabled={connecting !== null}
            style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', opacity: connecting ? 0.5 : 1 }}
          >
            {connecting === 'ethereum' ? 'Connecting...' : 'MetaMask'}
          </button>
          <button
            onClick={connectSolana}
            disabled={connecting !== null}
            style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', opacity: connecting ? 0.5 : 1 }}
          >
            {connecting === 'solana' ? 'Connecting...' : 'Phantom'}
          </button>
        </div>
      )}
      {error && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>
      )}
      <div style={{ marginTop: '6px', fontSize: '9px', color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
        Auto-fills your source chain key on connection.
      </div>
    </div>
  );
}