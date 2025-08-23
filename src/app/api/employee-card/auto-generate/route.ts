import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔧 自動生成API初期化:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 社員証明書自動生成API開始');
    
    const body = await request.json();
    console.log('📋 リクエストボディ:', body);
    
    // 環境変数チェック
    console.log('🔧 環境変数チェック:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      supabaseUrl: supabaseUrl?.substring(0, 30) + '...'
    });
    
    const { user_id, section_name, employee_number, card_number, issue_date, expiry_date, discord_user_id } = body;
    
    console.log('📋 Discord ID確認:', {
      discord_user_id,
      discord_user_id_type: typeof discord_user_id,
      has_discord_id: !!discord_user_id,
      isNull: discord_user_id === null,
      isUndefined: discord_user_id === undefined,
      isEmpty: discord_user_id === '',
      stringLength: typeof discord_user_id === 'string' ? discord_user_id.length : 'N/A'
    });

    // 必須フィールドのバリデーション
    if (!user_id || !section_name || !employee_number || !card_number || !issue_date || !expiry_date) {
      console.error('❌ 必須フィールド不足:', { user_id, section_name, employee_number, card_number, issue_date, expiry_date });
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // リクエストヘッダーから認証トークンを取得
    const authHeader = request.headers.get('authorization');
    console.log('🔑 認証ヘッダー:', authHeader ? '存在' : 'なし');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ 認証ヘッダーが不足');
      return NextResponse.json(
        { error: '認証トークンが提供されていません' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 トークン:', token ? `${token.substring(0, 20)}...` : 'なし');
    
    // トークンからユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('👤 getUser結果:', { 
      userId: user?.id, 
      error: userError,
      hasUser: !!user 
    });
    
    // ユーザーのメタデータを詳細にログ出力
    if (user) {
      console.log('🔍 =======[ ユーザーメタデータ詳細 ]=======');
      console.log('🔍 user_id:', user.id);
      console.log('🔍 email:', user.email);
      console.log('🔍 user_metadata:', JSON.stringify(user.user_metadata, null, 2));
      console.log('🔍 app_metadata:', JSON.stringify(user.app_metadata, null, 2));
      console.log('🔍 provider_id:', user.user_metadata?.provider_id);
      console.log('🔍 sub:', user.user_metadata?.sub);
      console.log('🔍 discord_id:', user.user_metadata?.discord_id);
      console.log('🔍 username:', user.user_metadata?.username);
      console.log('🔍 name:', user.user_metadata?.name);
      console.log('🔍 providers:', user.app_metadata?.providers);
      console.log('🔍 =======[ ユーザーメタデータ詳細終了 ]=======');
      
      // バックエンドでもDiscord IDを取得してみる
      const backendDiscordId = user.user_metadata?.provider_id || 
                              user.user_metadata?.sub || 
                              user.user_metadata?.discord_id || 
                              user.user_metadata?.username ||
                              user.user_metadata?.name || 
                              null;
      
      console.log('🎯 バックエンドで取得したDiscord ID:', {
        backendDiscordId,
        type: typeof backendDiscordId,
        fromProviderIdField: user.user_metadata?.provider_id,
        receivedFromFrontend: discord_user_id,
        match: backendDiscordId === discord_user_id
      });
    }
    
    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError);
      return NextResponse.json(
        { error: '認証に失敗しました。再度ログインしてください。' },
        { status: 401 }
      );
    }

    // リクエストのuser_idと認証されたユーザーのIDが一致するかチェック
    if (user.id !== user_id) {
      console.error('❌ ユーザーID不一致:', { 
        requested: user_id, 
        authenticated: user.id 
      });
      return NextResponse.json(
        { error: '認証されたユーザーとリクエストのユーザーが一致しません' },
        { status: 403 }
      );
    }
    
    console.log('✅ ユーザー認証成功:', user.id);
    
    // 既存の社員証明書との重複チェック
    const { data: existingCards, error: checkError } = await supabase
      .from('employee_cards')
      .select('id, is_active')
      .eq('user_id', user.id);

    console.log('🔍 既存カード確認結果:', { existingCards, checkError });

    // 既存カードの情報をログに出力（UPSERTで後から処理）
    if (existingCards && existingCards.length > 0) {
      const activeCards = existingCards.filter(card => card.is_active);
      console.log('📋 既存カード情報:', {
        totalCards: existingCards.length,
        activeCards: activeCards.length,
        willBeDeleted: activeCards.length > 0
      });
    }

    // 既存の社員番号との重複チェック（アクティブなカードのみ）
    const { data: existingEmployee, error: employeeCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('employee_number', employee_number)
      .eq('is_active', true)
      .single();

    if (existingEmployee && !employeeCheckError) {
      console.error('❌ 社員番号重複:', employee_number);
      // 新しい社員番号を生成
      const newEmployeeNumber = `EMP${Date.now().toString().slice(-6)}`;
      console.log('🔄 新しい社員番号を生成:', newEmployeeNumber);
      body.employee_number = newEmployeeNumber;
    }

    // 既存のカード番号との重複チェック（アクティブなカードのみ）
    const { data: existingCardNumber, error: cardCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('card_number', card_number)
      .eq('is_active', true)
      .single();

    if (existingCardNumber && !cardCheckError) {
      console.error('❌ カード番号重複:', card_number);
      // 新しいカード番号を生成
      const newCardNumber = Date.now().toString().padStart(16, '0');
      console.log('🔄 新しいカード番号を生成:', newCardNumber);
      body.card_number = newCardNumber;
    }

    console.log('📝 社員証明書作成開始...');
    
    // デバッグ: テーブル構造を確認
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('employee_cards')
        .select('*')
        .limit(1);
      
      console.log('🔍 employee_cardsテーブル情報:', {
        tableInfo,
        tableError,
        hasTable: !tableError,
        errorCode: tableError?.code,
        errorMessage: tableError?.message
      });
      
      // テーブルが存在しない場合はエラーを返す
      if (tableError && (tableError.code === '42P01' || tableError.message?.includes('does not exist'))) {
        console.log('❌ employee_cardsテーブルが存在しません');
        return NextResponse.json(
          { 
            error: 'employee_cardsテーブルが存在しません。データベースの設定を確認してください。',
            details: tableError.message,
            code: tableError.code
          },
          { status: 500 }
        );
      }
      
      // 権限エラーの場合の詳細チェック
      if (tableError && tableError.code === '42501') {
        console.log('❌ employee_cardsテーブルへのアクセス権限がありません');
        return NextResponse.json(
          { 
            error: 'employee_cardsテーブルへのアクセス権限がありません。RLSポリシーやサービスロールキーを確認してください。',
            details: tableError.message,
            code: tableError.code
          },
          { status: 500 }
        );
      }
    } catch (debugError) {
      console.log('🔍 テーブル構造確認エラー:', debugError);
    }

    // Discord IDのフォールバック処理
    let finalDiscordId = body.discord_user_id;
    
    // フロントエンドからDiscord IDが来ていない場合、バックエンドで取得
    if (!finalDiscordId || finalDiscordId === null || finalDiscordId.trim() === '') {
      const backendDiscordId = user.user_metadata?.provider_id || 
                              user.user_metadata?.sub || 
                              user.user_metadata?.discord_id || 
                              null;
      
      if (backendDiscordId) {
        console.log('🔄 フロントエンドからDiscord IDが取得できなかったため、バックエンドで取得:', backendDiscordId);
        finalDiscordId = String(backendDiscordId);
      }
    }
    
    console.log('🎯 最終的なDiscord ID:', {
      original: body.discord_user_id,
      final: finalDiscordId,
      source: finalDiscordId === body.discord_user_id ? 'frontend' : 'backend_fallback'
    });
    
    // 新規社員証明書を作成
    const insertData: any = {
      user_id: user.id,
      section_name: body.section_name,
      employee_number: body.employee_number,
      card_number: body.card_number,
      issue_date: body.issue_date,
      expiry_date: body.expiry_date,
      is_active: true
    };
    
    // discord_user_idが存在する場合のみ追加
    if (finalDiscordId && finalDiscordId !== null && finalDiscordId.trim() !== '') {
      insertData.discord_user_id = finalDiscordId;
      console.log('✅ Discord IDをデータベースに保存:', finalDiscordId);
    } else {
      console.log('⚠️ Discord IDが空またはnullのため、保存をスキップ');
    }
    
    // user_emailが存在する場合のみ追加（古いスキーマ対応）
    if (user.email) {
      insertData.user_email = user.email;
    }
    
    console.log('📝 挿入データ:', insertData);
    
    console.log('📝 カード挿入処理開始（PostgreSQL UPSERT方式）');
    
    // PostgreSQL UPSERT を使用して確実に処理
    let newCard: any = null;
    let insertError: any = null;
    
    try {
      // まず既存のアクティブなカードがあるかチェック
      const { data: existingActiveCards, error: checkError } = await supabase
        .from('employee_cards')
        .select('id, card_number, employee_number')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      console.log('🔍 既存アクティブカード確認:', { existingActiveCards, checkError });
      
      if (existingActiveCards && existingActiveCards.length > 0) {
        console.log('⚠️ 既存のアクティブなカードが存在します。強制的に削除します。');
        
        // 既存のアクティブなカードのIDリストを取得
        const cardIds = existingActiveCards.map(card => card.id);
        console.log('🗑️ 削除対象カードID:', cardIds);
        
        // SQL DELETE文で強制削除
        const { error: forceDeleteError } = await supabase
          .from('employee_cards')
          .delete()
          .in('id', cardIds);
        
        if (forceDeleteError) {
          console.error('❌ 強制削除エラー:', forceDeleteError);
          return NextResponse.json(
            { 
              error: '既存カードの削除に失敗しました',
              details: forceDeleteError.message,
              code: forceDeleteError.code
            },
            { status: 500 }
          );
        }
        
        console.log('✅ 既存カードの強制削除完了');
        
        // 削除後の確認待ち（データベースの整合性確保）
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 削除が完了したことを確認
        const { data: verifyDeletion } = await supabase
          .from('employee_cards')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        console.log('🔍 削除確認結果:', { remainingCards: verifyDeletion?.length || 0 });
      }
      
      // 新しいカードを挿入
      console.log('📝 新しいカード挿入開始...');
      const { data: insertedCard, error: newInsertError } = await supabase
        .from('employee_cards')
        .insert(insertData)
        .select()
        .single();
      
      newCard = insertedCard;
      insertError = newInsertError;
      
      if (insertedCard) {
        console.log('✅ 新しいカード挿入成功:', {
          cardId: insertedCard.id,
          cardNumber: insertedCard.card_number,
          employeeNumber: insertedCard.employee_number,
          discordUserId: insertedCard.discord_user_id
        });
      }
      
    } catch (upsertError: any) {
      console.error('❌ UPSERT処理エラー:', upsertError);
      insertError = upsertError;
    }

    if (insertError) {
      console.error('❌ 挿入エラー詳細:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        insertData: {
          user_id: user.id,
          section_name: body.section_name,
          employee_number: body.employee_number,
          card_number: body.card_number,
          issue_date: body.issue_date,
          expiry_date: body.expiry_date,
          discord_user_id: body.discord_user_id || null,
          is_active: true
        }
      });
      return NextResponse.json(
        { 
          error: '社員証明書の作成に失敗しました',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('✅ 社員証明書自動生成成功:', newCard.id);

    return NextResponse.json({
      success: true,
      employeeCard: newCard,
      message: '社員証明書が正常に生成されました'
    });

  } catch (error) {
    console.error('❌ APIエラー:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
