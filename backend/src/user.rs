use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: i32,
    username: String,
    watchlist: Vec<String>,
    altitude: bool,
    active: bool,
}
