use std::{collections::HashMap, str::FromStr};
use tokio::sync::RwLock;
use std::sync::Arc;
use alloy::primitives::Address;

#[derive(Clone)]
pub struct SubscribeManager {
    subscriptions: Arc<RwLock<HashMap<Address, Vec<u64>>>>,
}

impl SubscribeManager {
    pub fn new() -> Self {
        Self {
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_subscriber(&self, address: &str, user_id: u64) {
        println!("add_subscriber from subscribe_manager");
        let mut subscriptions = self.subscriptions.write().await;
        // TODO: enhance error handling
        let onchain_addy = Address::from_str(address).unwrap();
        subscriptions.entry(onchain_addy)
            .or_insert_with(Vec::new)
            .push(user_id);

        println!("add_subscriber done {}", subscriptions.len());
        println!("new subscribers {:?}", subscriptions);
    }

    pub async fn remove_subscriber(&self, address: &str, user_id: u64) {
        println!("remove_subscriber from subscribe_manager");
        let mut subscriptions = self.subscriptions.write().await;
        let onchain_addy = Address::from_str(address).unwrap();
        if let Some(subscribers) = subscriptions.get_mut(&onchain_addy) {
            subscribers.retain(|&id| id != user_id);
            if subscribers.is_empty() {
                subscriptions.remove(&onchain_addy);
            }
        }
    }

    // Methode denormalisee qui a pour vocation de servir de read efficace lors du parcours de tx 
    pub async fn get_subscribers(&self, address: Address) -> Option<Vec<u64>> {
        let subscriptions = self.subscriptions.read().await;
        subscriptions.get(&address).cloned()
    }
}
