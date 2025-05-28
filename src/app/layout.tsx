import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import Header from './Header';

const inter = Inter({ subsets: ["latin"] });

const NAV_ITEMS = [
  { label: '運行情報', path: '/train-status' },
  { label: '乗換案内', path: '/transfer' },
  { label: '道路状況', path: '/road-status' },
  { label: 'その他', path: '/more' },
];

export const metadata: Metadata = {
  title: "AOIRO SERVER",
  description: "AOIRO SERVER Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
