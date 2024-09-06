import TelegramBot from 'node-telegram-bot-api';

require('dotenv').config();
const token = process.env.TG_TOKEN;

if (!token) {
    console.error('Bot token not found in environment variables');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Helper function to send messages
const sendMessage = (chatId: number, text: string) => {
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};

// Command handlers
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, 'Bot started. Notifications for wallet movements enabled.');
});

bot.onText(/\/pause/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, 'Bot paused. Notifications stopped.');
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpText = `
🤖 *Wallet Tracker Bot Help* 🤖

Here are the available commands:

/start - Enable notifications on wallets movement
/pause - Stop notifications from the bot
/list - List the tracked wallets
/track - Add a new wallet to monitor
/remove - Stop the tracking of a wallet
/bulkimport - Add a list of wallets to track, separated by commas ","
/clear - Remove all the wallets from tracked list
/status - Show the current status of the bot
/help - Show this help message

To use a command, simply type it in the chat, like this: /start

For more information or support, please contact the bot administrator.
    `;
    sendMessage(chatId, helpText);
});

// Placeholder implementations for other commands
bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "Here's a list of currently tracked wallets: [Wallet list would appear here]");
});

bot.onText(/\/track/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "Please provide the wallet address you want to track.");
});

bot.onText(/\/remove/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "Please provide the wallet address you want to stop tracking.");
});

bot.onText(/\/bulkimport/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "Please provide a comma-separated list of wallet addresses to track.");
});

bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "All tracked wallets have been removed.");
});

bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    sendMessage(chatId, "Bot is currently active and tracking wallets.");
});

console.log('Bot is running...');
