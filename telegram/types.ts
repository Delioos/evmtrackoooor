import TelegramBot from 'node-telegram-bot-api';
import { WhitelistMiddleware } from './middleware/WhitelistMiddleware';

export interface Command {
  execute: (msg: TelegramBot.Message) => Promise<void>;

  executeWithMiddleware: (msg: TelegramBot.Message, middleware: WhitelistMiddleware) => Promise<void>;
}
