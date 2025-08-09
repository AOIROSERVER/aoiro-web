'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
}

interface Props {
  timestamp: string;
}

function MinecraftAuthContent({ timestamp }: Props) {
  const [minecraftId, setMinecraftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [authStep, setAuthStep] = useState<'discord' | 'minecraft' | 'completed'>('discord');
  
  const router = useRouter();
  const { user, supabase } = useAuth();

  useEffect(() => {
    // Discord認証状態をチェック
    if (user?.user_metadata?.provider === 'discord') {
      setDiscordUser({
        id: user.user_metadata.provider_id,
        username: user.user_metadata.user_name || user.user_metadata.name,
        discriminator: user.user_metadata.discriminator || '0000',
        global_name: user.user_metadata.full_name,
        avatar: user.user_metadata.avatar_url
      });
      setAuthStep('minecraft');
    }
  }, [user]);

  const handleDiscordAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Starting Discord OAuth for Minecraft auth...');
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${redirectUrl}?next=/minecraft-auth`,
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error('❌ Discord OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Discord OAuth initiated successfully');
      
    } catch (err: any) {
      console.error('❌ Discord auth error:', err);
      setError('Discord認証に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMinecraftAuth = async () => {
    if (!minecraftId.trim()) {
      setError('Minecraft IDを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Starting Minecraft ID verification...');
      
      // Minecraft IDの存在確認
      const verifyResponse = await fetch('/api/verify-minecraft-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minecraftId: minecraftId.trim(),
          discordUserId: discordUser?.id,
          discordUsername: discordUser?.username,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Minecraft ID認証に失敗しました');
      }

      if (!verifyData.exists) {
        setError('指定されたMinecraft IDは存在しません。正確なIDを入力してください。');
        return;
      }

      console.log('✅ Minecraft ID verified successfully');

      // Discord認定メンバーロール付与
      const roleResponse = await fetch('/api/assign-discord-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordUserId: discordUser?.id,
          minecraftId: minecraftId.trim(),
        }),
      });

      const roleData = await roleResponse.json();

      if (!roleResponse.ok) {
        throw new Error(roleData.error || 'Discord ロール付与に失敗しました');
      }

      console.log('✅ Discord role assigned successfully');

      // Googleスプレッドシートに記録
      const sheetResponse = await fetch('/api/record-minecraft-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minecraftId: minecraftId.trim(),
          discordUserId: discordUser?.id,
          discordUsername: discordUser?.username,
          discordGlobalName: discordUser?.global_name,
        }),
      });

      if (sheetResponse.ok) {
        console.log('✅ Record saved to Google Sheets successfully');
      } else {
        console.warn('⚠️ Failed to save to Google Sheets, but auth was successful');
      }

      setSuccess(`認証が完了しました！Minecraft ID「${minecraftId}」がDiscordアカウントに紐付けられ、認定メンバーロールが付与されました。`);
      setAuthStep('completed');

    } catch (err: any) {
      console.error('❌ Minecraft auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (user: DiscordUser) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎮 Minecraft ID認証
          </h1>
          <p className="text-gray-600">
            AOIROSERVERの認定メンバーになろう
          </p>
          <p className="text-xs text-gray-400 mt-2">
            初期化: {new Date(timestamp).toLocaleString('ja-JP')}
          </p>
        </div>

        {authStep === 'discord' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-6">
                まずDiscordアカウントで認証してください
              </p>
              <button
                onClick={handleDiscordAuth}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <i className="fab fa-discord text-xl"></i>
                    <span>Discordで認証</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {authStep === 'minecraft' && discordUser && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <img
                  src={getAvatarUrl(discordUser)}
                  alt="Discord Avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-800">
                    {discordUser.global_name || discordUser.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    @{discordUser.username}#{discordUser.discriminator}
                  </p>
                </div>
              </div>
              <p className="text-green-600 font-medium mb-4">
                ✅ Discord認証完了
              </p>
            </div>

            <div>
              <label htmlFor="minecraftId" className="block text-sm font-medium text-gray-700 mb-2">
                Minecraft ID
              </label>
              <input
                type="text"
                id="minecraftId"
                value={minecraftId}
                onChange={(e) => setMinecraftId(e.target.value)}
                placeholder="あなたのMinecraft IDを入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                正確なMinecraft IDを入力してください
              </p>
            </div>

            <button
              onClick={handleMinecraftAuth}
              disabled={loading || !minecraftId.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <i className="fas fa-check text-xl"></i>
                  <span>認証する</span>
                </>
              )}
            </button>
          </div>
        )}

        {authStep === 'completed' && (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600">
              認証完了！
            </h2>
            <p className="text-gray-700">
              Minecraft IDが正常に認証され、Discordアカウントに紐付けられました。
              認定メンバーロールが付与されました！
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <i className="fas fa-check-circle text-green-400 mt-0.5"></i>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            認証に問題がある場合は、サーバー管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MinecraftAuthClient({ timestamp }: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <MinecraftAuthContent timestamp={timestamp} />
    </Suspense>
  );
}
