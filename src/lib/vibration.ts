/**
 * Web Vibration API を使用したバイブレーション機能
 */

export interface VibrationPattern {
  duration: number | number[];
  intensity?: number; // 将来的な拡張用
}

/**
 * デフォルトのバイブレーションパターン
 */
export const VIBRATION_PATTERNS = {
  // 短いタップ感覚
  TAP: 50,
  
  // 軽いクリック感覚
  CLICK: 75,
  
  // ボタン押下感覚
  BUTTON: 100,
  
  // 重要なアクション
  HEAVY: 200,
  
  // 成功時のフィードバック
  SUCCESS: [100, 50, 100],
  
  // エラー時のフィードバック
  ERROR: [200, 100, 200, 100, 200],
  
  // 通知風
  NOTIFICATION: [150, 100, 150],
} as const;

/**
 * バイブレーションを実行する
 * @param pattern - バイブレーションパターン（数値または数値配列）
 */
export function vibrate(pattern: number | readonly number[] = VIBRATION_PATTERNS.BUTTON): void {
  // ブラウザがVibration APIをサポートしているかチェック
  if (!('navigator' in globalThis) || !navigator.vibrate) {
    console.warn('Vibration API is not supported in this browser');
    return;
  }

  // ユーザーがバイブレーションを無効にしている可能性をチェック
  try {
    // readonly配列をmutable配列として扱うため型アサーション
    navigator.vibrate(pattern as number | number[]);
  } catch (error) {
    console.warn('Failed to vibrate:', error);
  }
}

/**
 * バイブレーションが利用可能かチェック
 */
export function isVibrationSupported(): boolean {
  return 'navigator' in globalThis && 'vibrate' in navigator;
}

/**
 * バイブレーション付きのボタンクリックハンドラーを作成
 * @param onClick - 元のクリックハンドラー
 * @param pattern - バイブレーションパターン
 */
export function createVibrateOnClick(
  onClick?: (event?: any) => void | Promise<void>,
  pattern: number | readonly number[] = VIBRATION_PATTERNS.BUTTON
) {
  return async (event?: any) => {
    // バイブレーションを実行
    vibrate(pattern);
    
    // 元のクリックハンドラーがあれば実行
    if (onClick) {
      await onClick(event);
    }
  };
}

/**
 * 特定のアクション用のバイブレーション関数
 */
export const vibrateActions = {
  // 一般的なボタン押下
  button: () => vibrate(VIBRATION_PATTERNS.BUTTON),
  
  // 軽いタップ
  tap: () => vibrate(VIBRATION_PATTERNS.TAP),
  
  // 重要なアクション（削除、送信など）
  important: () => vibrate(VIBRATION_PATTERNS.HEAVY),
  
  // 成功フィードバック
  success: () => vibrate(VIBRATION_PATTERNS.SUCCESS),
  
  // エラーフィードバック
  error: () => vibrate(VIBRATION_PATTERNS.ERROR),
  
  // 通知
  notification: () => vibrate(VIBRATION_PATTERNS.NOTIFICATION),
} as const;