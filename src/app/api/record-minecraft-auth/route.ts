import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { minecraftId, discordUserId, discordUsername, discordGlobalName } = await request.json();

    console.log('📝 Recording SUCCESSFUL Minecraft auth to Google Sheets:', {
      minecraftId,
      discordUserId: discordUserId?.substring(0, 8) + '...',
      discordUsername: discordUsername?.substring(0, 8) + '...'
    });

    if (!minecraftId) {
      return NextResponse.json(
        { error: 'Minecraft IDが必要です' },
        { status: 400 }
      );
    }

    // Google Sheets API設定
    const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('🔍 Google Sheets Configuration:', {
      serviceAccountExists: !!googleServiceAccount,
      spreadsheetIdExists: !!spreadsheetId
    });

    if (!googleServiceAccount || !spreadsheetId) {
      console.warn('⚠️ Google Sheets not configured, skipping record');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Google Sheets設定がないため、記録をスキップしました'
      });
    }



    try {
      // Google Sheets APIクライアントを初期化
      const serviceAccountKey = JSON.parse(googleServiceAccount);
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // 現在の日時を取得
      const timestamp = new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Discord表示名を決定（Discord認証がない場合は「未連携」）
      const displayName = discordGlobalName || discordUsername || '未連携';
      const discordUser = discordUsername || '未連携';
      const discordId = discordUserId || '未連携';

      // スプレッドシートに追加するデータ
      const values = [
        [
          timestamp,        // 認証日時
          minecraftId,      // Minecraft ID
          displayName,      // Discord表示名
          discordUser,      // Discordユーザー名
          discordId         // Discord User ID
        ]
      ];

      console.log('📝 Data to append:', {
        timestamp,
        minecraftId,
        displayName,
        discordUser: discordUser?.substring(0, 8) + '...',
        discordId: discordId?.substring(0, 8) + '...'
      });

      // ヘッダー行が存在するかチェック
      try {
        const headerCheck = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: 'A1:E1'
        });

        if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
          // ヘッダー行を追加
          console.log('📝 Adding header row...');
          const headerValues = [
            ['認証日時', 'Minecraft ID', 'Discord表示名', 'Discordユーザー名', 'Discord User ID']
          ];

          await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'A1:E1',
            valueInputOption: 'RAW',
            requestBody: {
              values: headerValues
            }
          });
        }
      } catch (headerError) {
        console.warn('⚠️ Could not check/add header row:', headerError);
      }

      // データを追加
      console.log('📝 Appending data to spreadsheet...');
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'A:E',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values
        }
      });

      console.log('✅ Data appended successfully:', {
        spreadsheetId: spreadsheetId,
        updatedRange: appendResponse.data.updates?.updatedRange,
        updatedRows: appendResponse.data.updates?.updatedRows
      });

      return NextResponse.json({
        success: true,
        message: 'Google Sheetsに記録されました',
        spreadsheetId: spreadsheetId,
        updatedRange: appendResponse.data.updates?.updatedRange
      });

    } catch (sheetsError) {
      console.error('❌ Google Sheets API error:', sheetsError);
      
      // Google Sheets エラーでも認証は成功として扱う
      return NextResponse.json({
        success: true,
        sheetsError: true,
        message: 'Google Sheetsへの記録に失敗しましたが、認証は成功しました',
        error: sheetsError instanceof Error ? sheetsError.message : 'Unknown sheets error'
      });
    }

  } catch (error) {
    console.error('❌ Record minecraft auth error:', error);
    
    // 記録エラーでも認証は成功として扱う
    return NextResponse.json({
      success: true,
      recordError: true,
      message: '記録処理でエラーが発生しましたが、認証は成功しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
