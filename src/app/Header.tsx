'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '運行情報', path: '/train-status' },
  { label: '乗換案内', path: '/transfer' },
  { label: '道路状況', path: '/road-status' },
  { label: 'その他', path: '/more' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 32px', height: 56
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 20, color: '#222', letterSpacing: 1 }}>AOIRO SERVER</div>
      <nav style={{ display: 'flex', gap: 24 }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            href={item.path}
            style={{
              color: pathname.startsWith(item.path) ? '#1976d2' : '#222',
              fontWeight: pathname.startsWith(item.path) ? 'bold' : 'normal',
              fontSize: 16,
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 4,
              borderBottom: pathname.startsWith(item.path) ? '2px solid #1976d2' : 'none',
              background: pathname.startsWith(item.path) ? '#f0f6ff' : 'transparent',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
} 