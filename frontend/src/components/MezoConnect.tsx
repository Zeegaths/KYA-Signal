'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function MezoConnect({ onConnect }: { onConnect?: (address: string) => void }) {
  const { address, isConnected } = useAccount();

  if (isConnected && address && onConnect) {
    onConnect(address);
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#aaa', letterSpacing: '0.12em', marginBottom: '10px' }}>
        MEZO WALLET (OPTIONAL)
      </div>
      <ConnectButton label='Connect Mezo Wallet' />
      {isConnected && address && (
        <div style={{ marginTop: '8px', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#cafd00' }}>
          Connected: {address.slice(0,8)}...{address.slice(-6)}
        </div>
      )}
    </div>
  );
}