"use client";
import { useParams } from "next/navigation";
import { Box, Typography, Divider, Grid, Avatar, Paper, Button, Link, IconButton } from "@mui/material";
import { Business, Phone, LocationOn, Wifi, Restaurant, Wc, Elevator, AccessTime, Map, Accessible, DirectionsSubway, CreditCard, LocalAtm, Lock, DirectionsCar, Info, ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

// ダミー駅データ
const stations = [
  { id: "S01", name: "東京", line: "山手線", address: "東京都千代田区丸の内1丁目", tel: "03-1234-5678", facilities: ["Wifi", "Restaurant", "Wc", "Elevator"], map: "https://maps.google.com/?q=東京駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" },
      { number: 3, info: "京浜東北線（南行）" },
      { number: 4, info: "京浜東北線（北行）" }
    ]
  },
  { id: "S02", name: "新宿", line: "中央線", address: "東京都新宿区新宿3丁目", tel: "03-2345-6789", facilities: ["Wifi", "Restaurant", "Wc"], map: "https://maps.google.com/?q=新宿駅",
    platforms: [
      { number: 1, info: "中央線（快速）" },
      { number: 2, info: "中央線（各駅停車）" },
      { number: 3, info: "山手線（内回り）" },
      { number: 4, info: "山手線（外回り）" }
    ]
  },
  { id: "S03", name: "品川", line: "京浜東北線", address: "東京都港区高輪3丁目", tel: "03-3456-7890", facilities: ["Restaurant", "Wc", "Elevator"], map: "https://maps.google.com/?q=品川駅",
    platforms: [
      { number: 1, info: "京浜東北線（南行）" },
      { number: 2, info: "京浜東北線（北行）" }
    ]
  },
  { id: "S04", name: "渋谷", line: "山手線", address: "東京都渋谷区道玄坂2丁目", tel: "03-4567-8901", facilities: ["Wifi", "Elevator"], map: "https://maps.google.com/?q=渋谷駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" }
    ]
  },
  { id: "S05", name: "池袋", line: "山手線", address: "東京都豊島区南池袋1丁目", tel: "03-5678-9012", facilities: ["Restaurant", "Wc"], map: "https://maps.google.com/?q=池袋駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" }
    ]
  },
  { id: "S06", name: "秋葉原", line: "総武線", address: "東京都千代田区外神田1丁目", tel: "03-6789-0123", facilities: ["Wifi", "Wc"], map: "https://maps.google.com/?q=秋葉原駅",
    platforms: [
      { number: 1, info: "総武線（各駅停車）" },
      { number: 2, info: "山手線（外回り）" },
      { number: 3, info: "京浜東北線（南行）" }
    ]
  },
  { id: "S07", name: "高輪ゲートウェイ", line: "山手線", address: "東京都港区港南2丁目", tel: "03-0000-0000", facilities: ["Wifi", "Elevator"], map: "https://maps.google.com/?q=高輪ゲートウェイ駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" }
    ]
  },
  { id: "S08", name: "大崎", line: "山手線", address: "東京都品川区大崎1丁目", tel: "03-0000-0001", facilities: ["Restaurant", "Wc"], map: "https://maps.google.com/?q=大崎駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" }
    ]
  },
  { id: "S09", name: "浜松", line: "東海道新幹線", address: "静岡県浜松市中区砂山町", tel: "053-000-0000", facilities: ["Wifi", "Wc"], map: "https://maps.google.com/?q=浜松駅",
    platforms: [
      { number: 1, info: "東海道新幹線（上り）" },
      { number: 2, info: "東海道新幹線（下り）" }
    ]
  },
  { id: "S10", name: "有楽町", line: "山手線", address: "東京都千代田区有楽町2丁目", tel: "03-0000-0002", facilities: ["Elevator", "Wc"], map: "https://maps.google.com/?q=有楽町駅",
    platforms: [
      { number: 1, info: "山手線（内回り）" },
      { number: 2, info: "山手線（外回り）" }
    ]
  },
  { id: "S11", name: "大出碧大前", line: "あきが丘線", address: "静岡県浜松市北区大出町1-1", tel: "053-000-0001", facilities: ["Elevator", "Wc"], map: "https://maps.google.com/?q=大出碧大前駅",
    platforms: [
      { number: 1, info: "あきが丘線（上り）" },
      { number: 2, info: "あきが丘線（下り）" }
    ]
  },
];

const facilityIcons: Record<string, JSX.Element> = {
  Wifi: <Wifi sx={{ color: '#1976d2' }} />,
  Restaurant: <Restaurant sx={{ color: '#43a047' }} />,
  Wc: <Wc sx={{ color: '#757575' }} />,
  Elevator: <Elevator sx={{ color: '#ffa000' }} />,
};

const normalize = (str: string) => str.replace(/\s+/g, '').replace(/　/g, '').toLowerCase();

const stationSignImages: Record<string, string> = {
  "東京": "https://i.imgur.com/mTX9J6e.png",
  "秋葉原": "https://i.imgur.com/PFt5F1c.png",
  "高輪ゲートウェイ": "https://i.imgur.com/DyqmgoM.png",
  "新宿": "https://i.imgur.com/xFcT0UI.png",
  "渋谷": "https://i.imgur.com/AEpjW4i.png",
  "大崎": "https://i.imgur.com/NJ5nkyd.png",
  "浜松": "https://i.imgur.com/0wKSID6.png",
  "有楽町": "https://i.imgur.com/Svyjl7f.png",
  "大出碧大前": "https://i.imgur.com/UE0Pyr6.jpeg",
};

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  if (!params) return <Box sx={{ p: 3 }}><Typography>駅情報が見つかりません</Typography></Box>;
  const rawStationId = params.stationId;
  const stationId = Array.isArray(rawStationId) ? rawStationId[0] : rawStationId;
  const decodedId = decodeURIComponent(stationId);
  const station = stations.find(s =>
    (s.id === decodedId) ||
    (normalize(s.name) === normalize(decodedId))
  );

  if (!station) {
    return <Box sx={{ p: 3 }}><Typography>駅情報が見つかりません</Typography></Box>;
  }

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
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
        <Business sx={{ color: '#1a237e', fontSize: 28, ml: 1 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20, ml: 1 }}>
          駅情報
        </Typography>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 2 }}>
        {/* 駅名標・駅名・路線名 */}
        <Box sx={{ pt: 4, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {stationSignImages[station.name] && (
            <img src={stationSignImages[station.name]} alt={`${station.name}駅名標`} style={{ height: 120, marginBottom: 16 }} />
          )}
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#222', mb: 0.5 }}>{station.name}駅</Typography>
          <Typography variant="subtitle1" color="text.secondary">{station.line}</Typography>
        </Box>
        {/* 主要機能アイコン */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
          <Button startIcon={<AccessTime />} color="success" variant="outlined">時刻表</Button>
          <Button startIcon={<Map />} color="success" variant="outlined">構内図</Button>
          <Button startIcon={<Accessible />} color="success" variant="outlined">バリアフリー</Button>
        </Box>
        {/* 駅情報 */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><Info sx={{ mr: 1, color: 'success.main' }} />駅情報</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocationOn sx={{ color: '#388e3c' }} />
                <Typography>{station.address}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Phone sx={{ color: '#388e3c' }} />
                <Typography>{station.tel}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Business sx={{ color: '#888' }} />
                <Typography>営業時間: 5:00〜24:00</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography fontWeight="bold" mb={1}>設備</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {station.facilities.map(f => (
                  <Box key={f} display="flex" alignItems="center" gap={0.5} sx={{ background: '#f0f4f8', borderRadius: 2, px: 1.5, py: 0.5, mb: 1 }}>
                    {f === "Wifi" && <Wifi sx={{ color: '#1976d2' }} />}
                    {f === "Restaurant" && <Restaurant sx={{ color: '#43a047' }} />}
                    {f === "Wc" && <Wc sx={{ color: '#757575' }} />}
                    {f === "Elevator" && <Elevator sx={{ color: '#ffa000' }} />}
                    <Typography fontSize={14}>{f}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        {/* のりば案内 */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><DirectionsSubway sx={{ mr: 1, color: 'success.main' }} />のりば案内</Typography>
          {station.platforms && station.platforms.length > 0 ? (
            station.platforms.map(p => (
              <Typography key={p.number}>{p.number}番線：{p.info}</Typography>
            ))
          ) : (
            <Typography>情報がありません</Typography>
          )}
        </Paper>
        {/* 指定席券売機 */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><CreditCard sx={{ mr: 1, color: 'success.main' }} />指定席券売機</Typography>
          <Typography>みどりの窓口横・中央改札付近</Typography>
        </Paper>
        {/* 多機能券売機 */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><CreditCard sx={{ mr: 1, color: 'success.main' }} />多機能券売機</Typography>
          <Typography>中央改札付近</Typography>
        </Paper>
        {/* Suica関連 */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><CreditCard sx={{ mr: 1, color: 'success.main' }} />Suica関連</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography>Suicaチャージ機：あり</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography>モバイルSuica：対応</Typography></Grid>
          </Grid>
        </Paper>
        {/* ATM */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><LocalAtm sx={{ mr: 1, color: 'success.main' }} />ATM</Typography>
          <Typography>ビューアルッテ：中央改札付近</Typography>
        </Paper>
        {/* コインロッカー */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><Lock sx={{ mr: 1, color: 'success.main' }} />コインロッカー</Typography>
          <Typography>中央改札付近・東口付近</Typography>
        </Paper>
        {/* 駅レンタカー */}
        <Paper sx={{ maxWidth: 700, mx: 'auto', p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}><DirectionsCar sx={{ mr: 1, color: 'success.main' }} />駅レンタカー</Typography>
          <Typography>駅前ロータリー</Typography>
        </Paper>
      </Box>
    </Box>
  );
} 