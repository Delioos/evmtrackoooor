import WebSocket from 'ws';
import { sendMessage } from '../bot';

export class NotificationClient {
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', this.handleMessage);
  }

  private handleMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString());
    // Process the message and use sendMessage to notify users
  }
}

