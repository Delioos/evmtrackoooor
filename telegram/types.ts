import TelegramBot from 'node-telegram-bot-api';

export interface Command {
  execute: (msg: TelegramBot.Message) => Promise<void>;
}
