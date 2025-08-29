import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Google Sheets設定（MCID方式）
const GOOGLE_SHEETS_ID = '17oFiF5pvclax-RM38DEREfa1EFKFpzQ9y0lCgizJFE8';
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Googleスプレッドシートにデータを追加する関数
async function addToGoogleSheets(submissionData: any) {
  try {
    console.log('📊 addToGoogleSheets開始（MCID方式）');
    
    // 環境変数チェック（MCID方式）
    if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY環境変数が設定されていません。スプレッドシート保存をスキップします。');
      return;
    }

    console.log('🔑 Google Sheets認証開始（MCID方式）');
    
    // Google Sheets APIの認証（MCID方式）
    const serviceAccountKey = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets認証完了（MCID方式）');

    // ヘッダー行があるかチェック
    console.log('📋 ヘッダー行チェック開始');
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'A1:K1', // Discordユーザー名列を追加したため範囲をKまで拡張
    });

    console.log('ヘッダー行取得結果:', headerResponse.data.values);

    // ヘッダー行がない場合は追加
    if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
      console.log('📝 ヘッダー行を追加中...');
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: 'A1:K1', // Discordユーザー名列を追加
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            '提出日時',
            '申請種類',
            'Minecraftタグ',
            '年齢',
            'メールアドレス',
            '都道府県',
            '使用端末/会社名',
            '意志表明',
            'ポートフォリオURL',
            'ステータス',
            'Discordユーザー名' // 新しい列を追加
          ]]
        },
      });
      console.log('✅ ヘッダー行追加完了');
    } else {
      console.log('✅ ヘッダー行は既に存在');
    }

    // データを追加
    const portfolioDisplayValue = submissionData.portfolioFileName 
      ? `${submissionData.portfolioFileName} (添付ファイル)`
      : (submissionData.portfolio_url || '');
    
    const values = [[
      new Date().toLocaleString('ja-JP'),
      submissionData.application_type,
      submissionData.minecraft_tag,
      submissionData.age || '',
      submissionData.email || '',
      submissionData.prefecture || '',
      submissionData.device || '',
      submissionData.motivation || '',
      portfolioDisplayValue,
      submissionData.status,
      submissionData.discord_username || '' // Discordユーザー名を追加
    ]];

    console.log('📊 追加するデータ:', values);

    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });

    console.log('✅ スプレッドシート追加結果:', {
      updatedRows: appendResult.data.updates?.updatedRows,
      updatedRange: appendResult.data.updates?.updatedRange
    });
    
    console.log('🎉 Googleスプレッドシートにデータを追加しました');
  } catch (error) {
    console.error('Googleスプレッドシート追加エラー:', error);
    // スプレッドシートエラーは処理を停止させない
  }
}

// メール送信機能（お問い合わせページと同じ方式）
async function sendNotificationEmail(submissionData: any) {
  try {
    // Gmail SMTP設定を取得（お問い合わせページと同じ環境変数）
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    console.log('🔧 Gmail SMTP設定確認:', {
      hasGmailUser: !!gmailUser,
      hasGmailAppPassword: !!gmailAppPassword,
      fromEmail: fromEmail
    });

    if (!gmailUser || !gmailAppPassword) {
      console.log('❌ Gmail SMTP設定が不足しています。メール送信をスキップします。');
      return;
    }

    // Nodemailerを使用してGmail SMTPでメール送信
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // 添付ファイル設定（ポートフォリオがある場合）
    let attachments = [];
    if (submissionData.portfolioData && submissionData.portfolioFileName) {
      // Base64エンコードされた画像データをBufferに変換
      const base64Data = submissionData.portfolioData.split(',')[1]; // data:image/...を除去
      const buffer = Buffer.from(base64Data, 'base64');
      
      attachments.push({
        filename: submissionData.portfolioFileName,
        content: buffer,
        contentType: `image/${submissionData.portfolioFileName.split('.').pop()?.toLowerCase() || 'jpeg'}`,
      });
    }

    const mailOptions = {
      from: fromEmail,
      to: 'aoiroserver.m@gmail.com',
      subject: `[ESシステム] 新しい${submissionData.application_type}申請`,
      attachments: attachments,
      html: `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ES申請通知</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- ヘッダー -->
            <div style="background-color: #667eea; padding: 32px 24px; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600;">🔐 新しいES申請が提出されました</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">AOIROSERVER ESシステム</p>
            </div>

            <!-- メインコンテンツ -->
            <div style="padding: 32px 24px;">
              <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333;">申請詳細</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057; width: 120px;">申請種類</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.application_type}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">Minecraftタグ</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.minecraft_tag}</td>
                  </tr>
                  ${submissionData.age ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">年齢</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.age}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.email ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">メールアドレス</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.email}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.discord_username ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">Discordユーザー名</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.discord_username}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.prefecture ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">都道府県</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.prefecture}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.device ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">使用端末/会社名</td>
                    <td style="padding: 12px 8px; color: #212529;">${submissionData.device}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.motivation ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">意志表明</td>
                    <td style="padding: 12px 8px; color: #212529; word-break: break-word;">${submissionData.motivation.replace(/\n/g, '<br>')}</td>
                  </tr>
                  ` : ''}
                  ${submissionData.portfolioFileName ? `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">ポートフォリオ</td>
                    <td style="padding: 12px 8px; color: #212529;">
                      <span style="color: #667eea;">📎 ${submissionData.portfolioFileName} (添付ファイル)</span>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 8px; font-weight: 600; color: #495057;">提出日時</td>
                    <td style="padding: 12px 8px; color: #212529;">${new Date(submissionData.submitted_at).toLocaleString('ja-JP')}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}" 
                   style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                  📊 スプレッドシートで確認
                </a>
              </div>
            </div>

            <!-- フッター -->
            <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">AOIROSERVER ESシステム</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ ES申請通知メール送信成功:', info.messageId);
  } catch (error) {
    console.error('❌ ES申請通知メール送信エラー:', error);
    // メールエラーは処理を停止させない
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('ES提出API開始');
    
    // JSONデータを取得（クエストと同じ方式）
    const body = await request.json();
    const { 
      applicationType, 
      minecraftTag, 
      age, 
      email, 
      prefecture, 
      device, 
      motivation, 
      discordUsername, // Discordユーザー名を追加
      portfolioData, 
      portfolioFileName, 
      captchaToken 
    } = body;

    console.log('受信データ:', {
      applicationType,
      minecraftTag: minecraftTag ? 'あり' : 'なし',
      age,
      email: email ? 'あり' : 'なし',
      prefecture,
      device: device ? 'あり' : 'なし',
      motivation: motivation ? 'あり' : 'なし',
      discordUsername: discordUsername || 'なし', // Discordユーザー名をログに追加
      portfolioData: portfolioData ? 'あり（Base64）' : 'なし',
      portfolioFileName: portfolioFileName || 'なし',
      captchaToken: captchaToken ? 'あり' : 'なし'
    });

    // 必須フィールドのバリデーション
    if (!applicationType || !minecraftTag || !captchaToken) {
      console.error('必須フィールド不足:', {
        applicationType: !applicationType,
        minecraftTag: !minecraftTag,
        captchaToken: !captchaToken
      });
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // hCaptchaの検証
    if (process.env.NODE_ENV !== 'development') {
      const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.HCAPTCHA_SECRET_KEY!,
          response: captchaToken,
        }),
      });

      const captchaResult = await captchaResponse.json();
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: 'Captcha認証に失敗しました' },
          { status: 400 }
        );
      }
    }

    // ポートフォリオファイル情報の処理（クエストと同じ方式）
    let portfolioUrl = null;
    if (portfolioData && portfolioFileName) {
      portfolioUrl = `attachment: ${portfolioFileName}`;
      console.log('📎 ポートフォリオ添付:', portfolioFileName);
    }

    // Googleスプレッドシートに保存
    const submissionData = {
      application_type: applicationType,
      minecraft_tag: minecraftTag,
      age: age || null,
      email: email || null,
      prefecture: prefecture || null,
      device: device || null,
      motivation: motivation || null,
      discord_username: discordUsername || null, // Discordユーザー名を追加
      portfolio_url: portfolioUrl,
      portfolioData: portfolioData,
      portfolioFileName: portfolioFileName,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    // Googleスプレッドシートに追加（MCID方式）
    if (process.env.NODE_ENV === 'development' && !GOOGLE_SERVICE_ACCOUNT_KEY) {
      // 開発環境でGoogle Sheets設定がない場合はコンソールログのみ
      console.log('開発環境: ESデータ（Googleスプレッドシート未設定）');
      console.log(JSON.stringify(submissionData, null, 2));
    } else {
      try {
        console.log('🔧 Googleスプレッドシート保存開始（MCID方式）');
        console.log('環境変数確認:', {
          hasGoogleServiceAccountKey: !!GOOGLE_SERVICE_ACCOUNT_KEY,
          sheetsId: GOOGLE_SHEETS_ID
        });
        
        await addToGoogleSheets(submissionData);
        console.log('✅ Googleスプレッドシートに保存成功');
      } catch (error) {
        console.error('❌ Googleスプレッドシート保存エラー:', error);
        
        // 開発環境では詳細なエラーを返す
        if (process.env.NODE_ENV === 'development') {
          console.error('詳細エラー情報:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack'
          });
          
          return NextResponse.json(
            { 
              error: 'Googleスプレッドシートの保存に失敗しました',
              details: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : 'Unknown'
            },
            { status: 500 }
          );
        }
        
        // 本番環境でもスプレッドシートエラーは継続処理
        console.log('⚠️ スプレッドシートエラーですが処理を継続します');
      }
    }

    // メール通知送信
    try {
      await sendNotificationEmail(submissionData);
    } catch (emailError) {
      console.error('メール送信処理エラー:', emailError);
      // メールエラーは処理を停止させない
    }

    // Discord webhook送信（オプション）
    if (process.env.DISCORD_ES_WEBHOOK_URL) {
      const discordMessage = {
        embeds: [
          {
            title: '🔐 新しいES申請が提出されました',
            color: 0x667eea,
            fields: [
              { name: '申請種類', value: applicationType, inline: true },
              { name: 'Minecraftタグ', value: minecraftTag, inline: true },
              { name: '提出日時', value: new Date().toLocaleString('ja-JP'), inline: true },
            ],
            footer: {
              text: 'AOIROSERVER ES System'
            }
          }
        ]
      };

      try {
        await fetch(process.env.DISCORD_ES_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discordMessage),
        });
        console.log('Discord webhook送信完了');
      } catch (webhookError) {
        console.error('Discord webhook送信エラー:', webhookError);
        // webhookエラーは処理を停止させない
      }
    }

    return NextResponse.json(
      { 
        message: 'エントリーシートを正常に提出しました',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('ES提出エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
