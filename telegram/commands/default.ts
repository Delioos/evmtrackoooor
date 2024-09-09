import type { Command } from '../types';
import { sendMessage } from '../bot';

export const defaultCommand: Command = {
  execute: async (msg) => {
    await sendMessage(msg.chat.id, "Unknown command. Use /help to see available commands.");
  }
};

