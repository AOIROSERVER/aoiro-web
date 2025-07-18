import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    console.log('📧 登録完了通知送信開始:', { email });

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
      return NextResponse.json(
        { error: 'Gmail SMTP設定が不足しています' },
        { status: 500 }
      );
    }

    // メールの件名と内容を生成
    const subject = '【運行情報メールサービス】ご登録完了のお知らせ';
    
    const emailContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>登録完了通知</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <img src="https://i.imgur.com/LpVQ7YZ.jpeg" style="width: 32px; height: 32px; border-radius: 6px;" alt="電車アイコン" />
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">登録完了通知</p>
              </div>
            </div>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 32px 24px;">
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 20px; height: 20px; background-color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                  <span style="color: white; font-size: 12px;">✓</span>
                </div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">登録が完了しました</h2>
              </div>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                運行情報メールサービスの登録が正常に完了しました。今後、列車の遅延や運転見合わせなどの情報が変更されると、このメールアドレスに自動で通知が送信されます。
              </p>
            </div>

            <!-- 登録情報 -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">登録情報</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">メールアドレス</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">登録日時</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${new Date().toLocaleString('ja-JP')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">サービス</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">運行情報メールサービス</span>
                </div>
              </div>
            </div>

            <!-- 通知される情報 -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0369a1;">通知される情報</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: center;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px;"></span>
                  <span style="font-size: 14px; color: #374151;">遅延情報 - 15分以上の遅れが発生または見込まれる場合</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px;"></span>
                  <span style="font-size: 14px; color: #374151;">運転見合わせ - 運転見合わせが発生または見込まれる場合</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px;"></span>
                  <span style="font-size: 14px; color: #374151;">復旧情報 - 運転再開や遅延解消の情報</span>
                </div>
              </div>
            </div>

            <!-- 注意事項 -->
            <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d97706;">注意事項</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">悪天候時や運転支障時、システムに関するメールについては、選択していただいた路線・曜日・時間帯に関わらず配信させていただく場合がございます。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">インターネット情報の通信遅延などの原因により、メールが届かないことや、到着が遅れることがあります。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">メールでお知らせする情報は実際のダイヤの状況と差異がある場合があります。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">メール受信やサイト閲覧等に関する通信料はお客さまのご負担となります。</span>
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
      console.error('❌ 登録完了メール送信に失敗しました');
      return NextResponse.json(
        { error: '登録完了メールの送信に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ 登録完了メール送信成功:', { email });

    return NextResponse.json({ 
      success: true, 
      message: '登録完了メールを送信しました'
    });

  } catch (error) {
    console.error('❌ 登録完了メール送信エラー:', error);
    return NextResponse.json(
      { error: '登録完了メールの送信に失敗しました' },
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

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail SMTP送信成功:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ Gmail SMTP送信エラー:', error);
    return false;
  }
} 