use crate::app_state::AppState;
use crate::models::User;
use crate::subscribe_manager::SubscriberError;
use actix_web::{web, HttpResponse, Responder};
use colored::Colorize;
use thiserror::Error;
use tracing::{debug, error, info};

#[derive(Error, Debug)]
pub enum WatchlistError {
    #[error("User not found")]
    UserNotFound,
    #[error("Wallet already in watchlist")]
    WalletAlreadyExists,
    #[error("Failed to add subscriber: {0}")]
    SubscriberError(#[from] SubscriberError),
}

pub async fn create_user(data: web::Data<AppState>, user: web::Json<User>) -> impl Responder {
    println!("{}", "POST /users".green());
    // TODO: Check if user already exists
    let mut users = data.users.write().await;
    let new_user = User {
        id: user.id,
        username: user.username.clone(),
        watchlist: Vec::new(),
        altitude: user.altitude,
        active: user.active,
    };
    users.insert(user.id, new_user.clone());
    println!("{}", format!("User {} created", user.id).on_green());
    HttpResponse::Created().json(new_user)
}

pub async fn get_user(data: web::Data<AppState>, id: web::Path<u64>) -> impl Responder {
    println!("{}", format!("GET /users/{}", id).blue());
    let users = data.users.read().await;
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user),
        None => HttpResponse::NotFound().finish(),
    }
}

pub async fn get_watchlist(data: web::Data<AppState>, id: web::Path<u64>) -> impl Responder {
    println!("{}", format!("GET /users/{}/watchlist", id).blue());
    let users = data.users.read().await;
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user.watchlist.clone()),
        None => HttpResponse::NotFound().finish(),
    }
}

pub async fn update_user(
    data: web::Data<AppState>,
    id: web::Path<u64>,
    user: web::Json<User>,
) -> impl Responder {
    println!("{}", format!("PUT /users/{}", id).yellow());
    let mut users = data.users.write().await;
    match users.get_mut(&id) {
        Some(existing_user) => {
            existing_user.username = user.username.clone();
            existing_user.altitude = user.altitude;
            existing_user.active = user.active;
            HttpResponse::Ok().json(existing_user)
        }
        None => HttpResponse::NotFound().finish(),
    }
}

pub async fn delete_user(data: web::Data<AppState>, id: web::Path<u64>) -> impl Responder {
    println!("{}", format!("DELETE /users/{}", id).red());
    let mut users = data.users.write().await;
    if users.remove(&id).is_some() {
        HttpResponse::NoContent().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}

pub async fn get_all_users(data: web::Data<AppState>) -> impl Responder {
    println!("{}", "GET /users".blue());
    let users = data.users.read().await;
    let users_vec: Vec<User> = users.values().cloned().collect();
    HttpResponse::Ok().json(users_vec)
}

pub async fn add_wallet_to_watchlist(
    data: web::Data<AppState>,
    id: web::Path<u64>,
    wallet: web::Json<String>,
) -> impl Responder {
    info!("POST /users/{}/watchlist", id);
    let user_id = id.into_inner();
    let wallet_address = wallet.into_inner();

    match add_wallet_to_watchlist_inner(&data, user_id, &wallet_address).await {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(WatchlistError::UserNotFound) => HttpResponse::NotFound().finish(),
        Err(WatchlistError::WalletAlreadyExists) => {
            HttpResponse::BadRequest().body("Wallet already in watchlist")
        }
        Err(e) => {
            error!("Error adding wallet to watchlist: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

async fn add_wallet_to_watchlist_inner(
    data: &web::Data<AppState>,
    user_id: u64,
    wallet_address: &str,
) -> Result<User, WatchlistError> {
    // Check if the user exists
    let user_exists = {
        let users = data.users.read().await;
        users.contains_key(&user_id)
    };
    if !user_exists {
        return Err(WatchlistError::UserNotFound);
    }

    // Add the subscription asynchronously
    data.subscribe_manager
        .add_subscriber(wallet_address, user_id)
        .await?;

    // Update the user's watchlist
    let mut users = data.users.write().await;
    let user = users.get_mut(&user_id).unwrap(); // Safe because we checked existence
    if !user.watchlist.contains(&wallet_address.to_string()) {
        user.watchlist.push(wallet_address.to_string());
        debug!(
            "Added wallet {} to user {}'s watchlist",
            wallet_address, user_id
        );
        Ok(user.clone())
    } else {
        Err(WatchlistError::WalletAlreadyExists)
    }
}

pub async fn remove_wallet_from_watchlist(
    data: web::Data<AppState>,
    id: web::Path<u64>,
    wallet: web::Json<String>,
) -> impl Responder {
    println!("{}", format!("DELETE /users/{}/watchlist", id).red());

    let user_id = id.into_inner();
    let wallet_address = wallet.into_inner();

    // Vérifier d'abord si l'utilisateur existe
    let user_exists = {
        let users = data.users.read().await;
        users.contains_key(&user_id)
    };

    if !user_exists {
        return HttpResponse::NotFound().finish();
    }

    // Mettre à jour la watchlist de l'utilisateur
    let mut users = data.users.write().await;
    let user = users.get_mut(&user_id).unwrap(); // Safe because we checked existence

    if let Some(pos) = user.watchlist.iter().position(|x| x == &wallet_address) {
        user.watchlist.remove(pos);

        // Supprimer l'abonnement de manière asynchrone
        let subscribe_manager = data.subscribe_manager.clone();
        tokio::spawn(async move {
            subscribe_manager
                .remove_subscriber(&wallet_address, user_id)
                .await;
        });

        HttpResponse::Ok().json(user)
    } else {
        HttpResponse::BadRequest().body("Wallet not found in watchlist")
    }
}
