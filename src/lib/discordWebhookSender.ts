export class DiscordWebhookSender {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || '';
  }

  async sendMessage(content: string): Promise<boolean> {
    if (!this.webhookUrl) {
      console.error('[Discord] Webhook URL is not set');
      return false;
    }
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
        }),
      });

      if (!response.ok) {
        console.error('[Discord] Failed to send message:', response.status, response.statusText);
        return false;
      }

      console.log('[Discord] Message sent successfully');
      return true;
    } catch (error) {
      console.error('[Discord] Error sending message:', error);
      return false;
    }
  }
} 