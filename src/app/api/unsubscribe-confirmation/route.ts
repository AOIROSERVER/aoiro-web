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

    console.log('📧 退会完了メール送信開始:', email);

    // メール送信設定
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // メールの件名と内容を生成
    const subject = '運行情報メールサービス退会完了';
    
    const emailContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>退会完了通知</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <img src="https://i.imgur.com/DG8qto5.png" style="width: 32px; height: 32px; border-radius: 6px;" alt="電車アイコン" />
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">退会完了通知</p>
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
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">退会が完了しました</h2>
              </div>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                運行情報メールサービスの退会が正常に完了しました。今後、このメールアドレスには運行情報の通知が送信されません。
              </p>
            </div>

            <!-- 退会情報 -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">退会情報</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">メールアドレス</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">退会日時</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${new Date().toLocaleString('ja-JP')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">サービス</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">運行情報メールサービス</span>
                </div>
              </div>
            </div>

            <!-- 再登録について -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0369a1;">再登録について</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">いつでも再登録いただけます。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">公式サイトから再度登録してください。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">ご利用ありがとうございました。</span>
                </div>
              </div>
            </div>

            <!-- フッター -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                このメールは自動送信されています
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                再登録は公式サイトから行ってください
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

    // メール送信
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@aoiroserver.site',
      to: email,
      subject: subject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    console.log('✅ 退会完了メール送信成功:', email);
    return NextResponse.json({ 
      success: true, 
      message: '退会完了メールを送信しました' 
    });

  } catch (error) {
    console.error('退会完了メール送信エラー:', error);
    return NextResponse.json(
      { error: '退会完了メールの送信に失敗しました' },
      { status: 500 }
    );
  }
} 