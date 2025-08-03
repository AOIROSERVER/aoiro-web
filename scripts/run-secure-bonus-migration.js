const fs = require('fs');
const path = require('path');

async function generateSecureBonusMigration() {
  try {
    console.log('🚀 セキュアなログインボーナスシステムのSQL生成開始...');

    // SQLファイルを読み込み
    const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_secure_login_bonus.sql');
    const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('✅ SQLファイルが読み込まれました');
    console.log('📁 ファイルパス:', sqlFilePath);
    console.log('');
    console.log('📋 次の手順でマイグレーションを実行してください:');
    console.log('');
    console.log('1. Supabaseダッシュボードにアクセス');
    console.log('2. SQL Editorを開く');
    console.log('3. 以下のSQLをコピー&ペースト');
    console.log('4. "Run"ボタンをクリック');
    console.log('');
    console.log('=== SQL内容 ===');
    console.log(migrationSQL);
    console.log('=== SQL内容終了 ===');
    console.log('');
    console.log('⚠️  注意事項:');
    console.log('- このSQLは既存のデータを移行します');
    console.log('- 実行前にバックアップを取ることを推奨します');
    console.log('- 新しいテーブル構造により、より確実なボーナス管理が可能になります');
    console.log('');
    console.log('✅ マイグレーション完了後、新しいAPIエンドポイントが使用されます');

  } catch (error) {
    console.error('❌ マイグレーションSQL生成エラー:', error);
  }
}

generateSecureBonusMigration(); 