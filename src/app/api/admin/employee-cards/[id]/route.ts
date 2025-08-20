import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// サービスロールキーが設定されている場合はそれを使用、そうでなければ匿名キーを使用
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 社員証明書を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user_email, section_name, employee_number, card_number, issue_date, expiry_date } = body;

    // 必須フィールドのバリデーション
    if (!user_email || !section_name || !employee_number || !card_number || !issue_date || !expiry_date) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // メールアドレスからユーザーIDを取得
    let user_id: string;
    
    try {
      // リクエストヘッダーから認証トークンを取得
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: '認証トークンが提供されていません' },
          { status: 401 }
        );
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      // トークンからユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return NextResponse.json(
          { error: '認証に失敗しました' },
          { status: 401 }
        );
      }
      
      // 管理者権限チェック
      if (user.email !== 'aoiroserver.m@gmail.com') {
        return NextResponse.json(
          { error: '管理者権限がありません' },
          { status: 403 }
        );
      }
      
      // 指定されたメールアドレスからユーザーIDを生成
      user_id = Buffer.from(user_email).toString('base64').slice(0, 36);
      
    } catch (userLookupError) {
      return NextResponse.json(
        { error: 'ユーザー検索中にエラーが発生しました' },
        { status: 500 }
      );
    }

    // 既存の社員番号との重複チェック（自分以外）
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('employee_number', employee_number)
      .eq('is_active', true)
      .neq('id', id)
      .single();

    if (existingEmployee && !checkError) {
      return NextResponse.json(
        { error: 'この社員番号は既に使用されています' },
        { status: 400 }
      );
    }

    // 既存のユーザーIDとの重複チェック（自分以外）
    const { data: existingUser, error: userCheckError } = await supabase
      .from('employee_cards')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .neq('id', id)
      .single();

    if (existingUser && !userCheckError) {
      return NextResponse.json(
        { error: 'このユーザーは既に社員証明書が発行されています' },
        { status: 400 }
      );
    }

    // 社員証明書を更新
    const { data: updatedCard, error: updateError } = await supabase
      .from('employee_cards')
      .update({
        user_id,
        section_name,
        employee_number,
        card_number,
        issue_date,
        expiry_date
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('更新エラー:', updateError);
      return NextResponse.json(
        { error: '社員証明書の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employeeCard: updatedCard
    });

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 社員証明書を削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 社員証明書を論理削除（is_activeをfalseに設定）
    const { error: deleteError } = await supabase
      .from('employee_cards')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('削除エラー:', deleteError);
      return NextResponse.json(
        { error: '社員証明書の削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '社員証明書を削除しました'
    });

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
