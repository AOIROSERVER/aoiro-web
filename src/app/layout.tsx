import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./Header";
import ClientThemeProvider from "./ClientThemeProvider";
import { TrainStatusNotification } from "../components/TrainStatusNotification";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AOIROSERVERアプリ",
  description: "鉄道運行情報アプリ",
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ja">
      <head>
        {/* ▼▼▼ ここにPushCodeのタグを追加してください ▼▼▼ */}
        <script defer src="https://www.pushcode.jp/dist/js/pushcode.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.PushCodeInit = function() {
                try {
                  if (PushCode && PushCode.isSupport()) {
                    PushCode.init({ domainToken: '65ba62e97ac215bc99708b3ba72f80b8384cf3fb8fa5a647c6c9b490fce21fe6', userid: '' });
                    PushCode.components.openSubscribeDialog();
                  }
                }
                catch (err) {
                  console.error(err);
                  if (PushCode) {
                    PushCode.sendError(err);
                  }
                }
              };
            `
          }}
        />
        {/* ▲▲▲ ここにPushCodeのタグを追加してください ▲▲▲ */}
      </head>
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
