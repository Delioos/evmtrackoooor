use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub username: String,
    pub watchlist: Vec<String>,
    pub altitude: bool,
    pub active: bool,
}
