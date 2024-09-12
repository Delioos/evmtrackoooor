use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use crate::models::User;
use crate::subscribe_manager::SubscribeManager;

pub struct AppState {
    pub users: Arc<RwLock<HashMap<i32, User>>>,
    pub subscribe_manager: SubscribeManager,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            users: Arc::new(RwLock::new(HashMap::new())),
            subscribe_manager: SubscribeManager::new(),
        }
    }

    /*
     * Returns a list of subscribers for a given address
     *
     * @ param address: The address to get subscribers for
     * @ return: A list of subscribers (their telegram id) for the given address
     */
    pub async fn get_subscribers(&self, address: &str) -> Vec<i32> {
        let users = self.users.read().await;
        users.values()
            .filter(|user| user.active && user.watchlist.contains(&address.to_string()))
            .map(|user| user.id)
            .collect()
    }
}
