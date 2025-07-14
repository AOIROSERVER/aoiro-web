import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";
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
      <body className={inter.className}>
        <ClientThemeProvider>
          <AuthProvider>
            <Header />
            <main>
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
