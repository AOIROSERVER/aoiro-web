'use client';

import { useState } from 'react';

export default function TestXboxVerification() {
  const [xboxId, setXboxId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!xboxId.trim()) {
      setError('Xbox IDを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/verify-xbox-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xboxId: xboxId.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || '検証中にエラーが発生しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Xbox ID 存在確認テスト
          </h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="xboxId" className="block text-sm font-medium text-gray-700 mb-2">
                Xbox ID (Gamertag)
              </label>
              <input
                type="text"
                id="xboxId"
                value={xboxId}
                onChange={(e) => setXboxId(e.target.value)}
                placeholder="例: Ninja, Shroud"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || !xboxId.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '検証中...' : 'Xbox IDを検証'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-2">検証結果:</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">存在:</span>{' '}
                    <span className={result.exists ? 'text-green-600' : 'text-red-600'}>
                      {result.exists ? '存在する' : '存在しない'}
                    </span>
                  </p>
                  
                  {result.message && (
                    <p className="text-sm">
                      <span className="font-medium">メッセージ:</span> {result.message}
                    </p>
                  )}
                  
                  {result.xuid && (
                    <p className="text-sm">
                      <span className="font-medium">XUID:</span> {result.xuid}
                    </p>
                  )}
                  
                  {result.gamertag && (
                    <p className="text-sm">
                      <span className="font-medium">Gamertag:</span> {result.gamertag}
                    </p>
                  )}
                  
                  {result.correctName && (
                    <p className="text-sm">
                      <span className="font-medium">正確な名前:</span> {result.correctName}
                    </p>
                  )}
                  
                  {result.fallback && (
                    <p className="text-sm text-yellow-600">
                      ⚠️ フォールバック検証が使用されました
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">使用方法:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Xbox ID（Gamertag）を入力してください</li>
              <li>• OpenXBL APIを使用して存在確認を行います</li>
              <li>• 存在する場合はXUIDとGamertagが表示されます</li>
              <li>• 大文字小文字の違いがある場合は正確な名前が表示されます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
