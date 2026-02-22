/**
 * ESシステム・入社申請用：Googleスプレッドシート「Companies」シートの読み書き
 * シート名: Companies
 * 列: A=id, B=name, C=description, D=location, E=employment_type, F=tags, G=form_json, H=max_participants, I=image_urls, J=created_at, K=active
 */
import { google } from 'googleapis';

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '17oFiF5pvclax-RM38DEREfa1EFKFpzQ9y0lCgizJFE8';
const COMPANIES_SHEET = 'Companies';
const COMPANIES_RANGE = `${COMPANIES_SHEET}!A2:K`;

export type CompanyRow = {
  id: string;
  name: string;
  description: string;
  location: string;
  employment_type: string;
  tags: string;
  form_json: string;
  max_participants: string;
  image_urls: string;
  created_at: string;
  active: string;
};

export type Company = {
  id: string;
  name: string;
  description: string;
  location: string;
  employmentType: string;
  tags: string[];
  formSchema: Record<string, unknown> | null;
  maxParticipants: number;
  imageUrls: string[];
  createdAt: string;
  active: boolean;
};

/** 架空のデフォルト会社（スプレッドシートに0件のときも一覧に表示） */
export const SEED_COMPANY: Company = {
  id: 'aoiro-admin-corp',
  name: 'AOIROSERVER管理者株式会社',
  description:
    'AOIROSERVERの運営・管理を担う架空の会社です。サーバー内の各種インフラ整備やイベント運営、コミュニティ運営に携わります。\n\n【主な業務】\n・サーバー運営サポート\n・イベント企画・進行\n・建築・整備プロジェクトへの参加\n・新規メンバーへのオンボーディング',
  location: 'AOIROSERVER 内（オンライン）',
  employmentType: '正社員',
  tags: ['運営', '建築', 'イベント', 'リモート'],
  formSchema: {
    fields: [
      { id: 'minecraft_tag', label: 'Minecraftゲームタグ', type: 'text', required: true, placeholder: '例: PlayerName' },
      { id: 'motivation', label: '志望理由・意志表明', type: 'textarea', required: true, placeholder: '入社の理由や意欲を記入してください' },
    ],
  },
  maxParticipants: 20,
  imageUrls: [],
  createdAt: new Date().toISOString(),
  active: true,
};

function rowToCompany(row: string[]): Company {
  const tags = (row[5] || '').split(',').map((s) => s.trim()).filter(Boolean);
  let formSchema: Record<string, unknown> | null = null;
  try {
    if (row[6]) formSchema = JSON.parse(row[6]) as Record<string, unknown>;
  } catch {
    // ignore
  }
  const imageUrls = (row[8] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    id: row[0] || '',
    name: row[1] || '',
    description: row[2] || '',
    location: row[3] || '',
    employmentType: row[4] || '正社員',
    tags,
    formSchema,
    maxParticipants: parseInt(row[7] || '0', 10) || 0,
    imageUrls,
    createdAt: row[9] || '',
    active: (row[10] || '1') === '1' || (row[10] || '').toLowerCase() === 'true',
  };
}

export async function getCompaniesFromSheets(): Promise<Company[]> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return [];

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: COMPANIES_RANGE,
    });
    const rows = (res.data.values || []) as string[][];
    return rows
      .filter((r) => r[0] && r[1])
      .map((r) => {
        const c = rowToCompany(r);
        return c.active ? c : null;
      })
      .filter((c): c is Company => c !== null);
  } catch (e) {
    console.error('getCompaniesFromSheets error:', e);
    return [];
  }
}

export async function getCompanyByIdFromSheets(companyId: string): Promise<Company | null> {
  const list = await getCompaniesFromSheets();
  return list.find((c) => c.id === companyId) || null;
}

/** 会社の作成者ID（created_by）を取得。L列 */
export async function getCompanyCreatedBy(companyId: string): Promise<string | null> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return null;
  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${COMPANIES_SHEET}!A2:L`,
    });
    const rows = (res.data.values || []) as string[][];
    const row = rows.find((r) => r[0] === companyId);
    return row && row[11] ? row[11] : null;
  } catch {
    return null;
  }
}

/** 指定ユーザーが作成した会社一覧（created_by 列でフィルタ）。L列 = created_by */
export async function getMyCompaniesFromSheets(userId: string): Promise<Company[]> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key || !userId) return [];

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${COMPANIES_SHEET}!A2:L`,
    });
    const rows = (res.data.values || []) as string[][];
    return rows
      .filter((r) => r[0] && r[1] && (r[11] || '') === userId)
      .map((r) => rowToCompany(r))
      .filter((c) => c.active);
  } catch (e) {
    console.error('getMyCompaniesFromSheets error:', e);
    return [];
  }
}

/** 会社を1件追加。id は自動生成。戻り値: 作成した会社の id */
export async function addCompanyToSheets(company: {
  name: string;
  description?: string;
  location?: string;
  employmentType?: string;
  tags?: string[];
  formSchema?: Record<string, unknown> | null;
  maxParticipants?: number;
  imageUrls?: string[];
  createdBy?: string;
}): Promise<string> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');

  const id = generateId();
  const serviceAccountKey = JSON.parse(key);
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = GOOGLE_SHEETS_ID;

  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${COMPANIES_SHEET}!A1:K1`,
    });
    if (!headerRes.data.values || headerRes.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${COMPANIES_SHEET}!A1:L1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['id', 'name', 'description', 'location', 'employment_type', 'tags', 'form_json', 'max_participants', 'image_urls', 'created_at', 'active', 'created_by']],
        },
      });
    }
  } catch {
    // シートが無い場合は手動で「Companies」シートを追加してください
  }

  const tagsStr = (company.tags || []).join(',');
  const formJson = company.formSchema ? JSON.stringify(company.formSchema) : '';
  const imageUrlsStr = (company.imageUrls || []).join(',');
  const createdBy = company.createdBy ?? '';
  const values = [[
    id,
    company.name,
    company.description || '',
    company.location || '',
    company.employmentType || '正社員',
    tagsStr,
    formJson,
    String(company.maxParticipants ?? 0),
    imageUrlsStr,
    new Date().toISOString(),
    '1',
    createdBy,
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${COMPANIES_SHEET}!A2:L`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
  return id;
}

/** 入社申請を「CompanyApplications」シートに追加。列: 申請ID, 申請日時, 会社ID, 会社名, メール, Discord, Minecraftタグ, フォーム回答(JSON), ステータス */
const APPLICATIONS_SHEET = 'CompanyApplications';
const APPLICATIONS_RANGE = `${APPLICATIONS_SHEET}!A:I`;

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** シートが存在しなければ作成する */
async function ensureApplicationsSheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const exists = meta.data.sheets?.some(
    (s) => (s.properties?.title ?? '') === APPLICATIONS_SHEET
  );
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: APPLICATIONS_SHEET } } }],
    },
  });
}

export async function appendCompanyApplication(row: {
  companyId: string;
  companyName: string;
  email: string;
  discordUsername: string;
  minecraftTag: string;
  formDataJson: string;
  status?: string;
}): Promise<string> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');

  const applicationId = generateId();
  const serviceAccountKey = JSON.parse(key);
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = GOOGLE_SHEETS_ID;

  await ensureApplicationsSheetExists(sheets, spreadsheetId);

  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${APPLICATIONS_SHEET}!A1:I1`,
    });
    if (!headerRes.data.values || headerRes.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${APPLICATIONS_SHEET}!A1:I1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['申請ID', '申請日時', '会社ID', '会社名', 'メール', 'Discord', 'Minecraftタグ', 'フォーム回答(JSON)', 'ステータス']],
        },
      });
    }
  } catch (e) {
    console.error('CompanyApplications header check/update error:', e);
  }

  const values = [[
    applicationId,
    new Date().toLocaleString('ja-JP'),
    row.companyId,
    row.companyName,
    row.email,
    row.discordUsername,
    row.minecraftTag,
    row.formDataJson,
    row.status || 'pending',
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: APPLICATIONS_RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
  return applicationId;
}

export type ApplicationRow = {
  id: string;
  createdAt: string;
  companyId: string;
  companyName: string;
  email: string;
  discord: string;
  minecraftTag: string;
  formDataJson: string;
  status: string;
};

export async function getApplicationsFromSheets(companyId?: string): Promise<ApplicationRow[]> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return [];

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${APPLICATIONS_SHEET}!A2:I`,
    });
    const rows = (res.data.values || []) as string[][];
    return rows
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        createdAt: r[1] || '',
        companyId: r[2] || '',
        companyName: r[3] || '',
        email: r[4] || '',
        discord: r[5] || '',
        minecraftTag: r[6] || '',
        formDataJson: r[7] || '{}',
        status: r[8] || 'pending',
      }))
      .filter((a) => !companyId || a.companyId === companyId);
  } catch (e) {
    console.error('getApplicationsFromSheets error:', e);
    return [];
  }
}

export async function updateApplicationStatus(applicationId: string, status: string): Promise<boolean> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return false;

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${APPLICATIONS_SHEET}!A2:I`,
    });
    const rows = (res.data.values || []) as string[][];
    const rowIndex = rows.findIndex((r) => r[0] === applicationId);
    if (rowIndex < 0) return false;
    const range = `${APPLICATIONS_SHEET}!I${rowIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    });
    return true;
  } catch (e) {
    console.error('updateApplicationStatus error:', e);
    return false;
  }
}
