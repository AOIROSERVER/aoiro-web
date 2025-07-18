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
      notificationType,
      html,
      summary = false
    } = await request.json();

    if (!email || !lineId || !lineName || !status) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    console.log('📧 メール通知送信開始:', { email, lineName, status, notificationType });

    // メールの件名と内容を生成
    const subject = summary ? `【${lineName}】` : `【運行情報】${lineName}の状況が更新されました`;
    const statusChangeText = previousStatus ? `${previousStatus} → ${status}` : status;
    
    // まとめ通知の場合は直接HTMLを使用
    if (summary && html) {
      const mailSent = await sendActualEmail(email, subject, html);
      
      if (!mailSent) {
        console.error('❌ まとめメール送信に失敗しました');
        return NextResponse.json(
          { error: 'まとめメール送信に失敗しました' },
          { status: 500 }
        );
      }

      console.log('✅ まとめメール送信成功:', { email, lineName });
      return NextResponse.json({ 
        success: true, 
        message: 'まとめメール通知を送信しました'
      });
    }
    
    // 状況に応じた色とアイコンを決定
    const getStatusStyle = (status: string) => {
      if (status.includes('遅延') || status.includes('delay')) {
        return {
          color: '#dc2626',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          icon: '🚨',
          title: '遅延情報'
        };
      } else if (status.includes('見合わせ') || status.includes('運転見合わせ') || status.includes('suspension')) {
        return {
          color: '#ea580c',
          bgColor: '#fff7ed',
          borderColor: '#fed7aa',
          icon: '⛔',
          title: '運転見合わせ'
        };
      } else if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) {
        return {
          color: '#059669',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          icon: '✅',
          title: '復旧情報'
        };
      } else {
        return {
          color: '#1f2937',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb',
          icon: 'ℹ️',
          title: '運行情報'
        };
      }
    };

    const statusStyle = getStatusStyle(status);
    
    const emailContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>運行情報通知</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <span style="color: white; font-size: 16px; font-weight: bold;">🚂</span>
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">運行情報更新通知</p>
              </div>
            </div>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 32px 24px;">
            <!-- 状況通知 -->
            <div style="background-color: ${statusStyle.bgColor}; border: 1px solid ${statusStyle.borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; background-color: ${statusStyle.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                  <span style="color: white; font-size: 14px;">${statusStyle.icon}</span>
                </div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: ${statusStyle.color};">${statusStyle.title}</h2>
              </div>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                ${lineName}の運行情報が更新されました。
              </p>
            </div>

            <!-- 詳細情報 -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">詳細情報</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">路線</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${lineName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">現在の状況</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${status}</span>
                </div>
                ${previousStatus ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">変更内容</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${previousStatus} → ${status}</span>
                </div>
                ` : ''}
                ${details ? `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <span style="font-size: 14px; color: #6b7280;">詳細情報</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500; text-align: right; max-width: 60%;">${details}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">更新時刻</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${new Date().toLocaleString('ja-JP')}</span>
                </div>
              </div>
            </div>

            <!-- 状況別の説明 -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0369a1;">状況について</h3>
              <div style="display: grid; gap: 8px;">
                ${status.includes('遅延') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #dc2626; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">15分以上の遅れが発生または見込まれています。ご利用の際は余裕を持ってお出かけください。</span>
                </div>
                ` : ''}
                ${status.includes('見合わせ') || status.includes('運転見合わせ') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #ea580c; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">運転見合わせが発生しています。代替交通機関のご利用をご検討ください。</span>
                </div>
                ` : ''}
                ${status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #059669; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">運転が再開されました。平常運転に戻りました。</span>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- 注意事項 -->
            <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d97706;">ご注意</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">この情報は実際のダイヤの状況と差異がある場合があります。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">最新の運行情報は各鉄道会社の公式サイトでご確認ください。</span>
                </div>
              </div>
            </div>

            <!-- フッター -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                このメールは自動送信されています
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                通知設定の変更はアプリ内の設定画面から行ってください
              </p>
            </div>
          </div>

          <!-- フッター -->
          <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                <strong>運行情報メールサービス</strong>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                鉄道運行情報の自動通知サービス
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px;">
                <a href="https://aoiroserver.site" style="color: #dc2626; text-decoration: none;">公式サイト</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                送信日時: ${new Date().toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
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
    // Gmail SMTP設定を取得
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    console.log('🔧 Gmail SMTP設定確認:', {
      hasGmailUser: !!gmailUser,
      hasGmailAppPassword: !!gmailAppPassword,
      fromEmail: fromEmail
    });

    if (!gmailUser || !gmailAppPassword) {
      console.error('❌ Gmail SMTP設定が不足しています');
      return false;
    }

    // Nodemailerを使用してGmail SMTPでメール送信
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: content
    };

    console.log('🔧 Gmail SMTP メール送信:', {
      from: fromEmail,
      to: to,
      subject: subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail SMTP送信成功:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ Gmail SMTP送信エラー:', error);
    return false;
  }
} 