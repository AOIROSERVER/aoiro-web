import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details, userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject = `【運行情報】${lineName}の状況が更新されました`;
    const htmlContent = `
      <div style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">🚄 運行情報の更新</h1>
          <p style="color: #666; margin: 0;">以下の路線の運行情報が更新されました。</p>
        </div>
        <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">${lineName}</h2>
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
              ${status === '遅延' ? 'background-color: #ff6b6b; color: white;' : ''}
              ${status === '運転見合わせ' ? 'background-color: #ff8c00; color: white;' : ''}
              ${status === '平常運転' ? 'background-color: #28a745; color: white;' : ''}
              ${status === '運転再開' ? 'background-color: #17a2b8; color: white;' : ''}
            ">
              ${status}
            </span>
          </div>
          ${details ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">詳細情報</h3>
              <p style="color: #555; margin: 0; line-height: 1.6;">${details}</p>
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/train-status/${lineId}" 
               style="
                 display: inline-block;
                 background-color: #007bff;
                 color: white;
                 text-decoration: none;
                 padding: 12px 24px;
                 border-radius: 6px;
                 font-weight: bold;
               ">
              詳細を確認する
            </a>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
          <p style="margin: 0 0 10px 0;">
            <strong>このメールについて：</strong><br>
            このメールは、AOIROSERVERアプリの運行情報通知サービスから送信されています。
          </p>
          <p style="margin: 0;">
            通知設定の変更や配信停止については、アプリ内の設定画面から変更できます。
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2024 AOIROSERVER. All rights reserved.
          </p>
        </div>
      </div>
    `;
    const textContent = `
運行情報の更新

${lineName}
状況: ${status}
${details ? `詳細: ${details}` : ''}

詳細を確認する: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/train-status/${lineId}

---
このメールはAOIROSERVERアプリの運行情報通知サービスから送信されています。
通知設定の変更はアプリ内の設定画面から行ってください。
    `;

    await transporter.sendMail({
      from: `AOIROSERVER <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 