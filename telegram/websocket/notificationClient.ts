import WebSocket from 'ws';
import { sendMessage } from '../bot';

interface Notification {
  id: number;
  message: string;
}

export class NotificationClient {
  private ws: WebSocket;
  private url: string;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
	console.log('Connecting to WebSocket : ', this.url);
    this.ws = new WebSocket(this.url);
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.ws.on('open', this.handleOpen);
    this.ws.on('message', this.handleMessage);
    this.ws.on('error', this.handleError);
    this.ws.on('close', this.handleClose);
  }

  private handleOpen = () => {
    console.log('WebSocket connection established');
  }

  private handleMessage = (data: WebSocket.Data) => {
    try {
      const notification: Notification = JSON.parse(data.toString());
      this.processNotification(notification);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private handleError = (error: Error) => {
    console.error('WebSocket error:', error);
    this.reconnect();
  }

  private handleClose = () => {
    console.log('[client] WebSocket connection closed');
    this.reconnect();
  }

  private reconnect(delay: number = 5000) {
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, delay);
  }

  private processNotification(notification: Notification) {
    sendMessage(notification.id, notification.message)
      .then(() => console.log(`Notification sent to user ${notification.id}`))
      .catch((error) => console.error(`Error sending notification to user ${notification.id}:`, error));
  }

  public sendMessage(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error('WebSocket is not open');
    }
  }
}

