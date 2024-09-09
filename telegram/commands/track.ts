import type { Command } from '../types';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';

export const track: Command = {
  execute: async (msg) => {
    const wallet = msg.text?.split(' ')[1];
    if (!wallet) {
      await sendMessage(msg.chat.id, "Please provide a wallet address to track. Usage: /track <wallet_address>");
      return;
    }
    try {
      await apiClient.post(`/users/${msg.from!.id}/watchlist`, JSON.stringify(wallet));
      await sendMessage(msg.chat.id, `Successfully added ${wallet} to your watchlist.`);
    } catch (error) {
      console.error('Error adding wallet to watchlist:', error);
      await sendMessage(msg.chat.id, "An error occurred while adding the wallet to your watchlist. Please try again later.");
    }
  }
};
