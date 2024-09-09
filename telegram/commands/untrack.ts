import type { Command } from '../types';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';

export const untrack: Command = {
  execute: async (msg) => {
    const wallet = msg.text?.split(' ')[1];
    if (!wallet) {
      await sendMessage(msg.chat.id, "Please provide a wallet address to untrack. Usage: /untrack <wallet_address>");
      return;
    }
    try {
      await apiClient.delete(`/users/${msg.from!.id}/watchlist`, { data: JSON.stringify(wallet) });
      await sendMessage(msg.chat.id, `Successfully removed ${wallet} from your watchlist.`);
    } catch (error) {
      console.error('Error removing wallet from watchlist:', error);
      await sendMessage(msg.chat.id, "An error occurred while removing the wallet from your watchlist. Please try again later.");
    }
  }
};


