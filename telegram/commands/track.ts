import type { Command } from '../types';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';
import { isValidAddy } from '../middleware/isValidAddy';
import TelegramBot from 'node-telegram-bot-api';

export const track: Command = {
  execute: async (msg: TelegramBot.Message): Promise<void> => {
    const wallet = msg.text?.split(' ')[1];
    if (!wallet) {
      await sendMessage(msg.chat.id, "Please provide a wallet address to track. Usage: /track <wallet_address>");
      return;
    }
    try {
      if (!isValidAddy(wallet)) {
        await sendMessage(msg.chat.id, "Invalid wallet address. Usage: /track <0x...>");
        return;
      }

      const userId = msg.from!.id;
      await apiClient('POST', `/users/${userId}/watchlist`, JSON.stringify( wallet ));
      await sendMessage(msg.chat.id, `Successfully added ${wallet} to your watchlist.`);
    } catch (error) {
      console.error('Error adding wallet to watchlist:', error);
      await sendMessage(msg.chat.id, "An error occurred while adding the wallet to your watchlist. Please try again later.");
    }
  }
};

