import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Shell } from '@/components/ui/Shell';

export const metadata: Metadata = {
  title: 'KYA Signal · Know Your Agent',
  description: 'Bitcoin-anchored cross-chain agent reputation. Portable. Permissionless. Verified.',
  openGraph: {
    title: 'KYA Signal',
    description: 'Cross-chain agent reputation settled on Bitcoin.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
