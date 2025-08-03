-- ================================================
-- AOIROSERVER クエストシステム 基本版
-- 手動実行用 - 最小限のテーブル構成
-- ================================================

-- 既存のテーブルを削除（クリーンインストール）
DROP TABLE IF EXISTS public.quest_tasks CASCADE;
DROP TABLE IF EXISTS public.quests CASCADE;

-- ================================================
-- 1. メインクエストテーブル
-- ================================================
CREATE TABLE public.quests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    description text NOT NULL,
    detailed_description text,
    category text NOT NULL DEFAULT 'daily',
    difficulty text NOT NULL DEFAULT 'easy',
    reward text DEFAULT '100ポイント' NOT NULL,
    estimated_time text,
    icon text DEFAULT 'assignment' NOT NULL,
    background_image text,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_by text DEFAULT 'admin',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quests_category_check CHECK (category IN ('daily', 'weekly', 'special')),
    CONSTRAINT quests_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- ================================================
-- 2. クエストタスクテーブル
-- ================================================
CREATE TABLE public.quest_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quest_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    display_order integer DEFAULT 1 NOT NULL,
    is_optional boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quest_tasks_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT quest_tasks_order_check CHECK (display_order > 0)
);

-- ================================================
-- インデックス作成
-- ================================================
CREATE INDEX idx_quests_category ON public.quests (category);
CREATE INDEX idx_quests_active ON public.quests (is_active);
CREATE INDEX idx_quests_dates ON public.quests (start_date, end_date);
CREATE INDEX idx_quest_tasks_quest_id ON public.quest_tasks (quest_id);
CREATE INDEX idx_quest_tasks_order ON public.quest_tasks (quest_id, display_order);

-- ================================================
-- Row Level Security (RLS) 設定
-- ================================================

-- クエストテーブル
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがアクティブなクエストを閲覧可能
CREATE POLICY "quests_select_active" ON public.quests
    FOR SELECT USING (is_active = true);

-- 認証済みユーザーがクエストを作成可能
CREATE POLICY "quests_insert_authenticated" ON public.quests
    FOR INSERT TO authenticated WITH CHECK (true);

-- 認証済みユーザーがクエストを更新可能
CREATE POLICY "quests_update_authenticated" ON public.quests
    FOR UPDATE TO authenticated USING (true);

-- 認証済みユーザーがクエストを削除可能
CREATE POLICY "quests_delete_authenticated" ON public.quests
    FOR DELETE TO authenticated USING (true);

-- クエストタスクテーブル
ALTER TABLE public.quest_tasks ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがタスクを閲覧可能
CREATE POLICY "quest_tasks_select_all" ON public.quest_tasks FOR SELECT USING (true);

-- 認証済みユーザーがタスクを管理可能
CREATE POLICY "quest_tasks_insert_authenticated" ON public.quest_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quest_tasks_update_authenticated" ON public.quest_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "quest_tasks_delete_authenticated" ON public.quest_tasks FOR DELETE TO authenticated USING (true);

-- ================================================
-- サンプルデータ挿入
-- ================================================
INSERT INTO public.quests (
    title, description, detailed_description, category, difficulty, 
    reward, estimated_time, icon, start_date, end_date
) VALUES 
(
    '🌅 朝の始まり', 
    'システムにログインして今日の活動を開始しよう',
    'アプリケーションにログインし、ダッシュボードを確認して今日のタスクを把握します。継続的な利用習慣を身につけるための基本的なクエストです。',
    'daily', 'easy', '50ポイント', '3分', 'wb_sunny',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day'
),
(
    '📊 データ確認マスター', 
    '重要な統計情報を確認して異常がないかチェック',
    'システムの各種メトリクスとパフォーマンス指標を確認し、潜在的な問題を早期発見します。データドリブンな意思決定の基礎となる重要な作業です。',
    'daily', 'medium', '100ポイント', '15分', 'analytics',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day'
),
(
    '🚀 週次レビュー', 
    '一週間の成果をまとめて詳細なレポートを作成',
    '過去一週間のデータを収集・分析し、改善点と成功要因を特定します。チームやステークホルダーと共有するための包括的なレポートを作成します。',
    'weekly', 'hard', '300ポイント', '1時間', 'assessment',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'
);

-- タスクの挿入
DO $$
DECLARE
    quest_record RECORD;
BEGIN
    -- 朝の始まりクエストのタスク
    SELECT id INTO quest_record FROM public.quests WHERE title LIKE '%朝の始まり%' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.quest_tasks (quest_id, title, description, display_order) VALUES
        (quest_record.id, 'システムにログイン', 'アプリケーションにログインします', 1),
        (quest_record.id, 'ダッシュボード確認', 'メインダッシュボードの情報を確認します', 2),
        (quest_record.id, '今日のタスク確認', '本日予定されているタスクリストを確認します', 3);
    END IF;
    
    -- データ確認マスタークエストのタスク
    SELECT id INTO quest_record FROM public.quests WHERE title LIKE '%データ確認%' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.quest_tasks (quest_id, title, description, display_order) VALUES
        (quest_record.id, 'パフォーマンス指標確認', 'システムのパフォーマンス指標を確認', 1),
        (quest_record.id, 'エラーログチェック', 'エラーログを確認して問題を特定', 2),
        (quest_record.id, 'データ整合性確認', 'データベースの整合性をチェック', 3),
        (quest_record.id, 'レポート生成', '日次レポートを生成して確認', 4);
    END IF;
    
    -- 週次レビュークエストのタスク
    SELECT id INTO quest_record FROM public.quests WHERE title LIKE '%週次レビュー%' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.quest_tasks (quest_id, title, description, display_order) VALUES
        (quest_record.id, 'データ収集', '一週間分のパフォーマンスデータを収集', 1),
        (quest_record.id, 'トレンド分析', 'データのトレンドと傾向を分析', 2),
        (quest_record.id, 'レポート執筆', '包括的な分析レポートを執筆', 3),
        (quest_record.id, 'ステークホルダー共有', 'チームやマネジメントとレポートを共有', 4);
    END IF;
END $$;

-- ================================================
-- 完了メッセージ
-- ================================================
DO $$
DECLARE
    quest_count integer;
    task_count integer;
BEGIN
    SELECT COUNT(*) INTO quest_count FROM public.quests;
    SELECT COUNT(*) INTO task_count FROM public.quest_tasks;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'クエストシステム基本版セットアップ完了！';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'クエスト数: % 件', quest_count;
    RAISE NOTICE 'タスク数: % 件', task_count;
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ テーブル作成完了';
    RAISE NOTICE '✅ RLS設定完了';
    RAISE NOTICE '✅ サンプルデータ挿入完了';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'システム準備完了 - クエスト作成可能！';
    RAISE NOTICE '==========================================';
END $$;