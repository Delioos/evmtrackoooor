import TelegramBot from 'node-telegram-bot-api';
import { commands } from './commands';
import { WhitelistMiddleware } from './middleware/WhitelistMiddleware';

export class CommandDispatcher {
	private whitelistMiddleware: WhitelistMiddleware;

	constructor() {
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

	//handleCallbackQuery(query: TelegramBot.CallbackQuery) {
	//TODO Implement callback query handling
	//}
}

