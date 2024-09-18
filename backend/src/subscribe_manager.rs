use alloy::primitives::Address;
use std::sync::Arc;
use std::{collections::HashMap, str::FromStr};
use thiserror::Error;
use tokio::sync::RwLock;
use tracing::{debug, error, info};

#[derive(Error, Debug)]
pub enum SubscriberError {
    #[error("Invalid address format: {0}")]
    InvalidAddress(String),
}

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

    pub async fn add_subscriber(&self, address: &str, user_id: u64) -> Result<(), SubscriberError> {
        info!("Adding subscriber for address: {}", address);
        let onchain_addy = Address::from_str(address)
            .map_err(|_| SubscriberError::InvalidAddress(address.to_string()))?;

        let mut subscriptions = self.subscriptions.write().await;
        let subscribers = subscriptions.entry(onchain_addy).or_insert_with(Vec::new);

        if !subscribers.contains(&user_id) {
            subscribers.push(user_id);
            debug!("Added subscriber {} for address {}", user_id, address);
        } else {
            debug!(
                "Subscriber {} already exists for address {}",
                user_id, address
            );
        }

        info!("Total subscriptions: {}", subscriptions.len());
        debug!("Current subscribers: {:?}", subscriptions);
        Ok(())
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
