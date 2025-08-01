import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'aoiro-auth-token',
    debug: process.env.NODE_ENV === 'development',
  },
  // リアルタイム機能を無効化して警告を回避
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // グローバル設定
  global: {
    headers: {
      'X-Client-Info': 'aoiro-web',
    },
  },
});

// クッキー管理のヘルパー関数
export const setAuthCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax${process.env.NODE_ENV === 'production' ? ';secure' : ''}`;
};

export const getAuthCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const removeAuthCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// クエスト関連の型定義
export type QuestCategory = 'daily' | 'weekly' | 'special';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface Quest {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  detailed_description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  reward: string;
  estimated_time?: string;
  icon: string;
  background_image?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestTask {
  id: string;
  quest_id: string;
  title: string;
  description?: string;
  display_order: number;
  is_optional: boolean;
  created_at: string;
}

export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at?: string;
  started_at: string;
  updated_at: string;
}

export interface UserTaskCompletion {
  id: string;
  user_id: string;
  quest_id: string;
  task_id: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface QuestWithTasks extends Quest {
  tasks?: QuestTask[];
}

export interface QuestWithProgress extends QuestWithTasks {
  user_progress?: UserQuestProgress | undefined;
  user_task_completions?: UserTaskCompletion[] | undefined;
}

// クエスト関連の関数

// アクティブなクエストを取得
export const getActiveQuests = async (): Promise<QuestWithTasks[]> => {
  console.log('🔍 Supabase: アクティブなクエストを取得中...');
  
  // 今日の日付を取得（UTC形式）
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('quests')
    .select(`
      *,
      quest_tasks (
        id,
        quest_id,
        title,
        description,
        display_order,
        is_optional,
        created_at
      )
    `)
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gte.${today}`) // 期限がnullまたは今日以降のクエストのみ
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase getActiveQuests エラー:', error);
    throw error;
  }

  console.log('✅ Supabase: クエスト取得成功:', data?.length || 0, '件');

  return data?.map(quest => ({
    ...quest,
    tasks: quest.quest_tasks?.sort((a: any, b: any) => a.display_order - b.display_order) || []
  })) || [];
};

// ユーザーのクエスト進行状況付きでクエストを取得
export const getQuestsWithProgress = async (userId: string): Promise<QuestWithProgress[]> => {
  console.log('🔍 Supabase: ユーザーのクエスト進行状況を取得中...', { userId });
  
  try {
    // まず基本的なクエスト取得を試行
    console.log('🔄 基本クエスト取得を試行...');
    const basicQuests = await getActiveQuests();
    console.log('✅ 基本クエスト取得成功:', basicQuests.length, '件');
    
    // 進行状況は後で実装予定として、今は基本クエストのみ返却
    return basicQuests.map(quest => ({
      ...quest,
      user_progress: undefined,
      user_task_completions: []
    }));
    
  } catch (error) {
    console.error('❌ getQuestsWithProgress 例外:', error);
    throw error;
  }
};

// 特定のクエストを取得
export const getQuestById = async (questId: string): Promise<QuestWithTasks | null> => {
  const { data, error } = await supabase
    .from('quests')
    .select(`
      *,
      quest_tasks (
        id,
        quest_id,
        title,
        display_order,
        created_at
      )
    `)
    .eq('id', questId)
    .single();

  if (error) {
    console.error('Error fetching quest:', error);
    return null;
  }

  return {
    ...data,
    tasks: data.quest_tasks?.sort((a: any, b: any) => a.display_order - b.display_order) || []
  };
};

// データベーステーブルの存在確認
export const checkDatabaseTables = async () => {
  try {
    console.log('🔍 データベーステーブルの存在確認...');
    
    // questsテーブルを確認
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('count(*)')
      .limit(1);
    
    console.log('📊 questsテーブル:', questsError ? '❌ エラー' : '✅ 存在');
    if (questsError) {
      console.error('questsエラー:', questsError);
    }
    
    // quest_tasksテーブルを確認
    const { data: tasksData, error: tasksError } = await supabase
      .from('quest_tasks')
      .select('count(*)')
      .limit(1);
    
    console.log('📊 quest_tasksテーブル:', tasksError ? '❌ エラー' : '✅ 存在');
    if (tasksError) {
      console.error('quest_tasksエラー:', tasksError);
    }
    
    return {
      questsTable: !questsError,
      tasksTable: !tasksError,
      errors: { questsError, tasksError }
    };
  } catch (error) {
    console.error('データベース確認エラー:', error);
    return {
      questsTable: false,
      tasksTable: false,
      errors: { general: error }
    };
  }
};

// クエストを作成（管理者のみ）
export const createQuest = async (questData: {
  title: string;
  subtitle?: string;
  description: string;
  detailed_description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  reward: string;
  estimated_time?: string;
  icon?: string;
  background_image?: string;
  start_date?: string | null;
  end_date?: string | null;
  tasks: { title: string }[];
}): Promise<Quest | null> => {
  // データベーステーブルの確認
  await checkDatabaseTables();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // 最高権限者チェック（localStorage の admin フラグを確認）
  const isSupremeAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
  const isSupabaseAdmin = user?.email === 'aoiroserver.m@gmail.com';
  
  console.log('🔍 createQuest - 認証チェック:', {
    hasUser: !!user,
    userEmail: user?.email || 'null',
    isSupremeAdmin,
    isSupabaseAdmin,
    canProceed: !!(user || isSupremeAdmin)
  });
  
  if (!user && !isSupremeAdmin) {
    throw new Error('ユーザーがログインしていません');
  }
  
  console.log('👤 ユーザー情報:', {
    id: user?.id || 'supreme-admin',
    email: user?.email || 'supreme-admin-access',
    authMethod: user ? 'supabase' : 'supreme-admin'
  });

  // クエストを作成
  console.log('🎮 Supabase: クエスト作成データ:', {
    ...questData,
    background_image: questData.background_image ? 'あり' : 'なし'
  });

  const { data: quest, error: questError } = await supabase
    .from('quests')
    .insert({
      title: questData.title,
      subtitle: questData.subtitle,
      description: questData.description,
      detailed_description: questData.detailed_description,
      category: questData.category,
      difficulty: questData.difficulty,
      reward: questData.reward,
      estimated_time: questData.estimated_time,
      icon: questData.icon || 'assignment',
      background_image: questData.background_image || null,
      start_date: questData.start_date || null,
      end_date: questData.end_date || null,
      is_active: true,
      created_by: user?.id || 'supreme-admin'
    })
    .select()
    .single();

  if (questError) {
    console.error('❌ Supabase: クエスト作成エラー:', questError);
    throw questError;
  }

  console.log('✅ Supabase: クエスト作成成功:', {
    id: quest.id,
    title: quest.title,
    background_image: quest.background_image ? 'あり' : 'なし'
  });

        // タスクを作成
  if (questData.tasks.length > 0) {
    console.log('🎯 タスク作成開始:', questData.tasks.length, '件');
    
    const tasks = questData.tasks.map((task, index) => ({
      quest_id: quest.id,
      title: task.title,
      description: null, // descriptionはNULLを許可
      display_order: index + 1,
      is_optional: false
    }));

    console.log('📝 作成するタスクデータ:', tasks);

    const { data: createdTasks, error: tasksError } = await supabase
      .from('quest_tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      console.error('❌ タスク作成エラー:', tasksError);
      console.error('📋 エラー詳細:', {
        message: tasksError.message,
        details: tasksError.details,
        hint: tasksError.hint,
        code: tasksError.code
      });
      // クエストは作成されているので、タスクエラーでもクエストは返す
    } else {
      console.log('✅ タスク作成成功:', createdTasks?.length || 0, '件');
    }
  } else {
    console.log('⚠️ タスクなし - タスク作成をスキップ');
  }

  return quest;
};

// ユーザーのクエスト進行状況を初期化
export const initializeUserQuestProgress = async (userId: string, questId: string): Promise<UserQuestProgress | null> => {
  // 既存の進行状況をチェック
  const { data: existing } = await supabase
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .single();

  if (existing) {
    return existing;
  }

  // クエストのタスク数を取得
  const { data: tasks } = await supabase
    .from('quest_tasks')
    .select('id')
    .eq('quest_id', questId);

  const maxProgress = tasks?.length || 1;

  const { data, error } = await supabase
    .from('user_quest_progress')
    .insert({
      user_id: userId,
      quest_id: questId,
      progress: 0,
      max_progress: maxProgress,
      completed: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error initializing quest progress:', error);
    throw error;
  }

  return data;
};

// タスクを完了
export const completeTask = async (userId: string, questId: string, taskId: string): Promise<boolean> => {
  // タスク完了をマーク
  const { error: taskError } = await supabase
    .from('user_task_completion')
    .upsert({
      user_id: userId,
      quest_id: questId,
      task_id: taskId,
      completed: true,
      completed_at: new Date().toISOString()
    });

  if (taskError) {
    console.error('Error completing task:', taskError);
    throw taskError;
  }

  // 完了済みタスク数を取得
  const { data: completedTasks } = await supabase
    .from('user_task_completion')
    .select('id')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('completed', true);

  const completedCount = completedTasks?.length || 0;

  // 総タスク数を取得
  const { data: allTasks } = await supabase
    .from('quest_tasks')
    .select('id')
    .eq('quest_id', questId);

  const totalTasks = allTasks?.length || 1;
  const isQuestCompleted = completedCount >= totalTasks;

  // クエスト進行状況を更新
  const { error: progressError } = await supabase
    .from('user_quest_progress')
    .upsert({
      user_id: userId,
      quest_id: questId,
      progress: completedCount,
      max_progress: totalTasks,
      completed: isQuestCompleted,
      completed_at: isQuestCompleted ? new Date().toISOString() : null
    });

  if (progressError) {
    console.error('Error updating quest progress:', progressError);
    throw progressError;
  }

  return isQuestCompleted;
};

// デバッグ用：Supabaseクライアントの状態を確認
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase client initialized');
  console.log('URL:', supabaseUrl);
  console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
  console.log('Environment:', process.env.NODE_ENV);
}