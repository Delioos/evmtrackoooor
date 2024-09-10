import TelegramBot from 'node-telegram-bot-api';

class MessageSender {
  private bot: TelegramBot;
  constructor(bot: TelegramBot) {
    this.bot = bot;
  }
  async sendMessage(chatId: number, text: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramBot.Message | null> {
    try {
      return await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    } catch (error: any) {
      if (error.message.includes("can't parse entities")) {
        return await this.bot.sendMessage(chatId, text, { ...options, parse_mode: undefined });
      }
      return null;
    }
  }
}
export default MessageSender;
