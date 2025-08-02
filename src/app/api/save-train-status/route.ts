import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Supabaseクライアントを直接初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🚨 運行情報保存開始:', { 
      lineId: data.lineId, 
      status: data.status,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    // 現在のステータスを取得して変更を検知
    const { data: currentData, error: fetchError } = await supabase
      .from('train_status')
      .select('*')
      .eq('line_id', data.lineId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116はデータが見つからないエラー
      console.error('現在のステータス取得エラー:', fetchError);
    }

    const previousStatus = currentData?.status || '平常運転';
    const hasChanged = previousStatus !== data.status;

    console.log('📊 ステータス変更チェック:', {
      previous: previousStatus,
      current: data.status,
      hasChanged
    });

    // Supabaseにデータを保存
    console.log('💾 Supabase保存開始:', {
      table: 'train_status',
      data: {
        line_id: data.lineId,
        name: data.name,
        status: data.status,
        section: data.section || '',
        detail: data.detail || '',
        color: data.color || '#000000'
      }
    });

    const { data: savedData, error } = await supabase
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
      })
      .select();

    if (error) {
      console.error('❌ Supabase保存エラー:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        message: '保存失敗', 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('✅ Supabase保存成功:', savedData);

    // ステータスが変更された場合のみメール通知を送信
    if (hasChanged) {
      console.log('📧 ステータス変更を検知、メール通知を送信します');
      
      const changedLine = {
        line_id: data.lineId,
        name: data.name,
        status: data.status,
        detail: data.detail || '',
        previousStatus: previousStatus,
        previousDetail: currentData?.detail || ''
      };

      console.log('📧 変更された路線情報:', changedLine);
      await sendEmailNotifications([changedLine]);
    } else {
      console.log('📊 ステータス変更なし、メール通知は送信しません');
    }

    return NextResponse.json({ 
      message: '保存成功',
      hasChanged,
      previousStatus,
      currentStatus: data.status
    });
  } catch (error) {
    console.error('❌ 運行状況保存エラー:', error);
    return NextResponse.json({ 
      message: '保存失敗', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// メール通知を送信する関数
async function sendEmailNotifications(changedLines: any[]) {
  try {
    console.log('📧 メール通知送信開始');

    // 匿名ユーザー用のメール通知設定を取得
    const { data: anonymousEmailSettings, error: anonymousError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('enabled', true);

    if (anonymousError) {
      console.error('匿名ユーザー設定取得エラー:', anonymousError);
    }

    console.log('📧 取得した通知設定:', {
      anonymousSettings: anonymousEmailSettings?.length || 0
    });

    // デバッグ用：全通知設定を表示
    if (anonymousEmailSettings && anonymousEmailSettings.length > 0) {
      console.log('📧 通知設定詳細:', anonymousEmailSettings.map(s => ({
        email: s.email,
        line_id: s.line_id,
        enabled: s.enabled,
        delay_notification: s.delay_notification,
        suspension_notification: s.suspension_notification,
        recovery_notification: s.recovery_notification,
        notification_frequency: s.notification_frequency
      })));
    }

    // 通知対象の路線IDを取得
    const targetLineIds = changedLines.map(line => line.line_id);
    console.log('📧 通知対象路線:', targetLineIds);

    // 通知タイプを判定する関数
    const getNotificationType = (status: string) => {
      if (status.includes('遅延')) return 'delay_notification';
      if (status.includes('運転見合わせ') || status.includes('見合わせ')) return 'suspension_notification';
      if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) return 'recovery_notification';
      return 'delay_notification'; // デフォルト
    };

    // 匿名ユーザーへの通知
    if (anonymousEmailSettings) {
      const anonymousTargetSettings = anonymousEmailSettings.filter(setting => 
        targetLineIds.includes(setting.line_id)
      );

      console.log('📧 匿名ユーザー通知対象:', anonymousTargetSettings.length, '件');

      for (const setting of anonymousTargetSettings) {
        const changedLine = changedLines.find(line => line.line_id === setting.line_id);
        if (changedLine) {
          const notificationType = getNotificationType(changedLine.status);
          
          // 通知タイプに応じてフィルタリング
          let shouldNotify = true;
          
          // 通知タイプの設定が明示的にされている場合のみフィルタリング
          if (setting.delay_notification !== undefined || setting.suspension_notification !== undefined || setting.recovery_notification !== undefined) {
            switch (notificationType) {
              case 'delay_notification':
                shouldNotify = setting.delay_notification !== undefined ? setting.delay_notification : true;
                break;
              case 'suspension_notification':
                shouldNotify = setting.suspension_notification !== undefined ? setting.suspension_notification : true;
                break;
              case 'recovery_notification':
                shouldNotify = setting.recovery_notification !== undefined ? setting.recovery_notification : true;
                break;
            }
          } else {
            // 通知タイプの設定が未定義の場合は、デフォルトで通知を送信
            console.log(`📧 通知タイプ設定が未定義のため、デフォルトで通知を送信: ${setting.email}`);
          }

          console.log(`📧 匿名ユーザー通知判定: ${setting.email} (${changedLine.name}) - ${notificationType}: ${shouldNotify}`);

          if (shouldNotify) {
            // 通知頻度のチェック
            const shouldSendImmediate = !setting.notification_frequency || setting.notification_frequency === 'immediate';
            
            console.log(`📧 通知頻度チェック: ${setting.email} - ${setting.notification_frequency} -> ${shouldSendImmediate ? '即座送信' : 'まとめ保存'}`);
            
            if (shouldSendImmediate) {
              await sendEmailNotification({
                email: setting.email,
                lineId: changedLine.line_id,
                lineName: changedLine.name,
                status: changedLine.status,
                details: changedLine.detail,
                previousStatus: changedLine.previousStatus,
                isAnonymous: true,
                notificationType
              });
            } else {
              // 日次/週次まとめの場合は通知履歴に保存
              await supabase
                .from('anonymous_email_notification_history')
                .insert({
                  email: setting.email,
                  line_id: changedLine.line_id,
                  line_name: changedLine.name,
                  status: changedLine.status,
                  message: `${changedLine.status}${changedLine.detail ? `: ${changedLine.detail}` : ''}`,
                  notification_type: notificationType,
                  frequency: setting.notification_frequency,
                });
            }
          }
        }
      }
    }

    console.log('📧 メール通知送信完了');
  } catch (error) {
    console.error('❌ メール通知送信エラー:', error);
  }
}

// 個別のメール通知を送信する関数
async function sendEmailNotification({
  email,
  lineId,
  lineName,
  status,
  details,
  previousStatus,
  isAnonymous,
  notificationType
}: {
  email: string;
  lineId: string;
  lineName: string;
  status: string;
  details: string;
  previousStatus: string;
  isAnonymous: boolean;
  notificationType?: string;
}) {
  try {
    // メールの件名と内容を生成
    const subject = `【運行情報】${lineName}の状況が更新されました`;
    const statusChangeText = previousStatus ? `${previousStatus} → ${status}` : status;
    
    // 状況に応じた色とアイコンを決定
    const getStatusStyle = (status: string) => {
      if (status.includes('遅延') || status.includes('delay')) {
        return {
          color: '#dc2626',
          bgColor: '#fefce8',
          borderColor: '#fde047',
          icon: '⚠️',
          title: '遅延情報'
        };
      } else if (status.includes('見合わせ') || status.includes('運転見合わせ') || status.includes('suspension')) {
        return {
          color: '#ea580c',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          icon: '⛔',
          title: '運転見合わせ'
        };
      } else if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) {
        return {
          color: '#059669',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          icon: '✅',
          title: '復旧情報'
        };
      } else {
        return {
          color: '#1f2937',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb',
          icon: 'ℹ️',
          title: '運行情報'
        };
      }
    };

    const statusStyle = getStatusStyle(status);
    
    const emailContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>運行情報通知</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; align-items: center;">
              <div style="width: 48px; height: 48px; background-color: #dc2626; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <img src="https://i.imgur.com/DG8qto5.png" style="width: 48px; height: 48px; border-radius: 10px;" alt="電車アイコン" />
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">運行情報更新通知</p>
              </div>
            </div>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 32px 24px;">
            <!-- 状況通知 -->
            <div style="background-color: ${statusStyle.bgColor}; border: 1px solid ${statusStyle.borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; background-color: ${statusStyle.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                  <span style="color: white; font-size: 16px; font-weight: bold;">${statusStyle.icon}</span>
                </div>
                <div>
                  <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: ${statusStyle.color};">${statusStyle.title}</h2>
                  ${status.includes('見合わせ') || status.includes('運転見合わせ') ? `
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280; font-weight: 500;">${lineName}</p>
                  ` : ''}
                </div>
              </div>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                ${lineName}の運行情報が更新されました。
              </p>
              ${details ? `
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">
                <strong>理由:</strong> ${details}
              </p>
              ` : ''}
              ${details && details.includes('区間') ? `
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">
                <strong>区間:</strong> ${details.split('区間')[1] || '詳細は各鉄道会社の公式サイトでご確認ください'}
              </p>
              ` : ''}
            </div>

            <!-- 詳細情報 -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">詳細情報</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">路線</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${lineName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">現在の状況</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${status}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">更新時刻</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${new Date().toLocaleString('ja-JP')}</span>
                </div>
              </div>
            </div>

            <!-- 状況別の説明 -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0369a1;">状況について</h3>
              <div style="display: grid; gap: 8px;">
                ${status.includes('遅延') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #dc2626; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">15分以上の遅れが発生または見込まれています。ご利用の際は余裕を持ってお出かけください。</span>
                </div>
                ` : ''}
                ${status.includes('見合わせ') || status.includes('運転見合わせ') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #ea580c; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">運転見合わせが発生しています。代替交通機関のご利用をご検討ください。</span>
                </div>
                ` : ''}
                ${status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転') ? `
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #059669; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">運転が再開されました。平常運転に戻りました。</span>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- 注意事項 -->
            <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d97706;">ご注意</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">このメールはAOIROSERVER内での列車情報であり、JR東日本などの鉄道会社とは一切関係がありません。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">この情報は実際のダイヤの状況と差異がある場合があります。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">最新の運行情報は各鉄道会社の公式サイトでご確認ください。</span>
                </div>
              </div>
            </div>

            <!-- フッター -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                このメールは自動送信されています
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                通知設定の変更はアプリ内の設定画面から行ってください
              </p>
            </div>
          </div>

          <!-- フッター -->
          <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                <strong>運行情報メールサービス</strong>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                鉄道運行情報の自動通知サービス
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px;">
                <a href="https://aoiroserver.site" style="color: #dc2626; text-decoration: none;">公式サイト</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                送信日時: ${new Date().toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Gmail SMTP設定を取得
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    if (!gmailUser || !gmailAppPassword) {
      console.error('❌ Gmail SMTP設定が不足しています');
      return;
    }

    // Nodemailerを使用してGmail SMTPでメール送信
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: subject,
      html: emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 メール通知送信成功: ${email} (${lineName}) - ${notificationType} - MessageId: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ メール通知送信エラー (${email}):`, error);
  }
} 