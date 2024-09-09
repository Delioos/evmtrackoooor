import TelegramBot from 'node-telegram-bot-api';

export interface Middleware {
  process(msg: TelegramBot.Message, next: () => void): void;
}

