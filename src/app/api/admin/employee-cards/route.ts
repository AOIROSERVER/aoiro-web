import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabaseクライアント初期化:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

// 匿名キーを使用してクライアントサイドの認証を検証
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 全社員証明書情報を取得
export async function GET() {
  try {
    const { data: employeeCards, error } = await supabase
      .from('employee_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('データベースエラー:', error);
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(employeeCards || []);

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 新規社員証明書を作成
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 社員証明書作成API開始');
    
    const body = await request.json();
    console.log('📋 リクエストボディ:', body);
    
    const { user_email, section_name, employee_number, card_number, issue_date, expiry_date } = body;

    // 必須フィールドのバリデーション
    if (!user_email || !section_name || !employee_number || !card_number || !issue_date || !expiry_date) {
      console.error('❌ 必須フィールド不足:', { user_email, section_name, employee_number, card_number, issue_date, expiry_date });
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
      user: user?.email, 
      error: userError,
      hasUser: !!user 
    });
    
    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError);
      return NextResponse.json(
        { error: '認証に失敗しました。再度ログインしてください。' },
        { status: 401 }
      );
    }
    
    // 管理者権限チェック
    if (user.email !== 'aoiroserver.m@gmail.com') {
      console.error('❌ 管理者権限なし:', user.email);
      return NextResponse.json(
        { error: '管理者権限がありません' },
        { status: 403 }
      );
    }
    
    console.log('✅ 管理者認証成功:', user.email);
    
    // 指定されたメールアドレスからユーザーIDを生成
    const user_id = Buffer.from(user_email).toString('base64').slice(0, 36);
    console.log('🆔 生成されたユーザーID:', user_id);
    
    // 既存の社員番号との重複チェック
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('employee_number', employee_number)
      .single();

    if (existingEmployee && !checkError) {
      console.error('❌ 社員番号重複:', employee_number);
      return NextResponse.json(
        { error: 'この社員番号は既に使用されています' },
        { status: 400 }
      );
    }

    // 既存のユーザーIDとの重複チェック
    const { data: existingUser, error: userCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingUser && !userCheckError) {
      console.error('❌ ユーザー重複:', user_id);
      return NextResponse.json(
        { error: 'このユーザーは既に社員証明書が発行されています' },
        { status: 400 }
      );
    }

    // 既存のカード番号との重複チェック
    const { data: existingCardNumber, error: cardCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('card_number', card_number)
      .single();

    if (existingCardNumber && !cardCheckError) {
      console.error('❌ カード番号重複:', card_number);
      // 新しいカード番号を生成
      const newCardNumber = Date.now().toString().padStart(16, '0');
      console.log('🔄 新しいカード番号を生成:', newCardNumber);
      body.card_number = newCardNumber;
    }

    console.log('📝 社員証明書作成開始...');

    // 新規社員証明書を作成
    const { data: newCard, error: insertError } = await supabase
      .from('employee_cards')
      .insert({
        user_id,
        user_email, // メールアドレスも保存
        section_name,
        employee_number,
        card_number,
        issue_date,
        expiry_date,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ 挿入エラー:', insertError);
      return NextResponse.json(
        { error: '社員証明書の作成に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ 社員証明書作成成功:', newCard.id);

    return NextResponse.json({
      success: true,
      employeeCard: newCard
    });

  } catch (error) {
    console.error('❌ APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
