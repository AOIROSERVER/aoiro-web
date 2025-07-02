export let subscriptions: any[] = [];

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    // すでに同じエンドポイントが登録されていなければ追加
    if (!subscriptions.some((s) => s.endpoint === subscription.endpoint)) {
      subscriptions.push(subscription);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 400 });
  }
} 