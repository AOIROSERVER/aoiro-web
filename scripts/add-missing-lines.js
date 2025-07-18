require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 不足している路線ID
const missingLineIds = ['JO', 'M', 'Z', 'C', 'H', 'G', 'AK', 'AU'];

async function addMissingLines() {
  try {
    console.log('🔧 不足している路線の通知設定を追加開始');

    // 既存の通知設定を取得
    const { data: existingSettings, error: fetchError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*');

    if (fetchError) {
      console.error('❌ 既存設定の取得に失敗:', fetchError);
      return;
    }

    console.log(`📧 既存の通知設定: ${existingSettings.length}件`);

    // メールアドレスごとに不足している路線の設定を追加
    const emailGroups = new Map();
    
    existingSettings.forEach(setting => {
      if (!emailGroups.has(setting.email)) {
        emailGroups.set(setting.email, new Set());
      }
      emailGroups.get(setting.email).add(setting.line_id);
    });

    let addedCount = 0;
    const insertPromises = [];

    for (const [email, existingLineIds] of emailGroups) {
      for (const lineId of missingLineIds) {
        if (!existingLineIds.has(lineId)) {
          const insertData = {
            email: email,
            line_id: lineId,
            enabled: true,
            delay_notification: true,
            suspension_notification: true,
            recovery_notification: true,
            notification_frequency: 'immediate'
          };
          
          insertPromises.push(
            supabase
              .from('anonymous_email_notification_settings')
              .insert(insertData)
              .then(result => {
                if (result.error) {
                  console.error(`❌ ${email}の${lineId}設定追加失敗:`, result.error);
                } else {
                  console.log(`✅ ${email}の${lineId}設定を追加`);
                  addedCount++;
                }
              })
          );
        }
      }
    }

    if (insertPromises.length > 0) {
      await Promise.all(insertPromises);
      console.log(`✅ 完了: ${addedCount}件の設定を追加しました`);
    } else {
      console.log('ℹ️ 追加する設定はありません');
    }

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  }
}

// スクリプト実行
addMissingLines(); 