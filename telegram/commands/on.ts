import type { Command } from '../types';
import { sendMessage } from '../bot';

export const on: Command = {
  execute: async (msg) => {
    await sendMessage(msg.chat.id, "on is not implemented yet.");
  }
};


