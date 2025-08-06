"use client";
import { Box, Typography, Divider, Paper } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <Box sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box
          onClick={() => router.back()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#666',
            '&:hover': { color: '#333' }
          }}
        >
          <ArrowBack sx={{ mr: 1 }} />
          <Typography>戻る</Typography>
        </Box>
      </Box>

      {/* プライバシーポリシーコンテンツ */}
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight="bold" className="long-page-title" sx={{ color: '#222', mb: 3, margin: '0 0 24px 0' }}>
          プライバシーポリシー
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            1. 個人情報の収集について
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            当アプリでは、以下の場合に個人情報を収集いたします：
          </Typography>
          <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
            <li>アカウント登録時（メールアドレス、ユーザー名）</li>
            <li>通知設定時（デバイストークン）</li>
            <li>お問い合わせ時（メールアドレス、お名前）</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            2. 個人情報の利用目的
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            収集した個人情報は、以下の目的で利用いたします：
          </Typography>
          <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
            <li>アプリの機能提供（運行情報、通知サービス）</li>
            <li>ユーザーサポート</li>
            <li>サービス改善のための分析</li>
            <li>重要な変更やお知らせの配信</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            3. 個人情報の管理
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            当アプリでは、個人情報の適切な管理のため、以下の対策を実施しています：
          </Typography>
          <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
            <li>データベースの暗号化</li>
            <li>アクセス権限の制限</li>
            <li>定期的なセキュリティ監査</li>
            <li>従業員への教育・研修</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            4. 個人情報の第三者提供
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            当アプリでは、以下の場合を除き、個人情報を第三者に提供いたしません：
          </Typography>
          <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
            <li>ユーザーの事前同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            5. ユーザーの権利
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            ユーザーは以下の権利を有します：
          </Typography>
          <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
            <li>個人情報の開示請求</li>
            <li>個人情報の訂正・追加・削除請求</li>
            <li>個人情報の利用停止・消去請求</li>
            <li>個人情報の第三者提供の停止請求</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            6. クッキー（Cookie）の使用
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            当アプリでは、ユーザーエクスペリエンスの向上のため、クッキーを使用しています。
            クッキーの使用を拒否する場合は、ブラウザの設定で無効にすることができます。
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            7. プライバシーポリシーの変更
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            当アプリは、必要に応じてこのプライバシーポリシーを変更することがあります。
            重要な変更がある場合は、アプリ内またはメールでお知らせいたします。
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            8. お問い合わせ
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            プライバシーポリシーに関するお問い合わせは、以下の方法でお受けいたします：
          </Typography>
          <Box sx={{ color: '#333', pl: 2 }}>
            <Typography sx={{ mb: 1 }}>
              <strong>お問い合わせ:</strong> <a href="https://aoiroserver.site/contact/" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>お問い合わせフォーム</a>
            </Typography>
            <Typography>
              <strong>Discord:</strong> <a href="https://discord.com/invite/U9DVtc2y5J" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>サーバーに参加</a>
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            9. 制定日・改定日
          </Typography>
          <Typography sx={{ color: '#333', mb: 2, lineHeight: 1.6 }}>
            制定日: 2024年1月1日<br />
            最終改定日: 2024年12月19日
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
} 