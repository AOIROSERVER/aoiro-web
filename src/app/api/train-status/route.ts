import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('train_status')
      .select('*')
      .order('line_id');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch train status' },
        { status: 500 }
      );
    }

    // Supabaseのデータ形式をアプリケーションの形式に変換
    const formattedData = data.map(item => ({
      id: item.line_id,
      name: item.name,
      status: item.status,
      section: item.section,
      detail: item.detail,
      color: item.color,
      updatedAt: item.updated_at
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching train status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch train status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // データの検証
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // 各データをSupabaseに保存
    for (const item of data) {
      const { error } = await supabase
        .from('train_status')
        .upsert({
          line_id: item.id,
          name: item.name,
          status: item.status,
          section: item.section || '',
          detail: item.detail || '',
          color: item.color || '#000000',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'line_id'
        });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to save train status' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving train status:', error);
    return NextResponse.json(
      { error: 'Failed to save train status' },
      { status: 500 }
    );
  }
} 