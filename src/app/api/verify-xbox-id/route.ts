import { NextRequest, NextResponse } from 'next/server';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { xboxId } = await request.json();

    console.log('🔍 Verifying Xbox ID:', {
      xboxId
    });

    if (!xboxId) {
      return NextResponse.json(
        { error: 'Xbox IDが必要です' },
        { status: 400 }
      );
    }

    // Xbox IDの形式チェック（基本的な検証）
    const xboxIdRegex = /^[a-zA-Z0-9_]{1,15}$/;
    if (!xboxIdRegex.test(xboxId)) {
      console.log('❌ Invalid Xbox ID format:', xboxId);
      return NextResponse.json(
        { 
          exists: false, 
          error: 'Xbox IDの形式が正しくありません（1-15文字の英数字と_のみ）' 
        },
        { status: 400 }
      );
    }

    try {
      // OpenXBL APIを使用してXbox IDの存在確認
      console.log('🔄 Checking Xbox ID with OpenXBL API...');
      
      // Xbox IDからXUIDを取得
      const xuidResponse = await fetch(
        `https://xbl.io/api/v2/account/${xboxId}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'AOIROSERVER/1.0',
            'X-AUTH': process.env.OPENXBL_API_KEY || '3338129b-e005-497e-ab05-6cd77c30ed8c'
          }
        }
      );

      console.log('📋 xbl.io API Response Status:', xuidResponse.status);

      if (xuidResponse.status === 404) {
        console.log('❌ Xbox ID not found:', xboxId);
        return NextResponse.json({
          exists: false,
          message: 'Xbox IDが見つかりません'
        });
      }

      if (!xuidResponse.ok) {
        console.error('❌ xbl.io API error:', xuidResponse.status, xuidResponse.statusText);
        
        // OpenXBL APIが利用できない場合のフォールバック
        console.log('⚠️ OpenXBL API unavailable, using fallback validation');
        return NextResponse.json({
          exists: true,
          fallback: true,
          message: 'OpenXBL APIが利用できないため、フォールバック検証を使用しました'
        });
      }

      const userData = await xuidResponse.json();
      console.log('✅ Xbox user found:', {
        name: userData.profileUsers?.[0]?.settings?.find((s: any) => s.id === 'Gamertag')?.value,
        xuid: userData.profileUsers?.[0]?.id?.substring(0, 8) + '...'
      });

      // プロフィール情報が取得できた場合
      if (userData.profileUsers && userData.profileUsers.length > 0) {
        const gamertag = userData.profileUsers[0].settings?.find((s: any) => s.id === 'Gamertag')?.value;
        
        // 名前の大文字小文字の違いをチェック
        if (gamertag && gamertag.toLowerCase() !== xboxId.toLowerCase()) {
          console.log('⚠️ Case mismatch:', { input: xboxId, actual: gamertag });
          return NextResponse.json({
            exists: true,
            correctName: gamertag,
            message: `Xbox IDが見つかりました（正確な名前: ${gamertag}）`
          });
        }

        return NextResponse.json({
          exists: true,
          xuid: userData.profileUsers[0].id,
          gamertag: gamertag || xboxId,
          message: 'Xbox IDが確認されました'
        });
      }

      return NextResponse.json({
        exists: false,
        message: 'Xbox IDの情報を取得できませんでした'
      });

    } catch (apiError) {
      console.error('❌ OpenXBL API error:', apiError);
      
      // API エラーの場合もフォールバック
      console.log('⚠️ API error occurred, using fallback validation');
      return NextResponse.json({
        exists: true,
        fallback: true,
        message: 'OpenXBL APIエラーのため、基本検証のみ実行されました'
      });
    }

  } catch (error) {
    console.error('❌ Xbox ID verification error:', error);
    return NextResponse.json(
      { 
        error: 'Xbox ID確認中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
