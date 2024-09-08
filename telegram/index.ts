import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
require('dotenv').config();

const token = process.env.TG_TOKEN;
const adminId = process.env.ADMIN_ID;
const apiUrl = process.env.API_URL || 'http://localhost:8080';

if (!token || !adminId) {
    console.error('Bot token or admin ID not found in environment variables');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// In-memory storage for whitelist and pending requests
const whitelist = new Set<number>();
const pendingRequests = new Map<number, string>(); // Store user ID and username

// Helper function to send messages
const sendMessage = async (chatId: number, text: string, options?: TelegramBot.SendMessageOptions) => {
    console.log('Attempting to send message:', chatId, text, options);
    try {
        const sentMessage = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
        console.log('Message sent successfully:', sentMessage);
        return sentMessage;
    } catch (error: any) {
        console.error('Error sending message with Markdown:', error);
        if (error.message.includes("can't parse entities")) {
            try {
                const sentMessage = await bot.sendMessage(chatId, text, { ...options, parse_mode: undefined });
                console.log('Message sent successfully without Markdown:', sentMessage);
                return sentMessage;
            } catch (retryError) {
                console.error('Error sending message without Markdown:', retryError);
                return null;
            }
        }
        return null;
    }
};

// Check if user is whitelisted
const isWhitelisted = (userId: number) => whitelist.has(userId);

// Middleware to check whitelist
const checkWhitelist = async (msg: TelegramBot.Message, action: () => void) => {
    const userId = msg.from!.id;
    if (isWhitelisted(userId)) {
        action();
    } else {
        if (pendingRequests.has(userId)) {
            console.log('check -> pending');
            await sendMessage(msg.chat.id, "Your access request is pending approval.");
        } else {
            console.log('check -> ce mec est un random');
            const sentMessage = await sendMessage(Number(userId), "You don't have permission to use this bot. Please request access using /request_access.");
            if (!sentMessage) {
                console.log('Failed to send message to user. They may have blocked the bot or never started a chat with it.');
                await sendMessage(Number(adminId), `Failed to send message to user ${userId}. They may have blocked the bot or never started a chat with it.`);
            }
        }
    }
};

// Handle all incoming messages
bot.on('message', async (msg) => {
    const userId = msg.from!.id;
    const text = msg.text || '';
    console.log('message', msg);

    if (text.startsWith('/')) {
        // Handle commands
        const command = text.split(' ')[0];
        switch (command) {
            case '/request_access':
                handleRequestAccess(msg);
                break;
            case '/help':
                helpMessage(msg.chat.id);
                break;
            case '/start':
                startMessage(msg);
                break;
            case '/list':
                checkWhitelist(msg, () => list(msg));
                break;
            case '/track':
                checkWhitelist(msg, () => track(msg));
                break;
            case '/untrack':
                checkWhitelist(msg, () => untrack(msg));
                break;
            case '/bulk_import':
                checkWhitelist(msg, () => bulkImport(msg));
                break;
            case '/stop':
                checkWhitelist(msg, () => stopMessage(msg.chat.id));
                break;
            case '/status':
                checkWhitelist(msg, () => statusMessage(msg.chat.id));
                break;
            default:
                checkWhitelist(msg, () => defaultMessage(msg.chat.id));
                break;
        }
    } else {
        // Handle non-command messages
        checkWhitelist(msg, () => {
            console.log('Processing message from whitelisted user:', text);
        });
    }
});

// Command handlers
const handleRequestAccess = (msg: TelegramBot.Message) => {
    const userId = msg.from!.id;
    const username = msg.from!.username || 'Unknown';
    if (isWhitelisted(userId)) {
        sendMessage(msg.chat.id, "You already have access to this bot.");
    } else if (pendingRequests.has(userId)) {
        sendMessage(msg.chat.id, "Your access request is pending approval.");
    } else {
        pendingRequests.set(userId, username);
        sendMessage(msg.chat.id, "Your access request has been submitted. Please wait for approval.");

        // Send request to admin with inline keyboard
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: 'Accept', callback_data: `accept_${userId}` },
                    { text: 'Deny', callback_data: `deny_${userId}` }
                ]
            ]
        };
        sendMessage(Number(adminId), `User @${username} (ID: ${userId}) requests to join the chat.`, { reply_markup: inlineKeyboard });
    }
};

// Handle callback queries (button clicks)
bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data?.split('_')[0];
    const userId = Number(callbackQuery.data?.split('_')[1]);
    const adminChatId = callbackQuery.message?.chat.id;

    if (adminChatId !== Number(adminId)) return;

    if (action === 'accept') {
        try {
            // Create user in the Rust backend
            await axios.post(`${apiUrl}/users`, {
                id: userId,
                username: pendingRequests.get(userId) || 'Unknown',
                watchlist: [],
                altitude: true,
                active: true
            });

            whitelist.add(userId);
            pendingRequests.delete(userId);
            await bot.answerCallbackQuery(callbackQuery.id, { text: 'User approved' });
            sendMessage(Number(adminId), `User ${userId} has been approved.`);
            sendMessage(userId, "Your access request has been approved. You can now use the bot.");
        } catch (error) {
            console.error('Error creating user:', error);
            sendMessage(Number(adminId), `Error creating user ${userId}. Please try again.`);
        }
    } else if (action === 'deny') {
        pendingRequests.delete(userId);
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'User denied' });
        sendMessage(Number(adminId), `User ${userId} has been denied access.`);
        sendMessage(userId, "Your access request has been denied.");
    }

    // Remove the inline keyboard after action
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: adminChatId,
        message_id: callbackQuery.message?.message_id
    });
});

let helpMessage = (chatId: number) => {
    sendMessage(chatId, `
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
🛑 */stop* - Stop the bot
📊 */status* - Check the status of the bot

Feel free to use these commands to interact with the bot. If you need any further assistance, envoyez moi un dm mes backers Altitude ☁️🩵
    `);
};

let startMessage = (msg: TelegramBot.Message) => {
    const userId = msg.from!.id;
    if (isWhitelisted(userId)) {
        sendMessage(msg.chat.id, "You already have access to this bot, check /help to see available commands.");
        return;
    } else if (pendingRequests.has(userId)) {
        sendMessage(msg.chat.id, "Your access request is pending approval.");
        return;
    }
    else {
        sendMessage(msg.chat.id, "Welcome to Altitude Wallet Tracker Bot! Use /request_access to use the bot and check /help to see available commands.");
    }
};

let stopMessage = (chatId: number) => {
    sendMessage(chatId, "Stopping the bot is not implemented yet.");
};

let statusMessage = (chatId: number) => {
    sendMessage(chatId, "Bot status check is not implemented yet.");
};

let defaultMessage = (chatId: number) => {
    sendMessage(chatId, "Unknown command. Use /help to see available commands.");
};

let list = async (msg: TelegramBot.Message) => {
    try {
        const response = await axios.get(`${apiUrl}/users/${msg.from!.id}/watchlist`);
        const wallets = response.data;
        if (wallets.length === 0) {
            sendMessage(msg.chat.id, "You are not tracking any wallets.");
        } else {
		// TODO: Add Parsec link in format
            sendMessage(msg.chat.id, `Your tracked wallets:\n${wallets.join('\n')}`);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        sendMessage(msg.chat.id, "An error occurred while fetching your watchlist. Please try again later.");
    }
};

let track = async (msg: TelegramBot.Message) => {
    const wallet = msg.text?.split(' ')[1];
    if (!wallet) {
        sendMessage(msg.chat.id, "Please provide a wallet address to track. Usage: /track <wallet_address>");
        return;
    }
    try {
        await axios.post(`${apiUrl}/users/${msg.from!.id}/watchlist`, JSON.stringify(wallet));
        sendMessage(msg.chat.id, `Successfully added ${wallet} to your watchlist.`);
    } catch (error) {
        console.error('Error adding wallet to watchlist:', error);
        sendMessage(msg.chat.id, "An error occurred while adding the wallet to your watchlist. Please try again later.");
    }
};

let untrack = async (msg: TelegramBot.Message) => {
    const wallet = msg.text?.split(' ')[1];
    if (!wallet) {
        sendMessage(msg.chat.id, "Please provide a wallet address to untrack. Usage: /untrack <wallet_address>");
        return;
    }
    try {
        await axios.delete(`${apiUrl}/users/${msg.from!.id}/watchlist`, { data: JSON.stringify(wallet) });
        sendMessage(msg.chat.id, `Successfully removed ${wallet} from your watchlist.`);
    } catch (error) {
        console.error('Error removing wallet from watchlist:', error);
        sendMessage(msg.chat.id, "An error occurred while removing the wallet from your watchlist. Please try again later.");
    }
};

let bulkImport = async (msg: TelegramBot.Message) => {
    const wallets = msg.text?.split(' ').slice(1).join(' ').split(',').map(w => w.trim());
    if (!wallets || wallets.length === 0) {
        sendMessage(msg.chat.id, "Please provide wallet addresses to import. Usage: /bulk_import <wallet1>,<wallet2>,...");
        return;
    }
    try {
        for (const wallet of wallets) {
            await axios.post(`${apiUrl}/users/${msg.from!.id}/watchlist`, JSON.stringify(wallet));
        }
        sendMessage(msg.chat.id, `Successfully added ${wallets.length} wallet(s) to your watchlist.`);
    } catch (error) {
        console.error('Error bulk importing wallets:', error);
        sendMessage(msg.chat.id, "An error occurred while bulk importing wallets. Some wallets may not have been added. Please try again later.");
    }
};

console.log('Bot is running...');
