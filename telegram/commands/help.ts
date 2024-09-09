import type { Command } from '../types';
import { sendMessage } from "../bot";

export const help: Command = {
  execute: async (msg) => {
    const helpText = `
Here are the available commands:

--setup--
🚀 */start* - Start the bot
🔑 */request_access* - Request access to the bot

--help--
📚 */help* - Show this message

--management--
📋 */list* - List all tracked wallets
👀 */track <wallet>* - Track a wallet
🚫 */untrack <wallet>* - Untrack a wallet
📥 */bulk_import <wallets>* - Bulk import wallets (comma-separated)
🔆 */on* - Turn on the bot
🛑 */off* - Turn off the bot 
📊 */status* - Check the status of the bot

Feel free to use these commands to interact with the bot. If you need any further assistance, envoyez moi un dm mes backers Altitude ☁️🩵
    `;
    await sendMessage(msg.chat.id, helpText);
  }
};

