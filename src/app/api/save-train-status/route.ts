import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Supabaseにデータを保存
    const { error } = await supabase
      .from('train_status')
      .upsert({
        line_id: data.lineId,
        name: data.name,
        status: data.status,
        section: data.section || '',
        detail: data.detail || '',
        color: data.color || '#000000',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'line_id'
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ message: '保存失敗', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '保存成功' });
  } catch (error) {
    console.error('Error saving train status:', error);
    return NextResponse.json({ message: '保存失敗', error: String(error) }, { status: 500 });
  }
} 