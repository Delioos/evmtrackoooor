import type { Command } from '../types';
import { sendMessage } from '../bot';
import { WhitelistMiddleware } from '../middleware/WhitelistMiddleware';

const whitelistMiddleware = new WhitelistMiddleware();

export const start: Command = {
  execute: async (msg) => {
    const userId = msg.from!.id;
    if (whitelistMiddleware.isWhitelisted(userId)) {
      await sendMessage(msg.chat.id, "You already have access to this bot, check /help to see available commands.");
    } else if (whitelistMiddleware.isPending(userId)) {
      await sendMessage(msg.chat.id, "Your access request is pending approval.");
    } else {
      await sendMessage(msg.chat.id, "Welcome to Altitude Wallet Tracker Bot! Use /request_access to use the bot and check /help to see available commands.");
    }
  }
};
