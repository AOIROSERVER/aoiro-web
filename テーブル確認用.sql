-- 存在するテーブルを確認するSQL

-- 1. 存在するテーブル一覧を表示
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%profile%'
ORDER BY table_name;

-- 2. 存在するテーブル全一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;