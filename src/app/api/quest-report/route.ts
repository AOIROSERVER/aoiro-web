import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questId, questTitle, userName, userEmail, reportMessage, imageData, imageFileName } = body;

    // バリデーション
    if (!questId || !questTitle || !userName || !userEmail || !reportMessage) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
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

    // 添付ファイル設定（画像がある場合）
    let attachments = [];
    if (imageData && imageFileName) {
      // Base64エンコードされた画像データをBufferに変換
      const base64Data = imageData.split(',')[1]; // data:image/...を除去
      const buffer = Buffer.from(base64Data, 'base64');
      
      attachments.push({
        filename: imageFileName,
        content: buffer,
        contentType: `image/${imageFileName.split('.').pop()?.toLowerCase() || 'jpeg'}`,
      });
    }

    // 管理者宛のメール内容
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
      to: 'aoiroserver@gmail.com',
      subject: `[クエスト報告] ${questTitle}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎯 クエスト完了報告</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">AOIROSERVER</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">クエスト完了報告</h2>
            
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f2f2f2; width: 150px;">クエストID</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${questId}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f2f2f2;">クエスト名</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${questTitle}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f2f2f2;">報告者名</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${userName}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f2f2f2;">メールアドレス</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${userEmail}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; background-color: #f2f2f2;">報告日時</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td>
              </tr>
            </table>
            
            <h3 style="color: #333;">完了報告内容</h3>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; white-space: pre-wrap; margin-bottom: 20px;">${reportMessage}</div>
            
            ${imageData ? '<p style="color: #666; font-weight: bold;">📎 証拠画像が添付されています</p>' : '<p style="color: #999;">📷 画像の添付はありません</p>'}
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              このメールは自動送信されています。<br>
              送信元IP: ${request.headers.get('x-forwarded-for') || request.ip || '不明'}
            </p>
          </div>
        </div>
      `,
      attachments: attachments,
    };

    // 報告者宛の自動返信メール内容
    const autoReplyMailOptions = {
      from: process.env.EMAIL_USER || 'aoiroserver@gmail.com',
      to: userEmail,
      subject: '[AOIROSERVER] クエスト報告を受け付けました',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎯 AOIROSERVER</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">クエスト報告ありがとうございます</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">クエスト報告を受け付けました</h2>
            
            <p style="color: #666; line-height: 1.6;">
              ${userName} 様<br><br>
              「${questTitle}」のクエスト完了報告を受け付けました。<br>
              内容を確認の上、担当者より対応させていただきます。
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">報告内容</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">クエスト名:</td>
                  <td style="padding: 8px 0;">${questTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #666;">報告日時:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td>
                </tr>
              </table>
              <div style="margin-top: 15px;">
                <p style="color: #666; font-weight: bold; margin-bottom: 8px;">報告内容:</p>
                <p style="background: #f9f9f9; padding: 12px; border-radius: 4px; white-space: pre-wrap; margin: 0;">${reportMessage}</p>
              </div>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">🎉 お疲れ様でした！</h3>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                クエストの完了、お疲れ様でした！<br>
                内容を確認後、ポイントの付与等を行わせていただきます。<br>
                今後ともAOIROSERVERをよろしくお願いいたします。
              </p>
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
    console.error('クエスト報告メール送信エラー:', error);
    return NextResponse.json(
      { error: 'クエスト報告の送信に失敗しました。しばらく時間をおいてから再度お試しください。' },
      { status: 500 }
    );
  }
}