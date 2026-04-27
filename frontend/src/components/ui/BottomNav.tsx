'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { href: '/',          label: 'Home',      icon: '◈' },
  { href: '/register',  label: 'Register',  icon: '⊕' },
  { href: '/dashboard', label: 'Score',     icon: '◉' },
  { href: '/audit',     label: 'Audit',     icon: '◎' },
  { href: '/disputes',  label: 'Disputes',  icon: '⚑' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                active ? 'text-btc' : 'text-gray-400'
              )}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

