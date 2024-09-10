// Notificator is a simple notification interface pushing notifications to users through web sockets.
use tokio::sync::mpsc;
use warp::ws::{Message, WebSocket};
use warp::Filter;
use futures::{FutureExt, StreamExt};
use tokio_stream::wrappers::UnboundedReceiverStream;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use rand::Rng;
use tokio::time::{sleep, Duration};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Notification {
    id: i64,  // Telegram user ID
    message: String,
}

type Clients = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;

#[derive(Clone)]
pub struct Notificator {
    pub clients: Clients,
    tx: mpsc::UnboundedSender<Notification>,
}

impl Notificator {
    pub fn new() -> (Self, mpsc::UnboundedReceiver<Notification>) {
        let (tx, rx) = mpsc::unbounded_channel();
        let clients: Clients = Arc::new(Mutex::new(HashMap::new()));

        (Notificator { clients, tx }, rx)
    }

    pub async fn start(self, port: u16) {
        let clients = self.clients.clone();

        // WebSocket route
        let ws_route = warp::path("ws")
            .and(warp::ws())
            .and(warp::any().map(move || clients.clone()))
            .map(|ws: warp::ws::Ws, clients| {
                ws.on_upgrade(move |socket| handle_connection(socket, clients))
            });

        // Start the server
        warp::serve(ws_route).run(([127, 0, 0, 1], port)).await;
    }

    pub fn send_notification(&self, notification: Notification) {
        if let Err(e) = self.tx.send(notification) {
            eprintln!("Error sending notification: {}", e);
        }
    }
}

async fn handle_connection(ws: WebSocket, clients: Clients) {
    println!("New WebSocket connection");

    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    let (client_sender, client_rcv) = mpsc::unbounded_channel();

    let client_rcv = UnboundedReceiverStream::new(client_rcv);
    tokio::task::spawn(client_rcv.forward(client_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("Error sending websocket msg: {}", e);
        }
    }));

    let client_id = Uuid::new_v4().to_string();

    clients.lock().await.insert(client_id.clone(), client_sender);

    while let Some(result) = client_ws_rcv.next().await {
        match result {
            Ok(_msg) => {
                // Handle incoming messages if needed
            }
            Err(e) => {
                eprintln!("Error receiving ws message: {}", e);
                break;
            }
        };
    }

    clients.lock().await.remove(&client_id);
    println!("WebSocket connection closed");
}

pub async fn run_notificator(mut rx: mpsc::UnboundedReceiver<Notification>, clients: Clients) {
    while let Some(notification) = rx.recv().await {
        let message = serde_json::to_string(&notification).unwrap();
        let clients = clients.lock().await;

        for (_, client_sender) in clients.iter() {
            if let Err(_disconnected) = client_sender.send(Ok(Message::text(message.clone()))) {
                // Handle disconnected client
            }
        }
    }
}

#[tokio::test]
async fn test_send_random_notification() {
    let (notificator, rx) = Notificator::new();

    // Spawn the notificator WebSocket server
    tokio::spawn(async move {
        notificator.start(8081).await;
    });

    // Spawn the notificator receiver
    tokio::spawn(async move {
        run_notificator(rx, notificator.clients.clone()).await;
    });

    let mut rng = rand::thread_rng();

    loop {
        let id = rng.gen_range(0..100);
        let message = format!("Test notification {}", id);
        let notification = Notification { id, message };

        notificator.send_notification(notification);

        sleep(Duration::from_secs(4)).await;
    }
}

