import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { minecraftId, discordUserId, discordUsername } = await request.json();

    console.log('🔍 Verifying Minecraft ID:', {
      minecraftId,
      discordUserId,
      discordUsername: discordUsername?.substring(0, 8) + '...'
    });

    if (!minecraftId || !discordUserId) {
      return NextResponse.json(
        { error: 'Minecraft IDとDiscord User IDが必要です' },
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
      // Mojang APIを使用してMinecraft IDの存在確認
      console.log('🔄 Checking Minecraft ID with Mojang API...');
      
      // UUIDを取得してIDの存在確認
      const mojangResponse = await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${minecraftId}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'AOIROSERVER/1.0'
          }
        }
      );

      console.log('📋 Mojang API Response Status:', mojangResponse.status);

      if (mojangResponse.status === 404) {
        console.log('❌ Minecraft ID not found:', minecraftId);
        return NextResponse.json({
          exists: false,
          message: 'Minecraft IDが見つかりません'
        });
      }

      if (!mojangResponse.ok) {
        console.error('❌ Mojang API error:', mojangResponse.status, mojangResponse.statusText);
        
        // Mojang APIが利用できない場合のフォールバック
        // 基本的な形式チェックでOKとする（実際の運用では適切なフォールバック戦略が必要）
        console.log('⚠️ Mojang API unavailable, using fallback validation');
        return NextResponse.json({
          exists: true,
          fallback: true,
          message: 'Minecraft IDの存在確認でフォールバック検証を使用しました'
        });
      }

      const userData = await mojangResponse.json();
      console.log('✅ Minecraft user found:', {
        name: userData.name,
        id: userData.id?.substring(0, 8) + '...'
      });

      // 名前の大文字小文字の違いをチェック
      if (userData.name.toLowerCase() !== minecraftId.toLowerCase()) {
        console.log('⚠️ Case mismatch:', { input: minecraftId, actual: userData.name });
        return NextResponse.json({
          exists: true,
          correctName: userData.name,
          message: `Minecraft IDが見つかりました（正確な名前: ${userData.name}）`
        });
      }

      return NextResponse.json({
        exists: true,
        uuid: userData.id,
        name: userData.name,
        message: 'Minecraft IDが確認されました'
      });

    } catch (apiError) {
      console.error('❌ Mojang API error:', apiError);
      
      // API エラーの場合もフォールバック
      console.log('⚠️ API error occurred, using fallback validation');
      return NextResponse.json({
        exists: true,
        fallback: true,
        message: 'Minecraft APIエラーのため、基本検証のみ実行されました'
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
