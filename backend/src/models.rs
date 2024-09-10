use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub watchlist: Vec<String>,
    pub altitude: bool,
    pub active: bool,
}
