-- ================================================
-- AOIROSERVER クエストシステム 完全版
-- 作成日: 2024-12-02
-- 機能: 完全なクエストシステム、報酬、統計、管理機能
-- ================================================

-- セッション設定
SET session_replication_role = replica;

-- 既存のテーブル、関数、トリガーを削除（クリーンインストール）
DROP TABLE IF EXISTS quest_statistics CASCADE;
DROP TABLE IF EXISTS quest_rewards CASCADE;
DROP TABLE IF EXISTS user_task_completion CASCADE;
DROP TABLE IF EXISTS user_quest_progress CASCADE;
DROP TABLE IF EXISTS quest_tasks CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS quest_categories CASCADE;

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_quest_progress() CASCADE;
DROP FUNCTION IF EXISTS public.complete_quest() CASCADE;
DROP FUNCTION IF EXISTS public.award_quest_reward() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_quest_stats() CASCADE;

-- ================================================
-- 1. クエストカテゴリマスターテーブル
-- ================================================
CREATE TABLE public.quest_categories (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text DEFAULT 'category',
    color text DEFAULT '#6366f1',
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ================================================
-- 2. メインクエストテーブル
-- ================================================
CREATE TABLE public.quests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    description text NOT NULL,
    detailed_description text,
    category text NOT NULL DEFAULT 'daily',
    difficulty text NOT NULL DEFAULT 'easy',
    reward_points integer DEFAULT 100 NOT NULL,
    reward_description text,
    estimated_time text,
    icon text DEFAULT 'assignment' NOT NULL,
    background_image text,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    max_participants integer, -- 参加者数制限
    current_participants integer DEFAULT 0,
    prerequisite_quest_ids uuid[], -- 前提クエスト
    tags text[], -- タグ配列
    metadata jsonb DEFAULT '{}', -- 拡張メタデータ
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quests_category_fkey FOREIGN KEY (category) REFERENCES public.quest_categories(id) ON UPDATE CASCADE,
    CONSTRAINT quests_category_check CHECK (category IN ('daily', 'weekly', 'special', 'event', 'tutorial', 'achievement')),
    CONSTRAINT quests_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    CONSTRAINT quests_reward_points_check CHECK (reward_points >= 0),
    CONSTRAINT quests_participants_check CHECK (current_participants <= max_participants OR max_participants IS NULL),
    CONSTRAINT quests_dates_check CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- ================================================
-- 3. クエストタスクテーブル
-- ================================================
CREATE TABLE public.quest_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quest_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    display_order integer DEFAULT 1 NOT NULL,
    is_optional boolean DEFAULT false NOT NULL,
    points integer DEFAULT 0, -- タスク個別ポイント
    task_type text DEFAULT 'manual', -- manual, auto, api
    validation_data jsonb DEFAULT '{}', -- 自動検証用データ
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quest_tasks_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT quest_tasks_type_check CHECK (task_type IN ('manual', 'auto', 'api')),
    CONSTRAINT quest_tasks_points_check CHECK (points >= 0),
    CONSTRAINT quest_tasks_order_check CHECK (display_order > 0)
);

-- ================================================
-- 4. ユーザークエスト進行状況テーブル
-- ================================================
CREATE TABLE public.user_quest_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    quest_id uuid NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    max_progress integer DEFAULT 1 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    points_earned integer DEFAULT 0,
    bonus_points integer DEFAULT 0,
    completion_data jsonb DEFAULT '{}', -- 完了時の追加データ
    
    CONSTRAINT user_quest_progress_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT user_quest_progress_user_quest_unique UNIQUE (user_id, quest_id),
    CONSTRAINT user_quest_progress_progress_check CHECK (progress >= 0 AND progress <= max_progress),
    CONSTRAINT user_quest_progress_points_check CHECK (points_earned >= 0 AND bonus_points >= 0)
);

-- ================================================
-- 5. ユーザータスク完了状況テーブル
-- ================================================
CREATE TABLE public.user_task_completion (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    quest_id uuid NOT NULL,
    task_id uuid NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    verification_data jsonb DEFAULT '{}', -- 検証データ
    points_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT user_task_completion_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT user_task_completion_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.quest_tasks(id) ON DELETE CASCADE,
    CONSTRAINT user_task_completion_user_task_unique UNIQUE (user_id, task_id),
    CONSTRAINT user_task_completion_points_check CHECK (points_earned >= 0)
);

-- ================================================
-- 6. クエスト報酬テーブル
-- ================================================
CREATE TABLE public.quest_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quest_id uuid NOT NULL,
    reward_type text NOT NULL, -- points, badge, item, unlock
    reward_value text NOT NULL, -- 報酬の値や識別子
    reward_amount integer DEFAULT 1,
    condition_type text DEFAULT 'completion', -- completion, perfect, speed
    condition_data jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quest_rewards_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT quest_rewards_type_check CHECK (reward_type IN ('points', 'badge', 'item', 'unlock', 'title')),
    CONSTRAINT quest_rewards_condition_check CHECK (condition_type IN ('completion', 'perfect', 'speed', 'first')),
    CONSTRAINT quest_rewards_amount_check CHECK (reward_amount > 0)
);

-- ================================================
-- 7. クエスト統計テーブル
-- ================================================
CREATE TABLE public.quest_statistics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quest_id uuid NOT NULL,
    total_attempts integer DEFAULT 0,
    total_completions integer DEFAULT 0,
    average_completion_time interval,
    completion_rate decimal(5,2) DEFAULT 0.00,
    difficulty_rating decimal(3,2) DEFAULT 0.00,
    user_rating decimal(3,2) DEFAULT 0.00,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT quest_statistics_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE,
    CONSTRAINT quest_statistics_quest_id_unique UNIQUE (quest_id),
    CONSTRAINT quest_statistics_positive_check CHECK (
        total_attempts >= 0 AND 
        total_completions >= 0 AND 
        total_completions <= total_attempts AND
        completion_rate >= 0 AND completion_rate <= 100 AND
        difficulty_rating >= 0 AND difficulty_rating <= 5 AND
        user_rating >= 0 AND user_rating <= 5
    )
);

-- ================================================
-- インデックス作成（パフォーマンス最適化）
-- ================================================

-- クエストテーブル
CREATE INDEX idx_quests_category ON public.quests (category);
CREATE INDEX idx_quests_difficulty ON public.quests (difficulty);
CREATE INDEX idx_quests_active ON public.quests (is_active);
CREATE INDEX idx_quests_featured ON public.quests (is_featured);
CREATE INDEX idx_quests_dates ON public.quests (start_date, end_date);
CREATE INDEX idx_quests_created_by ON public.quests (created_by);
CREATE INDEX idx_quests_metadata ON public.quests USING gin (metadata);
CREATE INDEX idx_quests_tags ON public.quests USING gin (tags);

-- クエストタスクテーブル
CREATE INDEX idx_quest_tasks_quest_id ON public.quest_tasks (quest_id);
CREATE INDEX idx_quest_tasks_order ON public.quest_tasks (quest_id, display_order);
CREATE INDEX idx_quest_tasks_type ON public.quest_tasks (task_type);

-- ユーザー進行状況テーブル
CREATE INDEX idx_user_quest_progress_user ON public.user_quest_progress (user_id);
CREATE INDEX idx_user_quest_progress_quest ON public.user_quest_progress (quest_id);
CREATE INDEX idx_user_quest_progress_completed ON public.user_quest_progress (completed);
CREATE INDEX idx_user_quest_progress_user_completed ON public.user_quest_progress (user_id, completed);

-- ユーザータスク完了テーブル
CREATE INDEX idx_user_task_completion_user ON public.user_task_completion (user_id);
CREATE INDEX idx_user_task_completion_quest ON public.user_task_completion (quest_id);
CREATE INDEX idx_user_task_completion_task ON public.user_task_completion (task_id);
CREATE INDEX idx_user_task_completion_completed ON public.user_task_completion (completed);

-- 報酬テーブル
CREATE INDEX idx_quest_rewards_quest_id ON public.quest_rewards (quest_id);
CREATE INDEX idx_quest_rewards_type ON public.quest_rewards (reward_type);
CREATE INDEX idx_quest_rewards_active ON public.quest_rewards (is_active);

-- 統計テーブル
CREATE INDEX idx_quest_statistics_completion_rate ON public.quest_statistics (completion_rate);
CREATE INDEX idx_quest_statistics_rating ON public.quest_statistics (user_rating);

-- ================================================
-- トリガー関数定義
-- ================================================

-- 1. updated_at自動更新関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. クエスト進行状況計算関数
CREATE OR REPLACE FUNCTION public.calculate_quest_progress(p_user_id uuid, p_quest_id uuid)
RETURNS void AS $$
DECLARE
    v_total_tasks integer;
    v_completed_tasks integer;
    v_progress integer;
    v_all_completed boolean;
BEGIN
    -- タスク数を取得
    SELECT COUNT(*) INTO v_total_tasks
    FROM public.quest_tasks
    WHERE quest_id = p_quest_id;
    
    -- 完了タスク数を取得
    SELECT COUNT(*) INTO v_completed_tasks
    FROM public.user_task_completion
    WHERE user_id = p_user_id 
    AND quest_id = p_quest_id 
    AND completed = true;
    
    -- 進行率計算
    v_progress := CASE 
        WHEN v_total_tasks = 0 THEN 1
        ELSE v_completed_tasks
    END;
    
    v_all_completed := (v_completed_tasks = v_total_tasks AND v_total_tasks > 0);
    
    -- 進行状況を更新
    INSERT INTO public.user_quest_progress (
        user_id, quest_id, progress, max_progress, completed, completed_at
    ) VALUES (
        p_user_id, p_quest_id, v_progress, v_total_tasks, v_all_completed,
        CASE WHEN v_all_completed THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, quest_id) DO UPDATE SET
        progress = EXCLUDED.progress,
        max_progress = EXCLUDED.max_progress,
        completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 3. クエスト完了処理関数
CREATE OR REPLACE FUNCTION public.complete_quest(p_user_id uuid, p_quest_id uuid)
RETURNS boolean AS $$
DECLARE
    v_quest_record RECORD;
    v_total_points integer := 0;
BEGIN
    -- クエスト情報を取得
    SELECT * INTO v_quest_record
    FROM public.quests
    WHERE id = p_quest_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- ポイント計算
    v_total_points := v_quest_record.reward_points;
    
    -- タスクポイントを加算
    v_total_points := v_total_points + COALESCE((
        SELECT SUM(qt.points)
        FROM public.quest_tasks qt
        JOIN public.user_task_completion utc ON qt.id = utc.task_id
        WHERE qt.quest_id = p_quest_id 
        AND utc.user_id = p_user_id 
        AND utc.completed = true
    ), 0);
    
    -- 進行状況更新
    UPDATE public.user_quest_progress
    SET 
        completed = true,
        completed_at = now(),
        points_earned = v_total_points,
        updated_at = now()
    WHERE user_id = p_user_id AND quest_id = p_quest_id;
    
    -- 統計更新
    INSERT INTO public.quest_statistics (quest_id, total_completions)
    VALUES (p_quest_id, 1)
    ON CONFLICT (quest_id) DO UPDATE SET
        total_completions = quest_statistics.total_completions + 1,
        completion_rate = (quest_statistics.total_completions + 1.0) / quest_statistics.total_attempts * 100,
        last_updated = now();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 4. ユーザー統計取得関数
CREATE OR REPLACE FUNCTION public.get_user_quest_stats(p_user_id uuid)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'total_quests_started', COUNT(*),
        'total_quests_completed', COUNT(*) FILTER (WHERE completed = true),
        'total_points_earned', COALESCE(SUM(points_earned), 0),
        'completion_rate', ROUND(
            COUNT(*) FILTER (WHERE completed = true) * 100.0 / NULLIF(COUNT(*), 0), 2
        ),
        'average_completion_time', AVG(
            EXTRACT(EPOCH FROM (completed_at - started_at))
        ) FILTER (WHERE completed = true)
    ) INTO v_result
    FROM public.user_quest_progress
    WHERE user_id = p_user_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- トリガー設定
-- ================================================

-- updated_at自動更新トリガー
CREATE TRIGGER update_quests_updated_at 
    BEFORE UPDATE ON public.quests 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_quest_progress_updated_at 
    BEFORE UPDATE ON public.user_quest_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- タスク完了時の進行状況自動計算
CREATE OR REPLACE FUNCTION public.auto_calculate_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.completed != NEW.completed) THEN
        PERFORM public.calculate_quest_progress(NEW.user_id, NEW.quest_id);
        
        -- クエスト完了チェック
        IF NEW.completed = true THEN
            DECLARE
                v_quest_completed boolean;
            BEGIN
                SELECT completed INTO v_quest_completed
                FROM public.user_quest_progress
                WHERE user_id = NEW.user_id AND quest_id = NEW.quest_id;
                
                IF v_quest_completed = true THEN
                    PERFORM public.complete_quest(NEW.user_id, NEW.quest_id);
                END IF;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_progress
    AFTER INSERT OR UPDATE ON public.user_task_completion
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_calculate_progress();

-- ================================================
-- Row Level Security (RLS) 設定
-- ================================================

-- クエストカテゴリテーブル（読み取り専用）
ALTER TABLE public.quest_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_categories_select_all" ON public.quest_categories FOR SELECT USING (true);

-- クエストテーブル
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quests_select_active" ON public.quests
    FOR SELECT USING (is_active = true);

CREATE POLICY "quests_insert_authenticated" ON public.quests
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "quests_update_creator" ON public.quests
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "quests_delete_creator" ON public.quests
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- クエストタスクテーブル
ALTER TABLE public.quest_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quest_tasks_select_all" ON public.quest_tasks FOR SELECT USING (true);
CREATE POLICY "quest_tasks_insert_authenticated" ON public.quest_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quest_tasks_update_authenticated" ON public.quest_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "quest_tasks_delete_authenticated" ON public.quest_tasks FOR DELETE TO authenticated USING (true);

-- ユーザー進行状況テーブル
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_quest_progress_select_own" ON public.user_quest_progress
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_quest_progress_insert_own" ON public.user_quest_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_quest_progress_update_own" ON public.user_quest_progress
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ユーザータスク完了テーブル
ALTER TABLE public.user_task_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_task_completion_select_own" ON public.user_task_completion
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_task_completion_insert_own" ON public.user_task_completion
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_task_completion_update_own" ON public.user_task_completion
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- クエスト報酬テーブル
ALTER TABLE public.quest_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_rewards_select_all" ON public.quest_rewards FOR SELECT USING (true);
CREATE POLICY "quest_rewards_manage_authenticated" ON public.quest_rewards FOR ALL TO authenticated USING (true);

-- クエスト統計テーブル
ALTER TABLE public.quest_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_statistics_select_all" ON public.quest_statistics FOR SELECT USING (true);
CREATE POLICY "quest_statistics_manage_authenticated" ON public.quest_statistics FOR ALL TO authenticated USING (true);

-- ================================================
-- 初期データ挿入
-- ================================================

-- クエストカテゴリ
INSERT INTO public.quest_categories (id, name, description, icon, color, sort_order) VALUES
('daily', 'デイリー', '毎日実行できるクエスト', 'today', '#10b981', 1),
('weekly', 'ウィークリー', '週単位のクエスト', 'date_range', '#6366f1', 2),
('special', 'スペシャル', '特別なイベントクエスト', 'star', '#f59e0b', 3),
('event', 'イベント', '期間限定イベント', 'event', '#ef4444', 4),
('tutorial', 'チュートリアル', '初心者向けガイド', 'school', '#8b5cf6', 5),
('achievement', 'アチーブメント', '実績解除クエスト', 'emoji_events', '#ec4899', 6);

-- メインクエスト（豊富なサンプルデータ）
INSERT INTO public.quests (
    title, description, detailed_description, category, difficulty, reward_points, 
    reward_description, estimated_time, icon, background_image, start_date, end_date, tags
) VALUES 
-- デイリークエスト
(
    '🌅 朝の始まり', 
    'システムにログインして今日の活動を開始しよう',
    'アプリケーションにログインし、ダッシュボードを確認して今日のタスクを把握します。継続的な利用習慣を身につけるための基本的なクエストです。',
    'daily', 'easy', 50, 'ログインボーナス + 経験値', '3分', 'wb_sunny', 
    'https://picsum.photos/320/220?random=101',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
    ARRAY['login', 'daily', 'habit']
),
(
    '📊 データ確認マスター', 
    '重要な統計情報を確認して異常がないかチェック',
    'システムの各種メトリクスとパフォーマンス指標を確認し、潜在的な問題を早期発見します。データドリブンな意思決定の基礎となる重要な作業です。',
    'daily', 'medium', 100, 'データ分析バッジ', '15分', 'analytics', 
    'https://picsum.photos/320/220?random=102',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
    ARRAY['analytics', 'monitoring', 'data']
),
(
    '🔄 システム健康診断', 
    'システム全体のヘルスチェックと必要な更新作業',
    'システムの安定性を維持するため、定期的なヘルスチェックを実行し、必要に応じてアップデートや設定調整を行います。',
    'daily', 'hard', 150, 'システム管理者バッジ', '30分', 'system_update', 
    'https://picsum.photos/320/220?random=103',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
    ARRAY['maintenance', 'system', 'admin']
),

-- ウィークリークエスト
(
    '📈 週次パフォーマンス分析', 
    '一週間の成果をまとめて詳細なレポートを作成',
    '過去一週間のデータを収集・分析し、改善点と成功要因を特定します。チームやステークホルダーと共有するための包括的なレポートを作成します。',
    'weekly', 'medium', 300, 'アナリストバッジ + ボーナスポイント', '1時間', 'assessment', 
    'https://picsum.photos/320/220?random=201',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days',
    ARRAY['report', 'analysis', 'weekly']
),
(
    '🛠️ システム最適化プロジェクト', 
    'パフォーマンス向上のための包括的なシステム改善',
    'システム全体のパフォーマンスを詳細に分析し、ボトルネックを特定して最適化を実施します。データベース、API、フロントエンドの全てを対象とした改善作業です。',
    'weekly', 'hard', 500, 'エンジニアマスターバッジ', '3時間', 'build', 
    'https://picsum.photos/320/220?random=202',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days',
    ARRAY['optimization', 'performance', 'engineering']
),

-- スペシャルクエスト
(
    '🚀 革新的機能開発', 
    '次世代機能の設計と実装プロジェクト',
    'ユーザーエクスペリエンスを大幅に向上させる革新的な機能を設計・開発します。最新技術を活用し、競合優位性を確立する重要なプロジェクトです。',
    'special', 'extreme', 1000, 'イノベーターバッジ + 特別報酬', '2週間', 'rocket_launch', 
    'https://picsum.photos/320/220?random=301',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
    ARRAY['innovation', 'development', 'feature']
),
(
    '🎯 マイルストーン征服', 
    'プロジェクトの重要な節目を達成する',
    'チーム全体で協力してプロジェクトの重要なマイルストーンを達成します。品質、スケジュール、予算の全ての観点で成功を収める必要があります。',
    'special', 'hard', 750, 'リーダーシップバッジ', '1週間', 'emoji_events', 
    'https://picsum.photos/320/220?random=302',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days',
    ARRAY['milestone', 'leadership', 'teamwork']
),

-- イベント限定
(
    '🎄 年末イベント特別ミッション', 
    '年末の特別な期間限定チャレンジ',
    '年末年始の特別期間中に実施される限定クエストです。普段とは異なる特別なタスクや、チーム全体でのコラボレーションが含まれます。',
    'event', 'medium', 888, '年末特別バッジ + 限定報酬', '5日間', 'celebration', 
    'https://picsum.photos/320/220?random=401',
    '2024-12-25', '2025-01-05',
    ARRAY['event', 'limited', 'celebration']
),

-- チュートリアル
(
    '📚 システム操作入門', 
    '基本的なシステム操作方法を学ぶ',
    '新規ユーザー向けのチュートリアルクエストです。システムの基本操作、各機能の使い方、効率的な作業方法を段階的に学習します。',
    'tutorial', 'easy', 200, 'ビギナーバッジ + 基本ツール解除', '45分', 'school', 
    'https://picsum.photos/320/220?random=501',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days',
    ARRAY['tutorial', 'beginner', 'learning']
);

-- クエストタスクの自動生成
DO $$
DECLARE
    quest_record RECORD;
BEGIN
    FOR quest_record IN SELECT id, title, difficulty FROM public.quests LOOP
        CASE 
            WHEN quest_record.title LIKE '%朝の始まり%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, 'システムにログイン', 'アプリケーションにログインします', 1, 10),
                (quest_record.id, 'ダッシュボード確認', 'メインダッシュボードの情報を確認します', 2, 15),
                (quest_record.id, '今日のタスク確認', '本日予定されているタスクリストを確認します', 3, 25);
                
            WHEN quest_record.title LIKE '%データ確認%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, 'パフォーマンス指標確認', 'システムのパフォーマンス指標を確認', 1, 25),
                (quest_record.id, 'エラーログチェック', 'エラーログを確認して問題を特定', 2, 25),
                (quest_record.id, 'データ整合性確認', 'データベースの整合性をチェック', 3, 30),
                (quest_record.id, 'レポート生成', '日次レポートを生成して確認', 4, 20);
                
            WHEN quest_record.title LIKE '%システム健康%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, 'システム診断実行', '自動診断ツールを実行してシステム状態を確認', 1, 30),
                (quest_record.id, 'セキュリティ更新確認', 'セキュリティ更新の有無を確認', 2, 35),
                (quest_record.id, 'バックアップ状態確認', 'データバックアップが正常に動作しているか確認', 3, 25),
                (quest_record.id, 'パフォーマンス最適化', 'システムのパフォーマンス最適化を実行', 4, 30),
                (quest_record.id, '診断レポート作成', 'ヘルスチェックの結果をレポートにまとめる', 5, 30);
                
            WHEN quest_record.title LIKE '%週次パフォーマンス%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, 'データ収集', '一週間分のパフォーマンスデータを収集', 1, 50),
                (quest_record.id, 'トレンド分析', 'データのトレンドと傾向を分析', 2, 75),
                (quest_record.id, 'グラフ・チャート作成', '視覚的なレポート素材を作成', 3, 50),
                (quest_record.id, 'レポート執筆', '包括的な分析レポートを執筆', 4, 75),
                (quest_record.id, 'ステークホルダー共有', 'チームやマネジメントとレポートを共有', 5, 50);
                
            WHEN quest_record.title LIKE '%システム最適化%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, 'ボトルネック分析', 'システムのパフォーマンスボトルネックを特定', 1, 75),
                (quest_record.id, 'データベース最適化', 'クエリ最適化とインデックス調整', 2, 100),
                (quest_record.id, 'API パフォーマンス改善', 'API レスポンス時間の最適化', 3, 100),
                (quest_record.id, 'フロントエンド最適化', 'UI/UX パフォーマンスの改善', 4, 75),
                (quest_record.id, '負荷テスト実行', '最適化後のパフォーマンステスト', 5, 75),
                (quest_record.id, '改善効果測定', '最適化の効果を測定して報告', 6, 75);
                
            WHEN quest_record.title LIKE '%革新的機能%' THEN
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, '市場調査・競合分析', '市場ニーズと競合状況を詳細に調査', 1, 100),
                (quest_record.id, '要件定義・仕様策定', '機能要件と技術仕様を詳細に定義', 2, 150),
                (quest_record.id, 'プロトタイプ開発', '概念実証のためのプロトタイプを開発', 3, 200),
                (quest_record.id, 'ユーザーテスト実施', 'ターゲットユーザーによるテストと改善', 4, 150),
                (quest_record.id, '本格実装', '本番品質での機能実装', 5, 250),
                (quest_record.id, 'テスト・品質保証', '包括的なテストと品質保証', 6, 150),
                (quest_record.id, 'ドキュメント整備', '技術文書とユーザーガイドの作成', 7, 100),
                (quest_record.id, 'リリース・展開', '本番環境へのリリースと展開', 8, 150);
                
            ELSE
                -- デフォルトタスク
                INSERT INTO public.quest_tasks (quest_id, title, description, display_order, points) VALUES
                (quest_record.id, '基本タスク実行', '基本的なタスクを実行します', 1, 50),
                (quest_record.id, '進捗確認', '作業の進捗を確認します', 2, 25),
                (quest_record.id, '完了報告', 'タスクの完了を報告します', 3, 25);
        END CASE;
    END LOOP;
END $$;

-- 各クエストの統計レコード初期化
INSERT INTO public.quest_statistics (quest_id, total_attempts, total_completions)
SELECT id, 0, 0 FROM public.quests;

-- ================================================
-- ビューの作成（便利なクエリ用）
-- ================================================

-- アクティブクエスト一覧ビュー
CREATE OR REPLACE VIEW public.active_quests_view AS
SELECT 
    q.*,
    qc.name as category_name,
    qc.color as category_color,
    COUNT(qt.id) as task_count,
    qs.completion_rate,
    qs.user_rating
FROM public.quests q
LEFT JOIN public.quest_categories qc ON q.category = qc.id
LEFT JOIN public.quest_tasks qt ON q.id = qt.quest_id
LEFT JOIN public.quest_statistics qs ON q.id = qs.quest_id
WHERE q.is_active = true
  AND (q.start_date IS NULL OR q.start_date <= CURRENT_DATE)
  AND (q.end_date IS NULL OR q.end_date >= CURRENT_DATE)
GROUP BY q.id, qc.name, qc.color, qs.completion_rate, qs.user_rating
ORDER BY q.is_featured DESC, q.created_at DESC;

-- ユーザー進行状況詳細ビュー
CREATE OR REPLACE VIEW public.user_quest_progress_view AS
SELECT 
    uqp.*,
    q.title as quest_title,
    q.category,
    q.difficulty,
    q.reward_points,
    q.estimated_time,
    q.background_image,
    ROUND((uqp.progress::decimal / NULLIF(uqp.max_progress, 0)) * 100, 1) as completion_percentage
FROM public.user_quest_progress uqp
JOIN public.quests q ON uqp.quest_id = q.id
WHERE q.is_active = true;

-- ================================================
-- 最終セットアップと検証
-- ================================================

-- セッション設定をリセット
SET session_replication_role = DEFAULT;

-- データ整合性チェック
DO $$
DECLARE
    quest_count integer;
    task_count integer;
    category_count integer;
BEGIN
    SELECT COUNT(*) INTO quest_count FROM public.quests;
    SELECT COUNT(*) INTO task_count FROM public.quest_tasks;
    SELECT COUNT(*) INTO category_count FROM public.quest_categories;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'クエストシステム完全版セットアップ完了！';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'カテゴリ数: % 件', category_count;
    RAISE NOTICE 'クエスト数: % 件', quest_count;
    RAISE NOTICE 'タスク数: % 件', task_count;
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ テーブル作成完了';
    RAISE NOTICE '✅ インデックス作成完了';
    RAISE NOTICE '✅ RLS設定完了';
    RAISE NOTICE '✅ トリガー設定完了';
    RAISE NOTICE '✅ 関数定義完了';
    RAISE NOTICE '✅ サンプルデータ挿入完了';
    RAISE NOTICE '✅ ビュー作成完了';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'システム準備完了 - 本格運用可能！';
    RAISE NOTICE '==========================================';
END $$;