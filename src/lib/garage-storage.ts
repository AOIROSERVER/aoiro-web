/**
 * Garage (S3互換・NAS) ストレージ用ヘルパー
 * 自宅NASの MinIO/Garage に画像をアップロードし、署名付きURLを返す
 * 環境変数: GARAGE_ENDPOINT, GARAGE_ACCESS_KEY, GARAGE_SECRET_KEY, GARAGE_BUCKET, GARAGE_REGION
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.GARAGE_ENDPOINT;
const accessKey = process.env.GARAGE_ACCESS_KEY;
const secretKey = process.env.GARAGE_SECRET_KEY;
const bucket = process.env.GARAGE_BUCKET || 'wordpress-media';
const region = process.env.GARAGE_REGION || 'garage';

/** Garage が利用可能か */
export function isGarageConfigured(): boolean {
  return !!(endpoint && accessKey && secretKey);
}

/** S3互換クライアント（Garage/MinIO） */
function getGarageClient(): S3Client {
  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey!,
      secretAccessKey: secretKey!,
    },
    forcePathStyle: true,
  });
}

/** 募集アイキャッチ用のプレフィックス */
const RECRUIT_EYECATCH_PREFIX = 'recruit-eyecatch/';

/**
 * バッファを Garage にアップロードし、署名付きURL（有効期限付き）を返す
 */
export async function uploadRecruitEyecatchToGarage(
  buffer: ArrayBuffer,
  contentType: string,
  fileExt: string
): Promise<{ url: string; path: string }> {
  const client = getGarageClient();
  const key = `${RECRUIT_EYECATCH_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
    })
  );

  // 1年間有効な署名付きGET URL を生成（表示用）
  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 365 * 24 * 60 * 60 }
  );

  return { url: signedUrl, path: key };
}
