use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Clone)]
pub struct SubscribeManager {
    subscriptions: Arc<RwLock<HashMap<String, Vec<i32>>>>,
}

impl SubscribeManager {
    pub fn new() -> Self {
        Self {
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_subscriber(&self, address: &str, user_id: i32) {
        let mut subscriptions = self.subscriptions.write().await;
        subscriptions.entry(address.to_string())
            .or_insert_with(Vec::new)
            .push(user_id);
    }

    pub async fn remove_subscriber(&self, address: &str, user_id: i32) {
        let mut subscriptions = self.subscriptions.write().await;
        if let Some(subscribers) = subscriptions.get_mut(address) {
            subscribers.retain(|&id| id != user_id);
            if subscribers.is_empty() {
                subscriptions.remove(address);
            }
        }
    }

    pub async fn get_subscribers(&self, address: &str) -> Option<Vec<i32>> {
        let subscriptions = self.subscriptions.read().await;
        subscriptions.get(address).cloned()
    }
}
