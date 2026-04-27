'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/ui/BottomNav';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      {/* Desktop: sidebar */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 max-w-5xl">
          {children}
        </main>
      </div>

      {/* Mobile: bottom nav */}
      <div className="md:hidden min-h-screen pb-20">
        <main className="p-4">{children}</main>
        <BottomNav />
      </div>
    </>
  );
}