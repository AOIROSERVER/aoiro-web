/**
 * ESシステム・入社申請用：Googleスプレッドシート「Companies」シートの読み書き
 * シート名: Companies
 * 列: A=id, B=name, C=description, D=location, E=employment_type, F=tags, G=form_json, H=max_participants, I=image_urls, J=created_at, K=active, L=created_by, M=created_by_discord_id, N=created_by_discord_username, O=会社詳細
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
  const { createdBy } = await getCompanyCreatorIds(companyId);
  return createdBy;
}

/** 会社の作成者情報を取得。L=created_by（Supabase user.id）, M=created_by_discord_id。申請の権限判定で両方使う */
export async function getCompanyCreatorIds(companyId: string): Promise<{
  createdBy: string | null;
  createdByDiscordId: string | null;
}> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return { createdBy: null, createdByDiscordId: null };
  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${COMPANIES_SHEET}!A2:O`,
    });
    const rows = (res.data.values || []) as string[][];
    const row = rows.find((r) => r[0] === companyId);
    if (!row) return { createdBy: null, createdByDiscordId: null };
    const createdBy = (row[11] || '').trim() || null;
    const createdByDiscordId = (row[12] || '').trim() || null;
    return { createdBy, createdByDiscordId };
  } catch {
    return { createdBy: null, createdByDiscordId: null };
  }
}

/** 指定ユーザーが作成した会社一覧。L列(created_by)またはM列(created_by_discord_id)で一致。discordId を渡すと両方で照合 */
export async function getMyCompaniesFromSheets(userId: string, discordId?: string | null): Promise<Company[]> {
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
      range: `${COMPANIES_SHEET}!A2:O`,
    });
    const rows = (res.data.values || []) as string[][];
    return rows
      .filter((r) => {
        if (!r[0] || !r[1]) return false;
        const matchL = (r[11] || '').trim() === userId;
        const matchM = discordId && (r[12] || '').trim() === discordId;
        return matchL || matchM;
      })
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
  createdByDiscordId?: string;
  createdByDiscordUsername?: string;
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

  await ensureCompaniesSheetExists(sheets, spreadsheetId);

  const headerRow = ['id', 'name', 'description', 'location', 'employment_type', 'tags', 'form_json', 'max_participants', 'image_urls', 'created_at', 'active', 'created_by', 'created_by_discord_id', 'created_by_discord_username', '会社詳細'];
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${COMPANIES_SHEET}!A1:O1`,
    });
    if (!headerRes.data.values || headerRes.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${COMPANIES_SHEET}!A1:O1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headerRow] },
      });
    }
  } catch (e) {
    console.error('Companies header check/update error:', e);
  }

  const tagsStr = (company.tags || []).join(',');
  const formJson = company.formSchema ? JSON.stringify(company.formSchema) : '';
  const imageUrlsStr = (company.imageUrls || []).join(',');
  const createdBy = company.createdBy ?? '';
  const discordId = company.createdByDiscordId ?? '';
  const discordUsername = company.createdByDiscordUsername ?? '';
  const desc = (company.description || '').replace(/\s+/g, ' ').trim();
  const companyDetail = `${company.name}${desc ? ` | ${desc.slice(0, 100)}${desc.length > 100 ? '…' : ''}` : ''}`;

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
    discordId,
    discordUsername,
    companyDetail,
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${COMPANIES_SHEET}!A2:O`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
  return id;
}

/** 会社1件を更新（作成者または管理者のみ）。id は変更不可。 */
export async function updateCompanyInSheets(
  companyId: string,
  updates: {
    name?: string;
    description?: string;
    location?: string;
    employmentType?: string;
    tags?: string[];
    formSchema?: Record<string, unknown> | null;
    maxParticipants?: number;
    imageUrls?: string[];
  }
): Promise<boolean> {
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
      range: `${COMPANIES_SHEET}!A2:O`,
    });
    const rows = (res.data.values || []) as string[][];
    const rowIndex = rows.findIndex((r) => r[0] === companyId);
    if (rowIndex < 0) return false;
    const row = rows[rowIndex] || [];
    const name = updates.name !== undefined ? updates.name : (row[1] || '');
    const description = updates.description !== undefined ? updates.description : (row[2] || '');
    const location = updates.location !== undefined ? updates.location : (row[3] || '');
    const employmentType = updates.employmentType !== undefined ? updates.employmentType : (row[4] || '正社員');
    const tagsStr = updates.tags !== undefined ? updates.tags.join(',') : (row[5] || '');
    const formJson = updates.formSchema !== undefined ? JSON.stringify(updates.formSchema) : (row[6] || '');
    const maxParticipants = updates.maxParticipants !== undefined ? String(updates.maxParticipants) : (row[7] || '0');
    const imageUrlsStr = updates.imageUrls !== undefined ? updates.imageUrls.join(',') : (row[8] || '');
    const created_at = row[9] || '';
    const active = row[10] ?? '1';
    const createdBy = row[11] || '';
    const discordId = row[12] || '';
    const discordUsername = row[13] || '';
    const companyDetail = `${name}${description ? ` | ${description.replace(/\s+/g, ' ').trim().slice(0, 100)}${description.length > 100 ? '…' : ''}` : ''}`;
    const range = `${COMPANIES_SHEET}!A${rowIndex + 2}:O${rowIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          companyId, name, description, location, employmentType, tagsStr, formJson, maxParticipants, imageUrlsStr, created_at, active, createdBy, discordId, discordUsername, companyDetail,
        ]],
      },
    });
    return true;
  } catch (e) {
    console.error('updateCompanyInSheets error:', e);
    return false;
  }
}

/** 会社を無効化（論理削除）。active を 0 にする。 */
export async function setCompanyActiveInSheets(companyId: string, active: boolean): Promise<boolean> {
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
      range: `${COMPANIES_SHEET}!A2:K`,
    });
    const rows = (res.data.values || []) as string[][];
    const rowIndex = rows.findIndex((r) => r[0] === companyId);
    if (rowIndex < 0) return false;
    const range = `${COMPANIES_SHEET}!K${rowIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[active ? '1' : '0']] },
    });
    return true;
  } catch (e) {
    console.error('setCompanyActiveInSheets error:', e);
    return false;
  }
}

/** 入社申請を「CompanyApplications」シートに追加。列: 申請ID, 申請日時, 会社ID, 会社名, メール, Discord, Discord ID, Minecraftタグ, 志望理由, ステータス, user_id（AIC所属更新用） */
const APPLICATIONS_SHEET = 'CompanyApplications';
const APPLICATIONS_RANGE = `${APPLICATIONS_SHEET}!A:K`;

/** AICカードの所属会社名をGASで管理。列: user_id, company_name, updated_at */
const AIC_COMPANY_SHEET = 'AIC所属';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Companies シートが存在しなければ作成する */
async function ensureCompaniesSheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const exists = meta.data.sheets?.some(
    (s) => (s.properties?.title ?? '') === COMPANIES_SHEET
  );
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: COMPANIES_SHEET } } }],
    },
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

/** AIC所属シートが存在しなければ作成する */
async function ensureAICCompanySheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const exists = meta.data.sheets?.some(
    (s) => (s.properties?.title ?? '') === AIC_COMPANY_SHEET
  );
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: AIC_COMPANY_SHEET } } }],
    },
  });
}

export async function appendCompanyApplication(row: {
  companyId: string;
  companyName: string;
  email: string;
  discordUsername: string;
  discordId: string;
  minecraftTag: string;
  /** 志望理由のみ（フォーム回答の志望理由フィールドのテキスト） */
  motivation: string;
  status?: string;
  /** Supabase user_id（申請許可時にAIC所属を更新するため） */
  userId?: string;
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

  const applicationHeaders = ['申請ID', '申請日時', '会社ID', '会社名', 'メール', 'Discord', 'Discord ID', 'Minecraftタグ', '志望理由', 'ステータス', 'user_id'];
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${APPLICATIONS_SHEET}!A1:K1`,
    });
    if (!headerRes.data.values || headerRes.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${APPLICATIONS_SHEET}!A1:K1`,
        valueInputOption: 'RAW',
        requestBody: { values: [applicationHeaders] },
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
    row.discordId,
    row.minecraftTag,
    row.motivation,
    row.status || 'pending',
    row.userId ?? '',
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
  discordId: string;
  minecraftTag: string;
  /** 志望理由のみ */
  motivation: string;
  status: string;
  /** Supabase user_id（AIC所属更新用） */
  userId: string;
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
      range: `${APPLICATIONS_SHEET}!A2:K`,
    });
    const rows = (res.data.values || []) as string[][];
    return rows
      .filter((r) => r[0])
      .map((r) => {
        const has10 = r.length >= 10;
        const has11 = r.length >= 11;
        return {
          id: r[0] || '',
          createdAt: r[1] || '',
          companyId: r[2] || '',
          companyName: r[3] || '',
          email: r[4] || '',
          discord: r[5] || '',
          discordId: has10 ? (r[6] || '') : '',
          minecraftTag: has10 ? (r[7] || '') : (r[6] || ''),
          motivation: has10 ? (r[8] || '') : (r[7] || ''),
          status: has10 ? (r[9] || 'pending') : (r[8] || 'pending'),
          userId: has11 ? (r[10] || '') : '',
        };
      })
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
      range: `${APPLICATIONS_SHEET}!A2:K`,
    });
    const rows = (res.data.values || []) as string[][];
    const rowIndex = rows.findIndex((r) => r[0] === applicationId);
    if (rowIndex < 0) return false;
    const statusCol = rows[rowIndex]?.length >= 10 ? 'J' : 'I';
    const range = `${APPLICATIONS_SHEET}!${statusCol}${rowIndex + 2}`;
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

/** AICカードの所属会社名をGASに保存（申請許可時に呼ぶ）。同一 user_id は上書き。 */
export async function setAICCompanyForUser(userId: string, companyName: string): Promise<void> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key || !userId || !companyName.trim()) return;

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = GOOGLE_SHEETS_ID;
    await ensureAICCompanySheetExists(sheets, spreadsheetId);

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${AIC_COMPANY_SHEET}!A1:C1`,
    });
    if (!headerRes.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${AIC_COMPANY_SHEET}!A1:C1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['user_id', 'company_name', 'updated_at']] },
      });
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${AIC_COMPANY_SHEET}!A2:C`,
    });
    const rows = (res.data.values || []) as string[][];
    const rowIndex = rows.findIndex((r) => r[0] === userId);
    const now = new Date().toISOString();
    if (rowIndex >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${AIC_COMPANY_SHEET}!B${rowIndex + 2}:C${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[companyName.trim(), now]] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${AIC_COMPANY_SHEET}!A2:C`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[userId, companyName.trim(), now]] },
      });
    }
  } catch (e) {
    console.error('setAICCompanyForUser error:', e);
  }
}

/** AICカードの所属会社名をGASから取得。無ければ null。 */
export async function getAICCompanyForUser(userId: string): Promise<string | null> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key || !userId) return null;

  try {
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${AIC_COMPANY_SHEET}!A2:B`,
    });
    const rows = (res.data.values || []) as string[][];
    const row = rows.find((r) => r[0] === userId);
    return row && row[1] ? row[1].trim() : null;
  } catch (e) {
    console.error('getAICCompanyForUser error:', e);
    return null;
  }
}
