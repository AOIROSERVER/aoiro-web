'use client';

import { Box, Typography, Paper, Container, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function TermsPage() {
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

      {/* メインコンテンツ */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#222', mb: 3 }}>
            利用規約
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
            最終更新日: 2024年1月1日
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第1条（適用）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              本規約は、AOIROSERVER（以下「当社」といいます）が提供する鉄道運行情報サービス（以下「本サービス」といいます）の利用条件を定めるものです。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第2条（利用登録）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              1. 本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を行うものとします。
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              2. 当社は、利用登録申請者が以下のいずれかに該当する場合、利用登録を拒否することがあります。
            </Typography>
            <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
              <li>虚偽の情報を提供した場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、当社が利用登録を適当でないと判断した場合</li>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第3条（禁止事項）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
            </Typography>
            <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
              <li>他の利用者に成りすます行為</li>
              <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第4条（本サービスの提供の停止等）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              1. 当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </Typography>
            <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>その他、当社が本サービスの提供が困難と判断した場合</li>
            </Box>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              2. 当社は、本サービスの提供の停止または中断により利用者または第三者に生じた損害について、一切の責任を負いません。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第5条（利用制限および登録抹消）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              1. 当社は、利用者が以下のいずれかに該当する場合には、事前の通知なく、利用者に対して、本サービスの全部もしくは一部の利用を制限し、または利用者としての登録を抹消することができるものとします。
            </Typography>
            <Box component="ul" sx={{ color: '#333', pl: 3, mb: 2 }}>
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>登録事項に虚偽の事実があることが判明した場合</li>
              <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
            </Box>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              2. 当社は、本条に基づき当社が行った行為により利用者に生じた損害について、一切の責任を負いません。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第6条（免責事項）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              1. 当社は、本サービスに関して、利用者と他の利用者または第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              2. 当社は、本サービスで提供される情報の正確性、完全性、有用性等について一切保証しません。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第7条（サービス内容の変更等）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              当社は、利用者に通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第8条（利用規約の変更）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。なお、本規約変更後、本サービスの利用を継続した場合には、変更後の規約に同意したものとみなします。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第9条（通知または連絡）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              利用者と当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、利用者から、当社が別途定める方法に従った変更通知がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時に利用者へ到達したものとみなします。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第10条（権利義務の譲渡の禁止）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              利用者は、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#222', mt: 3 }}>
              第11条（準拠法・裁判管轄）
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              1. 本規約の解釈にあたっては、日本法を準拠法とします。
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{ minWidth: 120 }}
            >
              戻る
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 