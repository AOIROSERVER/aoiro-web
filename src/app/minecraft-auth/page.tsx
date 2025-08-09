// Minecraft認証ページ - サーバーコンポーネント版
// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MinecraftAuthClient from './client-component';

export default async function MinecraftAuthPage() {
  // サーバーサイドでの初期化処理
  const timestamp = new Date().toISOString();
  
  return (
    <div>
      <MinecraftAuthClient timestamp={timestamp} />
    </div>
  );
}