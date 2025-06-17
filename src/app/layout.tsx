import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { TrainStatusNotification } from "../../../src/components/TrainStatusNotification";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AOIROSERVERアプリ",
  description: "鉄道運行情報アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ClientThemeProvider>
          <Header />
          <TrainStatusNotification />
          {children}
        </ClientThemeProvider>
      </body>
    </html>
  );
}
