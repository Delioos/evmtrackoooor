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
    pub fn new(sb : SubscribeManager) -> Self {
        AppState {
            users: Arc::new(RwLock::new(HashMap::new())),
            subscribe_manager: sb, 
        }
    }
}
