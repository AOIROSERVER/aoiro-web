import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactType, name, email, device, subject, message, captchaToken } = body;

    // バリデーション
    if (!contactType || !name || !email || !device || !subject || !message) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        { error: 'hCaptchaの認証が必要です' },
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

    // hCaptchaの検証（本番環境では実際のhCaptcha APIを使用）
    // 開発環境では簡易チェック
    if (process.env.NODE_ENV === 'production') {
      try {
        const hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: process.env.HCAPTCHA_SECRET_KEY || '',
            response: captchaToken,
          }),
        });

        const hcaptchaResult = await hcaptchaResponse.json();
        if (!hcaptchaResult.success) {
          return NextResponse.json(
            { error: 'hCaptchaの認証に失敗しました' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('hCaptcha検証エラー:', error);
        return NextResponse.json(
          { error: 'hCaptchaの検証に失敗しました' },
          { status: 500 }
        );
      }
    }

    // メール送信設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    // 管理者宛のメール内容
    const adminMailOptions = {
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

    // 自動返信メール内容
    const autoReplyMailOptions = {
      from: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
      to: email,
      subject: '[AOIROSERVER] お問い合わせを受け付けました',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">AOIROSERVER</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">お問い合わせありがとうございます</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">お問い合わせを受け付けました</h2>
            
            <p style="color: #666; line-height: 1.6;">
              ${name} 様<br><br>
              この度は、AOIROSERVERにお問い合わせいただき、誠にありがとうございます。<br>
              お問い合わせ内容を確認の上、担当者より回答させていただきます。
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">お問い合わせ内容</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">お問い合わせ種類:</td>
                  <td style="padding: 8px 0;">${contactType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">件名:</td>
                  <td style="padding: 8px 0;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">使用端末:</td>
                  <td style="padding: 8px 0;">${device}</td>
                </tr>
              </table>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
                <p style="margin: 0; white-space: pre-wrap; color: #333;">${message}</p>
              </div>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">今後の流れ</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>お問い合わせ内容を確認いたします</li>
                <li>内容に応じて担当者より回答いたします</li>
                <li>回答までに数日かかる場合がございます</li>
                <li>緊急の場合は、Discordサーバーでのお問い合わせもご利用ください</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                このメールは自動送信されています。<br>
                返信はできませんのでご了承ください。
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 5px 0;">
                <strong>AOIROSERVER</strong><br>
                鉄道運行情報アプリ<br>
                <a href="https://discord.com/invite/U9DVtc2y5J" style="color: #1976d2; text-decoration: none;">Discordサーバーに参加</a>
              </p>
              <p style="margin: 5px 0;">
                送信日時: ${new Date().toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // 管理者宛メール送信
    await transporter.sendMail(adminMailOptions);
    
    // 自動返信メール送信
    await transporter.sendMail(autoReplyMailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json(
      { error: 'メール送信に失敗しました。しばらく時間をおいてから再度お試しください。' },
      { status: 500 }
    );
  }
} 