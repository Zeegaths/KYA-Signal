'use client';
import { getConfig, matsnetTestnetChain } from '@mezo-org/passport';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();
const config = getConfig({ appName: 'KYA Signal' });

export function PassportProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={matsnetTestnetChain}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}