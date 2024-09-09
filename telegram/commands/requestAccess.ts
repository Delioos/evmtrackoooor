import type { Command } from '../types';
import { sendMessage } from '../bot';
import { WhitelistMiddleware } from '../middleware/WhitelistMiddleware';
import { adminId } from '../config';

const whitelistMiddleware = new WhitelistMiddleware();

export const requestAccess: Command = {
  execute: async (msg) => {
	console.log("Request access");
	console.log("msg content: ", msg);
    const userId = msg.from!.id;
    const username = msg.from!.username || 'Unknown';
    if (whitelistMiddleware.isWhitelisted(userId)) {
      await sendMessage(msg.chat.id, "You already have access to this bot.");
    } else if (whitelistMiddleware.isPending(userId)) {
      await sendMessage(msg.chat.id, "Your access request is pending approval.");
    } else {
      whitelistMiddleware.addPendingRequest(userId, username);
      await sendMessage(msg.chat.id, "Your access request has been submitted. Please wait for approval.");

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: 'Accept', callback_data: `accept_${userId}` },
            { text: 'Deny', callback_data: `deny_${userId}` }
          ]
        ]
      };
      await sendMessage(Number(adminId), `User @${username} (ID: ${userId}) requests to join the chat.`, { reply_markup: inlineKeyboard });
    }
  }
};

