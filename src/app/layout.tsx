import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Link from 'next/link';
import Header from './Header';

const inter = Inter({ subsets: ["latin"] });

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

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
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Header />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
