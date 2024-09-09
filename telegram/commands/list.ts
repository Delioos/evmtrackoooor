import type { Command } from '../types';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';

export const list: Command = {
  execute: async (msg) => {
    try {
      const response = await apiClient.get(`/users/${msg.from!.id}/watchlist`);
      const wallets = response.data;
      if (wallets.length === 0) {
        await sendMessage(msg.chat.id, "You are not tracking any wallets.");
      } else {
        await sendMessage(msg.chat.id, `Your tracked wallets:\n${wallets.join('\n')}`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      await sendMessage(msg.chat.id, "An error occurred while fetching your watchlist. Please try again later.");
    }
  }
};
