-- ============================================================
-- 募集アイキャッチ用 Supabase Storage バケット「recruit-eyecatch」の RLS
-- ============================================================
-- 実行場所: Supabase ダッシュボード → SQL Editor
-- 前提: Storage でバケット「recruit-eyecatch」を public で作成済みであること
-- ============================================================

-- 既に同じ名前のポリシーがある場合は削除してから作成（2回目実行用）
DROP POLICY IF EXISTS "recruit_eyecatch_allow_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "recruit_eyecatch_allow_public_select" ON storage.objects;

-- 認証済みユーザーが recruit-eyecatch にアップロードできるようにする
CREATE POLICY "recruit_eyecatch_allow_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recruit-eyecatch');

-- 誰でも画像を閲覧できるようにする（バケットを public にしている場合は既に許可されている可能性あり）
CREATE POLICY "recruit_eyecatch_allow_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recruit-eyecatch');
