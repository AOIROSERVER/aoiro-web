"use client";
import React from "react";
import { Box, Typography, Card, Modal, Paper, LinearProgress, IconButton } from "@mui/material";
import TrainIcon from "@mui/icons-material/Train";
import CloseIcon from '@mui/icons-material/Close';
import { ArrowBack } from "@mui/icons-material";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import './train-icon-anim.css';

// 路線ごとの駅データを定義（主要駅一覧に合わせる）
const LINE_STATIONS: Record<string, Array<{ name: string; code: string }>> = {
  // 山手線（内回り）
  JY1: [
    { name: '東京', code: 'JY01' },
    { name: '秋葉原', code: 'JY02' },
    { name: '高輪ゲートウェイ', code: 'JY03' },
    { name: '新宿', code: 'JY04' },
    { name: '渋谷', code: 'JY05' },
    { name: '大崎', code: 'JY06' },
    { name: '浜松', code: 'JY07' },
    { name: '有楽町', code: 'JY08' }
  ],
  // 山手線（外回り）
  JY2: [
    { name: '東京', code: 'JY01' },
    { name: '有楽町', code: 'JY02' },
    { name: '浜松', code: 'JY03' },
    { name: '大崎', code: 'JY04' },
    { name: '渋谷', code: 'JY05' },
    { name: '新宿', code: 'JY06' },
    { name: '高輪ゲートウェイ', code: 'JY07' },
    { name: '秋葉原', code: 'JY08' }
  ],
  // 京浜東北線
  JK: [
    { name: '大井町', code: 'JK01' },
    { name: '浜松', code: 'JK02' },
    { name: '有楽町', code: 'JK03' },
    { name: '東京', code: 'JK04' },
    { name: '秋葉原', code: 'JK05' },
    { name: '上野', code: 'JK06' }
  ],
  // 東海道新幹線
  CA: [
    { name: '武蔵小杉', code: 'CA01' },
    { name: '浜松', code: 'CA02' },
    { name: '東京', code: 'CA03' },
    { name: '上野', code: 'CA04' }
  ],
  // 総武線
  JB: [
    { name: '秋葉原', code: 'JB01' },
    { name: '御茶ノ水', code: 'JB02' },
    { name: '新宿', code: 'JB03' }
  ],
  // 中央線
  JC: [
    { name: '東京', code: 'JC01' },
    { name: '御茶ノ水', code: 'JC02' },
    { name: '新宿', code: 'JC03' }
  ],
  // 丸の内線
  M: [
    { name: '池袋', code: 'M01' },
    { name: '新大塚', code: 'M02' },
    { name: '茗荷谷', code: 'M03' },
    { name: '後楽園', code: 'M04' },
    { name: '本郷三丁目', code: 'M05' },
    { name: '御茶ノ水', code: 'M06' },
    { name: '淡路町', code: 'M07' },
    { name: '大手町', code: 'M08' },
    { name: '東京', code: 'M09' },
    { name: '銀座', code: 'M10' },
    { name: '霞ヶ関', code: 'M11' },
    { name: '国会議事堂前', code: 'M12' },
    { name: '赤坂見附', code: 'M13' },
    { name: '四谷三丁目', code: 'M14' },
    { name: '新宿御苑前', code: 'M15' },
    { name: '新宿三丁目', code: 'M16' },
    { name: '新宿', code: 'M17' },
    { name: '西新宿', code: 'M18' },
    { name: '中野坂上', code: 'M19' },
    { name: '新中野', code: 'M20' },
    { name: '東高円寺', code: 'M21' },
    { name: '新高円寺', code: 'M22' },
    { name: '南阿佐ヶ谷', code: 'M23' },
    { name: '荻窪', code: 'M24' }
  ],
  // 日比谷線
  H: [
    { name: '北千住', code: 'H01' },
    { name: '南千住', code: 'H02' },
    { name: '三ノ輪', code: 'H03' },
    { name: '入谷', code: 'H04' },
    { name: '上野', code: 'H05' },
    { name: '秋葉原', code: 'H06' },
    { name: '小伝馬町', code: 'H07' },
    { name: '人形町', code: 'H08' },
    { name: '茅場町', code: 'H09' },
    { name: '八丁堀', code: 'H10' },
    { name: '築地', code: 'H11' },
    { name: '東銀座', code: 'H12' },
    { name: '銀座', code: 'H13' },
    { name: '日比谷', code: 'H14' },
    { name: '有楽町', code: 'H15' },
    { name: '霞ヶ関', code: 'H16' },
    { name: '神谷町', code: 'H17' },
    { name: '六本木', code: 'H18' },
    { name: '広尾', code: 'H19' },
    { name: '恵比寿', code: 'H20' },
    { name: '中目黒', code: 'H21' }
  ],
  // 銀座線
  G: [
    { name: '浅草', code: 'G01' },
    { name: '田原町', code: 'G02' },
    { name: '稲荷町', code: 'G03' },
    { name: '上野', code: 'G04' },
    { name: '上野広小路', code: 'G05' },
    { name: '末広町', code: 'G06' },
    { name: '神田', code: 'G07' },
    { name: '三越前', code: 'G08' },
    { name: '日本橋', code: 'G09' },
    { name: '京橋', code: 'G10' },
    { name: '銀座', code: 'G11' },
    { name: '新橋', code: 'G12' },
    { name: '虎ノ門', code: 'G13' },
    { name: '溜池山王', code: 'G14' },
    { name: '赤坂見附', code: 'G15' },
    { name: '青山一丁目', code: 'G16' },
    { name: '外苑前', code: 'G17' },
    { name: '表参道', code: 'G18' },
    { name: '渋谷', code: 'G19' }
  ],
  // 東海道線
  JT: [
    { name: '浜松', code: 'JT01' },
    { name: '品川', code: 'JT02' },
    { name: '大井町', code: 'JT03' },
    { name: '大崎', code: 'JT04' },
    { name: '西大井', code: 'JT05' },
    { name: '武蔵小杉', code: 'JT06' }
  ],
  // 横須賀線
  JO: [
    { name: '大船', code: 'JO01' },
    { name: '北鎌倉', code: 'JO02' },
    { name: '鎌倉', code: 'JO03' },
    { name: '由比ヶ浜', code: 'JO04' },
    { name: '稲村ヶ崎', code: 'JO05' },
    { name: '極楽寺', code: 'JO06' },
    { name: '長谷', code: 'JO07' },
    { name: '江ノ島', code: 'JO08' },
    { name: '鵠沼', code: 'JO09' },
    { name: '藤沢', code: 'JO10' },
    { name: '辻堂', code: 'JO11' },
    { name: '茅ケ崎', code: 'JO12' },
    { name: '北茅ケ崎', code: 'JO13' },
    { name: '香川', code: 'JO14' },
    { name: '平塚', code: 'JO15' },
    { name: '大磯', code: 'JO16' },
    { name: '二宮', code: 'JO17' },
    { name: '国府津', code: 'JO18' },
    { name: '小田原', code: 'JO19' },
    { name: '早川', code: 'JO20' },
    { name: '根府川', code: 'JO21' },
    { name: '真鶴', code: 'JO22' },
    { name: '湯河原', code: 'JO23' },
    { name: '熱海', code: 'JO24' }
  ],
  // あきが丘線
  AK: [
    { name: '浜松', code: 'AK01' },
    { name: '大出碧大前', code: 'AK02' },
    { name: 'あきが丘', code: 'AK03' },
    { name: '丹津南', code: 'AK04' },
    { name: '片見', code: 'AK05' },
    { name: '舞洲', code: 'AK06' }
  ],
  // あおうみ線
  AU: [
    { name: '舞洲', code: 'AU01' },
    { name: '若宮道', code: 'AU02' },
    { name: 'あおうみ空港', code: 'AU03' },
    { name: '淡路大路', code: 'AU04' },
    { name: '美馬島通り', code: 'AU05' },
    { name: '磯町海岸', code: 'AU06' }
  ],
  // 千代田線
  C: [
    { name: '浜松', code: 'C01' },
    { name: '霞が関', code: 'C02' },
    { name: '国会議事堂', code: 'C03' },
    { name: '日比谷', code: 'C04' },
    { name: '二重橋前', code: 'C05' },
    { name: '大手町', code: 'C06' },
    { name: '千駄木', code: 'C07' },
    { name: '新御茶ノ水', code: 'C08' },
    { name: '西日暮里', code: 'C09' },
    { name: '北千住', code: 'C10' },
    { name: '金町', code: 'C11' },
    { name: '綾瀬', code: 'C12' },
    { name: '北綾瀬', code: 'C13' }
  ],
  // 半蔵門線
  Z: [
    { name: '浜松', code: 'Z01' },
    { name: '表参道', code: 'Z02' },
    { name: '永田町', code: 'Z03' },
    { name: '半蔵門', code: 'Z04' },
    { name: '九段下', code: 'Z05' },
    { name: '神保町', code: 'Z06' },
    { name: '大手町', code: 'Z07' },
    { name: '水天宮前', code: 'Z08' },
    { name: '押上', code: 'Z09' }
  ]
};

// 路線ごとの色を定義
const LINE_COLORS: Record<string, string> = {
  JY1: '#9acd32', // 山手線
  JY2: '#9acd32', // 山手線
  JK: '#00b2e5',  // 京浜東北線
  CA: '#0072bc',  // 東海道新幹線
  JB: '#ffd400',  // 総武線
  JC: '#ff4500',  // 中央線
  M: '#f62e36',   // 丸の内線
  H: '#b5b5ac',   // 日比谷線
  G: '#f39700',   // 銀座線
  JT: '#f68b1e',  // 東海道線
  JO: '#1069b4',  // 横須賀線
  AK: '#8e44ad',  // あきが丘線
  AU: '#3498db',  // あおうみ線
  C: '#e74c3c',   // 千代田線
  Z: '#f39c12'    // 半蔵門線
};

// 駅横アイコン用（イラスト）
const STATION_TRAIN_ICON_URLS: Record<string, string> = {
  '山手線': 'https://i.imgur.com/K04At9r.png', // 緑のイラスト
  '京浜東北線': 'https://i.imgur.com/ZfkSjHa.png', // 水色のイラスト
  '中央線': 'https://i.imgur.com/5k2USuI.png', // オレンジのイラスト
  '総武線': 'https://i.imgur.com/RadEwgh.png', // 黄色のイラスト
  '東海道新幹線': 'https://i.imgur.com/rKubwpB.png', // 新幹線イラスト
  'あきが丘線': 'https://i.imgur.com/1Q9Qw2A.png', // 紫のイラスト（仮）
};
const DEFAULT_STATION_TRAIN_ICON_URL = 'https://i.imgur.com/K04At9r.png';

// 路線ごとの電車画像URLを指定
const TRAIN_IMAGE_URLS: Record<string, string> = {
  '山手線': 'https://i.imgur.com/Wu8a0Pv.png',
  '京浜東北線': 'https://i.imgur.com/bn2qvjr.png',
  '中央線': 'https://i.imgur.com/A5oLcpF.jpg',
  '総武線': 'https://i.imgur.com/vb9dLGm.png',
  '東海道新幹線': 'https://i.imgur.com/ua4M1QB.jpg',
  'あきが丘線': 'https://i.imgur.com/oR6Koa5.png',
};
const DEFAULT_TRAIN_IMAGE_URL = 'https://i.imgur.com/Wu8a0Pv.png'; // デフォルトは山手線

// 路線コードを取得
const getLineCode = (lineName: string): string => {
  if (lineName.includes('山手線（内回り）')) {
    return 'JY1';
  } else if (lineName.includes('山手線（外回り）')) {
    return 'JY2';
  } else if (lineName.includes('山手線')) {
    return 'JY1';
  } else if (lineName.includes('京浜東北線')) {
    return 'JK';
  } else if (lineName.includes('総武線')) {
    return 'JB';
  } else if (lineName.includes('中央線')) {
    return 'JC';
  } else if (lineName.includes('東海道新幹線')) {
    return 'CA';
  } else if (lineName.includes('丸の内線')) {
    return 'M';
  } else if (lineName.includes('日比谷線')) {
    return 'H';
  } else if (lineName.includes('銀座線')) {
    return 'G';
  } else if (lineName.includes('東海道線')) {
    return 'JT';
  } else if (lineName.includes('横須賀線')) {
    return 'JO';
  } else if (lineName.includes('あきが丘線')) {
    return 'AK';
  } else if (lineName.includes('あおうみ線')) {
    return 'AU';
  } else if (lineName.includes('千代田線')) {
    return 'C';
  } else if (lineName.includes('半蔵門線')) {
    return 'Z';
  }
  return 'JY1'; // デフォルト
};

// 駅名の正規化関数
function normalizeStationName(name: string): string {
  return name
    .replace(/\s/g, '') // 空白除去
    .replace(/[駅]/g, '') // 「駅」除去
    .toLowerCase() // 小文字化
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); // 全角→半角
}

// 均等な高さの定数
const ROW_HEIGHT = 72;

export default function TrainPositionPage() {
  const [lineName, setLineName] = useState<string>('');
  const [lineCode, setLineCode] = useState<string>('JY1');
  const [direction, setDirection] = useState<string>('外回り');
  const [currentStations, setCurrentStations] = useState<string[]>([]); // 複数駅対応
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStation, setModalStation] = useState<string | null>(null);
  const [modalTime, setModalTime] = useState<string | null>(null);
  const [trainState, setTrainState] = useState<'stopped'|'between'>('stopped');
  const [betweenStations, setBetweenStations] = useState<[string, string]|null>(null);
  const [currentDirection, setCurrentDirection] = useState<string>('上り'); // 現在の電車の方向
  const lastStationRef = useRef<string|null>(null);
  const timerRef = useRef<any>(null);
  const [moveAnim, setMoveAnim] = useState(false);
  const router = useRouter();
  const stations = useMemo(() => (lineCode && LINE_STATIONS[lineCode] ? LINE_STATIONS[lineCode] : []), [lineCode]);

  // line名・方向の正規化関数
  function normalizeLineAndDirection(rawLine: string): { line: string, direction: string } {
    // 例: "京浜東北線（上り）" → line: "京浜東北線", direction: "上り"
    const match = rawLine.match(/^(.*?)(?:[（(](.*?)[)）])?$/);
    if (match) {
      const line = match[1].replace(/\s/g, '');
      let direction = match[2] ? match[2].replace(/\s/g, '') : '';
      // 京浜東北線などはdirectionを「上り」または「下り」に強制
      if (line.includes('京浜東北線') && (!direction || !['上り','下り'].includes(direction))) {
        direction = '上り'; // デフォルトを上りに
      } else if (!direction) {
        direction = (line.includes('外回り') ? '外回り' : '内回り');
      }
      return { line, direction };
    }
    return { line: rawLine, direction: '上り' };
  }

  useEffect(() => {
    // URLから路線名・方向を取得
    const urlParams = new URLSearchParams(window.location.search);
    const rawLine = urlParams.get('line') || '山手線（外回り）';
    const { line, direction } = normalizeLineAndDirection(rawLine);
    setLineName(line);
    setDirection(direction);
    // currentDirectionも初期化
    if (direction === '下り') {
      setCurrentDirection('下り');
    } else {
      setCurrentDirection('上り');
    }
    const code = getLineCode(line);
    setLineCode(code);
  }, []);

  useEffect(() => {
    if (!lineName || !lineCode || !direction) return;
    // fetch-discord-messages.jsから列車位置情報を取得
    const fetchTrainPositions = () => {
      fetch('/.netlify/functions/fetch-discord-messages')
        .then(res => res.json())
        .then(data => {
          console.log('🚂 APIデータ受信:', data);
          console.log('🚂 trainMessages:', data.trainMessages);
          console.log('🚂 trainMessages数:', data.trainMessages?.length || 0);
          const filtered = data.trainMessages.filter((msg: any) => {
            const parts = msg.content.split('/');
            const msgLine = normalizeStationName(parts[0] || '');
            const viewLine = normalizeStationName(lineName);
            const msgDir = normalizeStationName(parts[1] || '');
            const viewDir = normalizeStationName(direction);
            
            console.log('フィルタリング詳細:', {
              message: msg.content,
              msgLine,
              viewLine,
              msgDir,
              viewDir,
              lineMatch: msgLine.includes(viewLine) || viewLine.includes(msgLine),
              dirMatch: msgDir.includes(viewDir) || viewDir.includes(msgDir)
            });
            
            // 京浜東北線の場合は路線名のみでフィルタリング（方向は後で判定）
            if (lineName.includes('京浜東北線')) {
              return msgLine.includes(viewLine) || viewLine.includes(msgLine);
            }
            
            return (
              (msgLine.includes(viewLine) || viewLine.includes(msgLine)) &&
              (msgDir.includes(viewDir) || viewDir.includes(msgDir))
            );
          });
          console.log('filtered:', filtered);
          if (filtered.length > 0) {
            const latest = filtered[0];
            const parts = latest.content.split('/');
            const station = normalizeStationName(parts[2].replace('到着', '').replace(/駅$/, '').trim());
            const messageDirection = parts[1] || '';
            console.log('API駅名:', station);
            console.log('メッセージ方向:', messageDirection);
            console.log('現在のcurrentDirection:', currentDirection);
            console.log('路線名:', lineName);
            console.log('京浜東北線判定:', lineName.includes('京浜東北線'));
            
            // 方向情報を解析してcurrentDirectionを更新
            let newDirection = currentDirection; // デフォルトは現在の方向
            
            // 京浜東北線の場合の方向判定を強化
            if (lineName.includes('京浜東北線')) {
              console.log('京浜東北線方向判定開始 - messageDirection:', messageDirection);
              console.log('京浜東北線方向判定詳細:', {
                has下り: messageDirection.includes('下り'),
                has外回り: messageDirection.includes('外回り'),
                has南行: messageDirection.includes('南行'),
                has南向き: messageDirection.includes('南向き'),
                has上り: messageDirection.includes('上り'),
                has内回り: messageDirection.includes('内回り'),
                has北行: messageDirection.includes('北行'),
                has北向き: messageDirection.includes('北向き')
              });
              
              // メッセージ全体からも方向を検出
              const fullMessage = latest.content;
              console.log('京浜東北線メッセージ全体:', fullMessage);
              
              if (messageDirection.includes('下り') || messageDirection.includes('外回り') || messageDirection.includes('南行') || messageDirection.includes('南向き') || fullMessage.includes('下り')) {
                newDirection = '下り';
                console.log('京浜東北線下り方向を検出、currentDirectionを下りに設定');
              } else if (messageDirection.includes('上り') || messageDirection.includes('内回り') || messageDirection.includes('北行') || messageDirection.includes('北向き') || fullMessage.includes('上り')) {
                newDirection = '上り';
                console.log('京浜東北線上り方向を検出、currentDirectionを上りに設定');
              } else {
                console.log('京浜東北線: 方向情報が見つからないため、現在の方向を維持:', currentDirection);
              }
            } else {
              // 他の路線の場合
              if (messageDirection.includes('下り')) {
                newDirection = '下り';
                console.log('下り方向を検出、currentDirectionを下りに設定');
              } else if (messageDirection.includes('上り')) {
                newDirection = '上り';
                console.log('上り方向を検出、currentDirectionを上りに設定');
              } else {
                console.log('方向情報が見つからないため、現在の方向を維持:', currentDirection);
              }
            }
            
            // 京浜東北線の終点駅での方向変更処理
            if (lineName.includes('京浜東北線')) {
              const normalizedStation = normalizeStationName(station);
              console.log('京浜東北線駅名正規化:', station, '→', normalizedStation);
              if (normalizedStation === '上野') {
                console.log('京浜東北線上野駅到着 - 方向を下りに変更');
                newDirection = '下り';
              } else if (normalizedStation === '大井町') {
                console.log('京浜東北線大井町駅到着 - 方向を上りに変更');
                newDirection = '上り';
              }
            }
            
            setCurrentDirection(newDirection);
            setCurrentStations([station]);
            console.log('currentStations set:', [station]);
            console.log('currentDirection set:', newDirection);
            console.log('電車マーク位置:', newDirection === '下り' ? '右側（下り方向）' : '左側（上り方向）');
            // 駅が変わったら状態遷移
            if (lastStationRef.current !== station) {
              setTrainState('stopped');
              setBetweenStations(null);
              lastStationRef.current = station;
              if (timerRef.current) clearTimeout(timerRef.current);
              setMoveAnim(false);
              timerRef.current = setTimeout(() => {
                setTrainState('between');
                const idx = stations.findIndex(s => normalizeStationName(s.name).includes(station) || station.includes(normalizeStationName(s.name)));
                if (idx !== -1 && idx < stations.length - 1) {
                  setBetweenStations([
                    normalizeStationName(stations[idx].name),
                    normalizeStationName(stations[idx+1].name)
                  ]);
                  setMoveAnim(true);
                } else {
                  setBetweenStations(null);
                  setMoveAnim(false);
                }
                timerRef.current = setTimeout(() => {
                  setTrainState('stopped');
                  setBetweenStations(null);
                  setMoveAnim(false);
                }, 10000);
              }, 10000);
            }
          } else {
            setCurrentStations([]);
            console.log('currentStations set: []');
            setTrainState('stopped');
            setBetweenStations(null);
            lastStationRef.current = null;
          }
        })
        .catch((error) => {
          console.error('🚂 API呼び出しエラー:', error);
          setCurrentStations([]);
          console.log('currentStations set: []');
          setTrainState('stopped');
          setBetweenStations(null);
          lastStationRef.current = null;
        });
    };

    fetchTrainPositions();
    const interval = setInterval(fetchTrainPositions, 5000);
    return () => clearInterval(interval);
  }, [lineName, lineCode, direction, stations]);

  const lineColor = LINE_COLORS[lineCode] || '#666';

  // モーダルを開く関数
  const handleTrainIconClick = (stationName: string) => {
    setModalStation(stationName);
    setModalTime(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
    setModalOpen(true);
  };

  // モーダルの内容を作成
  const renderModal = () => {
    if (!modalStation) return null;
    // 進捗計算
    const stationIndex = stations.findIndex(s => s.name === modalStation);
    const totalStations = stations.length;
    const progress = ((stationIndex + 1) / totalStations) * 100;
    // 路線名から画像URLを取得
    const trainImageUrl = TRAIN_IMAGE_URLS[lineName] || DEFAULT_TRAIN_IMAGE_URL;
    // 駅ごとに路線記号の数字部分を連番で表示
    const match = lineCode.match(/^([A-Z]+)/i);
    const lineAlpha = match ? match[1] : lineCode;
    const lineNum = (stationIndex + 1).toString();
    // 駅名が長い場合はフォントサイズを小さくする
    const isLongName = modalStation.length >= 8;
    return (
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 1300
        }}>
          <Paper sx={{ width: '100%', maxWidth: 480, mx: 'auto', borderRadius: '20px 20px 0 0', p: 0, pb: 5, bgcolor: '#222', color: '#fff', position: 'relative' }}>
            {/* 閉じるボタン */}
            <IconButton
              onClick={() => setModalOpen(false)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 2,
                width: 40,
                height: 40,
                bgcolor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: '#ff5252',
                },
                borderRadius: '50%',
                boxShadow: 2,
                transition: 'all 0.2s',
                p: 0,
              }}
            >
              <CloseIcon sx={{ fontSize: 28 }} />
            </IconButton>
            {/* 電車画像 */}
            <Box sx={{ width: '100%' }}>
              <img src={trainImageUrl} alt="電車" style={{ width: '100%', height: 250, borderRadius: '20px 20px 0 0', objectFit: 'cover', display: 'block' }} />
            </Box>
            {/* 以下、内容部分だけpaddingをつける */}
            <Box sx={{ p: 3 }}>
              {/* 路線名・種別・方向 */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{lineName}（E235系）</Typography>
              <Typography sx={{ color: '#9acd32', fontSize: 16, mb: 0.5 }}>各駅停車</Typography>
              <Typography sx={{ fontSize: 16, mb: 2 }}>{currentDirection}</Typography>
              {/* 停車中/発車・駅名・到着時刻 */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ bgcolor: '#b71c1c', color: '#fff', borderRadius: 1, px: 1.5, py: 0.5, fontSize: 14, fontWeight: 700, mr: 2 }}>停車中</Box>
                <Typography sx={{ fontSize: 16 }}>{modalStation} → {modalTime}</Typography>
              </Box>
              {/* 情報 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, color: '#aaa' }}>平均速度</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>37km/h</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, color: '#aaa' }}>所要時間</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>4分</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, color: '#aaa' }}>列車番号</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>1234F</Typography>
                </Box>
              </Box>
              {/* 進捗バー */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 13, color: '#aaa', mb: 0.5 }}>通過駅数 / 総駅数</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#9acd32' } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography sx={{ fontSize: 13 }}>{stationIndex + 1}駅</Typography>
                  <Typography sx={{ fontSize: 13 }}>{totalStations}駅</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Modal>
    );
  };

  if (!lineName || !lineCode || !direction || stations.length === 0) {
    return null; // またはローディング表示
  }
  return (
    <Box sx={{ p: 0, maxWidth: '100%', mx: 'auto', backgroundColor: 'white', minHeight: '100vh' }} className="train-position-page">
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBack sx={{ color: '#1a237e' }} />
        </IconButton>
        <TrainIcon sx={{ color: '#1a237e', fontSize: 28, ml: 1 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20, ml: 1 }}>
          列車位置情報
        </Typography>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 2 }}>
        {/* 路線情報ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 3, justifyContent: 'center', px: 3 }} className="train-position-header">
          <Box
            className="line-icon"
            sx={{
              width: 48,
              height: 48,
              borderRadius: '15%',
              backgroundColor: 'white',
              border: `3px solid ${lineColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#0d2a70'
            }}
          >
            {lineCode === 'JY1' || lineCode === 'JY2' ? 'JY' : 
             lineCode === 'JK' ? 'JK' :
             lineCode === 'CA' ? 'CA' :
             lineCode === 'JB' ? 'JB' :
             lineCode === 'JC' ? 'JC' :
             lineCode === 'M' ? 'M' :
             lineCode === 'H' ? 'H' :
             lineCode === 'G' ? 'G' :
             lineCode === 'JT' ? 'JT' :
             lineCode === 'JO' ? 'JO' :
             lineCode === 'AK' ? 'AK' :
             lineCode === 'AU' ? 'AU' :
             lineCode === 'C' ? 'C' :
             lineCode === 'Z' ? 'Z' : 'JY'}
          </Box>
          <Box className="title-container" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textAlign: 'center', color: 'black', margin: 0 }} className="train-position-title">
              {lineName} 列車位置情報
            </Typography>
          </Box>
        </Box>

        {/* 路線図 */}
        <Box sx={{ p: 0, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {/* 上り・下り表記（山手線以外） */}
          {(lineCode !== 'JY1' && lineCode !== 'JY2') && (
            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 4, px: 3 }}>
              {/* 中央線の上部に配置 */}
              <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, zIndex: 200, top: -10 }} className="direction-buttons">
                <Typography
                  sx={{
                    fontWeight: direction === '上り' ? 'bold' : 400,
                    color: '#333',
                    fontSize: 16,
                    letterSpacing: 1,
                    backgroundColor: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                >
                  上り
                </Typography>
                <Typography
                  sx={{
                    fontWeight: direction === '下り' ? 'bold' : 400,
                    color: '#333',
                    fontSize: 16,
                    letterSpacing: 1,
                    backgroundColor: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                >
                  下り
                </Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* 縦線（中央配置） */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: lineColor,
                borderRadius: 2,
                zIndex: 100
              }}
            />
            
            {/* 駅ドット（中央線上の白丸）を全駅分絶対配置で描画 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {stations.map((station, index) => {
                // 駅ごとに路線記号の数字部分を連番で表示
                const match = lineCode.match(/^([A-Z]+)/i);
                const lineAlpha = match ? match[1] : lineCode;
                const lineNum = (index + 1).toString();
                // 駅名が長い場合はフォントサイズを小さくする
                const isLongName = station.name.length >= 8;
                return (
                  <React.Fragment key={station.code}>
                    {/* 1駅分の行 */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', minHeight: `${ROW_HEIGHT}px`, background: '#f3f3f3' }}>
                      {/* 駅名ボックス */}
                      <Box
                        className="station-name-box"
                        sx={{
                          width: { xs: 120, sm: 140 },
                          minWidth: { xs: 80, sm: 100 },
                          backgroundColor: 'white',
                          border: `2px solid ${lineColor}`,
                          borderRadius: 2,
                          px: { xs: 1, sm: 2 },
                          py: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          textAlign: 'left',
                          overflow: 'visible',
                          zIndex: 100,
                          marginLeft: '4px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          mr: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            transform: 'scale(1.02)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                        onClick={() => {
                          window.location.href = `/station-info/${station.name}`;
                        }}
                      >
                        {/* 路線記号バッジ */}
                        <Box
                          sx={{
                            width: { xs: 24, sm: 32 },
                            height: { xs: 24, sm: 32 },
                            borderRadius: { xs: '6px', sm: '8px' },
                            backgroundColor: 'white',
                            border: `2px solid ${lineColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d2a70',
                            marginRight: 1,
                            mr: { xs: 0.5, sm: 1 },
                            p: 0,
                            lineHeight: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                            flexGrow: 0,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <span style={{ 
                            fontSize: window.innerWidth < 600 ? '8px' : '11px', 
                            fontWeight: 700, 
                            lineHeight: 1 
                          }}>
                            {lineAlpha}
                          </span>
                          {lineNum && (
                            <span style={{ 
                              fontSize: window.innerWidth < 600 ? '10px' : '15px', 
                              fontWeight: 700, 
                              lineHeight: 1 
                            }}>
                              {lineNum}
                            </span>
                          )}
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#222', 
                            fontSize: window.innerWidth < 600 ? '0.75rem' : (isLongName ? '0.85rem' : '1rem'), 
                            textAlign: 'left', 
                            ml: { xs: 0.5, sm: 1 } 
                          }}
                        >
                          {station.name}
                        </Typography>
                      </Box>
                      {/* 中央線（縦線） */}
                      <Box sx={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: 4, background: lineColor, borderRadius: 2, zIndex: 1, transform: 'translateX(-50%)' }} />
                      {/* 駅ドット（白丸） */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#fff',
                          border: `4px solid ${lineColor}`,
                          zIndex: 100,
                          pointerEvents: 'none',
                        }}
                      />
                      {/* 電車マーク（駅ドットの左側） */}
                      {currentStations.includes(normalizeStationName(station.name)) && (
                        <Box sx={{ 
                          position: 'absolute', 
                          left: currentDirection === '下り' ? 'calc(50% + 56px)' : 'calc(50% - 56px)', 
                          top: currentDirection === '下り' ? 'calc(50% + 20px)' : 'calc(50% - 0px)', 
                          transform: 'translate(-50%, -50%)', 
                          width: 48, 
                          height: 68, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'flex-start', 
                          zIndex: 3 
                        }}
                        onClick={() => {
                          console.log('電車マーククリック - 駅:', station.name, '方向:', currentDirection, '路線:', lineName);
                        }}
                        >
                          {/* Googleマップ風の白い半透明円エフェクト */}
                          <span style={{
                            position: 'absolute',
                            left: '50%',
                            top: 24,
                            width: 56,
                            height: 56,
                            background: 'rgba(200,200,200,0.5)',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            filter: 'blur(2px)',
                            zIndex: 1,
                            pointerEvents: 'none',
                          }} />
                          <img
                            src={STATION_TRAIN_ICON_URLS[lineName] || DEFAULT_STATION_TRAIN_ICON_URL}
                            alt="電車"
                            className="train-icon-hover"
                            style={{ width: 48, height: 48, cursor: 'pointer', position: 'relative', zIndex: 2, animation: 'train-hover 2s ease-in-out infinite' }}
                            onClick={() => handleTrainIconClick(station.name)}
                          />
                          {/* 野球ベース（三角形） */}
                          <svg width="28" height="20" viewBox="0 0 28 20" style={{ 
                            position: 'absolute',
                            top: currentDirection === '下り' ? -20 : 50,
                            left: currentDirection === '下り' ? 'calc(50% + 0px)' : 'calc(50% - 14px)',
                            transform: `translateX(-50%) ${currentDirection === '下り' ? 'rotate(180deg)' : 'none'}`,
                            zIndex: 3
                          }}>
                            <polygon points="14,20 0,0 28,0" fill="#e0e0e0" stroke="#222" strokeWidth="2" />
                          </svg>
                        </Box>
                      )}
                    </Box>
                    {/* 駅間（白背景） ※最後の駅の後ろには表示しない */}
                    {index < stations.length - 1 && (
                      <Box sx={{ width: '100%', height: `${ROW_HEIGHT}px`, background: '#fff' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
      {renderModal()}
    </Box>
  );
} 