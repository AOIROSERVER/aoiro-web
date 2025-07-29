-- 古いログインボーナステーブルの削除
-- 注意: このスクリプトは既存データを削除します

-- 既存データの最終確認
SELECT 'login_bonus' as table_name, COUNT(*) as record_count FROM login_bonus
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;

-- 古いテーブルの削除
-- 注意: この操作は元に戻せません
DROP TABLE IF EXISTS login_bonus CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 削除確認
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_bonus') THEN
    RAISE NOTICE 'login_bonusテーブルが正常に削除されました';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE NOTICE 'user_profilesテーブルが正常に削除されました';
  END IF;
END $$;

-- 新しいテーブルの確認
SELECT 'user_profiles_secure' as table_name, COUNT(*) as record_count FROM user_profiles_secure
UNION ALL
SELECT 'login_bonus_history' as table_name, COUNT(*) as record_count FROM login_bonus_history
UNION ALL
SELECT 'bonus_settings' as table_name, COUNT(*) as record_count FROM bonus_settings; 