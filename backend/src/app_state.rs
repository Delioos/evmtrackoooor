use std::sync::Mutex;
use std::collections::HashMap;
use crate::models::User;

pub struct AppState {
    pub users: Mutex<HashMap<i32, User>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            users: Mutex::new(HashMap::new()),
        }
    }
}
