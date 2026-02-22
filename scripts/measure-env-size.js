#!/usr/bin/env node
/**
 * Netlify のサーバーレス関数に渡る環境変数の合計サイズを概算します。
 * Netlify は約 4KB (4096 bytes) の制限があります。
 *
 * 使い方:
 *   node -r dotenv/config scripts/measure-env-size.js
 *   （.env.local を読む場合） dotenv の path を指定:
 *   node -r dotenv/config scripts/measure-env-size.js
 *   事前に: export $(cat .env.local | xargs) && node scripts/measure-env-size.js
 *
 * .env.local を読み込む場合（dotenv が path をサポートしている場合）:
 *   node scripts/measure-env-size.js
 * スクリプト内で .env.local を手動で読み込む場合は、dotenv の path オプションを使用してください。
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' }); // .env.local があれば上書き

const env = process.env;
const entries = [];
let total = 0;

for (const [k, v] of Object.entries(env)) {
  if (v === undefined || v === null) continue;
  const entry = `${k}=${v}`;
  const size = Buffer.byteLength(entry, 'utf8');
  total += size;
  entries.push({ key: k, size, valuePreview: String(v).slice(0, 30) + (String(v).length > 30 ? '...' : '') });
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
console.log('\n※ 値のプレビューは表示していません（秘密情報のため）。');
console.log('※ Netlify の「Environment variables」で不要な変数を削除するか、長い秘密は外部シークレットに移してください。');
console.log('※ ローカル実行時は PATH 等のシステム変数が含まれるため、Netlify 実機より多くなることがあります。');
