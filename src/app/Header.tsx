'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Image from 'next/image';

const NAV_ITEMS = [
  { label: '運行情報', path: '/train-status', icon: 'fa-train' },
  { label: '乗換案内', path: '/transfer', icon: 'fa-exchange-alt' },
  { label: '道路状況', path: '/road-status', icon: 'fa-road' },
  { label: 'その他', path: '/more', icon: 'fa-ellipsis-h' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <>
      {/* PC用ヘッダー */}
      <header className="header">
        <div className="header-logo">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image 
              src="/header-icon.png" 
              alt="AOIRO SERVER Icon" 
              width={24} 
              height={24}
              style={{ objectFit: 'contain' }}
            />
            <span>AOIRO SERVER</span>
          </Box>
        </div>
        <nav className="header-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link ${pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon} nav-icon`}></i>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* スマホ用下部ナビゲーション */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`mobile-nav-link ${pathname.startsWith(item.path) ? 'active' : ''}`}
          >
            <i className={`fas ${item.icon} mobile-nav-icon`}></i>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
} 