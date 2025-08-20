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
    
    const { user_id, section_name, employee_number, card_number, issue_date, expiry_date } = body;

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
    
    console.log('✅ ユーザー認証成功:', user.email);
    
    // 既存の社員証明書との重複チェック
    const { data: existingCard, error: checkError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingCard && !checkError) {
      console.error('❌ 既存の社員証明書が存在:', user.id);
      return NextResponse.json(
        { error: 'このユーザーは既に社員証明書が発行されています' },
        { status: 400 }
      );
    }

    // 既存の社員番号との重複チェック
    const { data: existingEmployee, error: employeeCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('employee_number', employee_number)
      .single();

    if (existingEmployee && !employeeCheckError) {
      console.error('❌ 社員番号重複:', employee_number);
      // 新しい社員番号を生成
      const newEmployeeNumber = `EMP${Date.now().toString().slice(-6)}`;
      console.log('🔄 新しい社員番号を生成:', newEmployeeNumber);
      body.employee_number = newEmployeeNumber;
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
        user_id: user.id,
        section_name: body.section_name,
        employee_number: body.employee_number,
        card_number: body.card_number,
        issue_date: body.issue_date,
        expiry_date: body.expiry_date,
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

    console.log('✅ 社員証明書自動生成成功:', newCard.id);

    return NextResponse.json({
      success: true,
      employeeCard: newCard,
      message: '社員証明書が正常に生成されました'
    });

  } catch (error) {
    console.error('❌ APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
