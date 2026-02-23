#!/usr/bin/env node
/**
 * Netlify のサーバーレス関数に渡る環境変数の合計サイズを概算します。
 * Netlify は ___netlify-server-handler に渡す環境変数合計に約 4KB (4096 bytes) の制限があります。
 *
 * 使い方:
 *   node scripts/measure-env-size.js
 *     → .env.local を読み、全変数を測定（ローカルは PATH 等も含むため参考値）
 *   node scripts/measure-env-size.js .env.netlify
 *     → 指定ファイルの変数のみ測定（Netlify に設定している変数だけのファイルで 4KB チェックに最適）
 *
 * Netlify 実サイズに近づけるには:
 *   Netlify の「Environment variables」の変数名一覧をコピーし、.env.netlify に KEY=ダミー値 で長さを再現して保存してから
 *   node scripts/measure-env-size.js .env.netlify を実行してください。
 */

const fs = require('fs');
const path = require('path');

let env = {};
const envFile = process.argv[2];

if (envFile) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }
  console.log(`\n※ 対象: ${envFile} の変数のみ（${Object.keys(env).length} 件）\n`);
} else {
  require('dotenv').config();
  require('dotenv').config({ path: '.env.local' });
  env = process.env;
}

const entries = [];
let total = 0;

for (const [k, v] of Object.entries(env)) {
  if (v === undefined || v === null) continue;
  const entry = `${k}=${v}`;
  const size = Buffer.byteLength(entry, 'utf8');
  total += size;
  entries.push({ key: k, size });
}

entries.sort((a, b) => b.size - a.size);

const limit = 4096;
console.log('=== Netlify 環境変数サイズ概算 ===\n');
console.log(`合計: ${total} bytes (制限: ${limit} bytes)`);
console.log(total > limit ? `\n⚠️ 制限を ${total - limit} bytes 超過しています。Netlify デプロイが失敗します。\n` : '\n✅ 制限内です。\n');
console.log('サイズの大きい順（上位30件）:\n');
entries.slice(0, 30).forEach((e, i) => {
  const bar = total > 0 ? '#'.repeat(Math.round((e.size / total) * 40)) : '';
  console.log(`  ${String(i + 1).padStart(2)}. ${e.key.padEnd(35)} ${String(e.size).padStart(5)} bytes ${bar}`);
});
console.log('\n※ Netlify で「Build」スコープにできる変数は関数に渡らないため 4KB に含まれません。');
console.log('※ 不要な変数は削除し、長い秘密は外部シークレット化を検討してください。');
