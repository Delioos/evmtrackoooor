import type { Middleware } from './Middleware';
import TelegramBot from 'node-telegram-bot-api';
import { sendMessage } from '../bot';

export class WhitelistMiddleware implements Middleware {
  private whitelist: Set<number> = new Set();
  private pendingRequests: Map<number, string> = new Map();

  process(msg: TelegramBot.Message, next: () => void) {
    const userId = msg.from!.id;
    if (this.whitelist.has(userId)) {
      next();
    } else {
      if (this.pendingRequests.has(userId)) {
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
    this.whitelist.add(userId);
  }

  removeWhitelisted(userId: number) {
    this.whitelist.delete(userId);
  }

  public isPending(userId: number): boolean {
    return this.pendingRequests.has(userId);
  }

  addPendingRequest(userId: number, username: string) {
    this.pendingRequests.set(userId, username);
  }

  removePendingRequest(userId: number) {
    this.pendingRequests.delete(userId);
  }
}

