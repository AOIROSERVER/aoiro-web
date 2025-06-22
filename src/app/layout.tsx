import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { TrainStatusNotification } from "../components/TrainStatusNotification";
import { AuthProvider } from "../contexts/AuthContext";

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
            <TrainStatusNotification />
            {children}
          </AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
