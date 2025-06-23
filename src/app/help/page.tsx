"use client";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function HelpPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">ヘルプ・よくある質問</Typography>
      <Divider sx={{ mb: 2 }} />
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="#222">Q. ログインしないと使えませんか？</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="#222">A. 一部機能（通知・管理）はログインが必要ですが、運行状況や道路状況などは未ログインでも閲覧できます。</Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="#222">Q. 通知はどんな時に届きますか？</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="#222">A. 運行情報・道路情報・お知らせの更新時に通知が届きます。通知設定でON/OFFを切り替えられます。</Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="#222">Q. データはどこに保存されていますか？</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="#222">A. データはSupabaseクラウド上で安全に管理されています。</Typography>
        </AccordionDetails>
      </Accordion>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" fontWeight="bold" mb={1} color="#222">使い方ガイド</Typography>
      <Typography color="#222">1. ホーム画面から運行状況や道路状況を確認できます。<br/>2. 通知や個人設定は「その他」→「設定」から変更できます。<br/>3. 管理者は運行・道路情報の管理ページにアクセスできます。</Typography>
    </Box>
  );
} 