import type { Command } from '../types';
import { sendMessage } from '../bot';

export const off: Command = {
  execute: async (msg) => {
    await sendMessage(msg.chat.id, "off is not implemented yet.");
  }
};


