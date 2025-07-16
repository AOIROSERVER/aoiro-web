import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { 
      email, 
      lineId, 
      lineName, 
      status, 
      details, 
      previousStatus, 
      isAnonymous = false,
      notificationType
    } = await request.json();

    if (!email || !lineId || !lineName || !status) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    console.log('📧 メール通知送信開始:', { email, lineName, status, notificationType });

    // メールの件名と内容を生成
    const subject = `【運行情報】${lineName}の状況が更新されました`;
    const statusChangeText = previousStatus ? `${previousStatus} → ${status}` : status;
    
    const emailContent = `
      ${lineName}の運行情報が更新されました。

      【変更内容】
      路線: ${lineName}
      状況: ${statusChangeText}
      ${details ? `詳細: ${details}` : ''}
      
      更新時刻: ${new Date().toLocaleString('ja-JP')}
      
      このメールは自動送信されています。
      通知設定の変更はアプリ内の設定画面から行ってください。
    `;

    // 実際のメール送信を実装
    const mailSent = await sendActualEmail(email, subject, emailContent);
    
    if (!mailSent) {
      console.error('❌ メール送信に失敗しました');
      return NextResponse.json(
        { error: 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ メール送信成功:', { email, lineName, status, notificationType });

    // 通知履歴を保存
    const historyData = {
      email,
      line_id: lineId,
      line_name: lineName,
      status,
      message: details || '',
      sent_at: new Date().toISOString(),
      notification_type: notificationType || 'delay_notification'
    };

    if (isAnonymous) {
      // 匿名ユーザー用の通知履歴に保存
      const { error: historyError } = await supabase
        .from('anonymous_email_notification_history')
        .insert(historyData);

      if (historyError) {
        console.error('匿名ユーザー通知履歴保存エラー:', historyError);
      }
    } else {
      // ログインユーザー用の通知履歴に保存
      const { error: historyError } = await supabase
        .from('email_notification_history')
        .insert(historyData);

      if (historyError) {
        console.error('通知履歴保存エラー:', historyError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'メール通知を送信しました',
      notificationType 
    });

  } catch (error) {
    console.error('❌ メール通知送信エラー:', error);
    return NextResponse.json(
      { error: 'メール通知の送信に失敗しました' },
      { status: 500 }
    );
  }
}

async function sendActualEmail(to: string, subject: string, content: string): Promise<boolean> {
  try {
    // 環境変数からメール設定を取得
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    if (!mailgunApiKey || !mailgunDomain) {
      console.error('❌ Mailgun設定が不足しています');
      return false;
    }

    // Mailgun APIを使用してメール送信
    const formData = new URLSearchParams();
    formData.append('from', fromEmail);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', content);

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mailgun API エラー:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Mailgun送信成功:', result.id);
    return true;

  } catch (error) {
    console.error('❌ メール送信エラー:', error);
    return false;
  }
} 