import { NextRequest, NextResponse } from 'next/server';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { minecraftId } = await request.json();

    console.log('🔍 Verifying Minecraft ID:', {
      minecraftId
    });

    if (!minecraftId) {
      return NextResponse.json(
        { error: 'Minecraft IDが必要です' },
        { status: 400 }
      );
    }

    // Minecraft IDの形式チェック（基本的な検証）
    const minecraftIdRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!minecraftIdRegex.test(minecraftId)) {
      console.log('❌ Invalid Minecraft ID format:', minecraftId);
      return NextResponse.json(
        { 
          exists: false, 
          error: 'Minecraft IDの形式が正しくありません（3-16文字の英数字と_のみ）' 
        },
        { status: 400 }
      );
    }

    try {
      // OpenXBL検索APIを使用してMinecraft IDの存在確認
      console.log('🔄 Checking Minecraft ID with OpenXBL Search API...');
      
      // 検索APIを使用してアカウントの存在確認
      const searchResponse = await fetch(
        `https://xbl.io/api/v2/search/${minecraftId}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'AOIROSERVER/1.0',
            'X-Authorization': process.env.OPENXBL_API_KEY || '3338129b-e005-497e-ab05-6cd77c30ed8c'
          }
        }
      );

      console.log('📋 OpenXBL Search API Response Status:', searchResponse.status);

      if (!searchResponse.ok) {
        console.error('❌ OpenXBL Search API error:', searchResponse.status, searchResponse.statusText);
        
        // OpenXBL APIが利用できない場合のフォールバック
        console.log('⚠️ OpenXBL Search API unavailable, using fallback validation');
        return NextResponse.json({
          exists: true,
          fallback: true,
          message: 'OpenXBL Search APIが利用できないため、フォールバック検証を使用しました'
        });
      }

      const searchData = await searchResponse.json();
      console.log('📋 Search API response:', {
        peopleCount: searchData.people?.length || 0,
        hasRecommendations: !!searchData.recommendationSummary,
        hasFriendFinder: !!searchData.friendFinderState
      });

      // people配列が空でない場合、アカウントが存在する
      if (searchData.people && searchData.people.length > 0) {
        const foundUser = searchData.people[0];
        console.log('✅ Minecraft user found via OpenXBL:', {
          name: foundUser.gamertag,
          xuid: foundUser.xuid?.substring(0, 8) + '...'
        });

        // 名前の大文字小文字の違いをチェック
        if (foundUser.gamertag && foundUser.gamertag.toLowerCase() !== minecraftId.toLowerCase()) {
          console.log('⚠️ Case mismatch:', { input: minecraftId, actual: foundUser.gamertag });
          return NextResponse.json({
            exists: true,
            correctName: foundUser.gamertag,
            xuid: foundUser.xuid,
            avatarUrl: foundUser.displayPicRaw || null,
            message: `Minecraft IDが見つかりました（正確な名前: ${foundUser.gamertag}）`
          });
        }

        return NextResponse.json({
          exists: true,
          xuid: foundUser.xuid,
          gamertag: foundUser.gamertag || minecraftId,
          avatarUrl: foundUser.displayPicRaw || null,
          message: 'Minecraft IDが確認されました'
        });
      } else {
        // people配列が空の場合、アカウントが存在しない
        console.log('❌ Minecraft ID not found via OpenXBL:', minecraftId);
        return NextResponse.json({
          exists: false,
          message: 'Minecraft IDが見つかりません'
        });
      }

    } catch (apiError) {
      console.error('❌ OpenXBL Search API error:', apiError);
      
      // API エラーの場合もフォールバック
      console.log('⚠️ API error occurred, using fallback validation');
      return NextResponse.json({
        exists: true,
        fallback: true,
        message: 'OpenXBL Search APIエラーのため、基本検証のみ実行されました'
      });
    }

  } catch (error) {
    console.error('❌ Minecraft ID verification error:', error);
    return NextResponse.json(
      { 
        error: 'Minecraft ID確認中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
