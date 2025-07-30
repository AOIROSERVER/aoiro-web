import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    console.log('🔧 メール通知退会処理開始:', email);

    // 指定されたメールアドレスの通知設定を無効化
    const { error } = await supabase
      .from('anonymous_email_notification_settings')
      .update({
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.error('退会処理エラー:', error);
      return NextResponse.json(
        { error: '退会処理に失敗しました' },
        { status: 500 }
      );
    }

    // 退会完了メールを送信
    try {
      const emailResponse = await fetch('/api/unsubscribe-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      
      if (emailResponse.ok) {
        console.log('✅ 退会完了メール送信成功');
      } else {
        console.error('❌ 退会完了メール送信失敗');
      }
    } catch (emailError) {
      console.error('❌ 退会完了メール送信エラー:', emailError);
    }

    console.log('✅ 退会処理完了:', email);
    return NextResponse.json({ 
      success: true, 
      message: '退会処理が完了しました' 
    });

  } catch (error) {
    console.error('退会処理エラー:', error);
    return NextResponse.json(
      { error: '退会処理に失敗しました' },
      { status: 500 }
    );
  }
} 