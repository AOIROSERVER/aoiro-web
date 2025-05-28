"use client";
import { Box, Card, Typography, Avatar } from "@mui/material";
import { useRouter } from "next/navigation";
import { Train, DirectionsBus, DirectionsWalk, MoreHoriz } from "@mui/icons-material";
import { ReactElement } from "react";

interface CardData {
  id: string;
  title: string;
  icon: ReactElement;
  color: string;
  route: string;
}

const CARD_DATA: CardData[] = [
  {
    id: "train-status",
    title: "運行情報",
    icon: <Train sx={{ fontSize: 32, color: '#fff' }} />,
    color: "#050045",
    route: "/train-status",
  },
  {
    id: "station-info",
    title: "駅情報",
    icon: <DirectionsWalk sx={{ fontSize: 32, color: '#fff' }} />,
    color: "#050045",
    route: "/station-info",
  },
  {
    id: "road-status",
    title: "道路状況",
    icon: <DirectionsBus sx={{ fontSize: 32, color: '#fff' }} />,
    color: "#050045",
    route: "/road-status",
  },
  {
    id: "more",
    title: "その他",
    icon: <MoreHoriz sx={{ fontSize: 32, color: '#fff' }} />,
    color: "#050045",
    route: "/more",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <Box sx={{ p: 2, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#050045' }}>AOIRO SERVER</Typography>
      </Box>

      {/* カードグリッド */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 2 
      }}>
        {CARD_DATA.map((card) => (
          <Card
            key={card.id}
            sx={{
              borderRadius: 3,
              p: 2,
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
            onClick={() => router.push(card.route)}
          >
            <Avatar
              sx={{
                bgcolor: card.color,
                width: 60,
                height: 60,
                mb: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {card.icon}
            </Avatar>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: '#050045', textAlign: 'center' }}
            >
              {card.title}
            </Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
} 