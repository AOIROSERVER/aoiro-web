const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixYamanoteSettings() {
  try {
    console.log('🔧 山手線通知設定の修正を開始します');

    // JYの設定を取得
    const { data: jySettings, error: jyError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('line_id', 'JY');

    if (jyError) {
      console.error('❌ JY設定取得エラー:', jyError);
      return;
    }

    console.log(`📧 取得したJY設定: ${jySettings?.length || 0}件`);

    if (!jySettings || jySettings.length === 0) {
      console.log('✅ JY設定が見つからないため、修正は不要です');
      return;
    }

    // 各JY設定をJY1とJY2に分けて作成
    for (const jySetting of jySettings) {
      console.log(`🔧 設定を修正中: ${jySetting.email}`);

      // JY1（内回り）の設定を作成
      const jy1Data = {
        email: jySetting.email,
        line_id: 'JY1',
        enabled: jySetting.enabled,
        delay_notification: jySetting.delay_notification,
        suspension_notification: jySetting.suspension_notification,
        recovery_notification: jySetting.recovery_notification,
        notification_frequency: jySetting.notification_frequency
      };

      // JY2（外回り）の設定を作成
      const jy2Data = {
        email: jySetting.email,
        line_id: 'JY2',
        enabled: jySetting.enabled,
        delay_notification: jySetting.delay_notification,
        suspension_notification: jySetting.suspension_notification,
        recovery_notification: jySetting.recovery_notification,
        notification_frequency: jySetting.notification_frequency
      };

      // JY1とJY2の設定を挿入
      const { error: insertError } = await supabase
        .from('anonymous_email_notification_settings')
        .insert([jy1Data, jy2Data]);

      if (insertError) {
        console.error(`❌ 設定挿入エラー (${jySetting.email}):`, insertError);
        continue;
      }

      // 元のJY設定を削除
      const { error: deleteError } = await supabase
        .from('anonymous_email_notification_settings')
        .delete()
        .eq('id', jySetting.id);

      if (deleteError) {
        console.error(`❌ JY設定削除エラー (${jySetting.email}):`, deleteError);
      } else {
        console.log(`✅ 設定修正完了: ${jySetting.email} (JY → JY1, JY2)`);
      }
    }

    console.log('✅ 山手線通知設定の修正が完了しました');

  } catch (error) {
    console.error('❌ 修正処理エラー:', error);
  }
}

// スクリプト実行
fixYamanoteSettings(); 