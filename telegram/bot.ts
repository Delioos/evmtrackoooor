import TelegramBot from 'node-telegram-bot-api';
import { token, wsUrl } from './config';
import { CommandDispatcher } from './commandDispatcher';
import MessageSender from './helpers/messageSender';
import { NotificationClient } from './websocket/notificationClient';

export class Bot {
    public bot: TelegramBot;
    private dispatcher: CommandDispatcher;
    private messageSender: MessageSender;
    private notificationClient: NotificationClient;
    private static singleton: Bot | null = null;

    constructor() {
        if (Bot.singleton) {
            return Bot.singleton;
        }
        Bot.singleton = this;
        this.bot = new TelegramBot(token!, { polling: true });
        this.dispatcher = new CommandDispatcher(this.bot);
        this.messageSender = new MessageSender(this.bot);
        this.notificationClient = new NotificationClient(wsUrl);
    }

    start() {
        this.bot.on('message', (msg) => this.dispatcher.dispatch(msg));
        this.bot.on('callback_query', (query) => this.dispatcher.handleCallbackQuery(query));
        console.log('Bot is running...');
    }

    public getSendMessage() {
        return this.messageSender.sendMessage.bind(this.messageSender);
    }

    public getWebSocketSender() {
        return this.notificationClient.sendMessage.bind(this.notificationClient);
    }
}

const bot = new Bot();
export const sendMessage = bot.getSendMessage();
export const sendWebSocketMessage = bot.getWebSocketSender();
