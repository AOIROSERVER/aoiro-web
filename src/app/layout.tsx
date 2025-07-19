import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { ServerStatusProvider } from "../contexts/ServerStatusContext";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AOIROSERVERアプリ",
  description: "鉄道運行情報アプリ",
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
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
