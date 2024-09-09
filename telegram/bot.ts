import TelegramBot from 'node-telegram-bot-api';
import { token } from './config';
import { CommandDispatcher } from './commandDispatcher';
import MessageSender from './helpers/messageSender';

export class Bot {
	public bot: TelegramBot;
	private dispatcher: CommandDispatcher;
	private messageSender: MessageSender;
	private singleton: Bot | null = null;

	constructor() {
		if (Bot.singleton) {
			return Bot.singleton;
		}
		Bot.singleton = this;
		this.bot = new TelegramBot(token!, { polling: true });
		this.dispatcher = new CommandDispatcher();
		this.messageSender = new MessageSender(this.bot);
	}

	start() {
		this.bot.on('message', (msg) => this.dispatcher.dispatch(msg));
		this.bot.on('callback_query', (query) => this.dispatcher.handleCallbackQuery(query));
		console.log('Bot is running...');
	}

	public getSendMessage() {
		return this.messageSender.sendMessage.bind(this.messageSender);
	}
}

const bot = new Bot();
export const sendMessage = bot.getSendMessage();

