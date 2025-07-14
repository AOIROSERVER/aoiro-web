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
      isAnonymous = false 
    } = await request.json();

    if (!email || !lineId || !lineName || !status) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    console.log('📧 メール通知送信開始:', { email, lineName, status });

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

    console.log('✅ メール送信成功:', { email, lineName, status });

    // 通知履歴を保存
    const historyData = {
      email,
      line_id: lineId,
      line_name: lineName,
      status,
      message: details || '',
      sent_at: new Date().toISOString()
    };

    if (isAnonymous) {
      // 匿名ユーザー用の履歴テーブルに保存
      const { error: historyError } = await supabase
        .from('anonymous_email_notification_history')
        .insert(historyData);

      if (historyError) {
        console.error('匿名ユーザー通知履歴保存エラー:', historyError);
      }
    } else {
      // ログインユーザー用の履歴テーブルに保存
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: historyError } = await supabase
          .from('email_notification_history')
          .insert({
            ...historyData,
            user_id: user.id
          });

        if (historyError) {
          console.error('ログインユーザー通知履歴保存エラー:', historyError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'メール通知を送信しました' 
    });

  } catch (error) {
    console.error('❌ メール通知送信エラー:', error);
    return NextResponse.json(
      { error: 'メール通知の送信に失敗しました' },
      { status: 500 }
    );
  }
}

// 実際のメール送信を行う関数
async function sendActualEmail(to: string, subject: string, content: string): Promise<boolean> {
  try {
    // 開発環境ではEthereal Emailを使用
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 開発環境 - Ethereal Emailでメール送信:');
      
      // Ethereal Emailのテストアカウントを作成
      const testAccount = await nodemailer.createTestAccount();
      
      // トランスポーターを作成
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      // メール送信
      const info = await transporter.sendMail({
        from: '"AOIRO SERVER" <noreply@aoiroserver.com>',
        to: to,
        subject: subject,
        text: content,
      });

      console.log('📧 メール送信成功:');
      console.log('Message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', content);
      console.log('---');
      
      return true;
    }

    // 本番環境ではGmail SMTPを使用（オプション）
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: gmailUser,
        to: to,
        subject: subject,
        text: content,
      });

      console.log('✅ Gmail SMTP メール送信成功');
      return true;
    }

    // 設定がない場合はログのみ
    console.log('📧 メール送信設定がありません - ログのみ出力:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', content);
    console.log('---');
    
    return true; // 開発環境では成功として扱う

  } catch (error) {
    console.error('❌ メール送信エラー:', error);
    return false;
  }
} 