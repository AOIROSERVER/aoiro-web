import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { ServerStatusProvider } from "../contexts/ServerStatusContext";
import dynamic from "next/dynamic";
import { registerServiceWorker } from "./sw-register";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AOIROSERVERアプリ",
  description: "鉄道運行状況と道路状況を確認できるアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AOIROSERVERアプリ",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "AOIROSERVERアプリ",
    "mobile-web-app-capable": "yes",
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({ children }: { children: any }) {
  // Service Workerを登録
  if (typeof window !== 'undefined') {
    registerServiceWorker();
  }

  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/header-icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/header-icon.png" />
        <link rel="mask-icon" href="/header-icon.png" color="#ffffff" />
      </head>
      <body className={inter.className}>
        <ClientThemeProvider>
          <AuthProvider>
            <ServerStatusProvider>
              <Header />
              <main>
                {children}
              </main>
              <Footer />
            </ServerStatusProvider>
          </AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
