'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Typography } from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const stations = [
    '東京', '新宿', '渋谷', '武蔵小杉', '大崎', '大井町', '有楽町', '浜松',
    '御茶ノ水', '秋葉原', '神田', '浅草橋', '三浦南', '古志路', 'みどり公園',
    '浮ヶ谷', '清田川', '夢洲', '秋島町', '虎ノ門',
    // あおうみ線の駅
    '若宮道', 'あおうみ空港', '淡路大路', '美馬島通り', '磯町海岸'
  ];

  const handleSearch = async () => {
    if (!departureStation || !arrivalStation) {
      alert('出発駅と到着駅を選択してください');
      return;
    }

    setIsSearching(true);
    
    // 駅名のマッピング（ローマ字 → 漢字）
    const stationMapping: { [key: string]: string } = {
      'Tokyo': '東京',
      'Shinjuku': '新宿',
      'Shibuya': '渋谷',
      'Musashi-Kosugi': '武蔵小杉',
      'Osaki': '大崎',
      'Ōimachi': '大井町',
      'Yurakucho': '有楽町',
      'Hamamatsu': '浜松町',
      'Ochanomizu': '御茶ノ水',
      'Akigaoka': '秋葉原',
      'Akihabara': '神田',
      'Kareuzaka': '浅草橋',
      'Miura-Minami': '三浦南',
      'Koshiji': '古志路',
      'Midori Park': 'みどり公園',
      'Ukigaya': '浮ヶ谷',
      'Kiyotagawa': '清田川',
      'Yumeshima': '夢洲',
      'Akishimacho': '秋島町',
      'Toranomon': '虎ノ門',
      // あおうみ線の駅
      'Wakamiyado': '若宮道',
      'AoumiAirport': 'あおうみ空港',
      'Awajioji': '淡路大路',
      'Mimajimadori': '美馬島通り',
      'Isomachikaigan': '磯町海岸'
    };

    // 漢字 → ローマ字の逆マッピング
    const reverseStationMapping: { [key: string]: string } = {};
    Object.entries(stationMapping).forEach(([roman, kanji]) => {
      reverseStationMapping[kanji] = roman;
    });
    
    // 実際の路線データを定義
    const lineData = {
      'JS': { 
        name: '湘南新宿ライン', 
        nameEn: 'Shonan-Shinjuku Line',
        color: '#00A0E9',
        stations: ['新宿', '渋谷', '武蔵小杉', '大崎']
      },
      'JO': { 
        name: '横須賀線', 
        nameEn: 'Yokosuka Line',
        color: '#FF6B00',
        stations: ['東京', '有楽町', '浜松']
      },
      'JC': { 
        name: '中央線', 
        nameEn: 'Chuo Line',
        color: '#FF6B00',
        stations: ['御茶ノ水', '秋葉原', '神田', '浅草橋']
      },
      'JB': { 
        name: '総武線', 
        nameEn: 'Sobu Line',
        color: '#FF6B00',
        stations: ['神田', '御茶ノ水', '三浦南', '古志路', 'みどり公園']
      },
      'JA': { 
        name: '埼京線', 
        nameEn: 'Saikyo Line',
        color: '#E60012',
        stations: ['渋谷', '浮ヶ谷', '清田川', '夢洲']
      },
      'CA': { 
        name: '東海道新幹線', 
        nameEn: 'Tokaido Shinkansen',
        color: '#FF6B00',
        stations: ['大崎', '大井町', '東京']
      },
      'HA': { 
        name: 'あきが丘線', 
        nameEn: 'Akigaoka Line',
        color: '#00A0E9',
        stations: ['浅草橋', '神田', '秋葉原', '御茶ノ水']
      },
      'KK': { 
        name: '海蛙線', 
        nameEn: 'Umigaeru Line',
        color: '#28A745',
        stations: ['秋島町', '虎ノ門']
      },
      'AU': { 
        name: 'あおうみ線', 
        nameEn: 'Aoumi Line',
        color: '#15206b',
        stations: ['夢洲', '若宮道', 'あおうみ空港', '淡路大路', '美馬島通り', '磯町海岸']
      }
    };

    // 駅間の距離データ（実際の距離に基づく）
    const stationDistances: { [key: string]: { [key: string]: number } } = {
      // 湘南新宿ライン
      '新宿': { '渋谷': 3, '武蔵小杉': 8, '大崎': 12 },
      '渋谷': { '新宿': 3, '武蔵小杉': 5, '大崎': 9, '浮ヶ谷': 4, '清田川': 8, '夢洲': 12 },
      '武蔵小杉': { '新宿': 8, '渋谷': 5, '大崎': 4 },
      '大崎': { '新宿': 12, '渋谷': 9, '武蔵小杉': 4, '大井町': 3, '東京': 6 },
      
      // 横須賀線
      '東京': { '有楽町': 2, '浜松': 6, '大崎': 6, '大井町': 3 },
      '有楽町': { '東京': 2, '浜松': 4 },
      '浜松町': { '東京': 6, '有楽町': 4 },
      '大井町': { '大崎': 3, '東京': 3 },
      
      // 中央線
      '御茶ノ水': { '秋葉原': 3, '神田': 5, '浅草橋': 8, '三浦南': 4, '古志路': 8, 'みどり公園': 13 },
      '秋葉原': { '御茶ノ水': 3, '神田': 2, '浅草橋': 5 },
      '神田': { '御茶ノ水': 5, '秋葉原': 2, '浅草橋': 3, '三浦南': 6, '古志路': 10, 'みどり公園': 15 },
      '浅草橋': { '御茶ノ水': 8, '秋葉原': 5, '神田': 3 },
      
      // 総武線
      '三浦南': { '神田': 6, '御茶ノ水': 4, '古志路': 4, 'みどり公園': 9 },
      '古志路': { '神田': 10, '御茶ノ水': 8, '三浦南': 4, 'みどり公園': 5 },
      'みどり公園': { '神田': 15, '御茶ノ水': 13, '三浦南': 9, '古志路': 5 },
      
      // 埼京線
      '浮ヶ谷': { '渋谷': 4, '清田川': 4, '夢洲': 8 },
      '清田川': { '渋谷': 8, '浮ヶ谷': 4, '夢洲': 4 },
      '夢洲': { '渋谷': 12, '浮ヶ谷': 8, '清田川': 4, '若宮道': 3 },
      
      // 海蛙線
      '秋島町': { '虎ノ門': 6 },
      '虎ノ門': { '秋島町': 6 },
      
      // あおうみ線
      '若宮道': { '夢洲': 3, 'あおうみ空港': 4 },
      'あおうみ空港': { '若宮道': 4, '淡路大路': 3 },
      '淡路大路': { 'あおうみ空港': 3, '美馬島通り': 3 },
      '美馬島通り': { '淡路大路': 3, '磯町海岸': 3 },
      '磯町海岸': { '美馬島通り': 3 }
    };

    // 経路を生成する関数
    const generateRoutes = (from: string, to: string) => {
      const routes: Route[] = [];
      
      // 直接経路を探す
      for (const [lineCode, lineInfo] of Object.entries(lineData)) {
        if (lineInfo.stations.includes(from) && lineInfo.stations.includes(to)) {
          const distance = stationDistances[from]?.[to] || 5;
          routes.push({
            id: `${lineCode}_direct`,
            departure: from,
            arrival: to,
            duration: `${Math.max(10, distance * 2)}分`,
            transfers: 0,
            fare: Math.max(140, distance * 20),
            lines: [lineInfo.name]
          });
        }
      }

      // 乗換経路を探す
      for (const [lineCode1, lineInfo1] of Object.entries(lineData)) {
        if (lineInfo1.stations.includes(from)) {
          for (const [lineCode2, lineInfo2] of Object.entries(lineData)) {
            if (lineCode1 !== lineCode2 && lineInfo2.stations.includes(to)) {
              // 共通駅を探す
              const commonStations = lineInfo1.stations.filter(station => 
                lineInfo2.stations.includes(station)
              );
              
              if (commonStations.length > 0) {
                const transferStation = commonStations[0];
                const distance1 = stationDistances[from]?.[transferStation] || 3;
                const distance2 = stationDistances[transferStation]?.[to] || 3;
                const totalDistance = distance1 + distance2;
                
                routes.push({
                  id: `${lineCode1}_${lineCode2}_transfer`,
                  departure: from,
                  arrival: to,
                  duration: `${Math.max(20, totalDistance * 2.5)}分`,
                  transfers: 1,
                  fare: Math.max(200, totalDistance * 25),
                  lines: [lineInfo1.name, lineInfo2.name]
                });
              }
            }
          }
        }
      }

      // 複数乗換経路（3路線以上）
      if (routes.length === 0 || Math.random() > 0.6) {
        const allStations = new Set();
        Object.values(lineData).forEach(line => {
          line.stations.forEach(station => allStations.add(station));
        });
        
        const availableStations = Array.from(allStations);
        const intermediateStations = availableStations.filter(station => 
          station !== from && station !== to
        ).slice(0, 2);
        
        if (intermediateStations.length > 0) {
          const totalDistance = 15; // 概算距離
          routes.push({
            id: 'multi_transfer',
            departure: from,
            arrival: to,
            duration: `${Math.max(35, totalDistance * 3)}分`,
            transfers: 2,
            fare: Math.max(280, totalDistance * 30),
            lines: ['湘南新宿ライン', '中央線', '総武線']
          });
        }
      }

      // 結果を時間順にソート
      return routes.sort((a, b) => {
        const timeA = parseInt(a.duration.replace('分', ''));
        const timeB = parseInt(b.duration.replace('分', ''));
        return timeA - timeB;
      }).slice(0, 3); // 上位3件のみ返す
    };

    setTimeout(() => {
      const mockResults = generateRoutes(departureStation, arrivalStation);
      
      if (mockResults.length === 0) {
        // 経路が見つからない場合のフォールバック
        mockResults.push({
          id: 'fallback',
          departure: departureStation,
          arrival: arrivalStation,
          duration: '45分',
          transfers: 2,
          fare: 300,
          lines: ['湘南新宿ライン', '中央線', '総武線']
        });
      }
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const swapStations = () => {
    setDepartureStation(arrivalStation);
    setArrivalStation(departureStation);
  };

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box className="page-header">
        <Box className="page-title">
          <SwapHoriz className="page-title-icon" />
          <Typography className="page-title-text">乗換案内</Typography>
        </Box>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 2, maxWidth: '800px', margin: '0 auto' }}>
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
                fontSize: '14px',
                alignSelf: 'flex-end',
                marginBottom: '0px',
                height: '44px'
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
      </Box>
    </Box>
  );
} 