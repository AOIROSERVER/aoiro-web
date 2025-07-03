import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    // endpointで既存レコードを検索
    const { data: existing, error: selectError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('endpoint', subscription.endpoint)
      .eq('device_type', 'web');

    if (selectError) {
      return new Response(JSON.stringify({ success: false, error: String(selectError) }), { status: 500 });
    }

    let upsertData = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      device_type: 'web',
      is_active: true,
      // user_idなど他に必要なカラムがあればここに追加
    };

    let result;
    if (existing && existing.length > 0) {
      // 既存レコードがあれば更新
      const { error: updateError } = await supabase
        .from('notification_tokens')
        .update(upsertData)
        .eq('id', existing[0].id);
      if (updateError) {
        return new Response(JSON.stringify({ success: false, error: String(updateError) }), { status: 500 });
      }
      result = { updated: true };
    } else {
      // 新規作成
      const { error: insertError } = await supabase
        .from('notification_tokens')
        .insert(upsertData);
      if (insertError) {
        return new Response(JSON.stringify({ success: false, error: String(insertError) }), { status: 500 });
      }
      result = { inserted: true };
    }
    return new Response(JSON.stringify({ success: true, ...result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 400 });
  }
} 