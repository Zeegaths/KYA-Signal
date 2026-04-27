'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/',           label: 'Home',       icon: '◈' },
  { href: '/register',   label: 'Register',   icon: '⊕' },
  { href: '/dashboard',  label: 'Dashboard',  icon: '◉' },
  { href: '/audit',      label: 'Audit Trail', icon: '◎' },
  { href: '/disputes',   label: 'Disputes',   icon: '⚑' },
  { href: '/configs',    label: 'Config Versions', icon: '≡' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-btc font-bold text-xl tracking-tight">KYA</span>
          <span className="text-acid font-bold text-xl tracking-tight">Signal</span>
        </div>
        <p className="text-gray-400 text-xs mt-1 font-mono">Know Your Agent</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-btc/10 text-btc border border-btc/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* BTC anchor indicator */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
          <span className="text-xs text-gray-400 font-mono">Bitcoin anchored</span>
        </div>
      </div>
    </aside>
  );
}

