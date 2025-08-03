const fs = require('fs');
const path = require('path');

async function generateAddPointsColumnMigration() {
  try {
    console.log('🚀 user_profilesテーブルにpointsカラムを追加するマイグレーションSQL生成開始...');
    
    const migrationSQL = `
-- user_profilesテーブルにpointsカラムを追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 既存のレコードに対してデフォルト値を設定
UPDATE user_profiles
SET points = 0
WHERE points IS NULL;

-- インデックスの作成（オプション）
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(points);

-- 確認用クエリ
SELECT 
  COUNT(*) as total_users,
  COUNT(points) as users_with_points,
  AVG(points) as average_points,
  MIN(points) as min_points,
  MAX(points) as max_points
FROM user_profiles;
`;

    const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_points_to_user_profiles.sql');
    fs.writeFileSync(outputPath, migrationSQL);

    console.log('✅ マイグレーションSQLファイルが生成されました');
    console.log('📁 ファイルパス:', outputPath);
    console.log('');
    console.log('📋 次の手順でマイグレーションを実行してください:');
    console.log('');
    console.log('1. Supabaseダッシュボードにアクセス');
    console.log('2. SQL Editorを開く');
    console.log('3. 生成されたSQLファイルの内容をコピー&ペースト');
    console.log('4. "Run"ボタンをクリック');
    console.log('');
    console.log('または、以下のコマンドでSQLファイルの内容を表示:');
    console.log('cat', outputPath);

  } catch (error) {
    console.error('❌ マイグレーションSQL生成エラー:', error);
  }
}

generateAddPointsColumnMigration(); 