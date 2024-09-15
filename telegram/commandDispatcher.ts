import TelegramBot from 'node-telegram-bot-api';
import { commands } from './commands';
import { WhitelistMiddleware } from './middleware/WhitelistMiddleware';
import { adminId } from './config';
import { sendMessage } from './bot';

export class CommandDispatcher {
	private whitelistMiddleware: WhitelistMiddleware;
	private bot: TelegramBot;

	constructor(bot: TelegramBot) {
		this.bot = bot;
		this.whitelistMiddleware = new WhitelistMiddleware();
	}

	dispatch(msg: TelegramBot.Message) {

		const text = msg.text || '';
		if (text.startsWith('/')) {
			let [command] = text.split(' ');
			console.log("Command:", command);
			if (command in commands) {
				//@ts-ignore
				// bypass the middleware for non whitelisted commands
				console.log("Command: ", command);
				console.log("type: ", typeof command);
				switch (command) {
					// could be enhanced but will do for now
					case '/request_access':
						commands[command].executeWithMiddleware(msg, this.whitelistMiddleware);
						break;
					case '/help':
					case '/start':
						commands[command].execute(msg);
						break;
					default:
						// @ts-ignore
						this.whitelistMiddleware.process(msg, () => commands[command].execute(msg));
				}
			}
		} else {
			commands.default.execute(msg);
		}

	}


	// May should be moved to request acces or a helper but not sure and it not so sloppy to do it here I guess
	// TODO: Move to a helper
	async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
		console.log("DISPATCHER LOG query -----------------------------------------------", query);
		const [action, userId] = query.data!.split('_');
		const adminChatId = query.message?.chat.id;

		if (adminChatId !== Number(adminId)) {
			// Retourner si l'appel ne vient pas de l'admin
			return;
		}

		switch (action) {
			case 'accept':
				try {
					console.log("in dispatcher meow meow");
					// TODO: FIX THIS to add any user to the bot lmeow
					await this.whitelistMiddleware.acceptAccessRequest(Number(userId));
					await this.bot.answerCallbackQuery(query.id, { text: 'User approved' });
				} catch (error) {
					console.error('Error creating user:', error);
					await sendMessage(Number(adminId), `Error creating user ${userId}. Please try again.`);
				}
				break;
			case 'deny':
				await this.whitelistMiddleware.denyAccessRequest(Number(userId));
				await this.bot.answerCallbackQuery(query.id, { text: 'User denied' });
				break;
			default:
				// Gérer d'autres actions de callback si nécessaire
				break;
		}

		// Supprimer le clavier en ligne après l'action
		await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
			chat_id: adminChatId,
			message_id: query.message?.message_id
		});
	}
}
