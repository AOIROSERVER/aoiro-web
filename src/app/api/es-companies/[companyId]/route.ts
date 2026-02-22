import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByIdFromSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }
    if (companyId === SEED_COMPANY.id) {
      return NextResponse.json(SEED_COMPANY);
    }
    const company = await getCompanyByIdFromSheets(companyId);
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (e) {
    console.error('es-companies [companyId] GET error:', e);
    return NextResponse.json(
      { error: '会社情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
