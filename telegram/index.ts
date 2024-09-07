import TelegramBot from 'node-telegram-bot-api';

require('dotenv').config();


const token = process.env.TG_TOKEN;
const adminId = process.env.ADMIN_ID;

if (!token || !adminId) {
	console.error('Bot token or admin ID not found in environment variables');
	process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// In-memory storage for whitelist and pending requests
const whitelist = new Set<number>();
const pendingRequests = new Map<number, string>(); // Store user ID and username

// Helper function to send messages
const sendMessage = (chatId: number, text: string, options?: TelegramBot.SendMessageOptions) => {
	bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
};

// Check if user is whitelisted
const isWhitelisted = (userId: number) => whitelist.has(userId);
//const isWhitelisted = (userId: number) => true;

// Middleware to check whitelist
const checkWhitelist = (msg: TelegramBot.Message, action: () => void) => {
	const userId = msg.from?.id;
	if (userId && isWhitelisted(userId)) {
		action();
	} else {
		sendMessage(msg.chat.id, "You don't have permission to use this bot. Please request access using /request_access.");
	}
};

// Command handlers
bot.onText(/\/start/, (msg) => {
	sendMessage(msg.chat.id, "Welcome to the bot! Use /request_access to request access.");
});


// New command for requesting access
bot.onText(/\/request_access/, (msg) => {
	const userId = msg.from?.id;
	const username = msg.from?.username || 'Unknown';
	if (userId) {
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
	}
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (callbackQuery) => {
	const action = callbackQuery.data?.split('_')[0];
	const userId = Number(callbackQuery.data?.split('_')[1]);
	const adminChatId = callbackQuery.message?.chat.id;

	if (adminChatId !== Number(adminId)) return;

	if (action === 'accept') {
		whitelist.add(userId);
		pendingRequests.delete(userId);
		await bot.answerCallbackQuery(callbackQuery.id, { text: 'User approved' });
		sendMessage(Number(adminId), `User ${userId} has been approved.`);
		sendMessage(userId, "Your access request has been approved. You can now use the bot.");
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


////////////////////
// command handlers
////////////////////


bot.onText('message', (msg) => {
  const command = msg.text?.split(' ')[0];
  
  checkWhitelist(msg, () => {
    switch (command) {
      case '/help':
        helpMessage(msg.chat.id);
        break;
      case '/start':
        startMessage(msg.chat.id);
        break;
      case '/list':
        list(msg);
        break;
      case '/track':
        track(msg);
        break;
      case '/untrack':
        untrack(msg);
        break;
      case '/bulk_import':
        bulkImport(msg);
        break;
      case '/stop':
        stopMessage(msg.chat.id);
        break;
      case '/status':
        statusMessage(msg.chat.id);
        break;
      default:
        defaultMessage(msg.chat.id);
        break;
    }
  });
});

let helpMessage = (chatId: number) => {
	sendMessage(chatId, `
		/help - Show this message
		/start - Start the bot
		/request_access - Request access to the bot
		/list - List all tracked users
		/track - Track a user
		/untrack - Untrack a user
		/bulk_import - Bulk import users
		/stop - Stop the bot
		/status - Check the status of the bot
	`);
};

let startMessage = (chatId: number) => {
	sendMessage(chatId, "you are already whitelisted, check /help for more commands");
};

let stopMessage = (chatId: number) => {
	sendMessage(chatId, "todo");
};

let statusMessage = (chatId: number) => {
	sendMessage(chatId, "todo");
};

let defaultMessage = (chatId: number) => {
	sendMessage(chatId, "unknown command, check /help for more commands");
};

let list = (msg: TelegramBot.Message) => {
	sendMessage(msg.chat.id, "todo");
};

let track = (msg: TelegramBot.Message) => {
	sendMessage(msg.chat.id, "todo");
};

let untrack = (msg: TelegramBot.Message) => {
	sendMessage(msg.chat.id, "todo");
};

let bulkImport = (msg: TelegramBot.Message) => {
	sendMessage(msg.chat.id, "todo");
};


console.log('Bot is running...');
