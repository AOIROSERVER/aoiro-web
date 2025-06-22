'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Route {
  id: string;
  departure: string;
  arrival: string;
  duration: string;
  transfers: number;
  fare: number;
  lines: string[];
}

export default function TransferPage() {
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const stations = [
    '東京', '新宿', '渋谷', '池袋', '品川', '上野', '秋葉原', '新橋', '浜松町', '田町',
    '恵比寿', '目黒', '五反田', '大崎', '西新宿', '中野', '高田馬場', '目白', '巣鴨', '駒込',
    '大塚', '巣鴨', '駒込', '田端', '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原',
    '神田', '東京', '有楽町', '新橋', '浜松町', '田町', '品川', '大井町', '大森', '蒲田',
    '川崎', '横浜', '保土ケ谷', '東戸塚', '戸塚', '大船', '北鎌倉', '鎌倉', '由比ヶ浜', '稲村ヶ崎',
    '極楽寺', '長谷', '江ノ島', '鵠沼', '藤沢', '辻堂', '茅ケ崎', '北茅ケ崎', '香川', '平塚'
  ];

  const handleSearch = async () => {
    if (!departureStation || !arrivalStation) {
      alert('出発駅と到着駅を選択してください');
      return;
    }

    setIsSearching(true);
    
    // 模擬的な検索結果（実際のAPIに置き換える）
    setTimeout(() => {
      const mockResults: Route[] = [
        {
          id: '1',
          departure: departureStation,
          arrival: arrivalStation,
          duration: '25分',
          transfers: 1,
          fare: 280,
          lines: ['JR山手線', 'JR中央線']
        },
        {
          id: '2',
          departure: departureStation,
          arrival: arrivalStation,
          duration: '32分',
          transfers: 0,
          fare: 320,
          lines: ['JR山手線']
        },
        {
          id: '3',
          departure: departureStation,
          arrival: arrivalStation,
          duration: '28分',
          transfers: 2,
          fare: 260,
          lines: ['JR山手線', '東京メトロ丸ノ内線', 'JR中央線']
        }
      ];
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const swapStations = () => {
    setDepartureStation(arrivalStation);
    setArrivalStation(departureStation);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', color: '#222' }}>
        乗換案内
      </h1>

      {/* 検索フォーム */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '32px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              出発駅
            </label>
            <select
              value={departureStation}
              onChange={(e) => setDepartureStation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                background: '#fff'
              }}
            >
              <option value="">駅を選択</option>
              {stations.map(station => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapStations}
            style={{
              padding: '8px 12px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⇄
          </button>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              到着駅
            </label>
            <select
              value={arrivalStation}
              onChange={(e) => setArrivalStation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                background: '#fff'
              }}
            >
              <option value="">駅を選択</option>
              {stations.map(station => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching || !departureStation || !arrivalStation}
          style={{
            width: '100%',
            padding: '16px',
            background: isSearching || !departureStation || !arrivalStation ? '#adb5bd' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSearching || !departureStation || !arrivalStation ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {isSearching ? '検索中...' : '経路検索'}
        </button>
      </div>

      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#222' }}>
            検索結果
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {searchResults.map((route, index) => (
              <div
                key={route.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: index === 0 ? '#28a745' : '#6c757d',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index === 0 ? '推奨' : `${index + 1}番目`}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#222' }}>
                      {route.duration}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                      ¥{route.fare}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      乗換{route.transfers}回
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                    経路
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {route.lines.map((line, lineIndex) => (
                      <span
                        key={lineIndex}
                        style={{
                          background: '#e9ecef',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    詳細を見る
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    地図で見る
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 履歴・お気に入り */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#222' }}>
          よく使う経路
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#222', marginBottom: '4px' }}>
              東京 → 新宿
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              JR山手線 約15分
            </div>
          </div>
          <div style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#222', marginBottom: '4px' }}>
              渋谷 → 池袋
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              東京メトロ副都心線 約20分
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 