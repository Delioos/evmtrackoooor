import type { Middleware } from './Middleware';
import TelegramBot from 'node-telegram-bot-api';
import { sendMessage } from '../bot';
import { adminId } from '../config';
import { apiClient } from '../helpers/apiClient';

export class WhitelistMiddleware implements Middleware {
  private whitelist: Set<number> = new Set();
  private pendingRequests: Map<number, string> = new Map();

  process(msg: TelegramBot.Message, next: () => void) {
    const userId = msg.from!.id;
    if (this.whitelist.has(userId)) {
      next();
    } else {
      if (this.isPending(userId)) {
        sendMessage(msg.chat.id, "Your access request is pending approval.");
      } else {
        sendMessage(userId, "You don't have permission to use this bot. Please request access using /request_access.");
      }
    }
  }

  public isWhitelisted(userId: number): boolean {
    return this.whitelist.has(userId);
  }

  addWhitelisted(userId: number) {
  console.log("addWhitelisted", userId);
  this.whitelist.add(userId);
  const userInfos = {
    id: userId,
    username: this.getPendingUsername(userId),
    altitude: true,
    active: true,
    watchlist: []
  }
  apiClient.post('/users', userInfos).then((res) => {
    console.log("res", res);
  });
}


  removeWhitelisted(userId: number) {
    this.whitelist.delete(userId);
  }

  public isPending(userId: number): boolean {
    return this.pendingRequests.has(userId);
  }

  getPendingUsername(userId: number): string {
	  console.log('just pulled', userId);
    return this.pendingRequests.get(userId) || 'Unknown';
  }

  addPendingRequest(userId: number, username: string) {
    this.pendingRequests.set(userId, username);
  }

  removePendingRequest(userId: number) {
    this.pendingRequests.delete(userId);
  }

  async acceptAccessRequest(userId: number) {
	console.log("acceptAccessRequest", userId);
      this.addWhitelisted(userId);
      this.removePendingRequest(userId);
      //const username = this.getPendingUsername(userId);
      await sendMessage(Number(adminId), `User @${userId} has been granted access.`);
      await sendMessage(userId, `Your access request has been approved. You can now use the bot.`);
  }

  async denyAccessRequest(userId: number) {
    if (this.isPending(userId)) {
      this.removePendingRequest(userId);
      // const username = this.getPendingUsername(userId);
      // TODO: fix username
      await sendMessage(Number(adminId), `User @${userId} has been denied access.`);
      await sendMessage(userId, `Your access request has been denied.`);
    }
  }
}
