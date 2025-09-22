"use client";
import { Box, Card, Typography, Avatar, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import { Train, DirectionsBus, DirectionsWalk, MoreHoriz, ArrowBack, CreditCard } from "@mui/icons-material";
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
    icon: <Train sx={{ fontSize: { xs: 24, sm: 32 }, color: '#fff' }} />,
    color: "#050045",
    route: "/train-status",
  },
  {
    id: "station-info",
    title: "駅情報",
    icon: <DirectionsWalk sx={{ fontSize: { xs: 24, sm: 32 }, color: '#fff' }} />,
    color: "#050045",
    route: "/station-info",
  },
  {
    id: "road-status",
    title: "道路状況",
    icon: <DirectionsBus sx={{ fontSize: { xs: 24, sm: 32 }, color: '#fff' }} />,
    color: "#050045",
    route: "/road-status",
  },
  {
    id: "aic",
    title: "AIC",
    icon: <CreditCard sx={{ fontSize: { xs: 24, sm: 32 }, color: '#fff' }} />,
    color: "#FF6B35",
    route: "/aic-intro",
  },
  {
    id: "more",
    title: "その他",
    icon: <MoreHoriz sx={{ fontSize: { xs: 24, sm: 32 }, color: '#fff' }} />,
    color: "#050045",
    route: "/more",
  },
];

export default function HomePage() {
  const router = useRouter();

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
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20, ml: 1 }}>
          AOIRO SERVER
        </Typography>
      </Box>

      {/* カードグリッド */}
      <Box sx={{ p: 2 }}>
        <Box className="card-grid">
          {CARD_DATA.map((card) => (
            <Card
              key={card.id}
              className="home-card"
              onClick={() => router.push(card.route)}
            >
              <Avatar
                sx={{
                  bgcolor: card.color,
                  width: { xs: 50, sm: 60 },
                  height: { xs: 50, sm: 60 },
                  mb: { xs: 1, sm: 2 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {card.icon}
              </Avatar>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ 
                  color: '#050045', 
                  textAlign: 'center',
                  fontSize: { xs: 14, sm: 16 }
                }}
              >
                {card.title}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 