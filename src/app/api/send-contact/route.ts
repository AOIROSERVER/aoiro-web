import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactType, name, email, device, subject, message } = body;

    // バリデーション
    if (!contactType || !name || !email || !device || !subject || !message) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '正しいメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // メール送信設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    // メール内容
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
      to: 'aoiroserver@gmail.com',
      subject: `[お問い合わせ] ${subject}`,
      html: `
        <h2>お問い合わせフォームからの送信</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">お問い合わせ種類</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${contactType}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">お名前</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${name}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">メールアドレス</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${email}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">使用端末</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${device}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">件名</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${subject}</td>
          </tr>
        </table>
        <h3>お問い合わせ内容</h3>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          送信日時: ${new Date().toLocaleString('ja-JP')}<br>
          送信元IP: ${request.headers.get('x-forwarded-for') || request.ip || '不明'}
        </p>
      `,
    };

    // メール送信
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json(
      { error: 'メール送信に失敗しました。しばらく時間をおいてから再度お試しください。' },
      { status: 500 }
    );
  }
} 