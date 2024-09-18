import type { Command } from '../types';
import { sendMessage } from '../bot';
import { apiClient } from '../helpers/apiClient';
import { isValidAddy } from '../middleware/isValidAddy';

export const bulkImport: Command = {
  execute: async (msg) => {
    const wallets = msg.text?.split(' ').slice(1).join(' ').split(',').map(w => w.trim());
    if (!wallets || wallets.length === 0) {
      await sendMessage(msg.chat.id, "Please provide wallet addresses to import. Usage: /bulk_import <wallet1>,<wallet2>,...");
      return;
    }
    try {
      for (const wallet of wallets) {
				if (!isValidAddy(wallet)) {
					await sendMessage(msg.chat.id, `${wallet} is not a valid EVM wallet address.`);
				}
        await apiClient('POST', `/users/${msg.from!.id}/watchlist`, JSON.stringify(wallet));
      }
      await sendMessage(msg.chat.id, `Successfully added ${wallets.length} wallet(s) to your watchlist.`);
    } catch (error) {
      console.error('Error bulk importing wallets:', error);
      await sendMessage(msg.chat.id, "An error occurred while bulk importing wallets. Some wallets may not have been added. Please try again later.");
    }
  }
};

