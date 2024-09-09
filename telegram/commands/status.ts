import type { Command } from '../types';
import { sendMessage } from '../bot';

export const status: Command = {
  execute: async (msg) => {
    await sendMessage(msg.chat.id, "Bot status check is not implemented yet.");
  }
};

