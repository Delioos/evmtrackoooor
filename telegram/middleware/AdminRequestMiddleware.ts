import type { Middleware } from './Middleware';
import TelegramBot from 'node-telegram-bot-api';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';
import { adminId } from '../config';
import { WhitelistMiddleware } from './WhitelistMiddleware';

const whitelistMiddleware = new WhitelistMiddleware();

export class AdminRequestMiddleware implements Middleware {
  process(msg: TelegramBot.Message, next: () => void) {
    // This middleware doesn't need to do anything for regular messages
    next();
  }

  async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const action = callbackQuery.data?.split('_')[0];
    const userId = Number(callbackQuery.data?.split('_')[1]);
    const adminChatId = callbackQuery.message?.chat.id;

    if (adminChatId !== Number(adminId)) return;

    if (action === 'accept') {
      try {
        await apiClient.post('/users', {
          id: userId,
          username: whitelistMiddleware.getPendingUsername(userId) || 'Unknown',
          watchlist: [],
          altitude: true,
          active: true
        });

        whitelistMiddleware.addToWhitelist(userId);
        whitelistMiddleware.removePendingRequest(userId);
        await sendMessage(Number(adminId), `User ${userId} has been approved.`);
        await sendMessage(userId, "Your access request has been approved. You can now use the bot.");
      } catch (error) {
        console.error('Error creating user:', error);
        await sendMessage(Number(adminId), `Error creating user ${userId}. Please try again.`);
      }
    } else if (action === 'deny') {
      whitelistMiddleware.removePendingRequest(userId);
      await sendMessage(Number(adminId), `User ${userId} has been denied access.`);
      await sendMessage(userId, "Your access request has been denied.");
    }

    // Remove the inline keyboard after action
    await TelegramBot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: adminChatId,
      message_id: callbackQuery.message?.message_id
    });
  }
}
